"""
GridShare ML Solar Resource Forecasting & PV Estimation Engine.
Loads versioned solar_v1 model artifact and provides clean, decoupled prediction interfaces:
- Single-step and multi-horizon irradiance predictions (15m, 30m, 60m)
- Empirical prediction intervals (lower_ghi, upper_ghi) derived from ensemble spread
- Explicit, configurable PV output estimation layer with documented physical assumptions
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

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from ml.solar.features import SOLAR_FEATURE_NAMES

DEFAULT_SOLAR_MODEL_PATH = os.path.join(ROOT_DIR, "ml", "models", "solar_v1.joblib")
DEFAULT_SOLAR_META_PATH = os.path.join(ROOT_DIR, "ml", "models", "solar_metadata.json")

class SolarPredictor:
    """
    Decoupled Solar Resource Forecaster for GridShare microgrid coordination.
    """
    def __init__(
        self,
        model_path: str = DEFAULT_SOLAR_MODEL_PATH,
        meta_path: str = DEFAULT_SOLAR_META_PATH
    ):
        self.model_path = model_path
        self.meta_path = meta_path
        self.model = None
        self.metadata = {}
        self._ensure_loaded()

    def _ensure_loaded(self):
        """Ensure trained model artifact and metadata are loaded into memory."""
        if not os.path.exists(self.model_path):
            print("[*] Solar model artifact not found. Triggering automated training pipeline...")
            from ml.solar.train import train_and_evaluate_solar
            self.model, self.metadata = train_and_evaluate_solar()
        else:
            self.model = joblib.load(self.model_path)
            if os.path.exists(self.meta_path):
                with open(self.meta_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)

    @property
    def model_version(self) -> str:
        return self.metadata.get("model_version", "solar_v1")

    @property
    def model_name(self) -> str:
        return self.metadata.get("model_name", "Random Forest Regressor")

    def build_feature_vector(
        self,
        current_time: datetime,
        recent_ghi: List[float],
        dni: float = 0.0,
        dhi: float = 0.0,
        temp: float = 25.0,
        humidity: float = 65.0,
        wind: float = 1.5
    ) -> pd.DataFrame:
        """
        Construct a valid 27-feature vector from recent 15-minute observations.
        """
        if len(recent_ghi) == 0:
            recent_ghi = [0.0] * 96
        elif len(recent_ghi) < 96:
            pad = [recent_ghi[0]] * (96 - len(recent_ghi))
            recent_ghi = pad + list(recent_ghi)

        g = np.array(recent_ghi, dtype=np.float64)

        hour = current_time.hour
        minute = (current_time.minute // 15) * 15
        day_of_year = current_time.timetuple().tm_yday
        month = current_time.month
        is_weekend = 1 if current_time.weekday() in (5, 6) else 0

        time_fraction = hour + minute / 60.0
        sin_hour = math.sin(2 * math.pi * time_fraction / 24.0)
        cos_hour = math.cos(2 * math.pi * time_fraction / 24.0)
        sin_doy = math.sin(2 * math.pi * day_of_year / 365.25)
        cos_doy = math.cos(2 * math.pi * day_of_year / 365.25)

        solar_elevation_proxy = max(0.0, math.sin(math.pi * np.clip(time_fraction - 5.5, 0, 13) / 13.0))

        row_dict = {
            "hour": hour,
            "minute": minute,
            "day_of_year": day_of_year,
            "month": month,
            "is_weekend": is_weekend,
            "sin_hour": sin_hour,
            "cos_hour": cos_hour,
            "sin_day_of_year": sin_doy,
            "cos_day_of_year": cos_doy,
            "solar_elevation_proxy": round(solar_elevation_proxy, 4),
            "lag_15m_ghi": float(g[-1]),
            "lag_30m_ghi": float(g[-2]),
            "lag_45m_ghi": float(g[-3]),
            "lag_1h_ghi":  float(g[-4]),
            "lag_2h_ghi":  float(g[-8]),
            "lag_3h_ghi":  float(g[-12]),
            "lag_6h_ghi":  float(g[-24]),
            "lag_24h_ghi": float(g[-96]),
            "lag_15m_dni": dni,
            "lag_15m_dhi": dhi,
            "lag_15m_temp": temp,
            "lag_15m_humidity": humidity,
            "lag_15m_wind": wind,
            "rolling_mean_1h_ghi": float(np.mean(g[-4:])),
            "rolling_mean_3h_ghi": float(np.mean(g[-12:])),
            "rolling_std_1h_ghi":  float(np.std(g[-4:])),
            "rolling_mean_6h_ghi": float(np.mean(g[-24:])),
        }

        feature_cols = self.metadata.get("features", SOLAR_FEATURE_NAMES)
        df_row = pd.DataFrame([row_dict])[feature_cols]
        return df_row

    def predict_solar(
        self,
        recent_history: Union[List[float], Dict, pd.DataFrame],
        horizon_minutes: int = 15,
        current_time: Optional[datetime] = None,
        installed_kwp: float = 4.0,
        efficiency: float = 0.18,
        loss_factor: float = 0.86
    ) -> Dict:
        """
        Primary solar prediction interface with explicit PV conversion estimation layer.
        """
        self._ensure_loaded()
        if current_time is None:
            current_time = datetime.now(timezone.utc)

        # Parse recent GHI readings
        if isinstance(recent_history, (list, tuple)):
            if len(recent_history) > 0 and isinstance(recent_history[0], dict):
                g_list = [float(r.get("ghi", r.get("GHI", 0.0))) for r in recent_history]
            else:
                g_list = [float(x) for x in recent_history]
        elif isinstance(recent_history, pd.DataFrame):
            col = "ghi" if "ghi" in recent_history.columns else ("GHI" if "GHI" in recent_history.columns else recent_history.columns[0])
            g_list = recent_history[col].dropna().tolist()
        else:
            g_list = [0.0]

        steps_needed = min(4, max(1, horizon_minutes // 15))
        history_buffer = list(g_list)
        sim_time = current_time

        predicted_ghi = float(g_list[-1]) if g_list else 0.0
        tree_std = None

        for step in range(1, steps_needed + 1):
            feat_df = self.build_feature_vector(sim_time, history_buffer)
            is_final = (step == steps_needed)
            pred_point, step_std = self._predict_with_uncertainty(feat_df, compute_ensemble_std=is_final)
            predicted_ghi = pred_point
            tree_std = step_std
            history_buffer.append(pred_point)
            sim_time = sim_time + timedelta(minutes=15)

        # If horizon > 60m (e.g. 6H or 24H), evaluate target time features directly
        if horizon_minutes > 60:
            target_time = current_time + timedelta(minutes=horizon_minutes)
            feat_df = self.build_feature_vector(target_time, history_buffer)
            predicted_ghi, tree_std = self._predict_with_uncertainty(feat_df, compute_ensemble_std=True)

        # Solar geometry night zero clamp (if solar elevation is 0, clamp to 0)
        target_time = current_time + timedelta(minutes=horizon_minutes)
        t_frac = target_time.hour + target_time.minute / 60.0
        elev = max(0.0, math.sin(math.pi * np.clip(t_frac - 5.5, 0, 13) / 13.0))
        if elev == 0.0:
            predicted_ghi = 0.0
            lower_ghi = 0.0
            upper_ghi = 0.0
        else:
            sigma = tree_std if tree_std is not None else 15.0
            lower_ghi = max(0.0, round(predicted_ghi - 1.96 * sigma, 1))
            upper_ghi = max(0.0, round(predicted_ghi + 1.96 * sigma, 1))

        # PV Output Estimation Layer (Explicit Simplified Conversion)
        # kW = (GHI / 1000) * Capacity_kWp * Efficiency * LossFactor
        estimated_pv_kw = round((predicted_ghi / 1000.0) * installed_kwp * efficiency * loss_factor, 3)

        return {
            "forecast_horizon_minutes": horizon_minutes,
            "predicted_ghi": round(float(predicted_ghi), 1),
            "lower_ghi": lower_ghi,
            "upper_ghi": upper_ghi,
            "uncertainty_metric": "ensemble_tree_std_w_m2",
            "uncertainty_value": round(float(tree_std), 2) if tree_std is not None else None,
            "estimated_pv_kw": estimated_pv_kw,
            "pv_conversion_assumptions": {
                "installed_kwp": installed_kwp,
                "module_efficiency": efficiency,
                "system_loss_factor": loss_factor,
                "note": "Estimated conversion proxy, not measured rooftop PV telemetry"
            },
            "model": self.model_name,
            "model_version": self.model_version,
            "location": "Guwahati, Assam, India",
            "target": f"target_{horizon_minutes}m_ghi",
            "target_unit": "W/m²",
            "prediction_timestamp": target_time.isoformat()
        }

    def _predict_with_uncertainty(self, feature_df: pd.DataFrame, compute_ensemble_std: bool = True) -> tuple[float, Optional[float]]:
        feature_cols = self.metadata.get("features", SOLAR_FEATURE_NAMES)
        X_df = feature_df[feature_cols]

        mean_pred = float(self.model.predict(X_df)[0])
        std_err = None

        if compute_ensemble_std and hasattr(self.model, "estimators_") and len(self.model.estimators_) > 0:
            X_arr = X_df.values
            tree_preds = [tree.predict(X_arr)[0] for tree in self.model.estimators_]
            std_err = float(np.std(tree_preds))

        return max(0.0, round(mean_pred, 2)), round(std_err, 2) if std_err is not None else None

def predict_solar(
    recent_history: Union[List[float], Dict, pd.DataFrame],
    horizon_minutes: int = 15,
    current_time: Optional[datetime] = None,
    installed_kwp: float = 4.0,
    efficiency: float = 0.18,
    loss_factor: float = 0.86
) -> Dict:
    """Standalone prediction helper for solar resource and PV estimation."""
    predictor = SolarPredictor()
    return predictor.predict_solar(
        recent_history=recent_history,
        horizon_minutes=horizon_minutes,
        current_time=current_time,
        installed_kwp=installed_kwp,
        efficiency=efficiency,
        loss_factor=loss_factor
    )

if __name__ == "__main__":
    predictor = SolarPredictor()
    midday_history = [350.0, 420.0, 510.0, 580.0, 640.0, 710.0]
    noon_time = datetime(2026, 8, 28, 12, 0, 0, tzinfo=timezone.utc)

    print(f"\n[*] GridShare Solar Model: {predictor.model_name} (Version: {predictor.model_version})")
    for h in [15, 30, 60]:
        res = predictor.predict_solar(midday_history, horizon_minutes=h, current_time=noon_time)
        print(f"   -> Horizon {h}m Forecast:\n{json.dumps(res, indent=2)}")
