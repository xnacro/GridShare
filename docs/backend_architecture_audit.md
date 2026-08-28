# GridShare — Backend Architecture Audit

## 1. System Overview & Entry Points

GridShare backend is a Python Flask application configured with SQLAlchemy ORM, SQLite/PostgreSQL persistence, and scikit-learn ML inference models.

### Runtime Entry Points:
- **Application Factory**: `server/app/__init__.py:create_app(config_class=Config)`
- **Server Startup Script**: `server/run.py` (Default port: `5000`, binds to `0.0.0.0`)
- **Module Dynamic Resolver**: `server/_bootstrap.py` (Maps `gridshare.backend.app` and `gridshare.ml` dynamically into Python sys.modules)
- **Database Initialization & Seeding**: `server/database/init_db.py`, `server/database/seed_data.py`
- **Simulation Runner**: `server/simulator/run_simulator.py` (Supports `--mode live`, `--mode ppt`, `--mode history`)

---

## 2. Actual Architectural Layers (Source of Truth)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION & CLIENT                           │
│     React 18 + Vite SPA  |  P2P Double Auction  |  Hornet AI Twin      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST (JSON)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          API ROUTE LAYER                               │
│  - health_bp (/api/health)           - market_bp (/api/market/*)       │
│  - user_bp (/api/me, /api/my-*)      - copilot_bp (/api/copilot/*)     │
│  - household_bp (/api/households)    - prediction_bp (/api/predictions)│
│  - energy_bp (/api/energy/*)         - optimization_bp (/api/optimize) │
│  - battery_bp (/api/battery/*)       - device_bp (/api/devices/*)      │
│  - telemetry_bp (/api/telemetry)     - demo_bp (/api/demo/*)           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 AUTHENTICATION & MULTI-TENANT CONTEXT                  │
│  - utils/auth.py: decode_supabase_token()                             │
│  - utils/auth.py: resolve_or_provision_user()                         │
│  - @require_auth decorator injecting (g.user, g.household, g.energy_node)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       SERVICE & DOMAIN LOGIC                           │
│  - CommunityStateService (OBSERVE: Aggregation & Net State)            │
│  - PredictionService (PREDICT: Demand ML feature extraction & runs)     │
│  - CopilotService (6-step decision loop orchestration)                │
│  - RuleBasedOptimizer (OPTIMIZE: Deterministic 4-tier dispatch)        │
│  - StorageOptimizationService (Storage vs Export economic evaluator)   │
│  - BatteryAccountingService (Proportional equity & credit ledger)      │
│  - MarketplaceService (Continuous double auction matching engine)     │
│  - TelemetryService (Smart meter ingestion & validation)               │
└───────────────────────┬───────────────────────────────┬────────────────┘
                        │                               │
                        ▼                               ▼
┌───────────────────────────────┐     ┌──────────────────────────────────┐
│      MACHINE LEARNING (ML)    │     │   PERSISTENCE LAYER (SQLAlchemy) │
│  - demand_v1: RandomForest    │     │  - user_profiles                 │
│    (UCI Power, 32 features)   │     │  - households, energy_nodes      │
│  - solar_v1: RandomForest     │     │  - energy_readings               │
│    (NSRDB Solar, 27 features) │     │  - batteries, battery_ledger     │
│  - Empirical tree spread      │     │  - battery_contributions/withdraw│
│    uncertainty estimation     │     │  - market_offers, market_requests│
│                               │     │  - energy_transactions           │
│                               │     │  - optimization_decisions        │
│                               │     │  - predictions                   │
└───────────────────────────────┘     └──────────────────────────────────┘
```

---

## 3. Configuration & Environment Variables

The backend loads configuration from `.env` through `server/app/config.py`:
- `SECRET_KEY`: Flask session secret key.
- `DATABASE_URL` / `DB_CONNECT`: Database connection string (defaults to `sqlite:///gridshare.db`). Auto-replaces `postgres://` with `postgresql://`.
- `SUPABASE_URL` / `VITE_SUPABASE_URL`: Supabase project URL for JWT token validation.
- `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`: Supabase anon key.
- `SUPABASE_JWT_SECRET` / `JWT_SECRET`: Local secret for offline JWT decoding.
- `MQTT_BROKER_HOST`, `MQTT_BROKER_PORT`, `MQTT_TOPIC_TELEMETRY`, `MQTT_ENABLED`: Optional MQTT telemetry ingestion.
- `SIMULATOR_BASE_GRID_PRICE`: Default benchmark grid tariff (₹6.10/kWh).
- `P2P_DISCOUNT_FACTOR`: Multiplier for P2P clearing (0.75 → ₹4.50/kWh).

---

## 4. Background Workers & Event Processing

- **MQTT Client** (`server/app/utils/mqtt_client.py`): Non-blocking paho-mqtt client running on background thread when `MQTT_ENABLED=true`. Ingests JSON packets directly into `TelemetryService.ingest_reading`.
- **SSE / WebSockets**: Currently not active as server push daemon. Telemetry is polled by clients or pushed via REST POST `/api/telemetry`.
- **Deterministic Simulation Generator** (`server/simulator/`): CLI generator that can push synthetic continuous streams to `/api/telemetry`.

---

## 5. Security & Isolation Summary

1. **Authentication Flow**:
   - Bearer token in `Authorization` header.
   - Evaluated by `utils.auth.decode_supabase_token`.
   - Supports: Supabase `/auth/v1/user` verification, local JWT secret verification, or deterministic demo test tokens (`demo-token-user-a`, `demo-token-user-b`, `demo-token-user-c`).
2. **Multi-Tenant User Isolation**:
   - Every user has an entry in `user_profiles`.
   - User owns a single `Household` and `EnergyNode`.
   - User endpoints (`/api/me`, `/api/my-household`, `/api/my-energy`, `/api/my-energy/source`, `/api/my-transactions`, `/api/my-devices`) strictly scope queries to `g.household_id`.
