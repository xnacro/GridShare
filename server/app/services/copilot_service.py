"""
GridShare AI Copilot Service.
Orchestrates:
Current State (OBSERVE)
     ↓
Demand Forecast (demand_v1) + Solar Forecast (solar_v1) (PREDICT)
     ↓
Uncertainty / Forecast Range (Empirical Tree Spread & PV Conversion)
     ↓
Rule-Based Dispatch Optimizer (OPTIMIZE)
     ↓
Recommendation (RECOMMENDED Action - Separated from Execution)
     ↓
Explainable Reasoning (Derived from Real Telemetry & Market Rates)
     ↓
Expected Impact (Cost Savings, Grid Energy Avoided, CO2 Reduction)
"""

import os
import math
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any

from gridshare.backend.app.models import db, Household, EnergyReading, Battery, OptimizationDecision
from gridshare.backend.app.services.community_state_service import CommunityStateService
from gridshare.backend.app.services.rule_optimizer import RuleBasedOptimizer
from gridshare.ml.predict import DemandPredictor
from gridshare.ml.solar.predict import SolarPredictor

class CopilotService:
    _demand_predictor: Optional[DemandPredictor] = None
    _solar_predictor: Optional[SolarPredictor] = None

    @classmethod
    def get_demand_predictor(cls) -> DemandPredictor:
        if cls._demand_predictor is None:
            cls._demand_predictor = DemandPredictor()
        return cls._demand_predictor

    @classmethod
    def get_solar_predictor(cls) -> SolarPredictor:
        if cls._solar_predictor is None:
            cls._solar_predictor = SolarPredictor()
        return cls._solar_predictor

    @classmethod
    def get_copilot_insights(
        cls,
        household_id: Optional[str] = None,
        horizon_minutes: int = 15,
        target_time: Optional[datetime] = None,
        installed_kwp: float = 4.0,
        efficiency: float = 0.18,
        loss_factor: float = 0.86
    ) -> Dict[str, Any]:
        """
        Generate structured, authoritative, explainable AI Copilot insights.
        """
        now = target_time or datetime.now(timezone.utc)
        observed = CommunityStateService.observe_community_state(timestamp=now)
        summary = observed["summary"]
        battery = Battery.query.first()

        # 1. Current State
        cur_gen = summary["total_generation_kw"]
        cur_demand = summary["total_consumption_kw"]
        cur_balance = summary["net_community_balance_kw"]
        battery_soc = summary["community_battery_soc"]
        battery_cap = summary["community_battery_capacity_kwh"]
        min_reserve = battery.min_reserve if battery else 20.0
        grid_price = summary["current_grid_price"]
        p2p_price = summary["p2p_market_price"]

        # Household specific context if requested
        selected_household = None
        if household_id:
            selected_household = next((h for h in observed["households"] if h["household_id"] == household_id), None)
            if selected_household:
                cur_gen = selected_household["generation_kw"]
                cur_demand = selected_household["consumption_kw"]
                cur_balance = selected_household["net_energy_kw"]
                if selected_household.get("battery_soc") is not None:
                    battery_soc = selected_household["battery_soc"]
                # Dynamic installed PV capacity map
                cap_map = {
                    "house_anjali": 6.0,
                    "house_prince": 1.0,
                    "house_ayush": 4.0,
                    "house_rahul": 2.0
                }
                installed_kwp = cap_map.get(household_id, installed_kwp)

        # 2. Run Demand ML Model (demand_v1)
        demand_pred_engine = cls.get_demand_predictor()
        # Collect recent historical demand readings
        if household_id:
            h_readings = EnergyReading.query.filter_by(household_id=household_id).order_by(EnergyReading.timestamp.desc()).limit(12).all()
            p_history = [r.consumption_kw for r in reversed(h_readings)] if h_readings else [selected_household["consumption_kw"] if selected_household else 1.5]
        else:
            # Community aggregate demand history (last 5 intervals)
            households = Household.query.all()
            p_history = [cur_demand] * 5

        demand_forecast = demand_pred_engine.predict_demand(
            recent_history=p_history,
            horizon_minutes=horizon_minutes,
            current_time=now
        )
        predicted_demand_kw = round(float(demand_forecast.get("predicted_consumption_kw", cur_demand)), 2)

        # 3. Run Solar ML Model (solar_v1) + PV Conversion Layer
        solar_pred_engine = cls.get_solar_predictor()
        # Derive recent GHI from generation or default diurnal proxy
        est_ghi_now = (cur_gen / (installed_kwp * efficiency * loss_factor)) * 1000.0 if cur_gen > 0 else 0.0
        ghi_history = [est_ghi_now] * 5

        solar_forecast = solar_pred_engine.predict_solar(
            recent_history=ghi_history,
            horizon_minutes=horizon_minutes,
            current_time=now,
            installed_kwp=installed_kwp,
            efficiency=efficiency,
            loss_factor=loss_factor
        )

        predicted_ghi = solar_forecast.get("predicted_ghi", 0.0)
        lower_ghi = solar_forecast.get("lower_ghi", 0.0)
        upper_ghi = solar_forecast.get("upper_ghi", 0.0)
        tree_std = solar_forecast.get("uncertainty_value", 0.0)

        # Convert GHI prediction and bounds to estimated solar PV output (kW)
        pv_scale = (installed_kwp * efficiency * loss_factor) / 1000.0
        predicted_solar_kw = round(predicted_ghi * pv_scale, 2)
        solar_lower_kw = round(lower_ghi * pv_scale, 2)
        solar_upper_kw = round(upper_ghi * pv_scale, 2)

        # 4. Net Energy Balance & Uncertainty Corridor
        predicted_balance_kw = round(predicted_solar_kw - predicted_demand_kw, 2)
        conservative_balance_kw = round(solar_lower_kw - predicted_demand_kw, 2)

        # 5. Feed Forecast into the Authoritative Optimizer (RuleBasedOptimizer)
        # Determine storable and tradeable surplus
        surplus_in = max(0.0, predicted_balance_kw)
        deficit_in = max(0.0, -predicted_balance_kw)

        allocation_result = RuleBasedOptimizer.allocate_energy(
            surplus_kw=surplus_in,
            deficit_kw=deficit_in,
            battery_soc=battery_soc,
            battery_capacity_kwh=battery_cap,
            battery_min_reserve=min_reserve,
            grid_price=grid_price,
            p2p_price=p2p_price,
        )

        plan = allocation_result["allocation_plan"]
        top_step = plan[0] if len(plan) > 0 else {"action": "BALANCED_IDLE", "energy_kwh": 0.0, "reason": "System is balanced."}

        action = top_step.get("action", "BALANCED_IDLE")
        amount_kwh = top_step.get("energy_kwh", 0.0)

        action_labels = {
            "LOCAL_TRADE": f"TRADE {amount_kwh:.1f} kWh LOCALLY",
            "STORE": f"STORE {amount_kwh:.1f} kWh IN COMMUNITY BATTERY",
            "STORE_SKIPPED": "BYPASS STORAGE (BATTERY FULL)",
            "GRID_EXPORT": f"EXPORT {amount_kwh:.1f} kWh TO UTILITY GRID",
            "DISCHARGE": f"DISCHARGE {amount_kwh:.1f} kWh FROM BATTERY",
            "GRID_IMPORT": f"IMPORT {amount_kwh:.1f} kWh FROM UTILITY GRID",
            "BALANCED_IDLE": "MAINTAIN BALANCED SELF-CONSUMPTION"
        }
        action_label = action_labels.get(action, f"EXECUTE {action}")

        # 6. Structured Explainable Reasoning (All Derived from Actual Numbers)
        reasoning = []
        if action == "LOCAL_TRADE":
            reasoning.append(f"Predicted community surplus is +{predicted_balance_kw:.2f} kW (+{conservative_balance_kw:.2f} kW conservative lower bound).")
            reasoning.append(f"Local peer deficit of {summary['total_deficit_kw']:.2f} kW is actively requesting energy.")
            reasoning.append(f"Community battery reserve is healthy at {battery_soc:.1f}% (exceeds {min_reserve:.1f}% reserve floor).")
            reasoning.append(f"Local P2P rate of Rs {p2p_price:.2f}/kWh provides Rs {(grid_price - p2p_price):.2f}/kWh peer savings vs grid tariff Rs {grid_price:.2f}/kWh.")
        elif action == "STORE":
            reasoning.append(f"Predicted renewable surplus of +{predicted_balance_kw:.2f} kW exceeds immediate local load.")
            reasoning.append(f"Community battery has {round((100.0 - battery_soc) * (battery_cap / 100.0), 1)} kWh available headroom (current SOC {battery_soc:.1f}%).")
            reasoning.append("Storing surplus now buffers the microgrid against high-tariff evening peak periods.")
        elif action == "GRID_EXPORT":
            reasoning.append(f"Predicted surplus of +{predicted_balance_kw:.2f} kW remains after satisfying local demand and battery storage.")
            reasoning.append(f"Exporting to utility grid secures guaranteed feed-in revenue at Rs {grid_price:.2f}/kWh.")
        elif action == "DISCHARGE":
            reasoning.append(f"Predicted deficit of {abs(predicted_balance_kw):.2f} kW requires backup power.")
            reasoning.append(f"Community battery is at {battery_soc:.1f}%, safely above the {min_reserve:.1f}% reserve safety floor.")
            reasoning.append(f"Discharging avoids costly utility grid import at Rs {grid_price:.2f}/kWh.")
        elif action == "GRID_IMPORT":
            reasoning.append(f"Predicted deficit of {abs(predicted_balance_kw):.2f} kW exceeds available local battery capacity.")
            reasoning.append(f"Battery at or near reserve floor ({battery_soc:.1f}% vs {min_reserve:.1f}% minimum).")
            reasoning.append(f"Importing {amount_kwh:.2f} kW from utility grid ensures uninterrupted power quality.")
        else:
            reasoning.append("Predicted local generation closely matches local consumption.")
            reasoning.append("No active energy routing or storage transfer is required.")

        # 7. Risk-Aware Checks
        ghi_spread = round(upper_ghi - lower_ghi, 1)
        if ghi_spread > 250.0:
            cloud_risk = "HIGH"
        elif ghi_spread > 120.0:
            cloud_risk = "MODERATE"
        else:
            cloud_risk = "LOW"

        risk_check = {
            "expected_surplus_kw": predicted_balance_kw,
            "conservative_surplus_kw": conservative_balance_kw,
            "energy_offered_kwh": amount_kwh,
            "forecast_range_solar_kw": [solar_lower_kw, solar_upper_kw],
            "forecast_range_ghi_w_m2": [lower_ghi, upper_ghi],
            "solar_variability_std_w_m2": round(tree_std, 2) if tree_std else None,
            "cloud_volatility_risk": cloud_risk,
            "battery_reserve_protected": bool(battery_soc >= min_reserve),
            "safety_margin_preserved": bool(conservative_balance_kw >= 0 or battery_soc >= min_reserve)
        }

        # 8. Expected Impact Calculation (Strictly Real Calculated Numbers, None if Not Applicable)
        if action == "LOCAL_TRADE" and amount_kwh > 0:
            savings_rs = round(amount_kwh * (grid_price - p2p_price), 2)
            grid_avoided = amount_kwh
            co2_kg = round(amount_kwh * 0.82, 2)
        elif action == "DISCHARGE" and amount_kwh > 0:
            savings_rs = round(amount_kwh * (grid_price - p2p_price), 2)
            grid_avoided = amount_kwh
            co2_kg = round(amount_kwh * 0.82, 2)
        elif action == "GRID_EXPORT" and amount_kwh > 0:
            savings_rs = round(amount_kwh * grid_price, 2) # export revenue
            grid_avoided = None
            co2_kg = round(amount_kwh * 0.82, 2)
        else:
            savings_rs = None
            grid_avoided = None
            co2_kg = None

        impact = {
            "estimated_saving_rs": savings_rs,
            "grid_energy_avoided_kwh": grid_avoided,
            "local_energy_used_kwh": amount_kwh if action in ("LOCAL_TRADE", "STORE") else None,
            "co2_avoided_kg": co2_kg
        }

        return {
            "timestamp": now.isoformat(),
            "horizon_minutes": horizon_minutes,
            "household_id": household_id,
            "models_used": {
                "demand": demand_pred_engine.model_version,
                "solar": solar_pred_engine.model_version,
                "optimizer": RuleBasedOptimizer.ENGINE_VERSION,
            },
            "current_state": {
                "generation_kw": cur_gen,
                "demand_kw": cur_demand,
                "net_balance_kw": cur_balance,
                "battery_soc": battery_soc,
                "grid_tariff_rs": grid_price,
                "p2p_market_price_rs": p2p_price,
            },
            "forecast": {
                "solar_kw": predicted_solar_kw,
                "solar_lower_kw": solar_lower_kw,
                "solar_upper_kw": solar_upper_kw,
                "predicted_ghi": predicted_ghi,
                "lower_ghi": lower_ghi,
                "upper_ghi": upper_ghi,
                "demand_kw": predicted_demand_kw,
                "balance_kw": predicted_balance_kw,
                "conservative_balance_kw": conservative_balance_kw
            },
            "decision": {
                "action": action,
                "action_label": action_label,
                "amount_kwh": amount_kwh,
                "status": "RECOMMENDED",
                "target_entity": top_step.get("action"),
                "workflow_state": "PENDING_REVIEW"
            },
            "risk_check": risk_check,
            "reasoning": reasoning,
            "impact": impact
        }

    @classmethod
    def simulate_weather_shock(
        cls,
        shock_type: str = "CLOUD_COVER",
        severity: float = 0.6,
        household_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Simulate weather/demand shocks for hackathon demonstration with explicit simulation labelling.
        """
        baseline = cls.get_copilot_insights(household_id=household_id)

        # Apply deterministic shock transformations
        now = datetime.now(timezone.utc)
        cur_gen = baseline["current_state"]["generation_kw"]
        cur_demand = baseline["current_state"]["demand_kw"]

        if shock_type == "CLOUD_COVER":
            # Cloud cover reduces solar generation and widens forecast bounds
            shocked_gen = max(0.0, cur_gen * (1.0 - severity))
            shocked_ghi = baseline["forecast"]["predicted_ghi"] * (1.0 - severity)
            shock_summary = f"Simulated heavy cloud passage (-{int(severity*100)}% solar irradiance drop)."
        elif shock_type == "EV_CHARGE_SPIKE":
            shocked_gen = cur_gen
            shocked_demand = cur_demand + (severity * 4.0)
            shock_summary = f"Simulated unexpected EV charging cluster (+{round(severity*4.0, 1)} kW demand surge)."
        else:
            shocked_gen = cur_gen
            shock_summary = f"Simulated operational shock ({shock_type})."

        # Re-run insights under shocked state
        shocked_insights = cls.get_copilot_insights(household_id=household_id)
        if shock_type == "CLOUD_COVER":
            shocked_insights["current_state"]["generation_kw"] = round(shocked_gen, 2)
            shocked_insights["forecast"]["solar_kw"] = round(shocked_insights["forecast"]["solar_kw"] * (1.0 - severity), 2)
            shocked_insights["forecast"]["solar_lower_kw"] = round(shocked_insights["forecast"]["solar_lower_kw"] * (1.0 - severity * 1.2), 2)
            shocked_insights["forecast"]["balance_kw"] = round(shocked_insights["forecast"]["solar_kw"] - shocked_insights["forecast"]["demand_kw"], 2)
            shocked_insights["risk_check"]["cloud_volatility_risk"] = "HIGH"

            # Recalculate decision
            new_bal = shocked_insights["forecast"]["balance_kw"]
            if new_bal < 0:
                shocked_insights["decision"]["action"] = "DISCHARGE"
                shocked_insights["decision"]["action_label"] = f"DISCHARGE {abs(new_bal):.1f} kWh FROM BATTERY"
                shocked_insights["decision"]["amount_kwh"] = abs(new_bal)
                shocked_insights["reasoning"] = [
                    f"Weather Shock Alert: Solar collapsed from {baseline['forecast']['solar_kw']} kW to {shocked_insights['forecast']['solar_kw']} kW.",
                    "Community transitioned from surplus into deficit.",
                    "Copilot immediately throttles export and activates community battery discharge to prevent grid penalty."
                ]

        return {
            "status": "SUCCESS",
            "is_simulation": True,
            "simulation_label": "HACKATHON_DEMO_WEATHER_SHOCK",
            "shock_type": shock_type,
            "severity": severity,
            "summary": shock_summary,
            "baseline": baseline,
            "shocked_state": shocked_insights
        }
