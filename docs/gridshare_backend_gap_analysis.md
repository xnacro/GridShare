# GridShare — Backend Gap Analysis

This document identifies the genuine gaps, partial implementations, and areas of improvement in the GridShare backend.

---

## 1. Capability Status Matrix

| Capability Area | Status | Current Implementation State | Recommendation / Action |
|---|---|---|---|
| **Multi-User Identity & Tenant Isolation** | `EXISTS` | Bearer token decoder in `utils.auth` maps user to `user_profiles`, `households`, and `energy_nodes`. Isolated endpoints `/api/my-*` filter by `g.household_id`. | Keep as is; verified with 7 unit tests. |
| **Personal Data Source Override** | `EXISTS` | `POST /api/my-energy/source` allows switching between `SIMULATION` and `MANUAL` with custom kW values. | Keep as is; great for interactive evaluation. |
| **15-Min Demand Forecasting (demand_v1)** | `EXISTS` | Trained Random Forest on 95k UCI Power samples (MAE 0.235 kW, R² 0.758). Generates lag-32 feature vectors. | High accuracy; use as primary forecast baseline. |
| **15-Min Solar Irradiance Forecasting (solar_v1)**| `EXISTS` | Trained Random Forest on NSRDB Solar data with 27 temporal & solar geometry features (MAE 38.6 W/m², R² 0.942). | High accuracy; converts GHI to PV kW via configurable array specs. |
| **Forecast Uncertainty Corridor** | `EXISTS` | Derived from empirical variance/std across 150 individual estimator decision trees in Random Forest. | Accurate; do not mislabel as Gaussian parametric bounds. |
| **Multi-Horizon Rollout (1h, 6h, 24h)** | `PARTIAL` | Single-step models (15m) can iterate multi-step rollouts, but are only rigorously validated on 15m–60m horizons. | Clearly display "15-Min Dispatch Forecast" in primary UI; label 24h charts as diurnal scenario projections. |
| **P2P Continuous Double Auction** | `EXISTS` | Asks and bids matched at uniform midpoint clearing price. Auto-generates orders from live prosumer surplus and consumer deficit. | Fully functional; operates in-memory/DB. |
| **Battery Proportional Equity Accounting** | `EXISTS` | Tracks individual household contributions, applies 90% round-trip efficiency, allocates withdrawals proportionally. | Fully functional; tested across multiple edge cases. |
| **Storage vs. Export Decision Engine** | `EXISTS` | Evaluates immediate feed-in tariff (₹3.50) vs evening peak avoidance value (₹7.20). | Fully functional rule optimizer. |
| **Server-Sent Events (SSE) / WebSocket Push** | `MISSING` | Telemetry is currently pulled via HTTP REST polling (e.g. 5s intervals) or pushed on user actions. | Polling is fast, robust, and zero-dependency for web deployment; true SSE can remain a future P3 enhancement. |
| **Physical Payment / Banking Integration** | `SIMULATED` | All transactions calculate INR valuations; no real fiat banking or wallet APIs are integrated. | Keep simulated; appropriate for microgrid simulation and regulatory compliance. |
| **Physical ESP32 Telemetry** | `PARTIAL` | Backend accepts POST `/api/telemetry` from hardware and includes optional MQTT client, but defaults to deterministic simulation. | Expose through Devices view as "Hardware-Ready Protocol Layer". |
