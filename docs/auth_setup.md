# GridShare Authentication & Supabase Setup Guide

This guide details the configuration required to run GridShare multi-tenant authentication both locally and in production deployments.

---

## 1. Environment Variables Specification

### 1.1 Backend Environment Variables (`server/.env` or root `.env`)

```ini
# Flask Server Secret
SECRET_KEY=your-flask-secret-key

# Database Connection (PostgreSQL or SQLite in testing)
DATABASE_URL=postgresql://postgres.yourproject:yourpassword@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres

# Supabase Auth Verification
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-public-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret # (Optional for local offline JWT verification)
```

### 1.2 Frontend Environment Variables (`client/.env`)

```ini
# Backend API Base URL
VITE_API_URL=http://127.0.0.1:5000/api

# Supabase Public Client Credentials (Safe to expose in frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-public-anon-key
```

---

## 2. Supabase Dashboard Configuration

### 2.1 Enable Email + Password Authentication
1. Go to your **Supabase Dashboard** $\rightarrow$ **Authentication** $\rightarrow$ **Providers**.
2. Enable **Email**.
3. (Optional) Disable "Confirm email" for immediate login during development and demo presentations.

### 2.2 Configure Google OAuth (Optional / Production)
1. In **Authentication** $\rightarrow$ **Providers**, select **Google**.
2. Enter your Google Cloud OAuth **Client ID** and **Client Secret**.
3. Copy the Supabase Callback URL into your Google Cloud Console Authorized redirect URIs:
   `https://<your-project-id>.supabase.co/auth/v1/callback`

### 2.3 Redirect URLs Configuration
In **Authentication** $\rightarrow$ **URL Configuration**:
* **Site URL**: `http://localhost:5173` (or your production deployment domain).
* **Redirect URLs**:
  - `http://localhost:5173/*`
  - `https://your-domain.com/*`

---

## 3. Local Development & Instant Test Mode

GridShare includes a built-in deterministic demo authentication provider for instant offline testing and hackathon judging without needing live Supabase network connectivity:

1. Click **"House A (Prosumer)"** on the login card to immediately authenticate as **House A** (+4.7 kW Surplus).
2. Click **"House B (Consumer)"** on the login card to immediately authenticate as **House B** (-2.8 kW Deficit).
3. Sign in with any custom email/password $\rightarrow$ automatically provisions a fresh household and energy node.

---

## 4. Running Automated Auth Tests

```bash
# Run multi-tenant backend test suite
python -m unittest server/tests/test_auth_multitenant.py -v
```
