# GridShare ML Solar Resource Model Comparison & Benchmark Report
**Target**: `target_15m_ghi` (Next 15-minute Global Horizontal Irradiance in $\text{W/m}^2$)  
**Champion Model**: `Random Forest Regressor` (Version: `solar_v1`)  
**Trained At**: 2026-08-28T11:34:57.061468+00:00  
**Holdout Test Partition**: `2019-11-07 09:15:00` to `2019-12-31 23:30:00` (5,242 samples, completely unseen)  

---

## 1. Executive Summary & Holdout Benchmark

| Rank | Model Name | Model Family | Overall RMSE (W/m²) | Daytime RMSE (W/m²) | Daytime MAE (W/m²) | Test $R^2$ | Status |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | **Random Forest Regressor** | Tree Ensemble (Bagging) | **32.89 W/m²** | **50.19 W/m²** | **23.58 W/m²** | **0.9789** | 🏆 **CHAMPION** |
| 2 | **LightGBM Regressor** | Gradient Boosted Trees (LightGBM) | **35.37 W/m²** | **53.94 W/m²** | **34.3 W/m²** | **0.9756** | Evaluated |
| 3 | **XGBoost Regressor** | Gradient Boosted Trees (XGBoost) | **38.82 W/m²** | **59.24 W/m²** | **37.77 W/m²** | **0.9706** | Evaluated |
| 4 | **Baseline 1: Persistence (Last GHI)** | Heuristic Baseline | **39.67 W/m²** | **60.46 W/m²** | **41.66 W/m²** | **0.9693** | Baseline |
| 5 | **Baseline 2: Same-Time 24h Ago (Seasonal)** | Heuristic Baseline | **78.74 W/m²** | **120.15 W/m²** | **66.95 W/m²** | **0.879** | Baseline |
| 6 | **Baseline 3: Rolling Mean** | Heuristic Baseline | **81.75 W/m²** | **124.58 W/m²** | **86.21 W/m²** | **0.8695** | Baseline |
| 7 | **Baseline 4: Night-Zero Hybrid Persistence** | Heuristic Baseline | **198.24 W/m²** | **302.5 W/m²** | **201.33 W/m²** | **0.2327** | Baseline |

---

## 2. Regime-Specific Diagnostic Evaluation (Holdout Test Set)

Performance evaluated across operating solar irradiance regimes to prevent nighttime zeros from masking daylight accuracy:

| Model Name | Clear-Sky RMSE ($GHI \ge 400$) | Cloudy / Variable RMSE ($50 < GHI < 400$) | Sunrise/Sunset Transition RMSE ($0 < GHI \le 50$) | Night RMSE ($GHI = 0$) |
| :--- | :---: | :---: | :---: | :---: |
| **Random Forest Regressor** | `45.13 W/m²` | `56.88 W/m²` | `39.5 W/m²` | `0.51 W/m²` |
| **LightGBM Regressor** | `56.79 W/m²` | `54.47 W/m²` | `36.8 W/m²` | `1.78 W/m²` |
| **XGBoost Regressor** | `66.3 W/m²` | `55.93 W/m²` | `37.52 W/m²` | `0.86 W/m²` |
| **Baseline 1: Persistence (Last GHI)** | `56.25 W/m²` | `68.15 W/m²` | `39.98 W/m²` | `2.65 W/m²` |
| **Baseline 2: Same-Time 24h Ago (Seasonal)** | `126.2 W/m²` | `122.71 W/m²` | `75.24 W/m²` | `0.25 W/m²` |
| **Baseline 3: Rolling Mean** | `128.41 W/m²` | `128.36 W/m²` | `86.85 W/m²` | `5.69 W/m²` |
| **Baseline 4: Night-Zero Hybrid Persistence** | `416.8 W/m²` | `175.59 W/m²` | `34.47 W/m²` | `2.65 W/m²` |

---

## 3. Generalization & Validation Check

| Model Name | Val Daytime RMSE | Val Overall RMSE | Test Daytime RMSE | Test Overall RMSE | Overfitting Gap (Daytime) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Baseline 1: Persistence (Last GHI) | 81.21 W/m² | 56.26 W/m² | 60.46 W/m² | 39.67 W/m² | -20.75 W/m² |
| Baseline 2: Same-Time 24h Ago (Seasonal) | 202.97 W/m² | 140.56 W/m² | 120.15 W/m² | 78.74 W/m² | -82.82 W/m² |
| Baseline 3: Rolling Mean | 198.95 W/m² | 137.83 W/m² | 124.58 W/m² | 81.75 W/m² | -74.37 W/m² |
| Baseline 4: Night-Zero Hybrid Persistence | 322.08 W/m² | 223.05 W/m² | 302.5 W/m² | 198.24 W/m² | -19.58 W/m² |
| Random Forest Regressor | 74.72 W/m² | 51.74 W/m² | 50.19 W/m² | 32.89 W/m² | -24.53 W/m² |
| XGBoost Regressor | 92.12 W/m² | 63.8 W/m² | 59.24 W/m² | 38.82 W/m² | -32.88 W/m² |
| LightGBM Regressor | 78.45 W/m² | 54.33 W/m² | 53.94 W/m² | 35.37 W/m² | -24.51 W/m² |

---

## 4. Top 10 Predictive Features (`Random Forest Regressor`)

| Rank | Feature Name | Relative Importance | Domain Interpretation |
| :---: | :--- | :---: | :--- |
| 1 | `lag_15m_ghi` | `0.96766` | Dominant causal solar/weather feature available $\le t$ |
| 2 | `lag_15m_dhi` | `0.00369` | Dominant causal solar/weather feature available $\le t$ |
| 3 | `cos_hour` | `0.00361` | Dominant causal solar/weather feature available $\le t$ |
| 4 | `solar_elevation_proxy` | `0.00310` | Dominant causal solar/weather feature available $\le t$ |
| 5 | `lag_30m_ghi` | `0.00250` | Dominant causal solar/weather feature available $\le t$ |
| 6 | `lag_24h_ghi` | `0.00193` | Dominant causal solar/weather feature available $\le t$ |
| 7 | `rolling_std_1h_ghi` | `0.00174` | Dominant causal solar/weather feature available $\le t$ |
| 8 | `lag_1h_ghi` | `0.00147` | Dominant causal solar/weather feature available $\le t$ |
| 9 | `rolling_mean_1h_ghi` | `0.00139` | Dominant causal solar/weather feature available $\le t$ |
| 10 | `lag_45m_ghi` | `0.00139` | Dominant causal solar/weather feature available $\le t$ |

---

## 5. Diagnostic Figures

Saved to `ml/reports/solar_figures/`:
1. `actual_vs_predicted.png` — 7-day holdout trace overlay
2. `forecast_24h_example.png` — 24-hour diurnal tracking with prediction intervals
3. `prediction_scatter.png` — Parity plot ($y = \hat{y}$)
4. `error_distribution.png` — Daytime residual error histogram and Gaussian fit
5. `feature_importance.png` — Top 12 feature weights
6. `residual_analysis.png` — Residuals vs predicted and over time
7. `multi_day_solar_profile.png` — Multi-day clear vs cloudy transition tracking

---

## 6. Scientific Scope & GridShare PV Conversion Layer

1. **Solar Resource Model**: `solar_v1` predicts atmospheric physical irradiance ($GHI$ in $\text{{W/m}}^2$).
2. **Estimated PV Output**: Configurable conversion formula:
   $$\text{{Estimated PV (kW)}} = \frac{{GHI}}{{1000}} \times \text{{Capacity}}_{{\text{{kWp}}}} \times \eta \times \text{{LossFactor}}$$
3. **Decoupled Architecture**: Demand forecasting (`demand_v1`) and solar resource forecasting (`solar_v1`) operate as modular building blocks, combined at the microgrid balance layer.
