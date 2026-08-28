# GridShare AI/ML Model Training & Evaluation Documentation

This directory contains the training artifacts, dataset audits, feature engineering leakage verifications, benchmark comparisons, diagnostic visual figures, and metadata records for GridShare's machine learning models.

> [!TIP]
> For a detailed technical and mathematical explanation of why Random Forest won both benchmarks over XGBoost and LightGBM, see [Why Random Forest Won Both Trainings](../why_random_forest_wins.md).

```
docs/model_training/
├── README.md                          (This Master Documentation Index)
├── reports/
│   ├── dataset_audit.md               (Phase 1: Household Power Consumption Raw Dataset Audit)
│   ├── leakage_audit.md               (Phase 1: Demand Feature Target Leakage Verification)
│   ├── model_comparison.md            (Phase 1: Demand Forecasting Multi-Model Benchmark)
│   ├── demand_v1_validation.md        (Demand Model demand_v1 Inference Validation)
│   ├── solar_dataset_audit.md         (Phase 2: NLR NSRDB Meteosat Solar Dataset Audit)
│   ├── solar_leakage_audit.md         (Phase 2: Solar Causal Feature Leakage Verification)
│   ├── solar_model_comparison.md      (Phase 2: Solar Forecasting Multi-Model Benchmark)
│   └── phase2_solar_report.md         (Phase 2: Complete Solar Technical Summary Report)
├── records/
│   ├── demand_dataset_audit.json      (Machine-readable UCI power dataset audit metrics)
│   ├── solar_dataset_audit.json       (Machine-readable NSRDB solar dataset audit metrics)
│   ├── demand_v1_metadata.json        (demand_v1 hyperparameters, feature schema & test metrics)
│   └── solar_v1_metadata.json         (solar_v1 hyperparameters, feature schema & test metrics)
└── figures/
    ├── demand/                        (Phase 1 Demand Diagnostic Charts - 6 figures)
    │   ├── actual_vs_predicted.png
    │   ├── forecast_24h_example.png
    │   ├── prediction_scatter.png
    │   ├── error_distribution.png
    │   ├── feature_importance.png
    │   └── residual_analysis.png
    └── solar/                         (Phase 2 Solar Diagnostic Charts - 7 figures)
        ├── actual_vs_predicted.png
        ├── forecast_24h_example.png
        ├── prediction_scatter.png
        ├── error_distribution.png
        ├── feature_importance.png
        ├── residual_analysis.png
        └── multi_day_solar_profile.png
```

---

## 1. GridShare ML Architecture Overview

GridShare uses a decoupled, dual-engine ML forecasting architecture:

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

---

## 2. Phase 1: Demand Forecasting Model (`demand_v1`)

- **Dataset**: UCI Individual Household Electric Power Consumption (2,075,259 raw readings, 138,352 15-minute resampled records).
- **Target**: `target_15m` (Household Active Power in kW).
- **Champion Architecture**: `RandomForestRegressor` (150 trees, `max_depth=18`, 32 causal features).
- **Holdout Test Set Performance**:
  - **MAE**: `0.2353 kW`
  - **RMSE**: `0.3935 kW`
  - **$R^2$**: `0.7581`
  - **SMAPE**: `26.76%`
- **Detailed Reports**:
  - [Phase 1 Dataset Audit](reports/dataset_audit.md)
  - [Phase 1 Leakage Audit](reports/leakage_audit.md)
  - [Phase 1 Model Comparison Report](reports/model_comparison.md)
  - [demand_v1 Validation Report](reports/demand_v1_validation.md)

---

## 3. Phase 2: Solar Resource Forecasting Model (`solar_v1`)

- **Dataset**: NLR NSRDB Meteosat IODC (PSM v3, India) for Guwahati, Assam (`POINT(91.7362 26.1445)`, 35,040 15-minute intervals).
- **Target**: `target_15m_ghi` (Global Horizontal Irradiance in $\text{W/m}^2$).
- **Champion Architecture**: `RandomForestRegressor` (150 trees, `max_depth=18`, `min_samples_leaf=4`, 27 causal features).
- **PV Estimation Layer**: Configurable physical proxy ($\text{kW} = \frac{GHI}{1000} \times \text{kWp} \times \eta \times \text{LossFactor}$).
- **Holdout Test Set Performance**:
  - **Daytime RMSE ($GHI > 0$)**: `50.19 W/m²` (vs Persistence `60.46 W/m²`, **17.0% improvement**)
  - **Daytime MAE**: `23.58 W/m²` (vs Persistence `41.66 W/m²`, **43.4% improvement**)
  - **Overall RMSE**: `32.89 W/m²`
  - **Test $R^2$**: `0.9789`
- **Detailed Reports**:
  - [Phase 2 Solar Dataset Audit](reports/solar_dataset_audit.md)
  - [Phase 2 Solar Leakage Audit](reports/solar_leakage_audit.md)
  - [Phase 2 Solar Model Comparison](reports/solar_model_comparison.md)
  - [Phase 2 Complete Technical Report](reports/phase2_solar_report.md)

---

## 4. Machine-Readable Metadata & Audit Records

- [demand_dataset_audit.json](records/demand_dataset_audit.json)
- [solar_dataset_audit.json](records/solar_dataset_audit.json)
- [demand_v1_metadata.json](records/demand_v1_metadata.json)
- [solar_v1_metadata.json](records/solar_v1_metadata.json)
