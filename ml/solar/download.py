"""
NLR NSRDB Meteosat IODC Solar Data Downloader for GridShare ML.
Securely downloads empirical satellite solar irradiance for Guwahati, Assam, India.
"""

import os
import sys
import requests
from dotenv import dotenv_values

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
RAW_SOLAR_DIR = os.path.join(ROOT_DIR, "ml", "data", "raw", "meteosat")
os.makedirs(RAW_SOLAR_DIR, exist_ok=True)

NLR_BASE_URL = "https://developer.nlr.gov"
AUTH_TEST_ENDPOINT = f"{NLR_BASE_URL}/api/alt-fuel-stations/v1.json?limit=1"
SOLAR_DOWNLOAD_ENDPOINT = f"{NLR_BASE_URL}/api/nsrdb/v2/solar/msg-iodc-download.csv"

def get_api_key() -> str:
    """Retrieve API key from .env without logging or printing secret."""
    env_path = os.path.join(ROOT_DIR, ".env")
    if not os.path.exists(env_path):
        raise FileNotFoundError(f"Missing .env file at {env_path}")

    env_vars = dotenv_values(env_path)
    api_key = env_vars.get("NRL_URL") or env_vars.get("NLR_API_KEY") or env_vars.get("NREL_API_KEY")
    if not api_key:
        raise ValueError("NLR API key not found in .env (expected NRL_URL or NLR_API_KEY)")
    return api_key

def verify_nlr_authentication(api_key: str) -> dict:
    """Verify basic connectivity and authentication against developer.nlr.gov."""
    print("[*] Verifying NLR API authentication on developer.nlr.gov...")
    headers = {"X-Api-Key": api_key}
    try:
        resp = requests.get(AUTH_TEST_ENDPOINT, headers=headers, timeout=15)
        if resp.status_code == 200:
            print("    [+] NLR API: Authentication verified (HTTP 200, valid JSON response)")
            return {"authenticated": True, "status_code": 200, "category": "SUCCESS"}
        elif resp.status_code in (401, 403):
            print(f"    [-] NLR API: Authentication problem (HTTP {resp.status_code})")
            return {"authenticated": False, "status_code": resp.status_code, "category": "AUTHENTICATION_FAILURE"}
        elif resp.status_code == 429:
            print("    [-] NLR API: Rate limit exceeded (HTTP 429)")
            return {"authenticated": False, "status_code": 429, "category": "RATE_LIMIT"}
        elif resp.status_code >= 500:
            print(f"    [-] NLR API: Server error (HTTP {resp.status_code})")
            return {"authenticated": False, "status_code": resp.status_code, "category": "SERVER_ERROR"}
        else:
            print(f"    [-] NLR API: Unexpected status code (HTTP {resp.status_code})")
            return {"authenticated": False, "status_code": resp.status_code, "category": "ENDPOINT_ERROR"}
    except requests.exceptions.Timeout:
        print("    [-] NLR API: Request timed out")
        return {"authenticated": False, "status_code": None, "category": "TIMEOUT"}
    except requests.exceptions.ConnectionError:
        print("    [-] NLR API: Network connection error")
        return {"authenticated": False, "status_code": None, "category": "CONNECTION_ERROR"}

def download_guwahati_solar_data(
    api_key: str,
    year: str = "2019",
    lat: float = 26.1445,
    lon: float = 91.7362,
    output_filename: str = "meteosat_guwahati_2019.csv"
) -> str:
    """
    Download 15-minute Meteosat IODC solar data for Guwahati, Assam.
    """
    output_path = os.path.join(RAW_SOLAR_DIR, output_filename)
    if os.path.exists(output_path) and os.path.getsize(output_path) > 100000:
        print(f"[*] Raw solar dataset already exists at: {output_path} ({os.path.getsize(output_path):,} bytes)")
        return output_path

    print(f"[*] Requesting Meteosat IODC solar data for Guwahati (lat={lat}, lon={lon}, year={year}, 15m)...")
    headers = {"X-Api-Key": api_key}
    params = {
        "wkt": f"POINT({lon} {lat})",
        "names": year,
        "interval": "15",
        "attributes": "ghi,dni,dhi,air_temperature,relative_humidity,wind_speed",
        "utc": "true",
        "leap_day": "false",
        "email": "gridshare@avinya.local",
        "reason": "academic",
        "affiliation": "Avinya GridShare",
        "mailing_list": "false"
    }

    resp = requests.get(SOLAR_DOWNLOAD_ENDPOINT, headers=headers, params=params, timeout=60)
    if resp.status_code != 200:
        raise RuntimeError(f"Failed to download solar data (HTTP {resp.status_code}): {resp.text[:200]}")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(resp.text)

    size_bytes = os.path.getsize(output_path)
    total_lines = len(resp.text.splitlines())
    print(f"[+] Download complete: Saved raw file to {output_path} ({size_bytes:,} bytes, {total_lines:,} lines)")
    return output_path

def main():
    api_key = get_api_key()
    auth_res = verify_nlr_authentication(api_key)
    if not auth_res["authenticated"]:
        print("[!] Halting solar pipeline: NLR authentication failed.")
        sys.exit(1)

    file_path = download_guwahati_solar_data(api_key, year="2019")
    print(f"[+] Raw solar data ready at: {file_path}")

if __name__ == "__main__":
    main()
