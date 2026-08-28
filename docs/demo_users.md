# GridShare Community Microgrid — Authentic 4-User Accounts

This document outlines the four real community households in the GridShare microgrid ecosystem. All hardcoded/synthetic household tags (`House A`, `House B`, etc.) have been completely removed from application logic. Every household is backed by authenticated credentials and live PostgreSQL database records.

---

## Universal Demo Credentials

| Parameter | Value |
| :--- | :--- |
| **Default Password** | `admin@123` |
| **Authentication Flow** | `POST /api/auth/login` $\rightarrow$ JWT Bearer Token |
| **Database Engine** | Remote Supabase AWS PostgreSQL |

---

## 1. User Profiles & Energy Assets

### 👩‍💻 1. Anjali Sharma — High Solar Prosumer
- **Email**: `anjali@gridshare.io`
- **Password**: `admin@123`
- **Household ID**: `house_anjali`
- **Node ID**: `node_house_anjali`
- **Location**: Plot 101, Green Enclave (Sub-feeder A)
- **Role / Type**: `PROSUMER` (Surplus Energy Seller)
- **Solar Asset**: $6.0\text{ kWp}$ Rooftop Solar PV Array
- **Telemetry State**: Generation $6.40\text{ kW}$, Demand $2.20\text{ kW}$ $\rightarrow$ **$+4.20\text{ kW}$ Net Surplus**
- **Battery Ownership**: $10.0\text{ kWh}$ contributed to Community ESS ($65\%\text{ SOC}$)
- **Market Activity**: Lists $1.5\text{ kWh}$ surplus solar @ $\text{₹}4.50\text{/kWh}$ (saving $26\%$ vs $\text{₹}6.10$ grid price)

---

### 👨‍💻 2. Prince Patel — High-Load Consumer
- **Email**: `prince@gridshare.io`
- **Password**: `admin@123`
- **Household ID**: `house_prince`
- **Node ID**: `node_house_prince`
- **Location**: Plot 102, Green Enclave (Sub-feeder A)
- **Role / Type**: `CONSUMER` (Heavy Deficit Buyer)
- **Solar Asset**: $1.0\text{ kWp}$ Auxiliary Solar Panel
- **Telemetry State**: Generation $0.80\text{ kW}$, Demand $4.80\text{ kW}$ $\rightarrow$ **$-4.00\text{ kW}$ Net Deficit**
- **Battery Ownership**: $5.0\text{ kWh}$ contributed to Community ESS ($35\%\text{ SOC}$)
- **Market Activity**: Open market request for $2.0\text{ kWh}$ @ max $\text{₹}5.00\text{/kWh}$

---

### 👨‍💻 3. Ayush Verma — Balanced Prosumer
- **Email**: `ayush@gridshare.io`
- **Password**: `admin@123`
- **Household ID**: `house_ayush`
- **Node ID**: `node_house_ayush`
- **Location**: Plot 103, Green Enclave (Sub-feeder B)
- **Role / Type**: `PROSUMER` (Balanced / Micro-Storage)
- **Solar Asset**: $4.0\text{ kWp}$ Standard Rooftop Solar PV
- **Telemetry State**: Generation $3.20\text{ kW}$, Demand $3.10\text{ kW}$ $\rightarrow$ **$+0.10\text{ kW}$ Balanced**
- **Battery Ownership**: $8.0\text{ kWh}$ contributed to Community ESS ($50\%\text{ SOC}$)
- **Market Activity**: Lists $0.8\text{ kWh}$ buffer @ $\text{₹}4.80\text{/kWh}$

---

### 🚗 4. Rahul Sharma — EV Load Household
- **Email**: `rahul@gridshare.io`
- **Password**: `admin@123`
- **Household ID**: `house_rahul`
- **Node ID**: `node_house_rahul`
- **Location**: Plot 104, Green Enclave (Sub-feeder B)
- **Role / Type**: `CONSUMER` (EV Fast-Charging Spikes)
- **Solar Asset**: $2.0\text{ kWp}$ Supplemental Solar PV
- **Telemetry State**: Generation $1.80\text{ kW}$, Demand $5.20\text{ kW}$ (Active Level 2 EV charging) $\rightarrow$ **$-3.40\text{ kW}$ Net Deficit**
- **Battery Ownership**: $6.0\text{ kWh}$ contributed to Community ESS ($45\%\text{ SOC}$)
- **Market Activity**: Open market request for $1.5\text{ kWh}$ for EV charging window

---

## 2. Shared Community Assets

- **Central ESS Battery (`community_battery_1`)**:
  - Capacity: $50.0\text{ kWh}$
  - Current SOC: $50.0\%$ ($25.0\text{ kWh}$ Stored)
  - Emergency Reserve Floor: $20.0\%$ ($10.0\text{ kWh}$)
  - Round-Trip Efficiency: $90.0\%$
- **Grid Benchmark**:
  - Utility Grid Import Tariff: $\text{₹}6.10\text{/kWh}$
  - P2P Community Benchmark: $\text{₹}4.50\text{/kWh}$ (Guaranteed $26\%$ savings)

---

## 3. How to Test End-to-End

1. **1-Click Demo Login**: Click the user profile icon on the top right header (`NavUtility.jsx`) or visit the `/login` page to select any of the 4 users with 1 click.
2. **Standard Email/Password Login**: Enter `anjali@gridshare.io` with password `admin@123`.
3. **Inspect Personal Telemetry**: Open `/my-home` to view the authenticated user's generation, consumption, appliance circuits, and connected smart meter.
4. **Marketplace Matching**: Open `/marketplace` to review AI-recommended bilateral trades between Anjali's solar surplus and Prince/Rahul's demand with deterministic safety validation.
