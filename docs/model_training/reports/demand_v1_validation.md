# GridShare ML Demand Model (demand_v1) Validation Report
**Model Artifact**: `ml/models/demand_v1.joblib`  
**Metadata Artifact**: `ml/models/metadata.json`  
**Audited At**: 2026-08-28T11:31:16.529561+00:00  
**Audit Verdict**: ✅ **PASSED — MODEL & INFERENCE PIPELINE FULLY VALIDATED**  

---

## 1. Artifact Integrity & Architecture

| Property | Value / Status | Verification Notes |
| :--- | :--- | :--- |
| **Model Version** | `demand_v1` | Explicitly versioned |
| **Model Architecture** | `Random Forest Regressor` | 150 Estimators, max_depth=18 |
| **Artifact Size** | `124.61 MB` (130,658,817 bytes) | Serialized with joblib |
| **Training Timestamp** | `2026-08-28T11:18:09.389033+00:00` | Full metadata recorded |
| **Training Set Span** | `2006-12-17 17:00:00` to `2009-09-12 04:15:00` | 95,160 training intervals |
| **Holdout Test Metrics** | **MAE: 0.2353 kW**, **RMSE: 0.3935 kW**, **$R^2$: 0.7581** | Evaluated on 20,392 holdout samples |

---

## 2. Feature Schema & Backward-Looking Causal Alignment

The model expects exactly **32 features**, matching the canonical feature specification:

| Feature Category | Count | Features | Causal Guarantee |
| :--- | :---: | :--- | :--- |
| **Calendar & Temporal** | 6 | `hour`, `minute`, `day_of_week`, `day_of_month`, `month`, `is_weekend` | Clock & calendar at origin $t$ |
| **Cyclical Encodings** | 6 | `sin/cos(hour)`, `sin/cos(day_of_week)`, `sin/cos(month)` | Smooth continuous harmonic features |
| **Active Power Lags** | 9 | `lag_15m` ($t$), `lag_30m` ($t-1$), `lag_45m` ($t-2$), `lag_1h`, `lag_2h`, `lag_3h`, `lag_6h`, `lag_12h`, `lag_24h` | Strictly observations $\le t$ |
| **Rolling Statistics** | 5 | `rolling_mean_1h`, `rolling_mean_3h`, `rolling_std_1h`, `rolling_mean_6h`, `rolling_mean_24h` | Backward-looking closed window ending at $t$ |
| **Electrical Sensors** | 6 | `lag_15m_reactive_power`, `lag_15m_voltage`, `lag_15m_intensity`, `lag_15m_sub1`, `lag_15m_sub2`, `lag_15m_sub3` | Telemetry channels at origin $t$ |

---

## 3. Inference Interface Validation Results

| Test Input Format | 15m Forecast | 30m Forecast | 60m Forecast | Uncertainty ($\pm 1\sigma$) | Latency | Verdict |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **List of Float Readings** | `1.84 kW` | `1.736 kW` | `1.78 kW` | `±0.3474 kW` | `1043.84 ms` | ✅ PASS |
| **List of Dict Readings** | `1.702 kW` | `1.717 kW` | `1.801 kW` | `±0.4292 kW` | `1377.93 ms` | ✅ PASS |
| **Pandas DataFrame** | `1.819 kW` | `1.706 kW` | `1.776 kW` | `±0.311 kW` | `1221.18 ms` | ✅ PASS |

---

## 4. Multi-Horizon Rollout Integrity

1. **Horizon Independence**:
   - `horizon_minutes=15`: Direct single-step inference from state $t$.
   - `horizon_minutes=30`: 2-step autoregressive rollout with lag updating.
   - `horizon_minutes=60`: 4-step autoregressive rollout with lag updating.
2. **Uncertainty Quantification**:
   - Computes standard deviation across the 150 individual decision trees (`ensemble_tree_std_kw`).
   - Zero fabricated confidence percentages.
3. **Preservation**:
   - `demand_v1.joblib` will remain untouched during Phase 2 solar development.
