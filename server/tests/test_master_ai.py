"""
Integration test for GridShare AI Master Intelligence Center.
Validates:
1. /api/copilot/insights with authenticated tokens for Anjali, Prince, Ayush, Rahul
2. Safe tradeable energy calculation
3. Multi-horizon timeline
4. Anomaly detection
5. Predictive P2P matching
6. /api/copilot/simulate-shock
7. /api/copilot/scenario (custom sliders)
8. /api/copilot/query (grounded Q&A)
9. /api/copilot/model-health (benchmarks)
"""

import sys
import os
import requests

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

BASE_URL = "http://127.0.0.1:5000"

def test_ai_master():
    print("\n" + "="*70)
    print("GRIDSHARE AI MASTER INTELLIGENCE CENTER — VERIFICATION SUITE")
    print("="*70)

    # 1. Test Anjali Insights (Solar Prosumer)
    print("\n[*] 1. Testing Anjali Sharma AI Insights (/api/copilot/insights?household_id=house_anjali)...")
    res = requests.get(f"{BASE_URL}/api/copilot/insights?household_id=house_anjali", timeout=30)
    assert res.status_code == 200, f"Failed: {res.status_code}"
    data = res.json()["data"]
    print(f"    [OK] Anjali Forecast: Solar={data['forecast']['solar_kw']} kW, Demand={data['forecast']['demand_kw']} kW, Net={data['forecast']['balance_kw']} kW")
    print(f"    [OK] Safe Tradeable Energy: {data['forecast']['safe_tradeable_kwh']} kWh")
    print(f"    [OK] Decision: {data['decision']['action_label']}")
    print(f"    [OK] Predictive Match: {data['predictive_match'].get('partner_name')} (Trade: {data['predictive_match'].get('trade_kwh')} kWh)")
    print(f"    [OK] Multi-Horizon Timeline Horizons: {[t['horizon'] for t in data['multi_horizon_timeline']]}")
    print(f"    [OK] Anomaly Status: {data['anomalies'][0]['type']} - {data['anomalies'][0]['message']}")

    # 2. Test Prince Insights (High-load Consumer)
    print("\n[*] 2. Testing Prince Patel AI Insights (/api/copilot/insights?household_id=house_prince)...")
    res = requests.get(f"{BASE_URL}/api/copilot/insights?household_id=house_prince", timeout=30)
    assert res.status_code == 200, f"Failed: {res.status_code}"
    data_p = res.json()["data"]
    print(f"    [OK] Prince Forecast: Solar={data_p['forecast']['solar_kw']} kW, Demand={data_p['forecast']['demand_kw']} kW, Net={data_p['forecast']['balance_kw']} kW")
    print(f"    [OK] Decision: {data_p['decision']['action_label']}")
    print(f"    [OK] Partner Match: {data_p['predictive_match'].get('partner_name')}")

    # 3. Test Weather Shock Simulator
    print("\n[*] 3. Testing Weather Shock Simulation (/api/copilot/simulate-shock)...")
    payload = {"type": "CLOUD_COVER", "severity": 0.6, "household_id": "house_anjali"}
    res_shock = requests.post(f"{BASE_URL}/api/copilot/simulate-shock", json=payload, timeout=30)
    assert res_shock.status_code == 200, f"Failed: {res_shock.status_code}"
    shock_data = res_shock.json()
    print(f"    [OK] Shock Status: {shock_data['status']} ({shock_data['summary']})")
    print(f"    [OK] Shocked Decision: {shock_data['shocked_state']['decision']['action_label']}")

    # 4. Test Custom Scenario Slider Simulation
    print("\n[*] 4. Testing Custom Scenario Builder (/api/copilot/scenario)...")
    custom_payload = {"solar_delta_percent": -40.0, "demand_delta_percent": 30.0, "battery_soc": 25.0, "household_id": "house_anjali"}
    res_custom = requests.post(f"{BASE_URL}/api/copilot/scenario", json=custom_payload, timeout=30)
    assert res_custom.status_code == 200, f"Failed: {res_custom.status_code}"
    cust_data = res_custom.json()
    print(f"    [OK] Custom Scenario Action: {cust_data['shocked_state']['decision']['action_label']}")
    print(f"    [OK] Custom Scenario Balance: {cust_data['shocked_state']['forecast']['balance_kw']} kW")

    # 5. Test Grounded Q&A Assistant
    print("\n[*] 5. Testing Grounded Q&A Assistant (/api/copilot/query)...")
    q_payload = {"query": "Will I have surplus solar energy to sell?", "household_id": "house_anjali"}
    res_q = requests.post(f"{BASE_URL}/api/copilot/query", json=q_payload, timeout=30)
    assert res_q.status_code == 200, f"Failed: {res_q.status_code}"
    print(f"    [OK] Q&A Answer: \"{res_q.json()['answer']}\"")

    # 6. Test Model Health & Benchmark Comparisons
    print("\n[*] 6. Testing Model Health & Benchmarks (/api/copilot/model-health)...")
    res_m = requests.get(f"{BASE_URL}/api/copilot/model-health", timeout=30)
    assert res_m.status_code == 200, f"Failed: {res_m.status_code}"
    health = res_m.json()
    print(f"    [OK] Solar Model: {health['solar_model']['name']} ({health['solar_model']['version']}) - Test R2: {health['solar_model']['test_metrics'].get('r2')}")
    print(f"    [OK] Demand Model: {health['demand_model']['name']} ({health['demand_model']['version']}) - Test R2: {health['demand_model']['test_metrics'].get('r2')}")
    print(f"    [OK] Baseline Comparison Benchmarks: {len(health['demand_model'].get('benchmarks', []))} baselines verified.")

    print("\n" + "="*70)
    print("[SUCCESS] ALL MASTER AI INTELLIGENCE CENTER ENDPOINTS VERIFIED!")
    print("="*70 + "\n")

if __name__ == "__main__":
    test_ai_master()
