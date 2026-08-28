"""
Solar Preprocessing Pipeline for GridShare ML.
Processes raw NSRDB Meteosat IODC CSV into clean, indexed, multi-horizon resampled
datasets saved to ml/data/processed/solar_guwahati_15m.parquet.
"""

import os
import sys
import argparse
import pandas as pd
import numpy as np

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
RAW_SOLAR_PATH = os.path.join(ROOT_DIR, "ml", "data", "raw", "meteosat", "meteosat_guwahati_2019.csv")
PROCESSED_DIR = os.path.join(ROOT_DIR, "ml", "data", "processed")
os.makedirs(PROCESSED_DIR, exist_ok=True)

COLUMN_MAPPING = {
    "Year": "year",
    "Month": "month",
    "Day": "day",
    "Hour": "hour",
    "Minute": "minute",
    "GHI": "ghi",
    "DNI": "dni",
    "DHI": "dhi",
    "Temperature": "air_temperature",
    "Relative Humidity": "relative_humidity",
    "Wind Speed": "wind_speed"
}

def load_raw_solar_data(raw_path: str = RAW_SOLAR_PATH) -> pd.DataFrame:
    """Load raw NSRDB Meteosat IODC CSV file (skipping 2 header metadata rows)."""
    if not os.path.exists(raw_path):
        raise FileNotFoundError(f"Raw solar dataset not found at: {raw_path}")

    print(f"[*] Loading raw solar data from: {raw_path}")
    df = pd.read_csv(raw_path, skiprows=2)
    df = df.rename(columns=COLUMN_MAPPING)

    # Construct datetime
    df["datetime"] = pd.to_datetime(
        df[["year", "month", "day", "hour", "minute"]].astype(str).agg("-".join, axis=1),
        format="%Y-%m-%d-%H-%M"
    )
    df = df.sort_values("datetime").reset_index(drop=True)
    return df

def preprocess_solar_dataset(
    raw_path: str = RAW_SOLAR_PATH,
    output_dir: str = PROCESSED_DIR
) -> tuple[pd.DataFrame, str]:
    """
    Process raw solar data, construct forward prediction targets, and save artifacts.
    """
    df = load_raw_solar_data(raw_path)

    # Ensure strictly numeric types
    num_cols = ["ghi", "dni", "dhi", "air_temperature", "relative_humidity", "wind_speed"]
    for col in num_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Construct forward prediction targets
    # target_15m_ghi: 1 step ahead (15 min)
    # target_30m_ghi: 2 steps ahead (30 min)
    # target_60m_ghi: 4 steps ahead (60 min)
    df["target_15m_ghi"] = df["ghi"].shift(-1)
    df["target_30m_ghi"] = df["ghi"].shift(-2)
    df["target_60m_ghi"] = df["ghi"].shift(-4)

    # Daytime indicator (irradiance > 0)
    df["is_daytime"] = (df["ghi"] > 0).astype(int)

    # Regime categorization for granular evaluation
    conditions = [
        (df["ghi"] == 0),
        (df["ghi"] > 0) & (df["ghi"] <= 50),
        (df["ghi"] > 50) & (df["ghi"] < 400),
        (df["ghi"] >= 400)
    ]
    choices = ["night", "transition", "cloudy_low", "clear_sky"]
    df["regime"] = np.select(conditions, choices, default="night")

    parquet_path = os.path.join(output_dir, "solar_guwahati_15m.parquet")
    csv_path = os.path.join(output_dir, "solar_guwahati_15m.csv.gz")

    print(f"[*] Saving processed solar dataframe ({df.shape[0]} rows, {df.shape[1]} cols) to:")
    print(f"    - Parquet: {parquet_path}")
    df.to_parquet(parquet_path, index=False)

    print(f"    - CSV.GZ:  {csv_path}")
    df.to_csv(csv_path, index=False, compression="gzip")

    print("[+] Solar preprocessing completed successfully.")
    return df, parquet_path

def load_processed_solar_data() -> pd.DataFrame:
    """Load preprocessed solar data from parquet."""
    parquet_path = os.path.join(PROCESSED_DIR, "solar_guwahati_15m.parquet")
    if os.path.exists(parquet_path):
        return pd.read_parquet(parquet_path)
    df, _ = preprocess_solar_dataset()
    return df

if __name__ == "__main__":
    preprocess_solar_dataset()
