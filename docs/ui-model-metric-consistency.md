# GridShare V2 — Model Metric & Machine Learning Consistency Guide

**Authoritative Single Source of Truth**: All values below are directly extracted from version-controlled model artifacts `ml/models/metadata.json` (`demand_v1`) and `ml/models/solar_metadata.json` (`solar_v1`).

---

## 1. Authoritative ML Metric Reference Table

| Metric Field | Model: `demand_v1` (Load) | Model: `solar_v1` (Irradiance) | Benchmark Baseline 1 (Persistence) | Relative Improvement |
| :--- | :--- | :--- | :--- | :--- |
| **Model Algorithm** | Random Forest (150 trees, depth 18) | Random Forest (150 trees, depth 18) | Naive Persistence ($t-15m$) | — |
| **Target Variable** | Active Power 15m ahead ($\text{kW}$) | Atmospheric GHI 15m ahead ($\text{W/m}^2$) | Last Observed Value | — |
| **Geographic Scope** | Benchmark Residential | Guwahati, Assam ($26.13^\circ\text{N}, 91.74^\circ\text{E}$) | — | — |
| **Training Samples** | 95,160 intervals (2M+ raw rows) | 24,460 intervals (35,040 year rows) | — | — |
| **Test Samples** | 20,392 intervals (Holdout Test) | 5,242 intervals (Holdout Test) | 20,392 / 5,242 | — |
| **Test MAE** | **0.2353 kW** | **10.16 W/m²** (All) / **23.58 W/m²** (Daytime) | 0.2901 kW / 41.66 W/m² | **+18.9%** (Demand) / **+43.4%** (Solar) |
| **Test RMSE** | **0.3935 kW** | **32.89 W/m²** (All) / **50.19 W/m²** (Daytime) | 0.4912 kW / 60.46 W/m² | **+19.9%** (Demand) / **+17.0%** (Solar) |
| **Test $R^2$ Score** | **0.7581** (75.8%) | **0.9789** (97.9%) | 0.6231 / 0.9693 | — |
| **Test sMAPE** | **26.76%** | **14.81%** | 32.45% | — |

---

## 2. Strict UI Display Consistency Rules

1. **No Metric Divergence**:
   - If UI displays `demand_v1` MAE, it MUST display `0.235 kW` (or `0.24 kW` rounded), never an inaccurate number.
   - If UI displays `solar_v1` Daytime RMSE, it MUST display `50.19 W/m²` (or `50.2 W/m²` rounded).
   - If UI displays $R^2$, it MUST display `0.758` for demand and `0.979` for solar.
2. **Daytime vs. 24-Hour Solar Metrics**:
   - Because nighttime GHI is naturally 0 W/m², the 24-hour MAE ($10.16\text{ W/m}^2$) is artificially low due to zero-night intervals.
   - **Rule**: In all technical evaluation cards and judge presentations, ALWAYS display the **Daytime MAE ($23.58\text{ W/m}^2$)** and **Daytime RMSE ($50.19\text{ W/m}^2$)** to maintain academic and industrial rigor.
3. **No Fabricated Confidence Percentages**:
   - The UI must NEVER display static `"94% confidence"` badges.
   - The UI must display the live **Forecast Range Corridor** (`5.31 – 6.28 kW` / `848 – 1003 W/m²`) derived from tree ensemble variance.
