# GridShare — Database & Schema Capability Audit

This document audits the complete PostgreSQL / SQLite schema, relational model, constraints, indexes, and persistence layers.

---

## 1. Complete Entity-Relationship Overview

```
[UserProfile] 1 ──── N [Household] 1 ──── N [EnergyNode]
   (owner)                   │
                             ├──── N [EnergyReading]
                             ├──── N [Prediction]
                             ├──── N [MarketOffer]
                             ├──── N [MarketRequest]
                             ├──── N [BatteryContribution]
                             ├──── N [BatteryWithdrawal]
                             ├──── N [EnergyTransaction (as Seller)]
                             └──── N [EnergyTransaction (as Buyer)]

[Battery] 1 ──── N [BatteryContribution]
          ├──── N [BatteryWithdrawal]
          └──── N [BatteryLedger]

[OptimizationDecision] (Global Explainable Audit Log)
```

---

## 2. Table-by-Table Inventory

### 1. `user_profiles`
- **Purpose**: Authenticated user identity linked with Supabase Auth.
- **Primary Key**: `user_id` (VARCHAR 100) — Matches Supabase `auth.users.id` or demo IDs.
- **Columns**: `email` (VARCHAR 150, UNIQUE, INDEX), `display_name` (VARCHAR 100), `role` (VARCHAR 50, default 'USER'), `default_household_id` (VARCHAR 50), `created_at` (DATETIME).
- **Relationships**: `households` (1-to-many relationship).

### 2. `households`
- **Purpose**: Microgrid household entity (prosumer, consumer, solar villa).
- **Primary Key**: `id` (VARCHAR 50) — e.g. `'house_a'`, `'house_b'`.
- **Columns**: `name` (VARCHAR 100), `location` (VARCHAR 150), `household_type` (VARCHAR 50: `PROSUMER`, `CONSUMER`, `SOLAR_ONLY`), `owner_user_id` (VARCHAR 100, FK `user_profiles.user_id`, INDEX), `created_at` (DATETIME).

### 3. `energy_nodes`
- **Purpose**: Telemetry endpoint and physical/simulated device mapping per household.
- **Primary Key**: `id` (VARCHAR 50) — e.g. `'node_house_a'`.
- **Columns**: `household_id` (VARCHAR 50, FK `households.id`, INDEX), `node_type` (VARCHAR 50: `RESIDENTIAL_SOLAR`, `RESIDENTIAL_LOAD`, `BATTERY`, `GRID`), `source_type` (VARCHAR 50: `SIMULATION`, `MANUAL`, `HARDWARE`), `manual_generation_kw` (FLOAT), `manual_consumption_kw` (FLOAT), `status` (VARCHAR 50), `updated_at` (DATETIME).

### 4. `energy_readings`
- **Purpose**: Time-series smart meter telemetry log.
- **Primary Key**: `id` (INTEGER, AUTOINCREMENT).
- **Columns**: `household_id` (VARCHAR 50, FK `households.id`, INDEX), `timestamp` (DATETIME, INDEX), `generation_kw` (FLOAT), `consumption_kw` (FLOAT), `battery_soc` (FLOAT, nullable), `grid_price` (FLOAT), `source` (VARCHAR 50: `SIMULATED`, `HARDWARE`), `created_at` (DATETIME).
- **Properties**: `net_balance_kw` = `generation_kw - consumption_kw`.

### 5. `batteries`
- **Purpose**: Central Energy Storage System (ESS) technical state.
- **Primary Key**: `id` (VARCHAR 50) — default `'community_battery_1'`.
- **Columns**: `community_id` (VARCHAR 50), `capacity_kwh` (FLOAT, default 50.0), `current_energy_kwh` (FLOAT, default 20.0), `current_soc` (FLOAT, default 40.0), `round_trip_efficiency` (FLOAT, default 0.90), `min_reserve` (FLOAT, default 20.0), `minimum_reserve_kwh` (FLOAT, default 10.0), `updated_at` (DATETIME).

### 6. `battery_contributions`
- **Purpose**: Track energy injected into battery by prosumers with efficiency-adjusted credits.
- **Primary Key**: `id` (INTEGER, AUTOINCREMENT).
- **Columns**: `battery_id` (VARCHAR 50, FK, INDEX), `household_id` (VARCHAR 50, FK, INDEX), `contributed_energy_kwh` (FLOAT), `usable_energy_kwh` (FLOAT, after 90% efficiency), `remaining_credit_kwh` (FLOAT), `contribution_timestamp` (DATETIME), `status` (VARCHAR 20: `ACTIVE`, `PARTIALLY_WITHDRAWN`, `DEPLETED`).

### 7. `battery_withdrawals`
- **Purpose**: Historical battery discharge allocations by household under fairness policy.
- **Primary Key**: `id` (INTEGER, AUTOINCREMENT).
- **Columns**: `battery_id` (VARCHAR 50, FK, INDEX), `household_id` (VARCHAR 50, FK, INDEX), `requested_energy_kwh` (FLOAT), `allocated_energy_kwh` (FLOAT), `contribution_source` (VARCHAR 50: `PROPORTIONAL_OWNERSHIP`), `timestamp` (DATETIME).

### 8. `battery_ledger`
- **Purpose**: Immutable audit log for all battery actions.
- **Primary Key**: `id` (INTEGER, AUTOINCREMENT).
- **Columns**: `battery_id` (VARCHAR 50, FK, INDEX), `household_id` (VARCHAR 50, FK, INDEX), `action_type` (VARCHAR 30: `CONTRIBUTION`, `WITHDRAWAL`, `EFFICIENCY_LOSS`, `RESERVE_HOLD`, `OPTIMIZER_DISPATCH`), `energy_kwh` (FLOAT), `usable_kwh` (FLOAT), `balance_after_kwh` (FLOAT), `soc_after_percent` (FLOAT), `economic_value_inr` (FLOAT), `policy_applied` (VARCHAR 50), `reason` (TEXT), `timestamp` (DATETIME, INDEX).

### 9. `market_offers` & `market_requests`
- **Purpose**: P2P double-auction order book.
- **Primary Key**: `id` (INTEGER, AUTOINCREMENT).
- **Columns**: `household_id` (VARCHAR 50, FK, INDEX), `energy_kwh` (FLOAT), `min_price_per_kwh` / `max_price_per_kwh` (FLOAT), `remaining_kwh` (FLOAT), `status` (VARCHAR 50: `OPEN`, `FILLED`, `PARTIALLY_FILLED`, `CANCELLED`), `source` (VARCHAR 50), `created_at` (DATETIME).

### 10. `energy_transactions`
- **Purpose**: Bilateral P2P executed trades.
- **Primary Key**: `id` (INTEGER, AUTOINCREMENT).
- **Columns**: `seller_household_id` (VARCHAR 50, FK, INDEX), `buyer_household_id` (VARCHAR 50, FK, INDEX), `energy_kwh` (FLOAT), `price_per_kwh` (FLOAT), `total_value` (FLOAT), `status` (VARCHAR 50: `COMPLETED`), `timestamp` (DATETIME, INDEX).

### 11. `optimization_decisions`
- **Purpose**: Explainable decision audit trail generated by RuleBasedOptimizer and Copilot.
- **Primary Key**: `id` (INTEGER, AUTOINCREMENT).
- **Columns**: `timestamp` (DATETIME, INDEX), `source_household` (VARCHAR 50), `target` (VARCHAR 50), `energy_kwh` (FLOAT), `action` (VARCHAR 50: `LOCAL_TRADE`, `STORE`, `GRID_EXPORT`, `DISCHARGE`, `GRID_IMPORT`), `reason` (TEXT).

### 12. `predictions`
- **Purpose**: Persisted machine learning demand and solar forecasts.
- **Primary Key**: `id` (INTEGER, AUTOINCREMENT).
- **Columns**: `household_id` (VARCHAR 50, FK, INDEX), `prediction_time` (DATETIME, INDEX), `predicted_demand_kw` (FLOAT), `predicted_generation_kw` (FLOAT), `confidence` (FLOAT, nullable), `uncertainty_value` (FLOAT, ensemble tree spread), `model_version` (VARCHAR 50).
