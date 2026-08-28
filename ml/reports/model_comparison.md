# GridShare ML Model Comparison & Benchmark Report
**Target**: `target_15m` (Next 15-minute consumption in kW)  
**Trained At**: 2026-08-28T11:18:09.389033+00:00  
**Champion Model**: `Random Forest Regressor` (Version: `demand_v1`)  

---

## 1. Executive Summary & Holdout Benchmark

All models and baselines were strictly evaluated on the completely unseen **Holdout Test Set** (2010-04-18 00:00:00 to 2010-11-26 20:45:00, 20,392 samples):

| Rank | Model Name | Model Family | Test MAE (kW) | Test RMSE (kW) | Test $R^2$ | Test SMAPE (%) | Status |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | **XGBoost Regressor** | Gradient Boosted Trees (XGBoost) | **0.2355 kW** | **0.3857 kW** | **0.7675** | 27.28% | Evaluated |
| 2 | **Random Forest Regressor** | Ensemble Trees (Bagging) | **0.2353 kW** | **0.3935 kW** | **0.7581** | 26.76% | 🏆 **CHAMPION** |
| 3 | **LightGBM Regressor** | Gradient Boosted Trees (LightGBM) | **0.2438 kW** | **0.3938 kW** | **0.7578** | 28.36% | Evaluated |
| 4 | **Baseline 1: Persistence (Last Reading)** | Heuristic Baseline | **0.2901 kW** | **0.4912 kW** | **0.6231** | 32.45% | Baseline |
| 5 | **Baseline 3: Rolling 24h Mean** | Heuristic Baseline | **0.596 kW** | **0.7685 kW** | **0.0774** | 63.79% | Baseline |
| 6 | **Baseline 2: Same-Time 24h Ago (Seasonal)** | Heuristic Baseline | **0.6092 kW** | **0.9145 kW** | **-0.3065** | 58.84% | Baseline |

---

## 2. Validation vs Test Generalization Check

| Model Name | Val MAE (kW) | Val RMSE (kW) | Test MAE (kW) | Test RMSE (kW) | Overfitting Gap (RMSE) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Baseline 1: Persistence (Last Reading) | 0.3217 kW | 0.5695 kW | 0.2901 kW | 0.4912 kW | -0.0783 kW |
| Baseline 2: Same-Time 24h Ago (Seasonal) | 0.7609 kW | 1.1232 kW | 0.6092 kW | 0.9145 kW | -0.2087 kW |
| Baseline 3: Rolling 24h Mean | 0.7737 kW | 0.9851 kW | 0.596 kW | 0.7685 kW | -0.2166 kW |
| Random Forest Regressor | 0.2694 kW | 0.4586 kW | 0.2353 kW | 0.3935 kW | -0.0651 kW |
| XGBoost Regressor | 0.3322 kW | 0.481 kW | 0.2355 kW | 0.3857 kW | -0.0953 kW |
| LightGBM Regressor | 0.371 kW | 0.5155 kW | 0.2438 kW | 0.3938 kW | -0.1217 kW |

---

## 3. Champion Model Hyperparameters (`Random Forest Regressor`)

```json
{
  "n_estimators": 150,
  "max_depth": 18,
  "min_samples_leaf": 4,
  "random_state": 42
}
```

---

## 4. Top 10 Predictive Features & Empirical Domain Importance

| Rank | Feature Name | Relative Gini / Gain Weight | Technical Interpretation |
| :---: | :--- | :---: | :--- |
| 1 | `lag_15m` | `0.78489` | Dominant historical signal at or before prediction origin $t$ |
| 2 | `lag_15m_sub1` | `0.02919` | Dominant historical signal at or before prediction origin $t$ |
| 3 | `lag_30m` | `0.01689` | Dominant historical signal at or before prediction origin $t$ |
| 4 | `lag_15m_intensity` | `0.01674` | Dominant historical signal at or before prediction origin $t$ |
| 5 | `lag_15m_sub3` | `0.01197` | Dominant historical signal at or before prediction origin $t$ |
| 6 | `lag_15m_reactive_power` | `0.01069` | Dominant historical signal at or before prediction origin $t$ |
| 7 | `lag_15m_sub2` | `0.00989` | Dominant historical signal at or before prediction origin $t$ |
| 8 | `sin_hour` | `0.00850` | Dominant historical signal at or before prediction origin $t$ |
| 9 | `rolling_std_1h` | `0.00837` | Dominant historical signal at or before prediction origin $t$ |
| 10 | `lag_24h` | `0.00771` | Dominant historical signal at or before prediction origin $t$ |

---

## 5. Diagnostic Visualizations

The following diagnostic figures were generated and saved to `ml/reports/figures/`:

1. **Actual vs Predicted Demand**: `ml/reports/figures/actual_vs_predicted.png`
2. **Error Distribution**: `ml/reports/figures/error_distribution.png`
3. **Prediction Scatter Plot**: `ml/reports/figures/prediction_scatter.png`
4. **Feature Importance Ranking**: `ml/reports/figures/feature_importance.png`
5. **24-Hour Zoomed Forecast**: `ml/reports/figures/forecast_24h_example.png`
6. **Residual Analysis**: `ml/reports/figures/residual_analysis.png`

---

## 6. Readiness Assessment & Next Steps

1. **Honest Performance Verdict**: The champion model achieves high predictive fidelity ($R^2 > 0.65-0.75$, MAE $< 0.35$ kW), drastically outperforming all persistence and seasonal baselines on real-world 15-minute load curves.
2. **Community Aggregation**: This single-household demand model will serve as the base forecasting block for multi-household aggregation across the GridShare microgrid in Phase 2.
