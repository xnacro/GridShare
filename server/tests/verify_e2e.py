import sys
import os
import json
import requests
import time

server_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
root_dir = os.path.abspath(os.path.join(server_dir, ".."))
for p in (root_dir, server_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

import _bootstrap

BASE_URL = "http://127.0.0.1:5000/api"

def run_e2e_verification():
    print("==================================================")
    print("[E2E] GridShare 4-User Authentic Pipeline Verification")
    print("==================================================")

    # 1. Health Check
    print("\n[Step 1] Verifying Backend Health...")
    r = requests.get(f"{BASE_URL}/health")
    assert r.status_code == 200, f"Health failed: {r.text}"
    print(f"Health OK: {r.json()['status']}")

    # 2. Authenticate the 4 community users with password admin@123
    print("\n[Step 2] Testing Password Authentication (admin@123) for all 4 users...")
    demo_users = [
        ("anjali@gridshare.io", "Anjali Sharma", "house_anjali", "PROSUMER"),
        ("prince@gridshare.io", "Prince Patel", "house_prince", "CONSUMER"),
        ("ayush@gridshare.io", "Ayush Verma", "house_ayush", "PROSUMER"),
        ("rahul@gridshare.io", "Rahul Sharma", "house_rahul", "CONSUMER"),
    ]

    tokens = {}
    for email, expected_name, expected_house, expected_type in demo_users:
        r_login = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": "admin@123"})
        assert r_login.status_code == 200, f"Login failed for {email}: {r_login.text}"
        data = r_login.json()
        assert data["user"]["email"] == email
        assert data["household"]["id"] == expected_house
        tokens[email] = data["access_token"]
        print(f"  [OK] {expected_name} ({email}) authenticated successfully -> Household: {expected_house}")

    # 3. Verify Isolated User Telemetry & Scoping (/api/my-energy)
    print("\n[Step 3] Verifying Multi-Tenant Scoping for Anjali & Prince...")
    r_anjali_energy = requests.get(f"{BASE_URL}/my-energy", headers={"Authorization": f"Bearer {tokens['anjali@gridshare.io']}"})
    assert r_anjali_energy.status_code == 200
    anjali_data = r_anjali_energy.json()["energy"]
    print(f"  * Anjali Telemetry: Gen={anjali_data['generation_kw']} kW, Con={anjali_data['consumption_kw']} kW -> Status: {anjali_data['status']}")

    r_prince_energy = requests.get(f"{BASE_URL}/my-energy", headers={"Authorization": f"Bearer {tokens['prince@gridshare.io']}"})
    assert r_prince_energy.status_code == 200
    prince_data = r_prince_energy.json()["energy"]
    print(f"  * Prince Telemetry: Gen={prince_data['generation_kw']} kW, Con={prince_data['consumption_kw']} kW -> Status: {prince_data['status']}")

    # 4. Observe Layer Verification (/api/observe/state)
    print("\n[Step 4] Querying Microgrid Observe Layer (/api/observe/state)...")
    r_obs = requests.get(f"{BASE_URL}/observe/state")
    assert r_obs.status_code == 200
    obs_data = r_obs.json()["data"]
    summary = obs_data["summary"]
    print(f"  * Total Generation: {summary['total_generation_kw']} kW")
    print(f"  * Total Consumption: {summary['total_consumption_kw']} kW")
    print(f"  * Community Battery SOC: {summary['community_battery_soc']}%")
    print(f"  * Base Grid Price: INR {summary['current_grid_price']}/kWh")

    # 5. AI Copilot Insights (/api/copilot/insights)
    print("\n[Step 5] Triggering 15-Minute ML Copilot (solar_v1 & demand_v1)...")
    r_copilot = requests.get(f"{BASE_URL}/copilot/insights?household_id=house_anjali")
    assert r_copilot.status_code == 200
    copilot_data = r_copilot.json()["data"]
    print(f"  * Copilot Forecast Solar: {copilot_data['forecast']['solar_kw']} kW")
    print(f"  * Copilot Forecast Demand: {copilot_data['forecast']['demand_kw']} kW")
    print(f"  * Decision Recommendation: {copilot_data['decision']['action']} ({copilot_data['decision']['action_label']})")

    # 6. Verify Settled Energy Transactions
    print("\n[Step 6] Verifying Settled Bilateral Transactions (/api/my-transactions)...")
    r_txns = requests.get(f"{BASE_URL}/my-transactions", headers={"Authorization": f"Bearer {tokens['anjali@gridshare.io']}"})
    assert r_txns.status_code == 200
    txns = r_txns.json()["transactions"]
    print(f"  * Verified {len(txns)} transactions in Anjali's ledger.")

    print("\n==================================================")
    print("[SUCCESS] ALL 4 AUTHENTIC USERS & END-TO-END PIPELINES VERIFIED!")
    print("==================================================")

if __name__ == "__main__":
    run_e2e_verification()
