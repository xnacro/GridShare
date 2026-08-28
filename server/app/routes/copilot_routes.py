"""
AI Copilot Routes for GridShare.
Exposes the authoritative 6-step AI decision loop:
1. Current State (OBSERVE)
2. Demand & Solar Forecasts (PREDICT)
3. Forecast Range & Uncertainty
4. Dispatch Recommendation (OPTIMIZE)
5. Explainable Reasoning
6. Impact Metrics
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
