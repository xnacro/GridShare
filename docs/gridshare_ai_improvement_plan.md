# GridShare AI — Future Roadmap & Improvement Plan

This document outlines the ranked improvements for GridShare and Hornet AI across future engineering phases.

---

## Priority Ranking Matrix

```
┌─────────────┬─────────────────────────────────────────────────────────────┐
│ Priority    │ Focus Area                                                  │
├─────────────┼─────────────────────────────────────────────────────────────┤
│ P0 (Done)   │ Data Truth, Empirical Prediction Ranges, 6-Step Copilot API │
│ P1 (Near)   │ Physical Hardware Ingestion (MQTT / ESP32) & Live Mutex     │
│ P2 (Medium) │ Dynamic PV Parameter Customizer & Multi-Household Topology  │
│ P3 (Future) │ Deep Learning Neural Models & Multi-Cluster Microgrid Mesh  │
└─────────────┴─────────────────────────────────────────────────────────────┘
```

---

### P0: Correctness & Data Integrity (**COMPLETED**)
- [x] Integrate `demand_v1` (active load) and `solar_v1` (Guwahati GHI) into a unified `CopilotService`.
- [x] Replace all arbitrary `"94% confidence"` UI badges with empirical prediction ranges (`lower_ghi` to `upper_ghi`).
- [x] Enforce explicit separation between AI recommendation (`RECOMMENDED`) and human review/execution.
- [x] Protect the $20\%$ central battery emergency reserve floor in `RuleBasedOptimizer`.

---

### P1: Physical Hardware Ingestion & Database Mutex (**NEXT PHASE**)
- **Objective**: Connect physical IoT smart energy meters to replace simulated telemetry.
- **Tasks**:
  1. Enable `MQTT_ENABLED=true` in `server/app/config.py` using the already implemented `MQTTTelemetryClient` (`gridshare/telemetry` topic).
  2. Implement database transaction locks on `EnergyTransaction` to prevent double-spending during rapid P2P order matching.
  3. Add WebSocket / Server-Sent Events (SSE) stream for sub-second telemetry updates from smart meters.

---

### P2: Dynamic PV Parameter Customizer & Advanced UI Visualizations
- **Objective**: Allow users to configure their exact rooftop solar array characteristics.
- **Tasks**:
  1. Add UI sliders in `AiForecastView.jsx` to dynamically adjust rooftop capacity ($1.0\text{ kWp}$ to $20.0\text{ kWp}$), panel efficiency ($15\%\text{--}22\%$), and tilt angle.
  2. Implement an interactive 3D solar azimuth / sun position visualizer in Three.js on the `/ai` page.
  3. Expand `WeatherShockSimulator.jsx` with customizable cloud density and duration sliders.

---

### P3: Deep Learning Neural Models & Multi-Microgrid Mesh
- **Objective**: Long-term research extensions for multi-community energy federation.
- **Tasks**:
  1. Train Temporal Fusion Transformer (TFT) or NeuralProphet models for 7-day long-term battery cycle scheduling.
  2. Implement multi-cluster P2P routing (e.g. Cluster A in Guwahati North trading with Cluster B in Guwahati South across distribution feeders).
  3. Integrate live weather radar API feeds from IMD (India Meteorological Department) to improve 5-minute cloud ramp forecasting.
