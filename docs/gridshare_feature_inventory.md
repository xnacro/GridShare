# GridShare — Product Feature Inventory

This document maps all product features genuinely supported by the GridShare backend architecture.

---

## 1. Feature Inventory Matrix

| Feature | Backend Support | Data Source | User Value | Implementation Effort | Status | UI Page / Surface | Priority |
|---|---|---|---|---|---|---|---|
| **My Home Dashboard** | FULL (`/api/me`, `/api/my-*`) | `user_profiles`, `households`, `energy_nodes` | Personal energy monitoring, prosumer solar vs load, isolated household view | LOW | IMPLEMENTED | My Home | P0 |
| **Data Source Switcher** | FULL (`POST /api/my-energy/source`) | `energy_nodes` (`SIMULATION` vs `MANUAL`) | Allows user to test custom solar generation & load numbers directly | LOW | IMPLEMENTED | My Home (Smart Modes) | P0 |
| **Community Overview** | FULL (`/api/observe/state`, `/api/energy/summary`) | `CommunityStateService` | Real-time community balance, self-sufficiency %, storage state | LOW | IMPLEMENTED | Overview (Dashboard) | P0 |
| **Hornet AI Copilot** | FULL (`/api/copilot/insights`) | `CopilotService`, `demand_v1`, `solar_v1`, `RuleBasedOptimizer` | 6-step AI decision loop: forecast + uncertainty + rule dispatch + explainable rationale | LOW | IMPLEMENTED | Hornet AI | P0 |
| **Forecast Uncertainty Corridor** | FULL (`predict_solar`, `predict_demand`) | Empirical Random Forest Tree Spread (150 trees) | Shows lower/upper confidence bounds for risk-aware microgrid operations | LOW | IMPLEMENTED | Hornet AI / Forecast Chart | P0 |
| **P2P Energy Marketplace** | FULL (`/api/market/*`) | `market_offers`, `market_requests`, `MarketplaceService` | Continuous double-auction trading of solar surplus at fair midpoint tariffs (₹4.50/kWh) | LOW | IMPLEMENTED | Marketplace | P0 |
| **Automated Order Book Ingestion**| FULL (`auto_sync_orders_from_telemetry`) | `CommunityStateService` | Automatically turns prosumer surplus into sell orders and deficits into buy requests | LOW | IMPLEMENTED | Marketplace | P1 |
| **Community Battery Storage** | FULL (`/api/battery/*`) | `BatteryAccountingService`, `batteries`, `battery_ledger` | 50 kWh central ESS with 90% round-trip efficiency & proportional equity accounting | LOW | IMPLEMENTED | Battery / Community Storage| P0 |
| **Proportional Equity Allocation**| FULL (`calculate_proportional_allocation`)| `battery_contributions`, `battery_withdrawals` | Withdrawals allocated proportionally to stored credits to prevent unfair pool depletion | LOW | IMPLEMENTED | Battery (3D Ownership Twin)| P0 |
| **Storage vs. Export Decision** | FULL (`/api/optimization/storage-decision`)| `StorageOptimizationService` | Compares immediate feed-in revenue vs future peak avoidance value | LOW | IMPLEMENTED | Battery / Hornet AI | P1 |
| **Deterministic Scenario Engine** | FULL (`/api/demo/run-scenario`, `/api/demo/reset`) | `demo_bp`, `seed_data` | Evaluator/Judge presets: Sunny Afternoon, Battery Fairness, Instant Reset | LOW | IMPLEMENTED | Global Guided Scenarios Modal| P0 |
| **Weather & EV Shock Simulation** | FULL (`/api/copilot/simulate-shock`) | `CopilotService` | Demonstrates real-time AI response to cloud cover or EV charging surges | LOW | IMPLEMENTED | Hornet AI (Shock Simulator) | P1 |
| **Bilateral Transactions Ledger** | FULL (`/api/trades`, `/api/market/transactions`) | `energy_transactions` | Immutable financial & physical energy ledger with timestamp and party attribution | LOW | IMPLEMENTED | Transactions | P1 |
| **Devices & Hardware Telemetry** | FULL (`/api/devices`, `/api/devices/mode`) | `device_bp`, `energy_nodes` | ESP32 microcontroller status, INA219 voltage/current telemetry, ingestion modes | LOW | IMPLEMENTED | Devices | P2 |
| **System Health Monitoring** | FULL (`/api/health`) | Database ping, model load verification | Real-time infrastructure status and service health check | LOW | IMPLEMENTED | System Health Modal | P2 |
