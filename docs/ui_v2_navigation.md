# GridShare V2 — Global Navigation Architecture & Specification

**Component**: `client/src/components/navigation/GridShareNav.jsx` & `NavPill.jsx`  
**Pattern**: Centered Floating Collapsible Pill Navigation with Persistent State

---

## 1. Architectural Overview

GridShare rejects conventional clumsy vertical sidebars and dense full-width admin headers. Instead, it utilizes a signature **Floating Collapsible Pill Dock** that floats above page content with subtle glassmorphism (`rgba(255,255,255,0.85)` + `backdrop-blur-md`).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [GRIDSHARE LOGO]     [ ⚡ Overview | 🌐 Network | 🐝 Hornet AI | 🏪 Market | 🔋 Battery ]     [ ● LIVE | 🔔 | 👤 ] │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Desktop Navigation States

### A. Expanded Mode (Default)
- **Visuals**: Pill width $\approx 640\text{px}$, height $48\text{px}$, border-radius `9999px`.
- **Items**: FontAwesome icon + text label for the 6 primary daily destinations:
  1. **Overview** (`/`) $\rightarrow$ Executive Command Center & Net Balance
  2. **Energy Network** (`/network`) $\rightarrow$ 3D Spatial Digital Twin & Node Flows
  3. **Hornet AI** (`/ai`) $\rightarrow$ 6-Step Multi-Horizon Predictive Orchestration
  4. **Marketplace** (`/marketplace`) $\rightarrow$ P2P Energy Exchange & Double Auction
  5. **Battery** (`/battery`) $\rightarrow$ 50 kWh ESS & 20% Reserve Floor
  6. **My Home** (`/my-home`) $\rightarrow$ Prosumer Residential Cockpit
- **"More" Dropdown Menu**:
  - Scenarios Sandbox (`/optimize`)
  - Financial Transactions Ledger (`/transactions`)
  - Simulated Edge Devices (`/devices`)
  - System Infrastructure & Health (Modal)

### B. Collapsed Mode (Compact Float Dock)
- **Trigger**: Clickable collapse toggle arrow on the right end of the pill dock.
- **Visuals**: Shrinks smoothly to $\approx 360\text{px}$ width.
- **Behavior**: Labels are hidden; icons remain centered with crisp instant tooltips.
- **Persistence**: User preference is stored in browser `localStorage.getItem('gridshare_nav_collapsed')`.

---

## 3. Right Utility Area

The right side of the top header contains only essential operational controls:
1. **Live Status Badge**:
   - `● LIVE` with an animated emerald pulse dot and active timestamp.
2. **Guided Demo / Scenarios Trigger**:
   - One-click trigger opening the 4-step scenario presentation modal.
3. **Infrastructure Health Trigger**:
   - Opens `SystemHealthModal` for checking database latency and ML availability.
4. **User Profile Dropdown**:
   - Displays current household node (*"House A — Solar Prosumer"*), account settings, and logout action.

---

## 4. Responsive Adaptations

| Screen Width | Viewport Type | Navigation Behavior |
| :--- | :--- | :--- |
| **$\ge 1280\text{px}$** | Large Desktop | Full floating pill with labels and expand/collapse toggle. |
| **$1024\text{px} - 1279\text{px}$** | Small Desktop / Tablet Landscape | Auto-switches to compact icon-only pill. |
| **$768\text{px} - 1023\text{px}$** | Tablet Portrait | Compact top floating bar with quick-switch primary tabs. |
| **$< 768\text{px}$** | Mobile | Sticky top bar with brand logo + `● LIVE` badge + hamburger menu button opening `NavMobileDrawer.jsx` slide-out sheet. |

---

## 5. Route Map & Aliasing Table

```
/                -> DashboardView.jsx (Overview)
/dashboard       -> DashboardView.jsx (Overview alias)
/network         -> InteractiveMicrogridView.jsx (Energy Network)
/simulation      -> InteractiveMicrogridView.jsx (Network alias)
/energy-map      -> EnergyMapView.jsx (Detailed Map alias)
/ai              -> AiForecastView.jsx (Hornet AI Hub)
/copilot         -> AiForecastView.jsx (Hornet AI alias)
/marketplace     -> MarketplaceView.jsx (P2P Exchange)
/battery         -> BatteryView.jsx (Storage & Ledger)
/community       -> BatteryView.jsx (Battery alias)
/my-home         -> MyHomeView.jsx (Residential Cockpit)
/devices         -> DevicesView.jsx (Edge Gateway)
/transactions    -> TransactionsView.jsx (Financial Ledger)
/optimize        -> Optimization.jsx (Scenarios Sandbox)
```
