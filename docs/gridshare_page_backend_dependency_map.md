# GridShare — Page-to-Backend Dependency Map

This document defines the exact data, API endpoint, and service dependencies for every product page in GridShare.

---

## 1. Page Dependency Architecture

```
1. OVERVIEW (Command Center)
   ├─► GET /api/observe/state ───────► CommunityStateService (Aggregated Live State)
   ├─► GET /api/energy/summary ──────► EnergyService (Net Balance & Counts)
   ├─► GET /api/copilot/insights ────► CopilotService (Hornet AI Live Recommendation)
   └─► GET /api/battery ─────────────► BatteryAccountingService (Central ESS State)

2. MY HOME (Personal Prosumer Hub)
   ├─► GET /api/me ──────────────────► utils.auth (Authenticated User Context)
   ├─► GET /api/my-household ────────► Household Model (Owned Property & Nodes)
   ├─► GET /api/my-energy ───────────► EnergyNode + EnergyReading (Isolated Node State)
   ├─► POST /api/my-energy/source ───► EnergyNode (Switch Simulation vs Manual Override)
   └─► GET /api/my-transactions ─────► EnergyTransaction (User-Scoped Trade History)

3. HORNET AI (Predictive Dispatch Operating System)
   ├─► GET /api/copilot/insights ────► CopilotService (6-Step Decision Pipeline)
   │     ├─► DemandPredictor ────────► demand_v1.joblib (150-Tree Random Forest)
   │     ├─► SolarPredictor ─────────► solar_v1.joblib (100-Tree Random Forest)
   │     └─► RuleBasedOptimizer ─────► Deterministic 4-Tier Energy Dispatcher
   ├─► POST /api/copilot/simulate-shock ─► CopilotService (Cloud Cover / EV Spikes)
   └─► POST /api/predictions/run ────► PredictionService (Run Pipeline on Demand)

4. ENERGY NETWORK (Spatial Microgrid Grid View)
   ├─► GET /api/observe/state ───────► CommunityStateService (Node Positions & Status)
   ├─► GET /api/households ──────────► Household Registry (Metadata & Prosumer Types)
   └─► GET /api/optimization/latest ─► OptimizationService (Active Energy Routing Vectors)

5. MARKETPLACE (P2P Double-Auction Trading)
   ├─► GET /api/market/offers ───────► MarketplaceService (Open Sell Offers)
   ├─► POST /api/market/offers ──────► MarketplaceService (Create Sell Offer)
   ├─► GET /api/market/requests ─────► MarketplaceService (Open Buy Requests)
   ├─► POST /api/market/requests ────► MarketplaceService (Create Buy Request)
   ├─► POST /api/market/match ───────► MarketplaceService (Execute Double-Auction Match)
   └─► GET /api/market/transactions ─► EnergyTransaction (Executed Bilateral Trades)

6. COMMUNITY BATTERY (50 kWh Shared ESS & Fairness Ledger)
   ├─► GET /api/battery ─────────────► BatteryAccountingService (SOC, Headroom, Reserve)
   ├─► GET /api/battery/ownership ───► BatteryContribution (Proportional Equity Breakdown)
   ├─► POST /api/battery/contribute ─► BatteryAccountingService (Surplus Ingestion)
   ├─► POST /api/battery/withdraw ───► BatteryAccountingService (Fairness Allocation)
   ├─► GET /api/battery/ledger ──────► BatteryLedger (Immutable Event Audit Trail)
   ├─► POST /api/optimization/storage-decision ─► StorageOptimizationService (Storage Arbitrage)
   └─► POST /api/demo/battery-fairness-demo ───► demo_bp (Deterministic 4-Step Walkthrough)

7. TRANSACTIONS & AUDIT LEDGER (Bilateral Settlement History)
   ├─► GET /api/market/transactions ─► EnergyTransaction (All Community Trades)
   └─► GET /api/my-transactions ─────► EnergyTransaction (Filtered to User's Household)

8. DEVICES & HARDWARE (Smart Meters & Edge Ingestion)
   ├─► GET /api/devices ─────────────► device_bp (ESP32 Nodes & Virtual AMI Meters)
   ├─► GET/POST /api/devices/mode ───► device_bp (Switch HYBRID / LIVE / SIMULATION)
   └─► GET /api/my-devices ──────────► EnergyNode (Household-specific Telemetry Units)

9. GLOBAL MODALS & UTILITIES
   ├─► Guided Scenarios Modal ───────► POST /api/demo/run-scenario, POST /api/demo/reset
   ├─► System Infrastructure Health ─► GET /api/health
   └─► User Auth / Account Modal ────► Supabase Auth / Local Demo Tokens
