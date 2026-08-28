from flask import Blueprint, jsonify, request, g
from ..models import db, Household, EnergyReading, EnergyTransaction, MarketOffer, MarketRequest, EnergyNode
from ..utils.auth import require_auth
from ..services.telemetry_service import TelemetryService
from ..services.community_state_service import CommunityStateService

user_bp = Blueprint("user", __name__, url_prefix="/api")

@user_bp.route("/me", methods=["GET"])
@require_auth
def get_me():
    """
    Returns authenticated user identity, profile, owned household, and active energy node.
    """
    return jsonify({
        "status": "SUCCESS",
        "user": g.user.to_dict(),
        "household": g.household.to_dict(),
        "energy_node": g.energy_node.to_dict(),
    }), 200


@user_bp.route("/my-household", methods=["GET"])
@require_auth
def get_my_household():
    """
    Returns private household metadata and properties for the authenticated user.
    """
    return jsonify({
        "status": "SUCCESS",
        "household": g.household.to_dict(),
        "nodes": [n.to_dict() for n in g.household.nodes.all()],
    }), 200


@user_bp.route("/my-energy", methods=["GET"])
@require_auth
def get_my_energy():
    """
    Returns isolated user-specific energy state.
    Respects active source_type (SIMULATION vs MANUAL vs HARDWARE).
    """
    node = g.energy_node
    household = g.household

    if node.source_type == "MANUAL":
        gen_kw = node.manual_generation_kw
        con_kw = node.manual_consumption_kw
        net_kw = round(gen_kw - con_kw, 3)
        reading_dict = {
            "household_id": household.id,
            "household_name": household.name,
            "generation_kw": gen_kw,
            "consumption_kw": con_kw,
            "net_balance_kw": net_kw,
            "status": "SURPLUS" if net_kw > 0.001 else "DEFICIT" if net_kw < -0.001 else "BALANCED",
            "source": "MANUAL",
            "battery_soc": 68.0,
            "timestamp": node.updated_at.isoformat() if node.updated_at else None,
        }
    else:
        # SIMULATION / HARDWARE source: Fetch latest reading from database
        reading = EnergyReading.query.filter_by(household_id=household.id).order_by(EnergyReading.timestamp.desc()).first()
        if reading:
            reading_dict = {
                "household_id": household.id,
                "household_name": household.name,
                "generation_kw": reading.generation_kw,
                "consumption_kw": reading.consumption_kw,
                "net_balance_kw": reading.net_balance_kw,
                "status": "SURPLUS" if reading.net_balance_kw > 0.001 else "DEFICIT" if reading.net_balance_kw < -0.001 else "BALANCED",
                "source": node.source_type,
                "battery_soc": reading.battery_soc or 60.0,
                "timestamp": reading.timestamp.isoformat() if reading.timestamp else None,
            }
        else:
            # Fallback default values
            default_gen = 6.8 if household.id == "house_a" else 3.5 if household.id == "house_c" else 1.2
            default_con = 2.1 if household.id == "house_a" else 2.5 if household.id == "house_c" else 4.0
            default_net = round(default_gen - default_con, 3)
            reading_dict = {
                "household_id": household.id,
                "household_name": household.name,
                "generation_kw": default_gen,
                "consumption_kw": default_con,
                "net_balance_kw": default_net,
                "status": "SURPLUS" if default_net > 0 else "DEFICIT",
                "source": node.source_type,
                "battery_soc": 60.0,
                "timestamp": None,
            }

    # Fetch last 24 historical readings for this user
    history = EnergyReading.query.filter_by(household_id=household.id).order_by(EnergyReading.timestamp.desc()).limit(24).all()
    history_list = [h.to_dict() for h in history]

    return jsonify({
        "status": "SUCCESS",
        "energy": reading_dict,
        "history": history_list,
        "node": node.to_dict(),
    }), 200


@user_bp.route("/my-energy/source", methods=["POST"])
@require_auth
def update_my_energy_source():
    """
    Updates the data source (SIMULATION vs MANUAL) and manual generation/load values.
    Calculates authoritative net balance server-side and persists changes.
    """
    data = request.get_json() or {}
    source_type = data.get("source_type")
    node = g.energy_node

    if source_type:
        source_type = source_type.upper()
        if source_type not in ("SIMULATION", "MANUAL", "HARDWARE"):
            return jsonify({
                "status": "ERROR",
                "message": "Invalid source_type. Supported values: 'SIMULATION', 'MANUAL', 'HARDWARE'.",
            }), 400
        node.source_type = source_type

    if "manual_generation_kw" in data:
        try:
            node.manual_generation_kw = max(0.0, float(data["manual_generation_kw"]))
        except (ValueError, TypeError):
            return jsonify({"status": "ERROR", "message": "Invalid manual_generation_kw numeric value"}), 400

    if "manual_consumption_kw" in data:
        try:
            node.manual_consumption_kw = max(0.0, float(data["manual_consumption_kw"]))
        except (ValueError, TypeError):
            return jsonify({"status": "ERROR", "message": "Invalid manual_consumption_kw numeric value"}), 400

    db.session.commit()

    # Ingest a manual energy reading into ledger if in MANUAL mode
    if node.source_type == "MANUAL":
        TelemetryService.ingest_reading({
            "household_id": g.household_id,
            "generation_kw": node.manual_generation_kw,
            "consumption_kw": node.manual_consumption_kw,
            "source": "MANUAL",
        })

    return jsonify({
        "status": "SUCCESS",
        "message": f"Updated energy source for {g.household.name} to {node.source_type}",
        "node": node.to_dict(),
    }), 200


@user_bp.route("/my-transactions", methods=["GET"])
@require_auth
def get_my_transactions():
    """
    Returns user-scoped bilateral P2P transactions where user is seller or buyer.
    """
    limit = int(request.args.get("limit", 50))
    txns = EnergyTransaction.query.filter(
        db.or_(
            EnergyTransaction.seller_household_id == g.household_id,
            EnergyTransaction.buyer_household_id == g.household_id,
        )
    ).order_by(EnergyTransaction.timestamp.desc()).limit(limit).all()

    return jsonify({
        "status": "SUCCESS",
        "household_id": g.household_id,
        "count": len(txns),
        "transactions": [t.to_dict() for t in txns],
    }), 200


@user_bp.route("/my-devices", methods=["GET"])
@require_auth
def get_my_devices():
    """
    Returns edge nodes and simulated telemetry units belonging to the authenticated household.
    """
    nodes = g.household.nodes.all()
    return jsonify({
        "status": "SUCCESS",
        "household_id": g.household_id,
        "devices": [n.to_dict() for n in nodes],
    }), 200
