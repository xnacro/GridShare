# GridShare — Real Capabilities for Hackathon Judges & Evaluators

This document details GridShare's capabilities with absolute transparency, distinguishing between **Real (Trained/Calculated)**, **Simulated**, and **Estimated** components.

---

## 1. Executive Summary for Judges

```
┌────────────────────────────────────────────────────────────────────────┐
│                        WHAT IS 100% REAL & VERIFIABLE                  │
│  - Real trained ML models (Random Forest on 95k+ real UCI & NSRDB rows)│
│  - Real mathematical 6-step AI decision loop                           │
│  - Real continuous double-auction order matching engine                │
│  - Real proportional equity accounting for shared storage              │
│  - Real multi-tenant authentication & data isolation (62 tests passing)│
│  - Real 3D interactive spatial digital twins in Three.js               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technical Capability Audit by Subsystem

### 1. Machine Learning & Forecasting
- **Status**: `REAL (TRAINED ARTIFACTS)`
- **Demand Model (`demand_v1.joblib`)**:
  - Trained on 95,160 real 15-minute intervals from the UCI Individual Household Electric Power Consumption dataset.
  - Test Set MAE: **0.235 kW**, RMSE: **0.393 kW**, R²: **0.758**.
  - 32 Engineered Features: Cyclic sin/cos hour, day-of-week, month, lags (15m to 24h), rolling 1h/3h/6h/24h statistics, reactive power, voltage, and sub-metering channels.
- **Solar Model (`solar_v1.joblib`)**:
  - Trained on NSRDB Satellite Irradiance dataset for Guwahati microgrid coordinates.
  - Test Set MAE: **38.6 W/m²**, RMSE: **68.2 W/m²**, R²: **0.942**.
  - 27 Engineered Features: Cyclic day-of-year, hour, minute, solar elevation proxy, atmospheric conditions, and lag irradiance.
- **Forecast Uncertainty Corridor**:
  - `REAL`: Computed via the empirical variance/standard deviation across 150 individual decision tree estimators in the Random Forest ensemble.

### 2. Hornet AI Dispatch Optimization
- **Status**: `REAL (MATHEMATICAL RULE ENGINE)`
- **How it works**:
  - Executes a deterministic priority hierarchy:
    1. Local Community Deficit Service (P2P Trade @ ₹4.50/kWh)
    2. Shared ESS Battery Reserve Buffering
    3. Utility Grid Feed-in Export
    4. Emergency ESS Discharge & Grid Import
- **Explainability**: Every recommendation outputs structured text bullets with exact numbers (surplus kW, battery SOC %, tariff differential, CO2 reduction).

### 3. P2P Double-Auction Marketplace
- **Status**: `REAL (DATABASE & MATCHING ALGORITHM) / SIMULATED SETTLEMENT`
- **How it works**:
  - Prosumers place sell orders; consumers place buy requests.
  - Double auction engine sorts asks ASC and bids DESC, clearing matches at the uniform midpoint price.
  - Creates immutable records in `energy_transactions` table.
  - *Note for Judges*: Monetary amounts represent simulated local economic valuation (₹4.50 P2P vs ₹6.10 grid retail). No fiat banking or crypto wallets are integrated.

### 4. Community Battery Ownership & Fair Accounting
- **Status**: `REAL (MATHEMATICAL EQUITY ENGINE)`
- **How it works**:
  - Manages central 50 kWh ESS with 90% round-trip efficiency.
  - Tracks individual household contribution credits.
  - Calculates proportional allocations for evening withdrawals:
    $$\text{Allocation}_i = \text{Requested} \times \frac{\text{Credit}_i}{\sum \text{Credits}}$$
  - Prevents tragedy-of-the-commons and unfair pool depletion.

### 5. Multi-User Authentication & Isolation
- **Status**: `REAL (SUPABASE AUTH + FLASK MIDDLEWARE)`
- **How it works**:
  - Supports Supabase JWTs, Google OAuth, and instant demo switcher (House A, B, C).
  - Enforces strict tenant isolation: user endpoints (`/api/my-*`) only return data for the user's owned household.
  - Supported by 62 passing automated backend tests.

### 6. Physical Smart Meter Hardware
- **Status**: `SIMULATED / HARDWARE-READY PROTOCOL LAYER`
- **How it works**:
  - Backend exposes REST `POST /api/telemetry` and optional MQTT broker subscriber.
  - Default execution runs synthetic smart-meter telemetry. Ingestion accepts real ESP32 / INA219 sensor payloads seamlessly.
