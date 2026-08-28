"""
GridShare ML Demand Prediction & Inference Engine.
Loads versioned model artifacts and provides clean, decoupled prediction interfaces:
- Single-step 15m / 30m / 60m demand forecasts
- Multi-step future rollouts with empirical ensemble uncertainty estimation
"""

import os
import sys
import json
import math
from datetime import datetime, timedelta, timezone
from typing import Union, List, Dict, Optional
import numpy as np
import pandas as pd
import joblib

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from ml.features.feature_engineering import engineer_features, FEATURE_NAMES, FEATURE_COLUMNS

DEFAULT_MODEL_PATH = os.path.join(ROOT_DIR, "ml", "models", "demand_v1.joblib")
DEFAULT_META_PATH = os.path.join(ROOT_DIR, "ml", "models", "metadata.json")

class DemandPredictor:
    """
    Decoupled ML Demand Forecaster for GridShare microgrid coordination.
    """
    def __init__(self, model_path: str = DEFAULT_MODEL_PATH, meta_path: str = DEFAULT_META_PATH):
        self.model_path = model_path
        self.meta_path = meta_path
        self.model = None
        self.metadata = {}
        self._ensure_loaded()

    def _ensure_loaded(self):
        """Ensure trained model artifact and metadata are loaded into memory."""
        if not os.path.exists(self.model_path):
            print("[*] Model artifact not found. Triggering automated training pipeline...")
            from ml.train import train_and_evaluate_all
            self.model, self.metadata = train_and_evaluate_all()
        else:
            self.model = joblib.load(self.model_path)
            if os.path.exists(self.meta_path):
                with open(self.meta_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)

    @property
    def model_version(self) -> str:
        return self.metadata.get("model_version", "demand_v1")

    @property
    def model_name(self) -> str:
        return self.metadata.get("model_name", "Random Forest Regressor")

    def build_feature_vector(
        self,
        current_time: datetime,
        recent_active_power: List[float],
        reactive_power: float = 0.12,
        voltage: float = 240.0,
        intensity: float = 4.5,
        sub1: float = 0.0,
        sub2: float = 0.0,
        sub3: float = 1.0
    ) -> pd.DataFrame:
        """
        Construct a valid 32-feature vector from recent 15-minute readings.
        """
        # Ensure we have at least 96 historical lags (24h); backfill if shorter
        if len(recent_active_power) == 0:
            recent_active_power = [1.0] * 96
        elif len(recent_active_power) < 96:
            pad = [recent_active_power[0]] * (96 - len(recent_active_power))
            recent_active_power = pad + list(recent_active_power)

        p = np.array(recent_active_power, dtype=np.float64)

        hour = current_time.hour
        minute = (current_time.minute // 15) * 15
        day_of_week = current_time.weekday()
        day_of_month = current_time.day
        month = current_time.month
        is_weekend = 1 if day_of_week in (5, 6) else 0

        time_fraction = hour + minute / 60.0
        sin_hour = math.sin(2 * math.pi * time_fraction / 24.0)
        cos_hour = math.cos(2 * math.pi * time_fraction / 24.0)
        sin_dow = math.sin(2 * math.pi * day_of_week / 7.0)
        cos_dow = math.cos(2 * math.pi * day_of_week / 7.0)
        sin_month = math.sin(2 * math.pi * month / 12.0)
        cos_month = math.cos(2 * math.pi * month / 12.0)

        # Lags from historical array (index -1 is current observation at origin t)
        row_dict = {
            "hour": hour,
            "minute": minute,
            "day_of_week": day_of_week,
            "day_of_month": day_of_month,
            "month": month,
            "is_weekend": is_weekend,
            "sin_hour": sin_hour,
            "cos_hour": cos_hour,
            "sin_day_of_week": sin_dow,
            "cos_day_of_week": cos_dow,
            "sin_month": sin_month,
            "cos_month": cos_month,
            "lag_15m": float(p[-1]),
            "lag_30m": float(p[-2]),
            "lag_45m": float(p[-3]),
            "lag_1h": float(p[-4]),
            "lag_2h": float(p[-8]),
            "lag_3h": float(p[-12]),
            "lag_6h": float(p[-24]),
            "lag_12h": float(p[-48]),
            "lag_24h": float(p[-96]),
            "rolling_mean_1h": float(np.mean(p[-4:])),
            "rolling_mean_3h": float(np.mean(p[-12:])),
            "rolling_std_1h": float(np.std(p[-4:])),
            "rolling_mean_6h": float(np.mean(p[-24:])),
            "rolling_mean_24h": float(np.mean(p[-96:])),
            "lag_15m_reactive_power": reactive_power,
            "lag_15m_voltage": voltage,
            "lag_15m_intensity": intensity,
            "lag_15m_sub1": sub1,
            "lag_15m_sub2": sub2,
            "lag_15m_sub3": sub3,
        }

        feature_cols = self.metadata.get("features", FEATURE_NAMES)
        df_row = pd.DataFrame([row_dict])[feature_cols]
        return df_row

    def predict_demand(
        self,
        recent_history: Union[List[float], Dict, pd.DataFrame],
        horizon_minutes: int = 15,
        current_time: Optional[datetime] = None
    ) -> Dict:
        """
        Primary clean prediction interface for GridShare.
        Supports horizon_minutes = 15, 30, 60.
        """
        self._ensure_loaded()
        if current_time is None:
            current_time = datetime.now(timezone.utc)

        # Parse recent power readings
        if isinstance(recent_history, (list, tuple)):
            if len(recent_history) > 0 and isinstance(recent_history[0], dict):
                p_list = [float(r.get("consumption_kw", r.get("Global_active_power", 1.0))) for r in recent_history]
            else:
                p_list = [float(x) for x in recent_history]
        elif isinstance(recent_history, pd.DataFrame):
            col = "Global_active_power" if "Global_active_power" in recent_history.columns else "consumption_kw"
            p_list = recent_history[col].dropna().tolist()
        else:
            p_list = [1.0]

        steps_needed = min(4, max(1, horizon_minutes // 15))
        history_buffer = list(p_list)
        sim_time = current_time

        predicted_val = float(p_list[-1]) if p_list else 1.0
        tree_std = None

        for step in range(1, steps_needed + 1):
            feat_df = self.build_feature_vector(sim_time, history_buffer)
            is_final = (step == steps_needed)
            pred_point, step_std = self._predict_with_uncertainty(feat_df, compute_ensemble_std=is_final)
            predicted_val = pred_point
            tree_std = step_std
            history_buffer.append(pred_point)
            sim_time = sim_time + timedelta(minutes=15)

        # If horizon > 60m (e.g. 6H or 24H), evaluate target time features directly
        if horizon_minutes > 60:
            target_time = current_time + timedelta(minutes=horizon_minutes)
            feat_df = self.build_feature_vector(target_time, history_buffer)
            predicted_val, tree_std = self._predict_with_uncertainty(feat_df, compute_ensemble_std=True)

        return {
            "forecast_horizon_minutes": horizon_minutes,
            "predicted_consumption_kw": round(float(predicted_val), 3),
            "uncertainty_value": round(float(tree_std), 4) if tree_std is not None else None,
            "uncertainty_metric": "ensemble_tree_std_kw",
            "model": self.model_name,
            "model_version": self.model_version,
            "prediction_target": f"target_{horizon_minutes}m",
            "prediction_timestamp": (current_time + timedelta(minutes=horizon_minutes)).isoformat()
        }

    def _predict_with_uncertainty(self, feature_df: pd.DataFrame, compute_ensemble_std: bool = True) -> tuple[float, Optional[float]]:
        """Calculate prediction and empirical ensemble standard deviation."""
        feature_cols = self.metadata.get("features", FEATURE_NAMES)
        X_df = feature_df[feature_cols]
        
        mean_pred = float(self.model.predict(X_df)[0])
        std_err = None

        if compute_ensemble_std and hasattr(self.model, "estimators_") and len(self.model.estimators_) > 0:
            X_arr = X_df.values
            tree_preds = [tree.predict(X_arr)[0] for tree in self.model.estimators_]
            std_err = float(np.std(tree_preds))

        return max(0.05, round(mean_pred, 4)), round(std_err, 4) if std_err is not None else None

    # Backward compatibility helper for backend services
    def predict_next_hours(
        self,
        household_id: str = "house_a",
        recent_readings: Optional[List[Dict]] = None,
        horizon_hours: int = 6
    ) -> List[Dict]:
        """
        Generate short-term multi-step forecast for the next N hours.
        """
        self._ensure_loaded()
        now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
        
        if recent_readings and len(recent_readings) > 0:
            p_list = [float(r.get("consumption_kw", 1.0)) for r in recent_readings]
        else:
            p_list = [1.2, 1.1, 1.0, 0.9]

        forecasts = []
        for step in range(1, horizon_hours + 1):
            future_time = now + timedelta(hours=step)
            # Predict demand 15m/60m ahead
            res = self.predict_demand(p_list, horizon_minutes=step * 60, current_time=now)
            pred_demand = res["predicted_consumption_kw"]

            # Solar curve for microgrid net balance calculation
            hour = future_time.hour
            solar_factor = max(0.0, math.sin(math.pi * (hour - 6) / 12.0)) if 6 <= hour <= 18 else 0.0
            solar_capacity = 4.0
            pred_gen = round(solar_capacity * solar_factor * 0.90, 3)
            pred_net = round(pred_gen - pred_demand, 3)

            forecasts.append({
                "household_id": household_id,
                "prediction_time": future_time.isoformat(),
                "time_label": future_time.strftime("%H:%M UTC"),
                "horizon": f"{step}h_ahead",
                "horizon_hours": step,
                "predicted_demand_kw": pred_demand,
                "predicted_generation_kw": pred_gen,
                "predicted_net_balance_kw": pred_net,
                "confidence": None,
                "uncertainty_metric": "ensemble_tree_std_kw",
                "uncertainty_value": res.get("uncertainty_value"),
                "model_version": self.model_version,
            })

        return forecasts

    def predict_with_uncertainty(self, feature_df: pd.DataFrame):
        return self._predict_with_uncertainty(feature_df)

def predict_demand(
    recent_history: Union[List[float], Dict, pd.DataFrame],
    horizon_minutes: int = 15,
    current_time: Optional[datetime] = None
) -> Dict:
    """Standalone helper function for quick demand predictions."""
    predictor = DemandPredictor()
    return predictor.predict_demand(recent_history, horizon_minutes=horizon_minutes, current_time=current_time)

if __name__ == "__main__":
    predictor = DemandPredictor()
    sample_history = [1.12, 1.05, 1.34, 1.89, 2.10, 2.45, 2.15, 1.95]

    print(f"\n[*] GridShare Model: {predictor.model_name} (Version: {predictor.model_version})")
    for horiz in [15, 30, 60]:
        out = predictor.predict_demand(sample_history, horizon_minutes=horiz)
        print(f"   -> Horizon {horiz}m Forecast: {json.dumps(out, indent=2)}")
