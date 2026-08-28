"""
Solar Resource Forecasting Training & Multi-Model Benchmarking Engine for GridShare ML.
Trains Baselines, Random Forest, XGBoost, and LightGBM models on exact chronological splits,
tunes parameters on validation partition, evaluates on holdout test set across operational regimes,
generates 7 diagnostic figures, and serializes solar_v1.joblib and solar_metadata.json.
"""

import os
import sys
import json
import time
from datetime import datetime, timezone
import numpy as np
import pandas as pd
import joblib

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from sklearn.ensemble import RandomForestRegressor
import xgboost as xgb
import lightgbm as lgb

from ml.solar.preprocessing import load_processed_solar_data
from ml.solar.features import engineer_solar_features, SOLAR_FEATURE_NAMES
from ml.solar.evaluate import calculate_solar_metrics, generate_all_solar_figures

MODELS_DIR = os.path.join(ROOT_DIR, "ml", "models")
REPORTS_DIR = os.path.join(ROOT_DIR, "ml", "reports")
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

def train_and_evaluate_solar():
    print("=" * 70)
    print(" GRIDSHARE ML PHASE 2: SOLAR RESOURCE FORECASTING & BENCHMARKING")
    print("=" * 70)

    # 1. Load data and extract features
    print("\n[Step 1/7] Loading processed 15-minute solar telemetry dataset...")
    df_proc = load_processed_solar_data()
    print(f"   Processed dataset loaded: {len(df_proc):,} observations.")

    print("\n[Step 2/7] Generating strictly causal solar, lag, and weather features...")
    df_feat, features = engineer_solar_features(df_proc, is_training=True, target_col="target_15m_ghi")
    print(f"   Feature set engineered: {len(features)} features across {len(df_feat):,} clean records.")

    X = df_feat[features]
    y = df_feat["target_15m_ghi"].values
    timestamps = df_feat["datetime"]

    # 2. Exact Chronological 70% / 15% / 15% Split
    print("\n[Step 3/7] Performing exact chronological 70% / 15% / 15% partitioning...")
    n = len(df_feat)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)

    X_train, y_train = X.iloc[:train_end], y[:train_end]
    X_val, y_val = X.iloc[train_end:val_end], y[train_end:val_end]
    X_test, y_test = X.iloc[val_end:], y[val_end:]
    ts_test = timestamps.iloc[val_end:]

    train_dates = (str(timestamps.iloc[0]), str(timestamps.iloc[train_end - 1]))
    val_dates = (str(timestamps.iloc[train_end]), str(timestamps.iloc[val_end - 1]))
    test_dates = (str(timestamps.iloc[val_end]), str(timestamps.iloc[-1]))

    print(f"   Train samples: {len(X_train):,} ({train_dates[0]} to {train_dates[1]})")
    print(f"   Val samples:   {len(X_val):,} ({val_dates[0]} to {val_dates[1]})")
    print(f"   Test samples:  {len(X_test):,} ({test_dates[0]} to {test_dates[1]})")

    results_table = []

    # 3. Baseline Models
    print("\n[Step 4/7] Evaluating Solar Baseline Models...")

    # Baseline 1: Persistence (y_pred = lag_15m_ghi)
    pred_val_p = X_val["lag_15m_ghi"].values
    pred_test_p = X_test["lag_15m_ghi"].values
    m_p_val = calculate_solar_metrics(y_val, pred_val_p)
    m_p_test = calculate_solar_metrics(y_test, pred_test_p)
    print(f"   -> Baseline 1 (Persistence): Test MAE={m_p_test['mae']} W/m², Daytime MAE={m_p_test['daytime_mae']} W/m², R^2={m_p_test['r2']}")
    results_table.append({
        "model_name": "Baseline 1: Persistence (Last GHI)",
        "model_type": "Heuristic Baseline",
        "val_metrics": m_p_val,
        "test_metrics": m_p_test,
        "best_params": None,
        "model_obj": None
    })

    # Baseline 2: Same-Time 24h Ago (lag_24h_ghi)
    pred_val_s24 = X_val["lag_24h_ghi"].values
    pred_test_s24 = X_test["lag_24h_ghi"].values
    m_s24_val = calculate_solar_metrics(y_val, pred_val_s24)
    m_s24_test = calculate_solar_metrics(y_test, pred_test_s24)
    print(f"   -> Baseline 2 (Same-Time 24h Ago): Test MAE={m_s24_test['mae']} W/m², Daytime MAE={m_s24_test['daytime_mae']} W/m², R^2={m_s24_test['r2']}")
    results_table.append({
        "model_name": "Baseline 2: Same-Time 24h Ago (Seasonal)",
        "model_type": "Heuristic Baseline",
        "val_metrics": m_s24_val,
        "test_metrics": m_s24_test,
        "best_params": None,
        "model_obj": None
    })

    # Baseline 3: Rolling 24h Mean
    pred_val_rm = X_val["lag_24h_ghi"].rolling(4, min_periods=1).mean().values
    pred_test_rm = X_test["lag_24h_ghi"].rolling(4, min_periods=1).mean().values
    m_rm_val = calculate_solar_metrics(y_val, pred_val_rm)
    m_rm_test = calculate_solar_metrics(y_test, pred_test_rm)
    print(f"   -> Baseline 3 (Rolling Mean): Test MAE={m_rm_test['mae']} W/m², Daytime MAE={m_rm_test['daytime_mae']} W/m², R^2={m_rm_test['r2']}")
    results_table.append({
        "model_name": "Baseline 3: Rolling Mean",
        "model_type": "Heuristic Baseline",
        "val_metrics": m_rm_val,
        "test_metrics": m_rm_test,
        "best_params": None,
        "model_obj": None
    })

    # Baseline 4: Clear-Sky Night-Zero Hybrid Persistence
    # (If solar elevation is 0, predict 0; otherwise predict persistence)
    day_mask_val = X_val["solar_elevation_proxy"] > 0
    day_mask_test = X_test["solar_elevation_proxy"] > 0
    pred_val_hybrid = np.where(day_mask_val, pred_val_p, 0.0)
    pred_test_hybrid = np.where(day_mask_test, pred_test_p, 0.0)
    m_hyb_val = calculate_solar_metrics(y_val, pred_val_hybrid)
    m_hyb_test = calculate_solar_metrics(y_test, pred_test_hybrid)
    print(f"   -> Baseline 4 (Clear-Sky Night-Zero Hybrid): Test MAE={m_hyb_test['mae']} W/m², Daytime MAE={m_hyb_test['daytime_mae']} W/m², R^2={m_hyb_test['r2']}")
    results_table.append({
        "model_name": "Baseline 4: Night-Zero Hybrid Persistence",
        "model_type": "Heuristic Baseline",
        "val_metrics": m_hyb_val,
        "test_metrics": m_hyb_test,
        "best_params": None,
        "model_obj": None
    })

    # 4. Machine Learning Models Training & Tuning
    print("\n[Step 5/7] Training & Hyperparameter Tuning on Validation Split...")

    # Model A: Random Forest Regressor
    print("   [*] Training Model A: Random Forest Regressor...")
    rf_configs = [
        {"n_estimators": 100, "max_depth": 14, "min_samples_leaf": 2, "random_state": 42, "n_jobs": -1},
        {"n_estimators": 150, "max_depth": 18, "min_samples_leaf": 4, "random_state": 42, "n_jobs": -1},
    ]
    best_rf_model, best_rf_params, best_rf_val_rmse = None, None, float("inf")
    for params in rf_configs:
        rf = RandomForestRegressor(**params)
        rf.fit(X_train, y_train)
        pred_val = rf.predict(X_val)
        val_m = calculate_solar_metrics(y_val, pred_val)
        print(f"       RF (depth={params['max_depth']}, n_est={params['n_estimators']}) -> Val Daytime RMSE: {val_m['daytime_rmse']} W/m² (Overall RMSE: {val_m['rmse']} W/m²)")
        if val_m["daytime_rmse"] < best_rf_val_rmse:
            best_rf_val_rmse = val_m["daytime_rmse"]
            best_rf_params = params
            best_rf_model = rf

    pred_rf_val = best_rf_model.predict(X_val)
    pred_rf_test = best_rf_model.predict(X_test)
    m_rf_val = calculate_solar_metrics(y_val, pred_rf_val)
    m_rf_test = calculate_solar_metrics(y_test, pred_rf_test)
    results_table.append({
        "model_name": "Random Forest Regressor",
        "model_type": "Tree Ensemble (Bagging)",
        "val_metrics": m_rf_val,
        "test_metrics": m_rf_test,
        "best_params": {k: v for k, v in best_rf_params.items() if k != "n_jobs"},
        "model_obj": best_rf_model
    })

    # Model B: XGBoost Regressor
    print("   [*] Training Model B: XGBoost Regressor...")
    xgb_configs = [
        {"n_estimators": 200, "learning_rate": 0.05, "max_depth": 6, "subsample": 0.85, "colsample_bytree": 0.85, "random_state": 42, "n_jobs": -1},
        {"n_estimators": 300, "learning_rate": 0.03, "max_depth": 8, "subsample": 0.85, "colsample_bytree": 0.85, "random_state": 42, "n_jobs": -1},
    ]
    best_xgb_model, best_xgb_params, best_xgb_val_rmse = None, None, float("inf")
    for params in xgb_configs:
        model_xgb = xgb.XGBRegressor(**params)
        model_xgb.fit(X_train, y_train)
        pred_val = model_xgb.predict(X_val)
        val_m = calculate_solar_metrics(y_val, pred_val)
        print(f"       XGB (depth={params['max_depth']}, lr={params['learning_rate']}, n_est={params['n_estimators']}) -> Val Daytime RMSE: {val_m['daytime_rmse']} W/m² (Overall RMSE: {val_m['rmse']} W/m²)")
        if val_m["daytime_rmse"] < best_xgb_val_rmse:
            best_xgb_val_rmse = val_m["daytime_rmse"]
            best_xgb_params = params
            best_xgb_model = model_xgb

    pred_xgb_val = best_xgb_model.predict(X_val)
    pred_xgb_test = best_xgb_model.predict(X_test)
    m_xgb_val = calculate_solar_metrics(y_val, pred_xgb_val)
    m_xgb_test = calculate_solar_metrics(y_test, pred_xgb_test)
    results_table.append({
        "model_name": "XGBoost Regressor",
        "model_type": "Gradient Boosted Trees (XGBoost)",
        "val_metrics": m_xgb_val,
        "test_metrics": m_xgb_test,
        "best_params": {k: v for k, v in best_xgb_params.items() if k != "n_jobs"},
        "model_obj": best_xgb_model
    })

    # Model C: LightGBM Regressor
    print("   [*] Training Model C: LightGBM Regressor...")
    lgb_configs = [
        {"n_estimators": 250, "learning_rate": 0.05, "num_leaves": 31, "min_child_samples": 25, "reg_alpha": 0.05, "reg_lambda": 0.05, "random_state": 42, "n_jobs": -1, "verbose": -1},
        {"n_estimators": 350, "learning_rate": 0.03, "num_leaves": 45, "min_child_samples": 30, "reg_alpha": 0.10, "reg_lambda": 0.10, "random_state": 42, "n_jobs": -1, "verbose": -1},
        {"n_estimators": 400, "learning_rate": 0.04, "num_leaves": 63, "min_child_samples": 20, "reg_alpha": 0.01, "reg_lambda": 0.05, "random_state": 42, "n_jobs": -1, "verbose": -1},
    ]
    best_lgb_model, best_lgb_params, best_lgb_val_rmse = None, None, float("inf")
    for params in lgb_configs:
        model_lgb = lgb.LGBMRegressor(**params)
        model_lgb.fit(X_train, y_train)
        pred_val = model_lgb.predict(X_val)
        val_m = calculate_solar_metrics(y_val, pred_val)
        print(f"       LightGBM (leaves={params['num_leaves']}, lr={params['learning_rate']}, n_est={params['n_estimators']}) -> Val Daytime RMSE: {val_m['daytime_rmse']} W/m² (Overall RMSE: {val_m['rmse']} W/m²)")
        if val_m["daytime_rmse"] < best_lgb_val_rmse:
            best_lgb_val_rmse = val_m["daytime_rmse"]
            best_lgb_params = params
            best_lgb_model = model_lgb

    pred_lgb_val = best_lgb_model.predict(X_val)
    pred_lgb_test = best_lgb_model.predict(X_test)
    m_lgb_val = calculate_solar_metrics(y_val, pred_lgb_val)
    m_lgb_test = calculate_solar_metrics(y_test, pred_lgb_test)
    results_table.append({
        "model_name": "LightGBM Regressor",
        "model_type": "Gradient Boosted Trees (LightGBM)",
        "val_metrics": m_lgb_val,
        "test_metrics": m_lgb_test,
        "best_params": {k: v for k, v in best_lgb_params.items() if k not in ("n_jobs", "verbose")},
        "model_obj": best_lgb_model
    })

    # 5. Model Selection (Selecting champion based strictly on Validation Daytime RMSE)
    print("\n[Step 6/7] Selecting Champion Model based on Validation Daytime RMSE...")
    ml_candidates = [r for r in results_table if r["model_obj"] is not None]
    champion_entry = min(ml_candidates, key=lambda r: r["val_metrics"]["daytime_rmse"])
    champion_model = champion_entry["model_obj"]
    champion_name = champion_entry["model_name"]
    champion_test_pred = champion_model.predict(X_test)

    print(f"   [CHAMPION] Selected Solar Model: {champion_name} (solar_v1)")
    print(f"      Validation Daytime RMSE: {champion_entry['val_metrics']['daytime_rmse']} W/m² | Overall RMSE: {champion_entry['val_metrics']['rmse']} W/m² | R^2: {champion_entry['val_metrics']['r2']}")
    print(f"      Holdout Test Daytime RMSE: {champion_entry['test_metrics']['daytime_rmse']} W/m² | Overall RMSE: {champion_entry['test_metrics']['rmse']} W/m² | R^2: {champion_entry['test_metrics']['r2']}")

    # Extract feature importances
    if hasattr(champion_model, "feature_importances_"):
        raw_imp = np.array(champion_model.feature_importances_, dtype=np.float64)
        feature_importances = raw_imp / np.sum(raw_imp)
    else:
        feature_importances = np.ones(len(features)) / len(features)

    # 6. Generate 7 Diagnostic Figures
    print("\n[Step 7/7] Generating publication-quality diagnostic charts & saving artifacts...")
    generate_all_solar_figures(
        y_test=y_test,
        y_pred=champion_test_pred,
        timestamps=ts_test,
        feature_names=features,
        feature_importances=feature_importances,
        model_name=champion_name
    )

    # Save Model Artifact
    model_artifact_path = os.path.join(MODELS_DIR, "solar_v1.joblib")
    joblib.dump(champion_model, model_artifact_path)
    print(f"   [+] Saved solar model artifact to: {model_artifact_path}")

    # Build Metadata JSON
    sorted_feat_idx = np.argsort(feature_importances)[::-1]
    top_features_list = [
        {"feature": features[i], "importance": round(float(feature_importances[i]), 5)}
        for i in sorted_feat_idx
    ]

    metadata = {
        "model_name": champion_name,
        "model_version": "solar_v1",
        "target": "target_15m_ghi",
        "target_description": "Next 15-minute Global Horizontal Irradiance (W/m²)",
        "target_type": "Solar Resource Forecast (Physical Atmospheric Irradiance)",
        "pv_estimation_layer": {
            "description": "Simplified estimated conversion from GHI to AC power, not measured rooftop PV telemetry",
            "formula": "Estimated PV (kW) = (GHI / 1000) * Capacity_kWp * Efficiency * LossFactor",
            "default_parameters": {
                "capacity_kwp": 4.0,
                "efficiency": 0.18,
                "loss_factor": 0.86
            }
        },
        "resolution": "15min",
        "dataset": "NSRDB Meteosat IODC (PSM v3 India)",
        "location": {
            "city": "Guwahati",
            "state": "Assam",
            "country": "India",
            "latitude": 26.13,
            "longitude": 91.74,
            "elevation_m": 76.0,
            "year": 2019
        },
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "date_ranges": {
            "train": {"start": train_dates[0], "end": train_dates[1], "samples": len(X_train)},
            "validation": {"start": val_dates[0], "end": val_dates[1], "samples": len(X_val)},
            "test": {"start": test_dates[0], "end": test_dates[1], "samples": len(X_test)}
        },
        "hyperparameters": champion_entry["best_params"],
        "metrics_holdout_test": champion_entry["test_metrics"],
        "metrics_validation": champion_entry["val_metrics"],
        "features": features,
        "top_features": top_features_list[:10],
        "all_model_benchmarks": [
            {
                "model_name": r["model_name"],
                "model_type": r["model_type"],
                "val_rmse": r["val_metrics"]["rmse"],
                "val_daytime_rmse": r["val_metrics"]["daytime_rmse"],
                "test_rmse": r["test_metrics"]["rmse"],
                "test_daytime_rmse": r["test_metrics"]["daytime_rmse"],
                "test_daytime_mae": r["test_metrics"]["daytime_mae"],
                "test_r2": r["test_metrics"]["r2"],
                "test_clear_sky_rmse": r["test_metrics"].get("clear_sky_rmse"),
                "test_cloudy_rmse": r["test_metrics"].get("cloudy_rmse"),
                "test_transition_rmse": r["test_metrics"].get("transition_rmse")
            }
            for r in results_table
        ]
    }

    metadata_path = os.path.join(MODELS_DIR, "solar_metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"   [+] Saved solar metadata to: {metadata_path}")

    # Build Markdown Comparison Report
    comp_md = f"""# GridShare ML Solar Resource Model Comparison & Benchmark Report
**Target**: `target_15m_ghi` (Next 15-minute Global Horizontal Irradiance in $\\text{{W/m}}^2$)  
**Champion Model**: `{champion_name}` (Version: `solar_v1`)  
**Trained At**: {metadata['trained_at']}  
**Holdout Test Partition**: `{test_dates[0]}` to `{test_dates[1]}` ({len(X_test):,} samples, completely unseen)  

---

## 1. Executive Summary & Holdout Benchmark

| Rank | Model Name | Model Family | Overall RMSE (W/m²) | Daytime RMSE (W/m²) | Daytime MAE (W/m²) | Test $R^2$ | Status |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
"""
    sorted_results = sorted(results_table, key=lambda x: x["test_metrics"]["daytime_rmse"])
    for rank, r in enumerate(sorted_results, 1):
        tm = r["test_metrics"]
        is_champ = r["model_name"] == champion_name
        badge = "🏆 **CHAMPION**" if is_champ else ("Baseline" if "Baseline" in r["model_name"] else "Evaluated")
        comp_md += f"| {rank} | **{r['model_name']}** | {r['model_type']} | **{tm['rmse']} W/m²** | **{tm['daytime_rmse']} W/m²** | **{tm['daytime_mae']} W/m²** | **{tm['r2']}** | {badge} |\n"

    comp_md += f"""
---

## 2. Regime-Specific Diagnostic Evaluation (Holdout Test Set)

Performance evaluated across operating solar irradiance regimes to prevent nighttime zeros from masking daylight accuracy:

| Model Name | Clear-Sky RMSE ($GHI \\ge 400$) | Cloudy / Variable RMSE ($50 < GHI < 400$) | Sunrise/Sunset Transition RMSE ($0 < GHI \\le 50$) | Night RMSE ($GHI = 0$) |
| :--- | :---: | :---: | :---: | :---: |
"""
    for r in sorted_results:
        tm = r["test_metrics"]
        comp_md += f"| **{r['model_name']}** | `{tm.get('clear_sky_rmse', 0.0)} W/m²` | `{tm.get('cloudy_rmse', 0.0)} W/m²` | `{tm.get('transition_rmse', 0.0)} W/m²` | `{tm.get('night_rmse', 0.0)} W/m²` |\n"

    comp_md += f"""
---

## 3. Generalization & Validation Check

| Model Name | Val Daytime RMSE | Val Overall RMSE | Test Daytime RMSE | Test Overall RMSE | Overfitting Gap (Daytime) |
| :--- | :---: | :---: | :---: | :---: | :---: |
"""
    for r in results_table:
        vm = r["val_metrics"]
        tm = r["test_metrics"]
        gap = round(tm["daytime_rmse"] - vm["daytime_rmse"], 2)
        comp_md += f"| {r['model_name']} | {vm['daytime_rmse']} W/m² | {vm['rmse']} W/m² | {tm['daytime_rmse']} W/m² | {tm['rmse']} W/m² | {gap:+.2f} W/m² |\n"

    comp_md += f"""
---

## 4. Top 10 Predictive Features (`{champion_name}`)

| Rank | Feature Name | Relative Importance | Domain Interpretation |
| :---: | :--- | :---: | :--- |
"""
    for rank, item in enumerate(top_features_list[:10], 1):
        feat = item["feature"]
        weight = item["importance"]
        comp_md += f"| {rank} | `{feat}` | `{weight:.5f}` | Dominant causal solar/weather feature available $\\le t$ |\n"

    comp_md += """
---

## 5. Diagnostic Figures

Saved to `ml/reports/solar_figures/`:
1. `actual_vs_predicted.png` — 7-day holdout trace overlay
2. `forecast_24h_example.png` — 24-hour diurnal tracking with prediction intervals
3. `prediction_scatter.png` — Parity plot ($y = \\hat{y}$)
4. `error_distribution.png` — Daytime residual error histogram and Gaussian fit
5. `feature_importance.png` — Top 12 feature weights
6. `residual_analysis.png` — Residuals vs predicted and over time
7. `multi_day_solar_profile.png` — Multi-day clear vs cloudy transition tracking

---

## 6. Scientific Scope & GridShare PV Conversion Layer

1. **Solar Resource Model**: `solar_v1` predicts atmospheric physical irradiance ($GHI$ in $\\text{{W/m}}^2$).
2. **Estimated PV Output**: Configurable conversion formula:
   $$\\text{{Estimated PV (kW)}} = \\frac{{GHI}}{{1000}} \\times \\text{{Capacity}}_{{\\text{{kWp}}}} \\times \\eta \\times \\text{{LossFactor}}$$
3. **Decoupled Architecture**: Demand forecasting (`demand_v1`) and solar resource forecasting (`solar_v1`) operate as modular building blocks, combined at the microgrid balance layer.
"""

    report_path = os.path.join(REPORTS_DIR, "solar_model_comparison.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(comp_md)
    print(f"   [+] Saved solar model comparison report to: {report_path}")
    print("\n[SUCCESS] GridShare ML Solar Resource Forecasting Training Pipeline Completed!")
    return champion_model, metadata

if __name__ == "__main__":
    train_and_evaluate_solar()
