"""
GridShare ML Preprocessing Pipeline.
Processes raw 1-minute household power consumption telemetry into clean,
multi-resolution resampled datasets (15m, 30m, 60m) with strict gap management.
"""

import os
import sys
import argparse
import pandas as pd
import numpy as np

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
RAW_DATA_PATH = os.path.join(
    ROOT_DIR,
    "datasets",
    "individual+household+electric+power+consumption",
    "household_power_consumption.txt"
)
PROCESSED_DIR = os.path.join(ROOT_DIR, "ml", "data", "processed")
os.makedirs(PROCESSED_DIR, exist_ok=True)

NUMERIC_COLUMNS = [
    "Global_active_power",
    "Global_reactive_power",
    "Voltage",
    "Global_intensity",
    "Sub_metering_1",
    "Sub_metering_2",
    "Sub_metering_3"
]

def load_raw_dataset(raw_path: str = RAW_DATA_PATH) -> pd.DataFrame:
    """Load raw dataset with na_values='?' without modifying source file."""
    if not os.path.exists(raw_path):
        raise FileNotFoundError(f"Raw dataset not found at: {raw_path}")

    print(f"[*] Loading raw dataset from: {raw_path}")
    df = pd.read_csv(raw_path, sep=";", low_memory=False, na_values=["?"])
    
    # Parse timestamps
    print("[*] Parsing datetime and sorting chronologically...")
    df["datetime"] = pd.to_datetime(df["Date"] + " " + df["Time"], format="%d/%m/%Y %H:%M:%S", errors="coerce")
    df = df.sort_values("datetime").reset_index(drop=True)

    for col in NUMERIC_COLUMNS:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    return df

def handle_missing_and_gaps(df: pd.DataFrame, max_interpolation_gap_mins: int = 120) -> pd.DataFrame:
    """
    Handle missing values:
    - Linear interpolation for gaps <= max_interpolation_gap_mins (e.g. 2 hours).
    - Preserves longer gaps as NaN to avoid invalid interpolation over prolonged blackouts.
    """
    print(f"[*] Applying quality filter & gap-aware interpolation (limit={max_interpolation_gap_mins} mins)...")
    df = df.set_index("datetime")

    # Interpolate only up to max_interpolation_gap_mins
    df_interpolated = df[NUMERIC_COLUMNS].interpolate(method="time", limit=max_interpolation_gap_mins)
    return df_interpolated

def resample_telemetry(
    df: pd.DataFrame,
    freq: str = "15min"
) -> pd.DataFrame:
    """
    Resample time-series to specified frequency ('15min', '30min', '60min').
    - Power/Voltage/Intensity: mean
    - Sub-meterings: sum (total Wh consumed in the period) and mean (rate)
    """
    print(f"[*] Resampling dataset to resolution: {freq}...")
    
    agg_rules = {
        "Global_active_power": "mean",
        "Global_reactive_power": "mean",
        "Voltage": "mean",
        "Global_intensity": "mean",
        "Sub_metering_1": "sum",
        "Sub_metering_2": "sum",
        "Sub_metering_3": "sum",
    }

    resampled = df.resample(freq).agg(agg_rules)

    # Sub-metering remainder (active energy in interval minus sum of submeterings)
    # Energy in Wh for interval: active_power_mean (kW) * 1000 * (interval_mins / 60)
    interval_minutes = int(pd.to_timedelta(freq).total_seconds() / 60)
    resampled["active_energy_wh"] = (resampled["Global_active_power"] * 1000) * (interval_minutes / 60.0)
    resampled["sub_metering_remainder_wh"] = (
        resampled["active_energy_wh"] - (resampled["Sub_metering_1"] + resampled["Sub_metering_2"] + resampled["Sub_metering_3"])
    ).clip(lower=0.0)

    # Create forward prediction targets
    # target_15m: 1 step ahead for 15min resolution
    # target_30m: 2 steps ahead for 15min, 1 step ahead for 30min
    # target_60m: 4 steps ahead for 15min, 2 steps for 30min, 1 step for 60min
    if freq == "15min":
        resampled["target_15m"] = resampled["Global_active_power"].shift(-1)
        resampled["target_30m"] = resampled["Global_active_power"].shift(-2)
        resampled["target_60m"] = resampled["Global_active_power"].shift(-4)
    elif freq == "30min":
        resampled["target_30m"] = resampled["Global_active_power"].shift(-1)
        resampled["target_60m"] = resampled["Global_active_power"].shift(-2)
    elif freq in ("60min", "1h"):
        resampled["target_60m"] = resampled["Global_active_power"].shift(-1)

    resampled = resampled.reset_index()
    return resampled

def preprocess_dataset(
    raw_path: str = RAW_DATA_PATH,
    freq: str = "15min",
    output_dir: str = PROCESSED_DIR
) -> tuple[pd.DataFrame, str]:
    """Execute complete preprocessing pipeline and save artifacts."""
    df_raw = load_raw_dataset(raw_path)
    df_clean = handle_missing_and_gaps(df_raw, max_interpolation_gap_mins=120)
    df_resampled = resample_telemetry(df_clean, freq=freq)

    freq_clean = freq.replace("min", "m").replace("h", "h")
    parquet_filename = f"household_power_{freq_clean}.parquet"
    csv_filename = f"household_power_{freq_clean}.csv.gz"
    
    parquet_path = os.path.join(output_dir, parquet_filename)
    csv_path = os.path.join(output_dir, csv_filename)

    print(f"[*] Saving processed dataframe ({df_resampled.shape[0]} rows, {df_resampled.shape[1]} cols) to:")
    print(f"    - Parquet: {parquet_path}")
    df_resampled.to_parquet(parquet_path, index=False)
    
    print(f"    - CSV.GZ:  {csv_path}")
    df_resampled.to_csv(csv_path, index=False, compression="gzip")

    print("[+] Preprocessing pipeline completed successfully.")
    return df_resampled, parquet_path

def load_processed_data(freq: str = "15min") -> pd.DataFrame:
    """Load preprocessed dataset, running preprocessing if not already present."""
    freq_clean = freq.replace("min", "m").replace("h", "h")
    parquet_path = os.path.join(PROCESSED_DIR, f"household_power_{freq_clean}.parquet")
    if os.path.exists(parquet_path):
        return pd.read_parquet(parquet_path)
    df, _ = preprocess_dataset(freq=freq)
    return df

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GridShare Preprocessing Pipeline")
    parser.add_argument("--freq", type=str, default="15min", help="Resampling frequency (e.g. 15min, 30min, 60min)")
    args = parser.parse_args()
    preprocess_dataset(freq=args.freq)
