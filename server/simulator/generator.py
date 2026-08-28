"""
Energy Telemetry Generator.
Generates realistic simulated energy readings across community households.
Notice: All records are strictly synthetic and tagged with source='SIMULATED'.
"""

import math
import random
from datetime import datetime, timezone

HOUSEHOLD_PROFILES = {
    "house_anjali": {
        "name": "Anjali's Home",
        "type": "PROSUMER",
        "solar_capacity_kw": 6.0,
        "base_load_kw": 1.8,
        "peak_load_kw": 2.5,
        "has_battery": True,
        "base_battery_soc": 65.0,
    },
    "house_prince": {
        "name": "Prince's Home",
        "type": "CONSUMER",
        "solar_capacity_kw": 1.0,
        "base_load_kw": 3.8,
        "peak_load_kw": 5.5,
        "has_battery": True,
        "base_battery_soc": 35.0,
    },
    "house_ayush": {
        "name": "Ayush's Home",
        "type": "PROSUMER",
        "solar_capacity_kw": 4.0,
        "base_load_kw": 2.5,
        "peak_load_kw": 3.4,
        "has_battery": True,
        "base_battery_soc": 50.0,
    },
    "house_rahul": {
        "name": "Rahul's Home",
        "type": "CONSUMER",
        "solar_capacity_kw": 2.0,
        "base_load_kw": 2.0,
        "peak_load_kw": 5.2, # EV spike
        "has_battery": True,
        "base_battery_soc": 45.0,
    },
}

class TelemetryGenerator:
    def __init__(self, base_price=6.10):
        self.base_price = base_price

    def generate_demo_scenario(self):
        """
        Deterministic Scenario for 4 authentic community users:
        - Anjali: Gen=6.4kW, Con=2.2kW, Surplus=+4.2kW, Battery=65%
        - Prince: Gen=0.8kW, Con=4.8kW, Deficit=-4.0kW, Battery=35%
        - Ayush: Gen=3.2kW, Con=3.1kW, Balance=+0.1kW, Battery=50%
        - Rahul: Gen=1.8kW, Con=5.2kW (EV), Deficit=-3.4kW, Battery=45%
        - Community Battery: SOC=50%
        - Grid Price: ₹6.10/kWh
        """
        now = datetime.now(timezone.utc).isoformat()
        return [
            {
                "household_id": "house_anjali",
                "household_name": HOUSEHOLD_PROFILES["house_anjali"]["name"],
                "household_type": "PROSUMER",
                "timestamp": now,
                "generation_kw": 6.40,
                "consumption_kw": 2.20,
                "net_balance_kw": 4.20,
                "battery_soc": 65.0,
                "grid_price": self.base_price,
                "source": "SIMULATED",
            },
            {
                "household_id": "house_prince",
                "household_name": HOUSEHOLD_PROFILES["house_prince"]["name"],
                "household_type": "CONSUMER",
                "timestamp": now,
                "generation_kw": 0.80,
                "consumption_kw": 4.80,
                "net_balance_kw": -4.00,
                "battery_soc": 35.0,
                "grid_price": self.base_price,
                "source": "SIMULATED",
            },
            {
                "household_id": "house_ayush",
                "household_name": HOUSEHOLD_PROFILES["house_ayush"]["name"],
                "household_type": "PROSUMER",
                "timestamp": now,
                "generation_kw": 3.20,
                "consumption_kw": 3.10,
                "net_balance_kw": 0.10,
                "battery_soc": 50.0,
                "grid_price": self.base_price,
                "source": "SIMULATED",
            },
            {
                "household_id": "house_rahul",
                "household_name": HOUSEHOLD_PROFILES["house_rahul"]["name"],
                "household_type": "CONSUMER",
                "timestamp": now,
                "generation_kw": 1.80,
                "consumption_kw": 5.20,
                "net_balance_kw": -3.40,
                "battery_soc": 45.0,
                "grid_price": self.base_price,
                "source": "SIMULATED",
            },
        ]

    # Alias for backward compatibility
    generate_ppt_scenario = generate_demo_scenario

    def generate_single_reading(self, household_id, timestamp=None, solar_multiplier=1.0, cloud_factor=1.0):
        prof = HOUSEHOLD_PROFILES.get(household_id, HOUSEHOLD_PROFILES["house_anjali"])
        now = timestamp or datetime.now(timezone.utc)
        hour = now.hour + now.minute / 60.0

        # Diurnal Solar Profile
        if 6 <= hour <= 18:
            solar_peak_ratio = math.sin(math.pi * (hour - 6) / 12)
            gen = prof["solar_capacity_kw"] * solar_peak_ratio * solar_multiplier * cloud_factor
            gen += random.uniform(-0.05, 0.05) * prof["solar_capacity_kw"]
            gen = max(0.0, gen)
        else:
            gen = 0.0

        # Load Profile with Morning (7-9) and Evening (18-22) Peaks
        base = prof["base_load_kw"]
        peak = prof["peak_load_kw"]
        if 7 <= hour <= 9:
            load = base + (peak - base) * 0.7 + random.uniform(-0.2, 0.2)
        elif 18 <= hour <= 22:
            load = peak + random.uniform(-0.3, 0.3)
        else:
            load = base + random.uniform(-0.1, 0.2)
        load = max(0.2, load)

        # Battery Simulation
        soc = prof["base_battery_soc"]
        if soc is not None:
            net = gen - load
            soc += (net / 20.0) * 10.0
            soc = max(10.0, min(100.0, soc))

        return {
            "household_id": household_id,
            "household_name": prof["name"],
            "household_type": prof["type"],
            "timestamp": now.isoformat(),
            "generation_kw": round(gen, 3),
            "consumption_kw": round(load, 3),
            "net_balance_kw": round(gen - load, 3),
            "battery_soc": round(soc, 1) if soc is not None else None,
            "grid_price": self.base_price,
            "source": "SIMULATED",
        }
