# GridShare Microgrid — End-to-End System Test Report

**Execution Date**: August 28, 2026  
**Database**: Remote Supabase AWS PostgreSQL (`aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`)  
**Status**: `PASSED` (100% Deterministic & Database-Backed)

---

## 1. Database Schema Migration & Seeding Verification

- **Schema Check**:
  - `households.owner_user_id`: `VARCHAR(100)` verified and created.
  - `user_profiles.default_household_id`: `VARCHAR(50)` verified and created.
  - `energy_transactions.total_value`: Verified against PostgreSQL relational model.
- **Seeded Records**:
  - `4 UserProfile` records: `user_anjali_id`, `user_prince_id`, `user_ayush_id`, `user_rahul_id`.
  - `4 Household` records: `house_anjali`, `house_prince`, `house_ayush`, `house_rahul`.
  - `4 EnergyNode` records: `node_house_anjali`, `node_house_prince`, `node_house_ayush`, `node_house_rahul`.
  - `1 Battery` (`community_battery_1`, $50\text{ kWh}$) + `4 BatteryContribution` ownership allocations.
  - `100 EnergyReading` historical telemetry entries across 24 intervals.
  - `2 MarketOffer` + `2 MarketRequest` active database order listings.
  - `2 EnergyTransaction` settled bilateral receipts.

---

## 2. Authentication & Multi-Tenancy Tests

| Test Case | Method | Parameters | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Password Login (Anjali)** | `POST /api/auth/login` | `{"email": "anjali@gridshare.io", "password": "admin@123"}` | `200 OK`, JWT returned with `house_anjali` | `PASS` |
| **Password Login (Prince)** | `POST /api/auth/login` | `{"email": "prince@gridshare.io", "password": "admin@123"}` | `200 OK`, JWT returned with `house_prince` | `PASS` |
| **Password Login (Ayush)** | `POST /api/auth/login` | `{"email": "ayush@gridshare.io", "password": "admin@123"}` | `200 OK`, JWT returned with `house_ayush` | `PASS` |
| **Password Login (Rahul)** | `POST /api/auth/login` | `{"email": "rahul@gridshare.io", "password": "admin@123"}` | `200 OK`, JWT returned with `house_rahul` | `PASS` |
| **Invalid Password Rejection** | `POST /api/auth/login` | `{"email": "anjali@gridshare.io", "password": "wrong"}` | `401 Unauthorized` | `PASS` |
| **User Identity Context** | `GET /api/me` | `Authorization: Bearer <token>` | `200 OK`, returns user profile, household & node | `PASS` |
| **Isolated User Telemetry** | `GET /api/my-energy` | `Authorization: Bearer <token>` | `200 OK`, returns user's isolated generation & demand | `PASS` |

---

## 3. Machine Learning AI Copilot Integration Tests

- **Solar Inference (`solar_v1.joblib`)**: Tested with dynamic PV scale for $6.0\text{ kWp}$ (Anjali), $4.0\text{ kWp}$ (Ayush), $1.0\text{ kWp}$ (Prince), $2.0\text{ kWp}$ (Rahul).
- **Demand Forecasting (`demand_v1.joblib`)**: Successfully calculates rolling 15-minute load predictions per household history.
- **Conservative Surplus & Battery Safety**: Enforces formula $\text{Safe Surplus (kWh)} = \text{Conservative Surplus (kW)} \times 0.25\text{ h}$ with $20\%$ battery reserve floor protection.

---

## 4. Frontend Build & Asset Verification

- **Vite Production Build**: `npm run build` executed with `0 errors` and clean chunk tree.
- **UI Components**:
  - `NavUtility.jsx`: Multi-tenant switcher seamlessly switches tokens and triggers instantaneous cockpit updates.
  - `LoginView.jsx`: 1-Click quick buttons & standard password inputs configured with `admin@123`.
  - `MarketplaceView.jsx`: Matches & orders bound to authentic households.
  - `MyHomeView.jsx`: Reflects authenticated user telemetry.
