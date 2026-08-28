# GridShare V2 — Frontend Implementation Plan & Roadmap

**Execution Strategy**: Incremental refactoring and enhancement without breaking existing backend APIs, ML artifacts, or database models.

---

## 1. Phased Priority Hierarchy

```
┌─────────────┬─────────────────────────────────────────────────────────────┐
│ Priority    │ Scope & Subsystems                                          │
├─────────────┼─────────────────────────────────────────────────────────────┤
│ P0          │ Design Tokens, Typography, Colors, Icon Registry, Nav Pill  │
│ P1          │ Overview Command Center, Hornet AI 6-Step Hub, 3D Network   │
│ P2          │ P2P Marketplace, Battery ESS (20% Floor), My Home 3D        │
│ P3          │ Scenarios Sandbox, Ledger Transactions, Edge Devices, Auth  │
└─────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Phase Breakdown

### Phase 1: Design Tokens, Typography, Colors, Icon System & Nav Shell
- **Task 1.1**: Update `client/tailwind.config.js` and `client/src/index.css` with the complete V2 token system (Warm Off-White `#F5F7F3`, Deep Forest `#12392B`, Emerald `#209B67`, Solar Gold `#E7AA31`, AI Violet `#7359C8`).
- **Task 1.2**: Ensure `client/src/icons/iconRegistry.js` maps 100% of icons to FontAwesome Solid Icons.
- **Task 1.3**: Refactor `client/src/components/navigation/GridShareNav.jsx` and `NavPill.jsx` to support the floating collapsible pill dock with smooth transitions and persistent `localStorage` memory.
- **Task 1.4**: Create centralized shared components in `client/src/components/ui/` (`MetricCard`, `Badge`, `Button`, `StatusIndicator`, `FeedbackStates`).

### Phase 2: Core Intelligence & Command Surfaces
- **Task 2.1**: **Overview Command Center (`DashboardView.jsx`)**:
  - Dynamically load live net balance, generation, and load from `GET /api/dashboard`.
  - Feature 4 primary metric cards (**Generation**, **Community Load**, **Net Balance**, **Battery SOC**).
  - Embed live **Hornet AI Insight Card** connecting directly to `GET /api/copilot/insights`.
  - Provide spacious 3D Digital Twin with floating semantic flow legend.
- **Task 2.2**: **Hornet AI Operating Hub (`AiForecastView.jsx`)**:
  - Polish the 6-step progression strip (`Observe → Predict → Risk → Action → Explain → Savings`).
  - Toggle between **Simple View** (for everyday prosumers) and **Technical ML View** (for engineers/judges).
  - High-contrast decision card with explicit **[ Review & Confirm ]** $\rightarrow$ **Confirm Dispatch** workflow.
  - Multi-horizon forecast corridor chart with shaded prediction intervals ($\text{W/m}^2$, $\text{kW}$, $\text{kWh}$).
- **Task 2.3**: **3D Spatial Energy Network (`InteractiveMicrogridView.jsx`)**:
  - Consolidate `/network`, `/simulation`, and `/energy-map` into a unified high-performance 3D spatial microgrid twin.
  - Floating, non-intrusive node inspection cards with live surplus/deficit actions.

### Phase 3: Marketplace, Storage Asset & Residential Cockpit
- **Task 3.1**: **P2P Marketplace (`MarketplaceView.jsx`)**:
  - Clear bilateral intelligent matching cards (House A $\leftrightarrow$ House B @ ₹4.50/kWh vs ₹6.10 grid tariff).
  - Tabbed order book (Matches / Open Orders / Settled Trades).
- **Task 3.2**: **Battery ESS (`BatteryView.jsx`)**:
  - Visual 50 kWh battery storage progress bar clearly demarcating the **20% Emergency Reserve Floor**.
  - Proportional prosumer ownership table (House A, House B, House E shares).
  - Real-time battery ledger history.
- **Task 3.3**: **My Home 3D Cockpit (`MyHomeView.jsx`)**:
  - 3D residential house model with live solar roof yield and appliance wattage loads.
  - 1-click operating mode switcher (`AUTO`, `SELF_USE`, `BATTERY_FIRST`, `SELL_SURPLUS`, `GRID_BACKUP`).

### Phase 4: Scenarios, Ledger, Devices, Infrastructure & Auth
- **Task 4.1**: **Scenarios Workbench (`Optimization.jsx` & `DemoModal.jsx`)**:
  - 4-phase guided scenario engine (`BEFORE → ANALYSIS → RECOMMENDATION → AFTER`) for Solar Noon, Evening Peak, Normal Day, and Monsoon Overcast.
  - Explicit **SIMULATION** badge.
- **Task 4.2**: **Transactions Ledger (`TransactionsView.jsx`)**:
  - Crisp financial ledger with monospace currency (₹) and energy (kWh) formatting, searchable filters, and detailed receipt modals.
- **Task 4.3**: **Simulated Edge Devices (`DevicesView.jsx`)**:
  - Edge gateway health dashboard marked **SIMULATED TELEMETRY**.
- **Task 4.4**: **System Infrastructure Health (`SystemHealthModal.jsx`)**:
  - Status modal reporting live backend, database connectivity, and ML model availability without exposing sensitive connection strings.

---

## 3. Validation & Quality Gates

1. **Build & Bundler**: `npm run build` must complete with 0 errors.
2. **Backend Integrity**: All unit tests (`server/tests/test_copilot_api.py` and `ml/tests/`) must pass with 0 regressions.
3. **Data Honesty**: Zero hardcoded fake confidence percentages; all metrics must match authoritative metadata in `ml/models/metadata.json` and `solar_metadata.json`.
4. **Responsive Integrity**: Flawless visual display across Desktop ($\ge 1280\text{px}$), Tablet ($768\text{px}\text{--}1023\text{px}$), and Mobile ($< 768\text{px}$).
