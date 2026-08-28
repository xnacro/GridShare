# GridShare — Final Product Capability Matrix

This matrix documents every major system capability, backend backing, data source, user value, primary UI page, and priority level.

---

## Complete System Capability Matrix

| Capability | Status | Backend Support | Data Source | User Value | Primary Page / Surface | Priority |
|---|---|---|---|---|---|---|
| **Multi-Tenant User Accounts** | `IMPLEMENTED` | Supabase Auth + `utils.auth` JWT decoder | `user_profiles`, `households` | Personal prosumer/consumer identity & household mapping | Login Modal / Global Nav | P0 |
| **Isolated Household Telemetry** | `IMPLEMENTED` | `GET /api/my-energy` | `EnergyNode`, `EnergyReading` | View only one's own private generation and load | My Home | P0 |
| **Interactive Manual Override Mode** | `IMPLEMENTED` | `POST /api/my-energy/source` | `EnergyNode` (`MANUAL` source type) | Evaluator/User can enter custom solar & load numbers | My Home (Smart Modes) | P0 |
| **Community Microgrid Aggregation** | `IMPLEMENTED` | `CommunityStateService.observe` | `EnergyReading`, `Household` | Aggregated generation, consumption, net surplus/deficit | Community Overview | P0 |
| **3D Spatial Digital Twin** | `IMPLEMENTED` | `InteractiveOptimizerScene3D` | Three.js + R3F Canvas | Intuitive visual understanding of energy moving between homes | Overview / Network | P0 |
| **15-Min Demand Forecasting** | `IMPLEMENTED` | `demand_v1.joblib` (Random Forest) | UCI Individual Household Power Dataset | Anticipates upcoming household energy consumption spikes | Hornet AI | P0 |
| **15-Min Solar Irradiance Forecasting** | `IMPLEMENTED` | `solar_v1.joblib` (Random Forest) | NSRDB Satellite Irradiance Dataset | Predicts incoming rooftop solar production | Hornet AI | P0 |
| **Empirical Uncertainty Corridor** | `IMPLEMENTED` | 150 Decision Tree Estimator Spread | Ensemble Variance / Tree Standard Deviation | Risk-aware upper and lower bounds for cloud variability | Hornet AI | P0 |
| **Deterministic Rule-Based Optimizer** | `IMPLEMENTED` | `RuleBasedOptimizer.allocate_energy` | Priority Dispatch Hierarchy (Trade → Store → Export) | Mathematically optimal, cost-minimizing energy routing | Hornet AI / Lab | P0 |
| **Explainable AI Reasoning** | `IMPLEMENTED` | `CopilotService.get_copilot_insights` | Live Telemetry + Market Tariffs | Transparent justification for every recommended dispatch action | Hornet AI | P0 |
| **Real Impact Calculations** | `IMPLEMENTED` | Real mathematical calculation | Energy cleared * (Grid Tariff - P2P Tariff) | Exact INR cost savings, grid energy avoided, CO2 reduction | Hornet AI / Overview | P0 |
| **P2P Continuous Double Auction** | `IMPLEMENTED` | `MarketplaceService.match_orders` | Order Book (`market_offers`, `market_requests`) | Trade surplus solar peer-to-peer at fair midpoint tariffs (₹4.50) | Marketplace | P0 |
| **Automated Order Book Ingestion** | `IMPLEMENTED` | `auto_sync_orders_from_telemetry` | `CommunityStateService` | Automatically turns live surplus into asks and deficits into bids | Marketplace | P1 |
| **Community Battery Central ESS** | `IMPLEMENTED` | `BatteryAccountingService` | `batteries` (50 kWh Central ESS) | Neighborhood energy storage with 90% round-trip efficiency | Battery Storage | P0 |
| **Proportional Equity Accounting** | `IMPLEMENTED` | `calculate_proportional_allocation` | `battery_contributions`, `battery_withdrawals` | Tracks individual household storage credits; prevents unfair drain | Battery Storage | P0 |
| **Storage vs. Export Arbitrage** | `IMPLEMENTED` | `StorageOptimizationService` | Feed-in Tariff vs Evening Peak Avoidance | Decides whether to buffer surplus in ESS or export to grid | Battery Storage / AI | P1 |
| **Deterministic Scenario Engine** | `IMPLEMENTED` | `demo_bp.run_demo_scenario` | Predefined deterministic scenario packets | Instant 1-click demonstration of sunny afternoon prosumer flow | Scenarios Engine Modal | P0 |
| **Weather & EV Shock Simulation** | `IMPLEMENTED` | `CopilotService.simulate_weather_shock` | Cloud cover (-60%) and EV surge (+4 kW) | Demonstrates dynamic AI adaptation to sudden disruptions | Hornet AI | P1 |
| **Bilateral Transactions Ledger** | `IMPLEMENTED` | `EnergyTransaction` table | Executed P2P double-auction trades | Complete immutable trade ledger with volume, price, counterparties | Transactions | P1 |
| **Hardware Devices & Ingestion Modes** | `IMPLEMENTED` | `device_bp` | ESP32 nodes, INA219 sensors, virtual meters | Device health status and HYBRID / LIVE / SIMULATION toggles | Devices | P2 |
| **System Infrastructure Health Ping** | `IMPLEMENTED` | `GET /api/health` | Database ping, model load verification | Real-time system health and service availability monitoring | Health Modal | P2 |
