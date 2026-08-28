# GridShare — Simulation Capability Audit

This document audits the entire simulation engine, synthetic telemetry generation, scenario injection, and demo reproduction capabilities.

---

## 1. Simulation Architecture & Generators

The simulation system is split into three layers:
1. **Model & Mathematical Profiles** (`server/simulator/generator.py`):
   - Defined profiles for 5 households (`house_a` to `house_e`):
     - `house_a`: Solar Champion (8.0 kW PV, 1.5–2.5 kW load, battery: True, SOC: 75%).
     - `house_b`: Heavy Consumer / EV (1.5 kW PV, 3.0–5.5 kW load, battery: False).
     - `house_c`: Balanced Prosumer (4.0 kW PV, 1.2–2.8 kW load, battery: True, SOC: 60%).
     - `house_d`: Smart Apartment (0.0 kW PV, 1.0–3.2 kW load, battery: False).
     - `house_e`: Solar Villa (6.0 kW PV, 1.8–3.0 kW load, battery: True, SOC: 80%).
   - Diurnal solar curve: Generates irradiance and PV output via sinusoidal solar elevation between 06:00 and 18:00 UTC with peak at 12:00.
   - Temperature curve: Peaks at 14:00 (34°C) with minimum at 05:00 (22°C).
   - Household demand curve: Morning peak (07:00–09:00) and evening peak (18:00–22:00).
   - Gaussian noise: Added to simulated readings unless in deterministic demo mode.

2. **Telemetry Ingestion & Source Tagging** (`server/app/services/telemetry_service.py`):
   - Every reading in `energy_readings` table carries `source="SIMULATED"` or `source="HARDWARE"`.
   - Ingestion calculates authoritative net balance server-side (`generation_kw - consumption_kw`).

3. **Scenario Engine & Deterministic Scenarios**:
   - Supported predefined scenarios:
     - **Sunny Afternoon Community (PPT Demo)** (`/api/demo/run-scenario`):
       - House A: 6.80 kW gen, 2.10 kW load (+4.70 kW surplus).
       - House B: 1.20 kW gen, 4.00 kW load (-2.80 kW deficit).
       - Community Battery: 40.0% SOC (20.0 / 50.0 kWh).
       - Grid: ₹6.10/kWh | P2P clearing: ₹4.50/kWh.
       - Dispatches: 2.80 kW Local Trade (House A → House B), 1.20 kW Store in Battery, 0.70 kW Export to Grid.
     - **Battery Fairness Demo** (`/api/demo/battery-fairness-demo`):
       - House A injects 10.0 kWh (9.0 kWh usable after 90% round-trip efficiency).
       - House B injects 1.0 kWh (0.9 kWh usable).
       - Community withdraws 5.0 kWh evening peak.
       - Proportional allocation: House A = 4.545 kWh, House B = 0.455 kWh.
     - **Weather & Operational Shocks** (`/api/copilot/simulate-shock`):
       - `CLOUD_COVER`: Drops solar generation by configurable severity (e.g. -60%), expands forecast uncertainty interval.
       - `EV_CHARGE_SPIKE`: Adds sudden 4–8 kW load surge to consumer households.
     - **Database Reset** (`/api/demo/reset`):
       - Drops and reseeds all tables to clean deterministic baseline in < 0.2s.

---

## 2. Multi-User Simulation Independence

- **Independent Manual Override**: Authenticated users can switch their personal household's `source_type` from `SIMULATION` to `MANUAL` via `POST /api/my-energy/source` and provide custom `manual_generation_kw` and `manual_consumption_kw`.
- **Community Aggregation**: Community state service aggregates live readings across both simulated nodes and manual user overrides seamlessly.

---

## 3. Product & Demo Recommendations

| Capability | Reality | Product Experience Recommendation |
|---|---|---|
| Sunny Afternoon Demo | FULLY IMPLEMENTED | Expose via quick preset in Scenario engine modal |
| Battery Fairness Demo | FULLY IMPLEMENTED | Interactive 3D visual walkthrough on Battery page |
| Weather Shock | FULLY IMPLEMENTED | One-click "Simulate Cloud Passage" button on Hornet AI page |
| EV Load Surge | FULLY IMPLEMENTED | One-click "Simulate EV Cluster" button on Hornet AI page |
| Reset Baseline | FULLY IMPLEMENTED | Top navigation utility button for clean demo restart |
