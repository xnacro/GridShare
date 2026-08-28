# GridShare Multi-Tenant Identity & Energy Node Architecture

## 1. Conceptual Architecture

GridShare multi-tenant architecture implements a strictly isolated **4-tier identity and telemetry model**:

```text
              ┌─────────────────────────────────┐
              │    Supabase Auth User (JWT)     │  (auth.users: id, email, metadata)
              └────────────────┬────────────────┘
                               │ 1 : 1
                               ▼
              ┌─────────────────────────────────┐
              │       GridShare Profile         │  (user_profiles: user_id, display_name)
              └────────────────┬────────────────┘
                               │ 1 : 1 (or 1 : N)
                               ▼
              ┌─────────────────────────────────┐
              │           Household             │  (households: id, owner_user_id, name)
              └────────────────┬────────────────┘
                               │ 1 : N
                               ▼
              ┌─────────────────────────────────┐
              │          Energy Node            │  (energy_nodes: id, household_id)
              └────────────────┬────────────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
       ┌──────────────┐                  ┌──────────────┐
       │  SIMULATION  │                  │    MANUAL    │
       │ (Diurnal kW) │                  │  (User-Set)  │
       └──────┬───────┘                  └──────┬───────┘
              │                                 │
              └────────────────┬────────────────┘
                               ▼
                   ┌─────────────────────────┐
                   │      ENERGY STATE       │
                   └───────────┬─────────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
        PERSONAL SCOPE                   COMMUNITY SCOPE
       (My Home, Wallet,                (Microgrid Net, ESS,
        Bilateral P2P)                   Anonymized Market)
```

---

## 2. Multi-Tenant Data Flow

```text
React Client
    │
    ▼ (1. Authenticate with Supabase)
Supabase Auth Service
    │
    ▼ (2. Return Session JWT)
React Client
    │
    ▼ (3. Request with Authorization: Bearer <JWT>)
Flask REST API (@require_auth)
    │
    ▼ (4. Verify JWT Claims & Resolve Identity)
g.user (UserProfile), g.household (Household), g.energy_node (EnergyNode)
    │
    ▼ (5. Query database filtering strictly by g.household.id)
PostgreSQL Database (SQLAlchemy)
    │
    ▼ (6. Return Isolated Private Telemetry / Aggregate Community State)
React Viewport
```

---

## 3. Core Entities & Schema

### 3.1 `user_profiles`
* `user_id` (VARCHAR 100, Primary Key): Foreign key mapping to Supabase `auth.users.id`.
* `email` (VARCHAR 150, Unique, Index): Primary user login email.
* `display_name` (VARCHAR 100): User-facing full name or prosumer title.
* `role` (VARCHAR 50): `"USER"` or `"ADMIN"`.
* `default_household_id` (VARCHAR 50): Default active prosumer/consumer household ID.
* `created_at` (TIMESTAMP UTC).

### 3.2 `households`
* `id` (VARCHAR 50, Primary Key): e.g. `'house_a'`, `'house_b'`.
* `name` (VARCHAR 100): e.g. `"House A (Solar Champion - 8kW)"`.
* `location` (VARCHAR 150): e.g. `"Plot 101, Green Enclave"`.
* `household_type` (VARCHAR 50): `"PROSUMER"`, `"CONSUMER"`, `"SOLAR_ONLY"`.
* `owner_user_id` (VARCHAR 100, Foreign Key): Binds ownership strictly to a `user_profiles.user_id`.

### 3.3 `energy_nodes`
* `id` (VARCHAR 50, Primary Key): e.g. `'node_house_a'`.
* `household_id` (VARCHAR 50, Foreign Key): Maps to parent household.
* `node_type` (VARCHAR 50): `"RESIDENTIAL_SOLAR"`, `"RESIDENTIAL_LOAD"`, `"BATTERY"`, `"GRID"`.
* `source_type` (VARCHAR 50): `"SIMULATION"`, `"MANUAL"`, `"HARDWARE"`.
* `manual_generation_kw` (FLOAT): User-configured solar generation override.
* `manual_consumption_kw` (FLOAT): User-configured appliance demand override.
* `status` (VARCHAR 50): `"ONLINE"`, `"OFFLINE"`.
* `updated_at` (TIMESTAMP UTC).

---

## 4. Security Guarantees & Non-Spoofable Ownership

1. **Zero Client Trust on Household Identifiers**:
   - The Flask backend `@require_auth` decorator resolves `g.household_id` strictly from the verified JWT claims.
   - Any client attempting to query or execute actions with a forged `household_id` is prevented from modifying or inspecting other users' private readings.
2. **Server-Side Authoritative Balance**:
   - Net balances (`generation - consumption`) are computed and stored server-side.
3. **No Secret Key Leakage**:
   - The React frontend bundle contains only public configuration (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
   - Service-role tokens, JWT secrets, and database connection strings remain in server-side environment variables.

---

## 5. Personal Scope vs. Community Scope

| Feature Area | Personal Scope (Authenticated User) | Community Scope (Public / Aggregate) |
|---|---|---|
| **Overview Hero** | Personal status & prosumer yield | Total community clean surplus (+2.9 kW) |
| **My Home** | User's owned generation, circuits, and energy source | N/A |
| **P2P Marketplace** | User's bilateral trades & wallet balance | Anonymized order book of available peer energy |
| **Hornet AI** | Personal 15-minute rooftop generation & demand forecast | Microgrid feeder-level load balancing |
| **Battery ESS** | User's individual equity share (e.g. House A 10 kWh) | Centralized 50 kWh ESS state of charge & 20% reserve floor |
