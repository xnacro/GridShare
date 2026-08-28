# GridShare AI — Architectural Blueprint & Decision System

## 1. System Vision & Invariants

GridShare AI is not a collection of cosmetic dashboard cards. It is an **authoritative, 10-step closed-loop decision operating system** for community microgrids:

```
[1. OBSERVE] Live Telemetry & Historical Readings (DB / Smart Meters)
     ↓
[2. UNDERSTAND] Data Quality & Anomaly Detection (Statistical Z-Score / Freshness)
     ↓
[3. FORECAST] Dual ML Regressors (solar_v1 GHI + demand_v1 kW over 15m to 24h)
     ↓
[4. UNCERTAINTY] Empirical Ensemble Variance & Prediction Intervals (lower/upper GHI)
     ↓
[5. CONSTRAINTS] Battery Floor (>= 20% SOC), ESS Headroom, Tariff Benchmarks
     ↓
[6. OPTIMIZE] Deterministic Priority Solver (Self-Use -> Local P2P -> ESS -> Grid)
     ↓
[7. RECOMMEND] Authoritative Action + Safe Tradeable Quantity (safe_tradeable_kwh)
     ↓
[8. EXPLAIN] Grounded Deterministic Fact Bullets + Impact Estimates (Rs, kWh, CO2)
     ↓
[9. APPROVE] Human-in-the-Loop Confirmation (No autonomous trade without user consent)
     ↓
[10. EXECUTE & AUDIT] Ledger Transaction Execution & Historical Decision Tracking
```

---

## 2. Core Service Decomposition

1. **`IntelligenceOrchestrator` (`CopilotService`)**:
   - Master coordinator combining predictions, community state, constraints, anomalies, and matching.
2. **`SolarPredictor` (`ml.solar.predict`)**:
   - 150-tree Random Forest GHI model + physical PV conversion layer.
3. **`DemandPredictor` (`ml.predict`)**:
   - 150-tree Random Forest active demand model.
4. **`RuleBasedOptimizer` (`rule_optimizer.py`)**:
   - Deterministic economic dispatch solver prioritizing green local energy over grid imports.
5. **`BatteryAccountingService` (`battery_accounting_service.py`)**:
   - Proportional ownership tracking, $20\%$ reserve floor protection, $90\%$ round-trip efficiency accounting.
6. **`MarketplaceService` (`marketplace_service.py`)**:
   - P2P order matching, price clearing, and ledger settlement.

---

## 3. Mathematical Safety Invariants

1. **Power vs Energy Distinction**:
   - Power ($\text{kW}$) is rate of flow.
   - Energy ($\text{kWh}$) is cumulative work: $\text{Energy (kWh)} = \text{Power (kW)} \times \Delta t_{\text{hours}}$.
   - For a 15-minute dispatch interval ($\Delta t = 0.25\text{ h}$):
     $$\text{Safe Tradeable Energy (kWh)} = \max\left(0, \text{Conservative Surplus (kW)}\right) \times 0.25\text{ h}$$
2. **Battery Safety Reserve Floor**:
   $$\text{Usable Storage (kWh)} = \max\left(0, \left(\text{SOC} - \text{MinReserve}_{20\%}\right) \times \frac{\text{Capacity}}{100}\right)$$
3. **Simulation Isolation**:
   - Weather shock and custom scenario simulations execute against virtual in-memory copies and NEVER mutate production tables (`energy_readings`, `batteries`, `market_offers`, `energy_transactions`).
