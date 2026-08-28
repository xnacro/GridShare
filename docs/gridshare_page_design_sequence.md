# GridShare — Frontend Page Design Sequence

This document defines the step-by-step sequence for redesigning and refining the GridShare frontend **one page at a time**.

---

## 1. Page-by-Page Design Principle

We will NOT redesign the entire frontend in a single step. Each page will be designed, implemented, and verified in strict isolation following this protocol:
1. **Audit page backend dependencies and data availability.**
2. **Define primary user question and core goal.**
3. **Establish Hero-First editorial visual hierarchy.**
4. **Implement responsive layout with glassmorphism and modern tokens.**
5. **Verify data bindings and interactions with zero mock placeholders.**
6. **Pass all tests before moving to the next page.**

---

## 2. Recommended Implementation Sequence

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 1: GLOBAL SHELL & NAVIGATION                                      │
│ - Floating Pill Nav (`GridShareNav.jsx`)                               │
│ - Auth Context & Account Modal (`LoginModal.jsx`)                      │
│ - Global Guided Scenario Engine Modal (`DemoModal.jsx`)                │
│ - System Infrastructure Health Modal (`SystemHealthModal.jsx`)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 2: COMMUNITY OVERVIEW (`DashboardView.jsx`)                       │
│ - Question: "What is the live microgrid energy balance today?"         │
│ - Hero: Net Community Balance, Generation, Load, Battery Reserve       │
│ - Center: 3D Microgrid Marketplace Canvas                              │
│ - Key Sections: Live Node Breakdown, Diurnal Profile, Quick Actions    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 3: MY HOME (`MyHomeView.jsx`)                                     │
│ - Question: "What is my private household solar & consumption state?"  │
│ - Hero: Isolated User Balance, Solar PV, Load, Battery State           │
│ - Center: 3D Residential House Twin & Smart Energy Mode Switcher       │
│ - Key Sections: Appliance Load Manager, Private Transactions           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 4: HORNET AI OPERATING SYSTEM (`AiForecastView.jsx`)              │
│ - Question: "What will happen in 15 minutes and what should we do?"    │
│ - Hero: 15-Min Dispatch Forecast, Solar vs Demand Net Balance          │
│ - Center: 6-Step Decision Pipeline & Uncertainty Corridor              │
│ - Key Sections: Operational Shock Simulator (Cloud / EV), Reasoning   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 5: P2P MARKETPLACE (`MarketplaceView.jsx`)                        │
│ - Question: "How can I trade solar surplus with neighbors at fair rates?"│
│ - Hero: Available Local Energy, Recommended Matches, P2P Clearing Rate │
│ - Center: Continuous Double-Auction Order Book (Asks & Bids)           │
│ - Key Sections: Trade Confirmation Modal, Bilateral Transactions Ledger│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 6: COMMUNITY BATTERY (`BatteryView.jsx` / `CommunityView.jsx`)    │
│ - Question: "How is our 50 kWh shared storage allocated fairly?"       │
│ - Hero: Central ESS SOC %, Stored Energy, Dispatchable Headroom        │
│ - Center: 3D Battery Mesh & Proportional Equity Ownership Twin        │
│ - Key Sections: Storage Arbitrage Evaluator, Immutable Battery Ledger  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 7: ENERGY NETWORK (`EnergyMapView.jsx` / `InteractiveMicrogrid`)  │
│ - Question: "How is energy spatially routed across the neighborhood?"  │
│ - Hero: Active Microgrid Topology, Online Node Count, Substation Flow  │
│ - Center: 3D Spatial Network Canvas with Bilateral Energy Flow Lines   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 8: TRANSACTIONS LEDGER (`TransactionsView.jsx`)                   │
│ - Question: "What is the historical audit trail of all settled trades?"│
│ - Hero: Total Energy Cleared, Cumulative Savings, Trade Count          │
│ - Center: Searchable, Filterable Bilateral P2P Transactions Table      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 9: DEVICES & SMART METERS (`DevicesView.jsx`)                     │
│ - Question: "What physical and virtual telemetry nodes are connected?" │
│ - Hero: Ingestion Mode (HYBRID/LIVE/SIM), Active Hardware Status       │
│ - Center: ESP32 IoT Nodes, INA219 Voltage/Current Readings             │
└────────────────────────────────────────────────────────────────────────┘
```
