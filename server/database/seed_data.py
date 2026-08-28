import datetime
import hashlib
import math
from gridshare.backend.app.models import (
    db,
    UserProfile,
    Household,
    EnergyNode,
    EnergyReading,
    Battery,
    BatteryContribution,
    BatteryWithdrawal,
    BatteryLedger,
    EnergyTransaction,
    OptimizationDecision,
    Prediction,
    MarketOffer,
    MarketRequest,
)

# Standard password hash for demo accounts: admin@123
DEMO_PASSWORD_HASH = hashlib.sha256("admin@123".encode()).hexdigest()

def seed_database(clear_existing=True):
    """
    Populates authentic, reproducible seed data for GridShare 4-user community microgrid:
    1. Anjali (Prosumer - High Solar, Surplus Seller)
    2. Prince (Consumer - High Load, Deficit Buyer)
    3. Ayush (Balanced Prosumer - Solar + Storage)
    4. Rahul (Consumer - EV Household with load spikes)
    """
    now = datetime.datetime.now(datetime.timezone.utc)

    if clear_existing:
        db.session.query(BatteryLedger).delete()
        db.session.query(BatteryWithdrawal).delete()
        db.session.query(BatteryContribution).delete()
        db.session.query(MarketRequest).delete()
        db.session.query(MarketOffer).delete()
        db.session.query(OptimizationDecision).delete()
        db.session.query(Prediction).delete()
        db.session.query(EnergyTransaction).delete()
        db.session.query(EnergyReading).delete()
        db.session.query(Battery).delete()
        db.session.query(EnergyNode).delete()
        db.session.query(Household).delete()
        db.session.query(UserProfile).delete()
        db.session.commit()
    else:
        existing_count = db.session.query(Household).count()
        if existing_count >= 4:
            return

    # 0. User Profiles (4 Authentic Community Members)
    profiles = [
        UserProfile(
            user_id="user_anjali_id",
            email="anjali@gridshare.io",
            display_name="Anjali Sharma",
            role="USER",
            default_household_id="house_anjali",
        ),
        UserProfile(
            user_id="user_prince_id",
            email="prince@gridshare.io",
            display_name="Prince Patel",
            role="USER",
            default_household_id="house_prince",
        ),
        UserProfile(
            user_id="user_ayush_id",
            email="ayush@gridshare.io",
            display_name="Ayush Verma",
            role="USER",
            default_household_id="house_ayush",
        ),
        UserProfile(
            user_id="user_rahul_id",
            email="rahul@gridshare.io",
            display_name="Rahul Sharma",
            role="USER",
            default_household_id="house_rahul",
        ),
    ]
    db.session.add_all(profiles)
    db.session.commit()

    # 1. Households (4 Distinct Energy Profiles)
    households = [
        Household(
            id="house_anjali",
            name="Anjali's Home",
            location="Plot 101, Green Enclave (Sub-feeder A)",
            household_type="PROSUMER",
            owner_user_id="user_anjali_id",
            created_at=datetime.datetime(2026, 1, 1, 0, 0, 0, tzinfo=datetime.timezone.utc),
        ),
        Household(
            id="house_prince",
            name="Prince's Home",
            location="Plot 102, Green Enclave (Sub-feeder A)",
            household_type="CONSUMER",
            owner_user_id="user_prince_id",
            created_at=datetime.datetime(2026, 1, 1, 0, 0, 0, tzinfo=datetime.timezone.utc),
        ),
        Household(
            id="house_ayush",
            name="Ayush's Home",
            location="Plot 103, Green Enclave (Sub-feeder B)",
            household_type="PROSUMER",
            owner_user_id="user_ayush_id",
            created_at=datetime.datetime(2026, 1, 1, 0, 0, 0, tzinfo=datetime.timezone.utc),
        ),
        Household(
            id="house_rahul",
            name="Rahul's Home",
            location="Plot 104, Green Enclave (Sub-feeder B)",
            household_type="CONSUMER",
            owner_user_id="user_rahul_id",
            created_at=datetime.datetime(2026, 1, 1, 0, 0, 0, tzinfo=datetime.timezone.utc),
        ),
    ]
    db.session.add_all(households)
    db.session.commit()

    # 1b. Energy Nodes (1 for each household)
    nodes = [
        # Anjali: 6.0 kWp Solar, 2.2 kW Demand -> +4.2 kW Surplus
        EnergyNode(
            id="node_house_anjali",
            household_id="house_anjali",
            node_type="RESIDENTIAL_SOLAR",
            source_type="SIMULATION",
            manual_generation_kw=6.40,
            manual_consumption_kw=2.20,
            status="ONLINE"
        ),
        # Prince: 1.0 kWp Solar, 4.8 kW Demand -> -4.0 kW Deficit
        EnergyNode(
            id="node_house_prince",
            household_id="house_prince",
            node_type="RESIDENTIAL_LOAD",
            source_type="SIMULATION",
            manual_generation_kw=0.80,
            manual_consumption_kw=4.80,
            status="ONLINE"
        ),
        # Ayush: 4.0 kWp Solar, 3.1 kW Demand -> +0.1 kW Balanced
        EnergyNode(
            id="node_house_ayush",
            household_id="house_ayush",
            node_type="RESIDENTIAL_SOLAR",
            source_type="SIMULATION",
            manual_generation_kw=3.20,
            manual_consumption_kw=3.10,
            status="ONLINE"
        ),
        # Rahul: 2.0 kWp Solar, 5.2 kW Demand (EV Charging) -> -3.4 kW Deficit
        EnergyNode(
            id="node_house_rahul",
            household_id="house_rahul",
            node_type="RESIDENTIAL_LOAD",
            source_type="SIMULATION",
            manual_generation_kw=1.80,
            manual_consumption_kw=5.20,
            status="ONLINE"
        ),
    ]
    db.session.add_all(nodes)
    db.session.commit()

    # 2. Community Battery (Central Microgrid Energy Storage System)
    battery = Battery(
        id="community_battery_1",
        community_id="green_enclave_cluster",
        capacity_kwh=50.0,
        current_energy_kwh=25.0,
        current_soc=50.0,  # 50% State of Charge
        round_trip_efficiency=0.90,
        min_reserve=20.0,   # 20% Reserve safety floor
        minimum_reserve_kwh=10.0,
        updated_at=now,
    )
    db.session.add(battery)
    db.session.commit()

    # 2b. Individual Household Battery Ownership Contributions
    contributions = [
        BatteryContribution(
            battery_id="community_battery_1",
            household_id="house_anjali",
            contributed_energy_kwh=10.0,
            usable_energy_kwh=9.0,
            remaining_credit_kwh=9.0,
            status="ACTIVE",
            contribution_timestamp=now - datetime.timedelta(hours=5),
        ),
        BatteryContribution(
            battery_id="community_battery_1",
            household_id="house_prince",
            contributed_energy_kwh=5.0,
            usable_energy_kwh=4.5,
            remaining_credit_kwh=2.5,
            status="ACTIVE",
            contribution_timestamp=now - datetime.timedelta(hours=4),
        ),
        BatteryContribution(
            battery_id="community_battery_1",
            household_id="house_ayush",
            contributed_energy_kwh=8.0,
            usable_energy_kwh=7.2,
            remaining_credit_kwh=6.0,
            status="ACTIVE",
            contribution_timestamp=now - datetime.timedelta(hours=3),
        ),
        BatteryContribution(
            battery_id="community_battery_1",
            household_id="house_rahul",
            contributed_energy_kwh=6.0,
            usable_energy_kwh=5.4,
            remaining_credit_kwh=4.0,
            status="ACTIVE",
            contribution_timestamp=now - datetime.timedelta(hours=2),
        ),
    ]
    db.session.add_all(contributions)
    db.session.commit()

    # 3. Simulated Telemetry (EnergyReading historical time-series for all 4 households)
    readings = []
    for step in range(24, -1, -1):
        ts = now - datetime.timedelta(minutes=step * 15)
        # Diurnal solar multiplier curve
        hour = (ts.hour + ts.minute / 60.0)
        solar_factor = max(0.0, math.sin(math.pi * (hour - 6) / 12)) if 6 <= hour <= 18 else 0.0

        # Anjali: High solar prosumer
        gen_a = round(6.40 * solar_factor + (0.1 if solar_factor > 0 else 0.0), 3)
        con_a = round(2.00 + (0.4 if 18 <= hour <= 22 else 0.1), 3)
        readings.append(EnergyReading(
            household_id="house_anjali",
            timestamp=ts,
            generation_kw=gen_a,
            consumption_kw=con_a,
            battery_soc=round(65.0 + 5.0 * solar_factor, 1),
            grid_price=6.10,
            source="SIMULATED",
        ))

        # Prince: High load consumer
        gen_p = round(1.00 * solar_factor, 3)
        con_p = round(4.50 + (1.2 if 17 <= hour <= 23 else 0.3), 3)
        readings.append(EnergyReading(
            household_id="house_prince",
            timestamp=ts,
            generation_kw=gen_p,
            consumption_kw=con_p,
            battery_soc=35.0,
            grid_price=6.10,
            source="SIMULATED",
        ))

        # Ayush: Balanced prosumer
        gen_ay = round(4.00 * solar_factor, 3)
        con_ay = round(3.00 + 0.2, 3)
        readings.append(EnergyReading(
            household_id="house_ayush",
            timestamp=ts,
            generation_kw=gen_ay,
            consumption_kw=con_ay,
            battery_soc=50.0,
            grid_price=6.10,
            source="SIMULATED",
        ))

        # Rahul: EV household with load spike
        gen_r = round(2.00 * solar_factor, 3)
        con_r = round(2.00 + (3.2 if 19 <= hour <= 23 or step < 4 else 0.2), 3) # Active EV charging
        readings.append(EnergyReading(
            household_id="house_rahul",
            timestamp=ts,
            generation_kw=gen_r,
            consumption_kw=con_r,
            battery_soc=45.0,
            grid_price=6.10,
            source="SIMULATED",
        ))

    db.session.add_all(readings)
    db.session.commit()

    # 4. Open Marketplace Orders (Real database-backed listings)
    offers = [
        # Anjali lists 1.5 kWh surplus solar @ ₹4.50/kWh
        MarketOffer(
            household_id="house_anjali",
            energy_kwh=1.5,
            min_price_per_kwh=4.50,
            remaining_kwh=1.5,
            status="OPEN",
            source="SIMULATED",
            created_at=now - datetime.timedelta(minutes=10),
        ),
        # Ayush lists 0.8 kWh surplus @ ₹4.80/kWh
        MarketOffer(
            household_id="house_ayush",
            energy_kwh=0.8,
            min_price_per_kwh=4.80,
            remaining_kwh=0.8,
            status="OPEN",
            source="SIMULATED",
            created_at=now - datetime.timedelta(minutes=15),
        ),
    ]
    requests = [
        # Prince requests 2.0 kWh for heavy load @ max ₹5.00/kWh
        MarketRequest(
            household_id="house_prince",
            energy_kwh=2.0,
            max_price_per_kwh=5.00,
            remaining_kwh=2.0,
            status="OPEN",
            source="SIMULATED",
            created_at=now - datetime.timedelta(minutes=8),
        ),
        # Rahul requests 1.5 kWh for EV charging @ max ₹4.70/kWh
        MarketRequest(
            household_id="house_rahul",
            energy_kwh=1.5,
            max_price_per_kwh=4.70,
            remaining_kwh=1.5,
            status="OPEN",
            source="SIMULATED",
            created_at=now - datetime.timedelta(minutes=5),
        ),
    ]
    db.session.add_all(offers + requests)
    db.session.commit()

    # 5. Settled Bilateral Transactions Ledger
    transactions = [
        EnergyTransaction(
            seller_household_id="house_anjali",
            buyer_household_id="house_prince",
            energy_kwh=2.0,
            price_per_kwh=4.50,
            total_value=9.00,
            status="SETTLED",
            timestamp=now - datetime.timedelta(minutes=45),
        ),
        EnergyTransaction(
            seller_household_id="house_ayush",
            buyer_household_id="house_rahul",
            energy_kwh=1.2,
            price_per_kwh=4.80,
            total_value=5.76,
            status="SETTLED",
            timestamp=now - datetime.timedelta(minutes=90),
        ),
    ]
    db.session.add_all(transactions)
    db.session.commit()

    print("[SUCCESS] Successfully seeded 4 authentic community users (Anjali, Prince, Ayush, Rahul)!")
