# GridShare — Complete Backend API Inventory

This document provides a comprehensive audit of every REST endpoint exposed by the GridShare Flask backend.

---

## Complete API Route Table

| Method | Endpoint | Auth | Scope | Purpose | Backend Service / Model | Status | Frontend Consumer |
|---|---|---|---|---|---|---|---|
| `GET` | `/api/health` | PUBLIC | SYSTEM | Check DB ping & service health | SQLAlchemy ping | IMPLEMENTED | `SystemHealthModal.jsx`, `api.getHealth()` |
| `GET` | `/api/me` | AUTHENTICATED | HOUSEHOLD | Return user identity, household & active energy node | `UserProfile`, `Household`, `EnergyNode` | IMPLEMENTED | `AuthContext.jsx`, `NavUtility.jsx` |
| `GET` | `/api/my-household` | AUTHENTICATED | HOUSEHOLD | Return owned household metadata & node list | `Household.nodes` | IMPLEMENTED | `MyHomeView.jsx` |
| `GET` | `/api/my-energy` | AUTHENTICATED | HOUSEHOLD | Get isolated user energy reading (SIMULATION vs MANUAL) | `EnergyNode`, `EnergyReading` | IMPLEMENTED | `MyHomeView.jsx`, `api.getMyEnergy()` |
| `POST` | `/api/my-energy/source` | AUTHENTICATED | HOUSEHOLD | Switch source (`SIMULATION`/`MANUAL`) & set manual kW | `EnergyNode`, `TelemetryService` | IMPLEMENTED | `MyHomeView.jsx` |
| `GET` | `/api/my-transactions` | AUTHENTICATED | HOUSEHOLD | List P2P transactions where user is seller or buyer | `EnergyTransaction` | IMPLEMENTED | `TransactionsView.jsx`, `MyHomeView.jsx` |
| `GET` | `/api/my-devices` | AUTHENTICATED | HOUSEHOLD | List devices/nodes owned by user | `EnergyNode` | IMPLEMENTED | `DevicesView.jsx` |
| `GET` | `/api/households` | PUBLIC | COMMUNITY | List all registered community households | `Household` model query | IMPLEMENTED | `CommunityView.jsx`, `EnergyMapView.jsx` |
| `GET` | `/api/households/<id>` | PUBLIC | HOUSEHOLD | Get specific household record | `Household` by ID | IMPLEMENTED | `EnergyMapView.jsx` |
| `GET` | `/api/energy/live` | PUBLIC | COMMUNITY | Get latest energy reading for all community nodes | `EnergyService.get_live_readings` | IMPLEMENTED | `LiveEnergyChart.jsx`, `DashboardView.jsx` |
| `GET` | `/api/energy/observe` | PUBLIC | COMMUNITY | Observe Layer: Net energy state & node classification | `CommunityStateService.observe` | IMPLEMENTED | `DashboardView.jsx`, `InteractiveMicrogridView.jsx` |
| `GET` | `/api/observe/state` | PUBLIC | COMMUNITY | Alias for `/api/energy/observe` | `CommunityStateService.observe` | IMPLEMENTED | `api.getCommunityState()` |
| `GET` | `/api/energy/history` | PUBLIC | COMMUNITY | Retrieve historical time-series energy records | `EnergyService.get_history` | IMPLEMENTED | `LiveEnergyChart.jsx` |
| `GET` | `/api/energy/summary` | PUBLIC | COMMUNITY | Aggregate generation, load, balance, node counts | `EnergyService.get_energy_summary` | IMPLEMENTED | `DashboardView.jsx`, `TopNavbar.jsx` |
| `GET` | `/api/battery` | PUBLIC | COMMUNITY | Get battery capacity, SOC, reserve, usable headroom | `BatteryAccountingService.get_battery_state` | IMPLEMENTED | `BatteryView.jsx`, `CommunityView.jsx` |
| `PATCH`| `/api/battery` | PUBLIC | ADMIN | Update battery current SOC, capacity or reserve floor | `Battery` model patch | IMPLEMENTED | `BatteryView.jsx`, `DemoModal.jsx` |
| `GET` | `/api/battery/ownership` | PUBLIC | COMMUNITY | Household-level credit ownership breakdown & % shares | `BatteryAccountingService.get_ownership_summary` | IMPLEMENTED | `BatteryView.jsx`, `CommunityView.jsx` |
| `POST` | `/api/battery/contribute`| PUBLIC | HOUSEHOLD | Inject surplus prosumer energy into shared battery | `BatteryAccountingService.contribute_energy` | IMPLEMENTED | `BatteryView.jsx` |
| `POST` | `/api/battery/withdraw` | PUBLIC | COMMUNITY | Proportional credit withdrawal under fairness policy | `BatteryAccountingService.withdraw_energy` | IMPLEMENTED | `BatteryView.jsx` |
| `GET` | `/api/battery/ledger` | PUBLIC | COMMUNITY | Full immutable ledger audit trail for community storage | `BatteryAccountingService.get_ledger` | IMPLEMENTED | `BatteryView.jsx`, `CommunityView.jsx` |
| `POST` | `/api/optimization/storage-decision` | PUBLIC | AI | Evaluates Store vs. Grid Export economic arbitrage | `StorageOptimizationService.evaluate` | IMPLEMENTED | `BatteryView.jsx`, `AiForecastView.jsx` |
| `POST` | `/api/demo/battery-fairness-demo` | PUBLIC | DEMO | Deterministic 4-step community battery fairness test | `demo_bp`, `BatteryAccountingService` | IMPLEMENTED | `CommunityView.jsx`, `DemoModal.jsx` |
| `POST` | `/api/predictions/run` | PUBLIC | AI | Run feature engineering & RandomForestRegressor | `PredictionService.run_prediction_pipeline` | IMPLEMENTED | `AiForecastView.jsx`, `DemoModal.jsx` |
| `GET` | `/api/predictions/latest` | PUBLIC | AI | Latest demand predictions with uncertainty metrics | `PredictionService.get_latest_predictions` | IMPLEMENTED | `MLPredictionCard.jsx`, `AiForecastView.jsx` |
| `GET` | `/api/predictions` | PUBLIC | AI | Raw predictions table query | `PredictionService.get_predictions` | IMPLEMENTED | `AiForecastView.jsx` |
| `POST` | `/api/optimization/run` | PUBLIC | AI | Run 4-tier deterministic rule dispatch optimizer | `OptimizationService.run_optimization_engine`| IMPLEMENTED | `Optimization.jsx`, `DemoModal.jsx` |
| `GET` | `/api/optimization/latest` | PUBLIC | AI | List recent optimization decisions audit logs | `OptimizationService.get_latest_decisions` | IMPLEMENTED | `Optimization.jsx`, `DecisionTimeline.jsx` |
| `GET` | `/api/trades` | PUBLIC | MARKET | List recent peer-to-peer energy trades | `TradingService.get_trades` | IMPLEMENTED | `TransactionsView.jsx`, `MarketplaceView.jsx`|
| `POST` | `/api/trades/match` | PUBLIC | MARKET | Trigger instant P2P order matching via optimizer | `TradingService.match_orders` | IMPLEMENTED | `MarketplaceView.jsx` |
| `GET` | `/api/dashboard/summary` | PUBLIC | COMMUNITY | Consolidated payload for React dashboard | `DashboardService.get_dashboard_summary` | IMPLEMENTED | `DashboardView.jsx` |
| `POST` | `/api/telemetry` | PUBLIC | DEVICE | Ingest smart meter reading (simulator or hardware) | `TelemetryService.ingest_reading` | IMPLEMENTED | Simulator runner, `DevicesView.jsx` |
| `GET` | `/api/market/offers` | PUBLIC | MARKET | List open/active prosumer sell offers | `MarketplaceService.get_offers` | IMPLEMENTED | `MarketplaceView.jsx`, `P2POrderBook.jsx` |
| `POST` | `/api/market/offers` | OPTIONAL AUTH| HOUSEHOLD | Create sell offer (auto-scoped if token present) | `MarketplaceService.create_offer` | IMPLEMENTED | `MarketplaceView.jsx`, `ManualOrderForms.jsx`|
| `DELETE`| `/api/market/offers/<id>`| PUBLIC | HOUSEHOLD | Cancel open sell offer | `MarketplaceService.cancel_offer` | IMPLEMENTED | `MarketplaceView.jsx` |
| `GET` | `/api/market/requests` | PUBLIC | MARKET | List open/active consumer buy requests | `MarketplaceService.get_requests` | IMPLEMENTED | `MarketplaceView.jsx`, `P2POrderBook.jsx` |
| `POST` | `/api/market/requests` | OPTIONAL AUTH| HOUSEHOLD | Create buy request (auto-scoped if token present) | `MarketplaceService.create_request` | IMPLEMENTED | `MarketplaceView.jsx`, `ManualOrderForms.jsx`|
| `DELETE`| `/api/market/requests/<id>`| PUBLIC| HOUSEHOLD | Cancel open buy request | `MarketplaceService.cancel_request` | IMPLEMENTED | `MarketplaceView.jsx` |
| `POST` | `/api/market/match` | PUBLIC | MARKET | Run continuous double-auction clearing algorithm | `MarketplaceService.match_orders` | IMPLEMENTED | `MarketplaceView.jsx` |
| `GET` | `/api/market/transactions` | PUBLIC | MARKET | List executed P2P bilateral transactions | `MarketplaceService.get_transactions` | IMPLEMENTED | `MarketplaceView.jsx`, `TransactionsView.jsx`|
| `POST` | `/api/demo/run-scenario` | PUBLIC | DEMO | Execute deterministic PPT sunny afternoon scenario | `demo_bp.run_demo_scenario` | IMPLEMENTED | `DemoModal.jsx` |
| `POST` | `/api/demo/reset` | PUBLIC | DEMO | Reset database to deterministic initial seed data | `seed_database(clear_existing=True)` | IMPLEMENTED | `DemoModal.jsx`, `NavUtility.jsx` |
| `GET` | `/api/devices` | PUBLIC | DEVICE | List registered ESP32 and virtual smart meters | `device_bp.get_devices` | IMPLEMENTED | `DevicesView.jsx` |
| `GET` | `/api/devices/mode` | PUBLIC | DEVICE | Get current telemetry ingestion mode | `device_bp.manage_ingestion_mode` | IMPLEMENTED | `DevicesView.jsx` |
| `POST` | `/api/devices/mode` | PUBLIC | ADMIN | Set telemetry ingestion mode (`HYBRID`/`LIVE`/`SIM`) | `device_bp.manage_ingestion_mode` | IMPLEMENTED | `DevicesView.jsx` |
| `GET` | `/api/copilot/insights` | PUBLIC | AI | Hornet AI 6-step loop (Observe→Predict→Optimize) | `CopilotService.get_copilot_insights` | IMPLEMENTED | `AiForecastView.jsx`, `DashboardView.jsx` |
| `POST` | `/api/copilot/simulate-shock`| PUBLIC | DEMO | Simulate weather/EV demand shock scenarios | `CopilotService.simulate_weather_shock` | IMPLEMENTED | `AiForecastView.jsx`, `DemoModal.jsx` |
