"""
AI Copilot & Master Intelligence Routes for GridShare.
Exposes:
1. /api/copilot/insights (GET - Authoritative 10-step intelligence loop)
2. /api/copilot/simulate-shock (POST - Weather / demand shock simulations)
3. /api/copilot/scenario (POST - Custom parameter slider simulations)
4. /api/copilot/query (POST - Grounded conversational Q&A assistant)
5. /api/copilot/model-health (GET - Technical ML accuracy & baseline comparisons)
"""

from flask import Blueprint, jsonify, request
from gridshare.backend.app.services.copilot_service import CopilotService

copilot_bp = Blueprint("copilot", __name__)

@copilot_bp.route("/api/copilot/insights", methods=["GET"])
def get_copilot_insights():
    """
    Retrieve read-only authoritative AI Copilot insights for the microgrid community
    or a specific household.
    """
    household_id = request.args.get("household_id")
    
    if not household_id:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            from gridshare.backend.app.utils.auth import decode_supabase_token, resolve_or_provision_user
            token = auth_header.split(" ", 1)[1]
            decoded = decode_supabase_token(token)
            if decoded and decoded.get("id"):
                try:
                    _, household, _ = resolve_or_provision_user(
                        user_id=decoded["id"],
                        email=decoded.get("email"),
                        preferred_household_id=decoded.get("user_metadata", {}).get("preferred_household_id")
                    )
                    if household:
                        household_id = household.id
                except Exception:
                    pass

    horizon = int(request.args.get("horizon_minutes", 15))
    installed_kwp = float(request.args.get("installed_kwp", 4.0))

    insights = CopilotService.get_copilot_insights(
        household_id=household_id,
        horizon_minutes=horizon,
        installed_kwp=installed_kwp
    )
    return jsonify({"status": "SUCCESS", "data": insights}), 200

@copilot_bp.route("/api/copilot/simulate-shock", methods=["POST"])
def simulate_weather_shock():
    """
    Simulate operational weather / demand shock scenarios for hackathon demonstrations.
    Explicitly labeled as simulation.
    """
    data = request.get_json() or {}
    shock_type = data.get("type", "CLOUD_COVER")
    severity = float(data.get("severity", 0.6))
    household_id = data.get("household_id")

    res = CopilotService.simulate_weather_shock(
        shock_type=shock_type,
        severity=severity,
        household_id=household_id
    )
    return jsonify(res), 200

@copilot_bp.route("/api/copilot/scenario", methods=["POST"])
def simulate_custom_scenario():
    """
    Simulate custom scenario using arbitrary user parameter sliders.
    """
    data = request.get_json() or {}
    solar_delta = float(data.get("solar_delta_percent", 0.0))
    demand_delta = float(data.get("demand_delta_percent", 0.0))
    battery_soc = float(data["battery_soc"]) if "battery_soc" in data and data["battery_soc"] is not None else None
    household_id = data.get("household_id")

    res = CopilotService.simulate_custom_scenario(
        solar_delta_percent=solar_delta,
        demand_delta_percent=demand_delta,
        battery_soc=battery_soc,
        household_id=household_id
    )
    return jsonify(res), 200

@copilot_bp.route("/api/copilot/query", methods=["POST"])
def answer_copilot_query():
    """
    Answer grounded conversational energy questions without LLM hallucination.
    """
    data = request.get_json() or {}
    query = data.get("query", "")
    household_id = data.get("household_id")

    res = CopilotService.answer_copilot_query(query=query, household_id=household_id)
    return jsonify(res), 200

@copilot_bp.route("/api/copilot/model-health", methods=["GET"])
def get_model_health():
    """
    Retrieve empirical model metrics, accuracy benchmarks, and baseline comparisons.
    """
    res = CopilotService.get_model_health_and_benchmarks()
    return jsonify(res), 200
