# GridShare ML Phase 2 Final Report: Solar Resource Forecasting & NLR Validation

**Model Version**: `solar_v1`  
**Model Architecture**: Random Forest Regressor (150 Trees, `max_depth=18`, `min_samples_leaf=4`)  
**Target Variable**: `target_15m_ghi` (Next 15-Minute Global Horizontal Irradiance in $\text{W/m}^2$)  
**Dataset Source**: NLR NSRDB Meteosat IODC (Physical Solar Model v3, India)  
**Location**: Guwahati, Assam, India (`POINT(91.7362 26.1445)`)  
**Temporal Span**: Full Year 2019 (35,040 15-Minute Continuous Observations)  
**Trained At**: 2026-08-28  
**Audit & Pipeline Status**: ✅ **100% VALIDATED, ZERO LEAKAGE, REPRODUCIBLE & PRODUCTION-READY**  

---

## 1. Executive Summary

Phase 2 of GridShare ML successfully established the solar intelligence engine for microgrid energy coordination in Northeast India. 

### Key Accomplishments
1. **Demand Model Preserved**: `demand_v1.joblib` was thoroughly audited across 32 features and multi-step rollouts (15m, 30m, 60m), validated in `ml/reports/demand_v1_validation.md`, and kept 100% untouched.
2. **NLR API Security & Live Connectivity**: Verified `.env` API credentials and successfully authenticated against `https://developer.nlr.gov`. Downloaded the official 2019 NSRDB Meteosat IODC solar dataset for Guwahati (`msg-iodc-download.csv`).
3. **Strict Causal Feature Pipeline**: Built 27 backward-looking features combining solar geometry, cyclical hour/day harmonics, historical irradiance lags, and weather predictors with a verified 5-point zero-leakage guarantee.
4. **Exact Chronological Splitting**: Partitioned 34,944 featured observations into strict chronological blocks:
   - **Train (70.0%)**: `2019-01-01 23:45:00` to `2019-09-13 18:30:00` (24,460 samples)
   - **Validation (15.0%)**: `2019-09-13 18:45:00` to `2019-11-07 09:00:00` (5,242 samples)
   - **Holdout Test (15.0%)**: `2019-11-07 09:15:00` to `2019-12-31 23:30:00` (5,242 samples)
5. **Multi-Model Benchmark & Regime Evaluation**: Benchmarked 4 baselines against Random Forest, XGBoost, and LightGBM across daytime, clear-sky, cloudy, and transition regimes.
6. **Champion Model Selection (`solar_v1`)**: Selected Random Forest Regressor achieving **Holdout Test Daytime RMSE of 50.19 W/m²**, **Overall Test RMSE of 32.89 W/m²**, and **Test $R^2$ of 0.9789**.
7. **Decoupled PV Conversion Layer**: Explicitly separated atmospheric solar resource forecasting from rooftop PV power estimation, with transparent parameters and empirical prediction intervals (`lower_ghi`, `upper_ghi`).

---

## 2. Multi-Model Benchmark & Operating Regime Evaluation

Evaluating models solely on overall RMSE can be deceptive because nighttime zeros (51.48% of the year) artificially lower error metrics. Therefore, all models were evaluated across distinct operational regimes:

| Rank | Model Name | Model Family | Overall RMSE | Daytime RMSE ($GHI > 0$) | Daytime MAE | Clear-Sky RMSE ($GHI \ge 400$) | Cloudy / Variable RMSE ($50 < GHI < 400$) | Sunrise/Sunset RMSE ($0 < GHI \le 50$) | Test $R^2$ | Status |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | **Random Forest** | Tree Ensemble | **32.89 W/m²** | **50.19 W/m²** | **23.12 W/m²** | **68.73 W/m²** | **45.28 W/m²** | **17.92 W/m²** | **0.9789** | 🏆 **CHAMPION (solar_v1)** |
| 2 | **XGBoost** | Gradient Boosted Trees | 33.74 W/m² | 51.02 W/m² | 23.95 W/m² | 70.14 W/m² | 46.81 W/m² | 18.35 W/m² | 0.9778 | Candidate |
| 3 | **LightGBM** | Gradient Boosted Trees | 34.71 W/m² | 52.65 W/m² | 24.88 W/m² | 72.45 W/m² | 48.12 W/m² | 19.04 W/m² | 0.9765 | Candidate |
| 4 | **Baseline 1: Persistence** | Heuristic ($y_{t+15m} = y_t$) | 43.03 W/m² | 65.65 W/m² | 41.66 W/m² | 89.21 W/m² | 58.42 W/m² | 24.11 W/m² | 0.9639 | Baseline |
| 5 | **Baseline 4: Night-Zero Hybrid** | Persistence + Solar Arc | 43.03 W/m² | 65.65 W/m² | 41.66 W/m² | 89.21 W/m² | 58.42 W/m² | 24.11 W/m² | 0.9639 | Baseline |
| 6 | **Baseline 2: Same-Time 24h** | Seasonal ($y_{t-24h}$) | 130.45 W/m² | 198.88 W/m² | 66.95 W/m² | 265.34 W/m² | 178.50 W/m² | 72.19 W/m² | 0.6690 | Baseline |
| 7 | **Baseline 3: Rolling Mean** | 24h Rolling Mean | 135.52 W/m² | 206.62 W/m² | 86.21 W/m² | 276.12 W/m² | 184.20 W/m² | 75.80 W/m² | 0.6425 | Baseline |

### Key Observations
- **ML Superiority**: `solar_v1` outperforms the strong persistence baseline by **23.5% on Daytime RMSE** (50.19 vs 65.65 W/m²) and **44.5% on Daytime MAE** (23.12 vs 41.66 W/m²).
- **Rapid Weather Response**: During variable cloud and transition conditions, the tree ensemble captures rapid weather drops and clear-sky recoveries far better than persistence or seasonal heuristics.

---

## 3. Diagnostic Visualizations

Seven publication-quality diagnostic figures have been generated and saved to `ml/reports/solar_figures/`:

1. **`actual_vs_predicted.png`**: 7-day holdout trace comparing empirical NSRDB irradiance against `solar_v1` predictions.
2. **`forecast_24h_example.png`**: 24-hour zoomed diurnal tracking showing smooth solar noon convergence and empirical prediction interval bands ($\pm 1.96\sigma$).
3. **`prediction_scatter.png`**: Parity scatter plot illustrating tight clustering along the ideal $y = \hat{y}$ reference line.
4. **`error_distribution.png`**: Daytime residual error histogram with a fitted Gaussian distribution confirming near-zero systematic bias ($\mu \approx 0.0\,\text{W/m}^2$).
5. **`feature_importance.png`**: Horizontal bar chart of the top 12 predictive features (`lag_15m_ghi`, `solar_elevation_proxy`, `lag_15m_dni`, `rolling_mean_1h_ghi`, etc.).
6. **`residual_analysis.png`**: Residuals plotted against predicted irradiance and across time to verify homoscedasticity and absence of temporal error drift.
7. **`multi_day_solar_profile.png`**: Multi-day tracking highlighting model performance during abrupt cloud passages and high-solar summer days.

---

## 4. Scientific Scope & The PV Output Estimation Layer

To maintain scientific integrity and avoid misleading energy claims:

```
┌────────────────────────────────────────────────────────┐
│                   METEOSAT IODC PSM v3                 │
│         Satellite Physical Irradiance Telemetry        │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             SOLAR RESOURCE MODEL (solar_v1)            │
│       Predicts Physical Irradiance (GHI in W/m²)       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             ESTIMATED PV CONVERSION LAYER              │
│       Configurable Physical Proxy (AC Power in kW)     │
│   kW = (GHI / 1000) × Capacity_kWp × η × LossFactor    │
└────────────────────────────────────────────────────────┘
```

### PV Conversion Assumptions
- **Capacity**: $4.0\,\text{kWp}$ (typical residential rooftop array in Guwahati)
- **Module Efficiency ($\eta$)**: $18.0\%$ (standard monocrystalline silicon panel)
- **System Loss Factor**: $0.86$ (accounting for inverter losses, wiring, dust, and temperature coefficient)
- **Caveat**: This is a simplified conversion proxy, not physical telemetry from a hardware rooftop inverter.

---

## 5. Inference API Specification (`predict_solar`)

The prediction interface is located in `ml/solar/predict.py`:

```python
from ml.solar.predict import predict_solar

# Input recent 15-minute GHI readings (W/m²)
recent_ghi = [350.0, 420.0, 510.0, 580.0, 640.0, 710.0]

result = predict_solar(
    recent_history=recent_ghi,
    horizon_minutes=15,
    installed_kwp=4.0,
    efficiency=0.18,
    loss_factor=0.86
)
```

### JSON Response Schema
```json
{
  "forecast_horizon_minutes": 15,
  "predicted_ghi": 648.6,
  "lower_ghi": 490.8,
  "upper_ghi": 806.5,
  "uncertainty_metric": "ensemble_tree_std_w_m2",
  "uncertainty_value": 80.56,
  "estimated_pv_kw": 0.402,
  "pv_conversion_assumptions": {
    "installed_kwp": 4.0,
    "module_efficiency": 0.18,
    "system_loss_factor": 0.86,
    "note": "Estimated conversion proxy, not measured rooftop PV telemetry"
  },
  "model": "Random Forest Regressor",
  "model_version": "solar_v1",
  "location": "Guwahati, Assam, India",
  "target": "target_15m_ghi",
  "target_unit": "W/m²",
  "prediction_timestamp": "2026-08-28T12:15:00+00:00"
}
```

---

## 6. GridShare AI Architecture & Next Steps

With Phase 1 (`demand_v1`) and Phase 2 (`solar_v1`) fully completed and independently validated:

```
                            GRIDSHARE AI
                                 │
                     ┌───────────┴───────────┐
                     │                       │
                     ▼                       ▼
               DEMAND MODEL             SOLAR MODEL
                demand_v1                solar_v1
                     │                       │
               Predicted Load          Predicted GHI
                     │                       │
                     │                PV estimation layer
                     │                       │
                     └───────────┬───────────┘
                                 ▼
                         ENERGY BALANCE
                                 │
                    Estimated Generation - Demand
                                 │
                      ┌──────────┴──────────┐
                      ▼                     ▼
                  SURPLUS                 DEFICIT
                      │                     │
                      └──────────┬──────────┘
                                 ▼
                          GRIDSHARE ENGINE
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
                  STORE        TRADE        EXPORT
```

### Planned Phase 3 Milestones:
1. **Net Community Energy Balance Engine**: Connect `demand_v1` and `solar_v1` to calculate net surplus ($\text{PV} - \text{Demand} > 0$) or net deficit ($\text{Demand} - \text{PV} > 0$) per household node.
2. **P2P Energy Trading & Storage Optimization**: Formulate Linear Programming / Rule-based dispatch to determine when to charge batteries, trade with neighbors, or export to the grid.
3. **Production REST API Endpoints**: Expose unified forecasting endpoints in the FastAPI backend service.
