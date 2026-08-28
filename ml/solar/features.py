"""
Causal Feature Engineering Pipeline for Solar Resource Forecasting.
Constructs temporal, cyclical, solar geometry, lag, and meteorological rolling features
with zero target leakage.
"""

import pandas as pd
import numpy as np

SOLAR_FEATURE_NAMES = [
    # Calendar & Solar Geometry
    "hour",
    "minute",
    "day_of_year",
    "month",
    "is_weekend",
    "sin_hour",
    "cos_hour",
    "sin_day_of_year",
    "cos_day_of_year",
    "solar_elevation_proxy",
    # Historical GHI Lags (at 15-min intervals)
    "lag_15m_ghi",
    "lag_30m_ghi",
    "lag_45m_ghi",
    "lag_1h_ghi",
    "lag_2h_ghi",
    "lag_3h_ghi",
    "lag_6h_ghi",
    "lag_24h_ghi",
    # Meteorological Predictors at origin t
    "lag_15m_dni",
    "lag_15m_dhi",
    "lag_15m_temp",
    "lag_15m_humidity",
    "lag_15m_wind",
    # Rolling Statistics over past GHI
    "rolling_mean_1h_ghi",
    "rolling_mean_3h_ghi",
    "rolling_std_1h_ghi",
    "rolling_mean_6h_ghi",
]

def engineer_solar_features(
    df: pd.DataFrame,
    is_training: bool = True,
    target_col: str = "target_15m_ghi"
) -> tuple[pd.DataFrame, list[str]]:
    """
    Construct strictly causal solar resource forecasting features.
    
    Parameters:
        df: Processed 15-min DataFrame with 'datetime', 'ghi', 'dni', 'dhi', 'air_temperature', etc.
        is_training: If True, drops initial NaN lag rows and NaN target rows.
        target_col: Prediction target column ('target_15m_ghi', 'target_30m_ghi', 'target_60m_ghi').

    Returns:
        tuple of (featured_dataframe, feature_columns_list)
    """
    df = df.copy()
    if "datetime" in df.columns:
        df["datetime"] = pd.to_datetime(df["datetime"])
        df = df.sort_values("datetime").reset_index(drop=True)

        # 1. Calendar & Solar Temporal
        df["hour"] = df["datetime"].dt.hour
        df["minute"] = df["datetime"].dt.minute
        df["day_of_year"] = df["datetime"].dt.dayofyear
        df["month"] = df["datetime"].dt.month
        df["is_weekend"] = df["datetime"].dt.dayofweek.isin([5, 6]).astype(int)

        # 2. Cyclical Encodings
        time_fraction = df["hour"] + df["minute"] / 60.0
        df["sin_hour"] = np.sin(2 * np.pi * time_fraction / 24.0)
        df["cos_hour"] = np.cos(2 * np.pi * time_fraction / 24.0)
        df["sin_day_of_year"] = np.sin(2 * np.pi * df["day_of_year"] / 365.25)
        df["cos_day_of_year"] = np.cos(2 * np.pi * df["day_of_year"] / 365.25)

        # 3. Solar Elevation Arc Proxy (Guwahati sunrise ~05:00-05:30 UTC+5:30 / seasonal window)
        # Smooth bell-curve proxy representing theoretical daylight window
        day_arc = np.maximum(0.0, np.sin(np.pi * np.clip(time_fraction - 5.5, 0, 13) / 13.0))
        df["solar_elevation_proxy"] = np.round(day_arc, 4)

    # 4. GHI Lags (observation at origin t is lag_15m_ghi for predicting target t+15m)
    g = df["ghi"]
    df["lag_15m_ghi"] = g
    df["lag_30m_ghi"] = g.shift(1)
    df["lag_45m_ghi"] = g.shift(2)
    df["lag_1h_ghi"]  = g.shift(3)
    df["lag_2h_ghi"]  = g.shift(7)
    df["lag_3h_ghi"]  = g.shift(11)
    df["lag_6h_ghi"]  = g.shift(23)
    df["lag_24h_ghi"] = g.shift(95)

    # 5. Meteorological Predictors at origin t
    df["lag_15m_dni"]      = df["dni"]
    df["lag_15m_dhi"]      = df["dhi"]
    df["lag_15m_temp"]     = df["air_temperature"]
    df["lag_15m_humidity"] = df["relative_humidity"]
    df["lag_15m_wind"]     = df["wind_speed"]

    # 6. Backward-looking Rolling Statistics over GHI
    df["rolling_mean_1h_ghi"] = g.rolling(window=4, min_periods=2).mean()
    df["rolling_std_1h_ghi"]  = g.rolling(window=4, min_periods=2).std().fillna(0.0)
    df["rolling_mean_3h_ghi"] = g.rolling(window=12, min_periods=4).mean()
    df["rolling_mean_6h_ghi"] = g.rolling(window=24, min_periods=8).mean()

    if is_training:
        cols_to_check = SOLAR_FEATURE_NAMES + [target_col]
        df = df.dropna(subset=cols_to_check).reset_index(drop=True)
    else:
        for col in SOLAR_FEATURE_NAMES:
            if col in df.columns and df[col].isna().any():
                df[col] = df[col].bfill().ffill().fillna(0.0)

    return df, SOLAR_FEATURE_NAMES
