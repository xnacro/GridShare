"""
GridShare ML Feature Engineering Pipeline.
Constructs temporal, cyclical, lag, rolling statistical, and electrical features
with strict zero-leakage guarantees for short-term energy demand forecasting.
"""

import pandas as pd
import numpy as np

FEATURE_NAMES = [
    # Temporal & Calendar
    "hour",
    "minute",
    "day_of_week",
    "day_of_month",
    "month",
    "is_weekend",
    # Cyclical Encodings
    "sin_hour",
    "cos_hour",
    "sin_day_of_week",
    "cos_day_of_week",
    "sin_month",
    "cos_month",
    # Active Power Lags (at 15-min intervals)
    "lag_15m",
    "lag_30m",
    "lag_45m",
    "lag_1h",
    "lag_2h",
    "lag_3h",
    "lag_6h",
    "lag_12h",
    "lag_24h",
    # Rolling Statistics (Strictly backward-looking over active power)
    "rolling_mean_1h",
    "rolling_mean_3h",
    "rolling_std_1h",
    "rolling_mean_6h",
    "rolling_mean_24h",
    # Additional Electrical Sensors (at origin t)
    "lag_15m_reactive_power",
    "lag_15m_voltage",
    "lag_15m_intensity",
    "lag_15m_sub1",
    "lag_15m_sub2",
    "lag_15m_sub3",
]

# Alias for backwards compatibility
FEATURE_COLUMNS = FEATURE_NAMES

def engineer_features(
    df: pd.DataFrame,
    is_training: bool = True,
    target_col: str = "target_15m"
) -> tuple[pd.DataFrame, list[str]]:
    """
    Construct strictly causal, past-only features for time-series forecasting.
    
    Parameters:
        df: Resampled DataFrame (15-minute interval) with 'datetime' and sensor columns.
        is_training: If True, drops initial NaN rows caused by lags and rows with missing target.
        target_col: Prediction target column ('target_15m', 'target_30m', 'target_60m').

    Returns:
        tuple of (featured_dataframe, feature_columns_list)
    """
    df = df.copy()
    if "datetime" in df.columns:
        df["datetime"] = pd.to_datetime(df["datetime"])
        df = df.sort_values("datetime").reset_index(drop=True)
        
        # 1. Temporal features
        df["hour"] = df["datetime"].dt.hour
        df["minute"] = df["datetime"].dt.minute
        df["day_of_week"] = df["datetime"].dt.dayofweek
        df["day_of_month"] = df["datetime"].dt.day
        df["month"] = df["datetime"].dt.month
        df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)

        # 2. Cyclical encodings
        time_fraction = df["hour"] + df["minute"] / 60.0
        df["sin_hour"] = np.sin(2 * np.pi * time_fraction / 24.0)
        df["cos_hour"] = np.cos(2 * np.pi * time_fraction / 24.0)
        df["sin_day_of_week"] = np.sin(2 * np.pi * df["day_of_week"] / 7.0)
        df["cos_day_of_week"] = np.cos(2 * np.pi * df["day_of_week"] / 7.0)
        df["sin_month"] = np.sin(2 * np.pi * df["month"] / 12.0)
        df["cos_month"] = np.cos(2 * np.pi * df["month"] / 12.0)

    # 3. Active Power Lags
    # Observation at current origin t is lag_15m (since target is t + 15m)
    p = df["Global_active_power"]
    df["lag_15m"] = p
    df["lag_30m"] = p.shift(1)
    df["lag_45m"] = p.shift(2)
    df["lag_1h"]  = p.shift(3)
    df["lag_2h"]  = p.shift(7)
    df["lag_3h"]  = p.shift(11)
    df["lag_6h"]  = p.shift(23)
    df["lag_12h"] = p.shift(47)
    df["lag_24h"] = p.shift(95)

    # 4. Rolling Statistics (window includes current observation t and prior observations)
    # window=4 corresponds to 1 hour (4 x 15m)
    df["rolling_mean_1h"]  = p.rolling(window=4, min_periods=2).mean()
    df["rolling_std_1h"]   = p.rolling(window=4, min_periods=2).std().fillna(0.0)
    df["rolling_mean_3h"]  = p.rolling(window=12, min_periods=4).mean()
    df["rolling_mean_6h"]  = p.rolling(window=24, min_periods=8).mean()
    df["rolling_mean_24h"] = p.rolling(window=96, min_periods=24).mean()

    # 5. Additional Electrical Sensors at origin t
    df["lag_15m_reactive_power"] = df["Global_reactive_power"]
    df["lag_15m_voltage"]        = df["Voltage"]
    df["lag_15m_intensity"]      = df["Global_intensity"]
    df["lag_15m_sub1"]           = df["Sub_metering_1"]
    df["lag_15m_sub2"]           = df["Sub_metering_2"]
    df["lag_15m_sub3"]           = df["Sub_metering_3"]

    if is_training:
        # Drop rows where any feature or target is NaN
        cols_to_check = FEATURE_NAMES + [target_col]
        df = df.dropna(subset=cols_to_check).reset_index(drop=True)
    else:
        # For real-time inference, backfill any initial NaN lags with available values
        for col in FEATURE_NAMES:
            if col in df.columns and df[col].isna().any():
                df[col] = df[col].bfill().ffill().fillna(0.0)

    return df, FEATURE_NAMES
