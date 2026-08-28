# GridShare AI — API Contract & Intelligence Schemas

## 1. Unified Intelligence Endpoint

### `GET /api/copilot/insights`
**Description**: Returns authoritative 10-step AI intelligence for the authenticated user's household or community aggregate.

**Headers**:
- `Authorization`: `Bearer <jwt_token>` (optional, auto-resolves authenticated household)

**Query Parameters**:
- `household_id` *(string, optional)*: Specific household (e.g. `house_anjali`, `house_prince`).
- `horizon_minutes` *(int, default=15)*: Prediction horizon (15, 30, 60, 360, 1440).
- `installed_kwp` *(float, optional)*: PV capacity override.

**Response Schema (`200 OK`)**:
```json
{
  "status": "SUCCESS",
  "data": {
    "timestamp": "2026-08-28T18:00:00Z",
    "horizon_minutes": 15,
    "household_id": "house_anjali",
    "household_name": "Anjali's Home (Solar Exporter)",
    "data_quality": {
      "freshness": "LIVE",
      "last_reading_time": "2026-08-28T17:59:00Z",
      "samples_available": 12,
      "status": "HEALTHY"
    },
    "anomalies": [
      {
        "type": "NONE_DETECTED",
        "severity": "LOW",
        "message": "Telemetry within normal 2-sigma baseline."
      }
    ],
    "current_state": {
      "generation_kw": 6.40,
      "demand_kw": 2.20,
      "net_balance_kw": 4.20,
      "battery_soc": 65.0,
      "grid_tariff_rs": 6.10,
      "p2p_market_price_rs": 4.50
    },
    "forecast": {
      "solar_kw": 5.84,
      "solar_lower_kw": 5.31,
      "solar_upper_kw": 6.28,
      "predicted_ghi": 640.0,
      "lower_ghi": 582.0,
      "upper_ghi": 688.0,
      "demand_kw": 2.15,
      "balance_kw": 3.69,
      "conservative_balance_kw": 3.16,
      "safe_tradeable_kwh": 0.79
    },
    "multi_horizon_timeline": [
      { "horizon": "15M", "solar_kw": 5.84, "demand_kw": 2.15, "balance_kw": 3.69, "action": "LOCAL_TRADE" },
      { "horizon": "30M", "solar_kw": 5.40, "demand_kw": 2.30, "balance_kw": 3.10, "action": "LOCAL_TRADE" },
      { "horizon": "60M", "solar_kw": 4.20, "demand_kw": 2.80, "balance_kw": 1.40, "action": "LOCAL_TRADE" },
      { "horizon": "6H",  "solar_kw": 0.00, "demand_kw": 3.50, "balance_kw": -3.50, "action": "DISCHARGE" }
    ],
    "decision": {
      "action": "LOCAL_TRADE",
      "action_label": "TRADE 0.8 kWh LOCALLY",
      "amount_kwh": 0.79,
      "target_entity": "Prince Patel (house_prince)",
      "status": "RECOMMENDED",
      "workflow_state": "PENDING_REVIEW"
    },
    "predictive_match": {
      "has_match": true,
      "partner_household_id": "house_prince",
      "partner_name": "Prince Patel",
      "trade_kwh": 0.79,
      "price_rs": 4.50,
      "savings_rs": 1.26,
      "match_reasons": [
        "Forecasted conservative surplus (+3.16 kW)",
        "Nearby deficit buyer (Prince drawing 4.8 kW)",
        "Battery reserve protected at 65% SOC (min 20%)",
        "Economic win-win (Rs 4.50 vs Rs 6.10 grid)"
      ]
    },
    "risk_check": {
      "expected_surplus_kw": 3.69,
      "conservative_surplus_kw": 3.16,
      "safe_tradeable_kwh": 0.79,
      "cloud_volatility_risk": "LOW",
      "battery_reserve_protected": true,
      "safety_margin_preserved": true
    },
    "reasoning": [
      "Predicted rooftop solar (+5.84 kW) exceeds active domestic load (2.15 kW).",
      "Conservative 90% confidence lower bound guarantees +3.16 kW surplus.",
      "Prince's Home is drawing 4.8 kW and actively seeking P2P energy.",
      "Local settlement at Rs 4.50/kWh beats the Rs 6.10/kWh grid tariff."
    ],
    "impact": {
      "estimated_saving_rs": 1.26,
      "grid_energy_avoided_kwh": 0.79,
      "local_energy_used_kwh": 0.79,
      "co2_avoided_kg": 0.65
    },
    "ai_priorities": [
      { "priority": 1, "type": "OPPORTUNITY", "title": "P2P Solar Trade Available", "desc": "0.79 kWh safe surplus ready for Prince's Home" },
      { "priority": 2, "type": "STATUS", "title": "Battery Buffer Healthy", "desc": "65% SOC with 20% emergency floor preserved" },
      { "priority": 3, "type": "INSIGHT", "title": "Evening Peak Approaching", "desc": "Peak demand expected at 18:30" }
    ],
    "models_used": {
      "demand": "demand_v1",
      "solar": "solar_v1",
      "optimizer": "RuleBasedOptimizer_v1.0"
    }
  }
}
```

---

## 2. Weather Shock & Custom Scenario Simulators

### `POST /api/copilot/simulate-shock`
**Request**:
```json
{
  "type": "CLOUD_COVER" | "EV_CHARGE_SPIKE" | "MONSOON_DROP" | "BATTERY_DRAIN",
  "severity": 0.6,
  "household_id": "house_anjali"
}
```

### `POST /api/copilot/scenario`
**Request**:
```json
{
  "solar_delta_percent": -30.0,
  "demand_delta_percent": 25.0,
  "battery_soc": 35.0,
  "household_id": "house_anjali"
}
```

---

## 3. Grounded Conversational Q&A

### `POST /api/copilot/query`
**Request**:
```json
{
  "query": "Will I have enough surplus to sell right now?",
  "household_id": "house_anjali"
}
```
**Response**:
```json
{
  "status": "SUCCESS",
  "data": {
    "answer": "Yes. Based on your current 6.0 kWp rooftop solar and demand_v1 forecast, you are expected to generate 5.84 kW against 2.15 kW load. Accounting for the lower confidence bound, you have 0.79 kWh safe tradeable energy for the next 15 minutes.",
    "grounded_facts": {
      "predicted_solar_kw": 5.84,
      "predicted_demand_kw": 2.15,
      "safe_tradeable_kwh": 0.79,
      "battery_soc": 65.0
    }
  }
}
```
