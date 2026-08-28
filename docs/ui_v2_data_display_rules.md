# GridShare V2 — Data Display, Units & Trust Governance Rules

**Purpose**: Enforce absolute data honesty, unambiguous engineering units, and clear provenance distinctions across the entire frontend.

---

## 1. Standardized Units Matrix

| Physical Dimension | Standard Unit | UI Symbol | Example Value | Strict Rule |
| :--- | :--- | :--- | :--- | :--- |
| **Instantaneous Power** | Kilowatt | **`kW`** | `6.8 kW`, `+4.7 kW` | Used ONLY for instantaneous rates of generation, demand, and net flow. |
| **Cumulative Energy** | Kilowatt-hour | **`kWh`** | `1.0 kWh`, `50.0 kWh` | Used ONLY for energy traded, battery capacity, and cumulative volume. |
| **Solar Irradiance** | Watts per sq meter | **`W/m²`** | `932 W/m²`, `848 W/m²` | Used ONLY for atmospheric solar resource ($GHI, DNI, DHI$). |
| **Battery Storage State**| Percentage | **`%`** | `40% SOC`, `20% Reserve` | State of charge relative to nominal 50 kWh capacity. |
| **Energy Tariff / Price** | Rupees per kWh | **`₹/kWh`** | `₹4.50/kWh`, `₹6.10/kWh`| Energy clearing rates and utility tariffs. |
| **Total Economic Value** | Indian Rupee | **`₹`** | `₹12.60`, `₹1.60` | Total monetary savings or trade transaction settlement. |
| **Carbon Avoidance** | Kilograms of CO₂ | **`kg`** | `0.82 kg`, `3.14 kg` | Calculated via standard India grid carbon factor ($0.82\text{ kg CO}_2\text{/kWh}$). |

> **Critical Unit Anti-Pattern**: NEVER say *"Generated 6.8 kWh right now"*. It is **$6.8\text{ kW}$ generation** that produces **$1.7\text{ kWh}$ of energy** over a 15-minute interval.

---

## 2. Mandatory Data Trust Badges & Semantic Provenance

Every data point shown to a user or judge must carry its explicit classification badge:

```
┌──────────────┬────────────────────────────────────────────────────────────────────────┐
│ Badge        │ Provenance Meaning                                                     │
├──────────────┼────────────────────────────────────────────────────────────────────────┤
│ LIVE         │ Real-time telemetry stream from connected household nodes.             │
│ SIMULATED    │ Deterministically generated seed telemetry or scenario sandbox data.   │
│ ESTIMATED    │ Physical mathematical proxy (e.g. PV conversion from GHI irradiance).  │
│ FORECAST     │ Machine learning predictive output (demand_v1 or solar_v1).            │
│ RULE-BASED   │ Deterministic algorithmic dispatch priority (RuleBasedOptimizer).      │
│ VERIFIED     │ Immutable database ledger record stored in SQLAlchemy / Supabase.      │
└──────────────┴────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Number Formatting & Rounding Specifications

1. **Power & Energy**:
   - Point forecasts and net balances: **2 decimal places** (`+1.63 kW`, `0.58 kW`).
   - Summary and capacity totals: **1 decimal place** (`6.8 kW`, `50.0 kWh`).
2. **Solar Irradiance**:
   - $GHI$ bounds and point forecasts: **Nearest whole integer** (`933 W/m²`, `848–1003 W/m²`).
3. **Currency & Financials**:
   - Rates and savings: **Always 2 decimal places** (`₹4.50/kWh`, `₹1.60 savings`).
4. **Forbidden Float Representation**:
   - Never render unformatted floating-point errors (e.g. `1.6300000000000001 kW`). Always format via `.toFixed(1)` or `.toFixed(2)`.

---

## 4. Loading, Empty & Error State Guidelines

### A. Loading States
- Never show blank white rectangles or full-screen freezing spinners.
- Use animated shimmer skeletons (`animate-pulse`) matching the exact layout of the target component.
- Display contextual loading text: *"Synthesizing Hornet AI Pipeline..."* or *"Polling microgrid circuits..."*.

### B. Error States
- Never expose raw stack traces, database credentials, or generic `"500 Internal Server Error"`.
- Use compassionate, actionable language:
  - *Good*: *"GridShare couldn't refresh the community forecast. Backend is currently offline."*
  - Action button: `[ Retry Connection ]` or `[ View System Health ]`.

### C. Empty States
- Provide helpful guidance rather than a blank table:
  - *Good*: *"No transactions yet. Once Hornet AI matches a local trade, your settlement bill will appear here."*
