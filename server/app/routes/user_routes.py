import os
import datetime
import jwt
from flask import Blueprint, jsonify, request, g, current_app
from ..models import db, Household, EnergyReading, EnergyTransaction, MarketOffer, MarketRequest, EnergyNode, UserProfile
from ..utils.auth import require_auth, resolve_or_provision_user
from ..services.telemetry_service import TelemetryService
from ..services.community_state_service import CommunityStateService

user_bp = Blueprint("user", __name__, url_prefix="/api")

@user_bp.route("/auth/login", methods=["POST"])
def login():
    """
    Authenticates any of the 4 community demo users (Anjali, Prince, Ayush, Rahul)
    or custom provisioned users with password 'admin@123'.
    Returns signed JWT access token and user context.
    """
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email:
        return jsonify({"status": "ERROR", "message": "Email is required"}), 400

    # Demo password check: admin@123
    if password != "admin@123" and password != "password" and not password.startswith("demo"):
        return jsonify({"status": "ERROR", "message": "Invalid credentials. Demo password is 'admin@123'"}), 401

    # Map demo user email aliases
    email_to_id = {
        "anjali@gridshare.io": ("user_anjali_id", "Anjali Sharma", "house_anjali"),
        "prince@gridshare.io": ("user_prince_id", "Prince Patel", "house_prince"),
        "ayush@gridshare.io": ("user_ayush_id", "Ayush Verma", "house_ayush"),
        "rahul@gridshare.io": ("user_rahul_id", "Rahul Sharma", "house_rahul"),
    }

    if email in email_to_id:
        uid, dname, pref_hid = email_to_id[email]
    else:
        # Resolve from UserProfile database table
        existing_profile = UserProfile.query.filter_by(email=email).first()
        if existing_profile:
            uid = existing_profile.user_id
            dname = existing_profile.display_name
            pref_hid = existing_profile.default_household_id
        else:
            uid = f"user_{email.split('@')[0].lower()}"
            dname = email.split('@')[0].capitalize()
            pref_hid = f"house_{email.split('@')[0].lower()}"

    profile, household, node = resolve_or_provision_user(
        user_id=uid,
        email=email,
        display_name=dname,
        preferred_household_id=pref_hid,
    )

    # Generate JWT token
    jwt_secret = os.getenv("SECRET_KEY", "gridshare-secret-key-development")
    payload = {
        "sub": profile.user_id,
        "email": profile.email,
        "user_metadata": {
            "display_name": profile.display_name,
            "preferred_household_id": household.id,
        },
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7),
    }
    token = jwt.encode(payload, jwt_secret, algorithm="HS256")

    return jsonify({
        "status": "SUCCESS",
        "access_token": token,
        "token_type": "Bearer",
        "user": profile.to_dict(),
        "household": household.to_dict(),
        "energy_node": node.to_dict(),
    }), 200


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
    Returns isolated user-specific energy state directly from database records.
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
            "battery_soc": 60.0,
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
                "battery_soc": reading.battery_soc or 50.0,
                "timestamp": reading.timestamp.isoformat() if reading.timestamp else None,
            }
        else:
            # Fallback to node's configured manual attributes
            gen_kw = node.manual_generation_kw or (5.0 if household.household_type == "PROSUMER" else 1.0)
            con_kw = node.manual_consumption_kw or (2.2 if household.household_type == "PROSUMER" else 4.5)
            net_kw = round(gen_kw - con_kw, 3)
            reading_dict = {
                "household_id": household.id,
                "household_name": household.name,
                "generation_kw": gen_kw,
                "consumption_kw": con_kw,
                "net_balance_kw": net_kw,
                "status": "SURPLUS" if net_kw > 0 else "DEFICIT",
                "source": node.source_type,
                "battery_soc": 50.0,
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
            "household_id": g.household.id,
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
            EnergyTransaction.seller_household_id == g.household.id,
            EnergyTransaction.buyer_household_id == g.household.id,
        )
    ).order_by(EnergyTransaction.timestamp.desc()).limit(limit).all()

    return jsonify({
        "status": "SUCCESS",
        "household_id": g.household.id,
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
        "household_id": g.household.id,
        "devices": [n.to_dict() for n in nodes],
    }), 200
