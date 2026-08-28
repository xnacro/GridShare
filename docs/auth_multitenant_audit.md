# GridShare Multi-Tenant Authentication & Energy Node Audit

**Audit Date**: August 2026  
**Auditor**: Senior Full-Stack & Security Architect (Antigravity AI)  
**Target Provider**: Supabase Auth (Email + Password, Google OAuth)  
**Backend Framework**: Flask REST API (Python 3.12, SQLAlchemy, PyJWT)  
**Frontend Framework**: React 18.3 (Vite, React Router v6, Tailwind CSS V2 tokens)  

---

## 1. Executive Summary

GridShare is evolving from a single-community shared simulation interface to a **multi-user, tenant-isolated sustainable energy platform**. 

Every authenticated user maps to a distinct prosumer/consumer **Household** which owns one or more physical/virtual **Energy Nodes**. Each user's local energy yield, demand, battery allocation, and P2P trading actions are private and securely isolated, while community-level metrics (grid balance, aggregated solar yield, centralized 50 kWh ESS, and double-auction clearing) aggregate across authorized households without leaking private user telemetry.

---

## 2. Current Codebase Audit

### 2.1 Backend Models & Schema (`server/app/models/`)
| Model | Table Name | Current Primary Key / Foreign Keys | Identity / Ownership Status |
|---|---|---|---|
| `Household` | `households` | `id: VARCHAR(50)` (e.g. `'house_a'`) | **No user ownership column yet**. Needs `owner_user_id: VARCHAR(100)` referencing Supabase Auth `auth.users.id`. |
| `EnergyReading` | `energy_readings` | `id: INT`, `household_id: FK(households.id)` | Scoped by `household_id`. Has `source` column (`"SIMULATED"`, `"HARDWARE_ESP32"`, `"MANUAL"`). |
| `MarketOffer` | `market_offers` | `id: INT`, `household_id: FK(households.id)` | Scoped by prosumer `household_id`. |
| `MarketRequest` | `market_requests` | `id: INT`, `household_id: FK(households.id)` | Scoped by consumer `household_id`. |
| `EnergyTransaction` | `energy_transactions` | `id: INT`, `seller_household_id: FK`, `buyer_household_id: FK` | Bilateral trade execution. Needs server-side ownership authorization. |
| `Battery` & `BatteryContribution` | `battery`, `battery_contributions` | `household_id: FK` | Centralized 50 kWh ESS with prosumer equity shares. |
| `UserProfile` (NEW) | `user_profiles` | `user_id: VARCHAR(100)` PK | Stores `display_name`, `email`, `default_household_id`, `created_at`. |
| `EnergyNode` (NEW) | `energy_nodes` | `id: VARCHAR(50)` PK, `household_id: FK` | Stores `node_type`, `source_type` (`SIMULATION`, `MANUAL`, `HARDWARE`), and active telemetry state. |

---

### 2.2 Backend Authentication & Middleware (`server/app/utils/auth.py`)
* **Current State**: Routes are unauthenticated and accept client-supplied `household_id` parameters.
* **Target State**: Reusable `@require_auth` decorator extracting the Bearer token from the `Authorization` header, verifying the Supabase JWT (via Supabase Auth API or local `PyJWT` with `SUPABASE_JWT_SECRET` / JWKS), attaching `g.user` (with `user_id`, `email`, `display_name`, and resolved `household_id`) to the Flask request context.

---

### 2.3 Frontend State & Routing (`client/src/`)
* **Current State**: Routes in `App.jsx` (`/`, `/network`, `/ai`, `/marketplace`, `/battery`, `/my-home`, etc.) render directly without an auth gate. `NavUtility.jsx` contains a cosmetic dropdown switcher.
* **Target State**:
  - `src/context/AuthContext.jsx`: Provides `user`, `session`, `loading`, `signIn(email, password)`, `signUp(name, email, password)`, `signInWithGoogle()`, and `signOut()`.
  - `src/pages/LoginView.jsx`: Clean GridShare V2 login/signup card with Email/Password and Google OAuth.
  - `src/components/auth/ProtectedRoute.jsx`: Redirects unauthenticated users to `/login` with return URL preservation.
  - `src/services/api.js`: Axios request interceptor dynamically injecting `Authorization: Bearer <session.access_token>`.

---

## 3. The 4-Tier Identity & Multi-Tenant Model

```text
               ┌───────────────────────────┐
               │    Supabase Auth User     │  (auth.users: id, email, app_metadata)
               └─────────────┬─────────────┘
                             │ 1 : 1
                             ▼
               ┌───────────────────────────┐
               │     User Profile          │  (user_profiles: user_id, display_name, role)
               └─────────────┬─────────────┘
                             │ 1 : 1 (or 1 : N)
                             ▼
               ┌───────────────────────────┐
               │       Household           │  (households: id, owner_user_id, name, type)
               └─────────────┬─────────────┘
                             │ 1 : N
                             ▼
               ┌───────────────────────────┐
               │      Energy Node          │  (energy_nodes: id, household_id, source_type)
               └─────────────┬─────────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │ SIMULATION  │  │   MANUAL    │  │  HARDWARE   │
     │  (Diurnal)  │  │  (User kW)  │  │  (Future)   │
     └─────────────┘  └─────────────┘  └─────────────┘
```

---

## 4. API Endpoints Categorization

### 4.1 Public Endpoints
* `GET /api/health`: System health and component status.

### 4.2 User-Scoped Protected Endpoints (Require Supabase JWT)
* `GET /api/me`: Returns `{ user, profile, household, energy_node }`.
* `GET /api/my-household`: Returns the authenticated user's household details and metadata.
* `GET /api/my-energy`: Returns the authenticated user's current generation, consumption, net balance, and telemetry history.
* `POST /api/my-energy/source`: Configures data source (`SIMULATION` vs `MANUAL`) and manual kW values.
* `GET /api/my-transactions`: Returns billing records and bilateral trades where the user is either seller or buyer.
* `POST /api/my-marketplace/offer`: Lists prosumer surplus for sale (strictly validated against user's owned household).
* `POST /api/my-marketplace/request`: Submits energy purchase request for user's owned household.

### 4.3 Community Aggregate Endpoints
* `GET /api/community/state`: Aggregated community generation, demand, battery SOC, and active trades.
* `GET /api/market/offers`: Public anonymized order book of available peer energy.
* `GET /api/copilot/insights`: Hornet AI operating recommendation (scoped by personal household or community).

---

## 5. Security & Isolation Matrix

| Threat Vector | Mitigation |
|---|---|
| **Client ID Spoofing** (`household_id="house_b"` passed by User A) | Backend ignores client-provided owner IDs and resolves ownership strictly from verified JWT claims. |
| **Data Leakage in My Home** | `/api/my-energy` queries database filtering strictly by `owner_user_id == current_user.id`. |
| **Marketplace Impersonation** | Seller/Buyer ID is set by backend from `g.user.household_id`. |
| **Token Stolen / Expired** | Short-lived Supabase JWTs with automatic token refresh in frontend `AuthContext`. |
| **Secret Leakage** | Zero service-role keys in React client. Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in frontend build. |

---

## 6. Migration Safety Plan

1. Add `owner_user_id` column to `households` table as a nullable foreign key with fallback to deterministic demo users (`demo_user_a` $\rightarrow$ `house_a`, `demo_user_b` $\rightarrow$ `house_b`, `demo_user_c` $\rightarrow$ `house_c`).
2. If `user_profiles` table does not exist, auto-create it during database initialization.
3. Automatically create a default household for any new authenticated user on first login.
4. Keep all existing seeded transactions, battery contributions, and historical readings intact.
