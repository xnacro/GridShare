import datetime
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

def seed_database(clear_existing=False):
    """
    Populates deterministic reproducible seed data for GridShare microgrid.
    Includes PPT scenario & Community Battery Ownership accounting.
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
        if existing_count > 0:
            return

    # 0. User Profiles (Demo Accounts)
    profiles = [
        UserProfile(
            user_id="demo_user_a_id",
            email="house_a@gridshare.io",
            display_name="House A (Solar Champion)",
            role="USER",
            default_household_id="house_a",
        ),
        UserProfile(
            user_id="demo_user_b_id",
            email="house_b@gridshare.io",
            display_name="House B (EV Charger)",
            role="USER",
            default_household_id="house_b",
        ),
        UserProfile(
            user_id="demo_user_c_id",
            email="house_c@gridshare.io",
            display_name="House C (Prosumer)",
            role="USER",
            default_household_id="house_c",
        ),
    ]
    db.session.add_all(profiles)
    db.session.commit()

    # 1. Households (5 community members)
    households = [
        Household(
            id="house_a",
            name="House A (Solar Champion - 8kW)",
            location="Plot 101, Green Enclave",
            household_type="PROSUMER",
            owner_user_id="demo_user_a_id",
            created_at=datetime.datetime(2026, 1, 1, 0, 0, 0),
        ),
        Household(
            id="house_b",
            name="House B (Heavy Consumer / EV)",
            location="Plot 102, Green Enclave",
            household_type="CONSUMER",
            owner_user_id="demo_user_b_id",
            created_at=datetime.datetime(2026, 1, 1, 0, 0, 0),
        ),
        Household(
            id="house_c",
            name="House C (Balanced Prosumer - 4kW)",
            location="Plot 103, Green Enclave",
            household_type="PROSUMER",
            owner_user_id="demo_user_c_id",
            created_at=datetime.datetime(2026, 1, 1, 0, 0, 0),
        ),
        Household(
            id="house_d",
            name="House D (Smart Apartment)",
            location="Plot 104, Green Enclave",
            household_type="CONSUMER",
            created_at=datetime.datetime(2026, 1, 1, 0, 0, 0),
        ),
        Household(
            id="house_e",
            name="House E (Solar Villa - 6kW)",
            location="Plot 105, Green Enclave",
            household_type="PROSUMER",
            created_at=datetime.datetime(2026, 1, 1, 0, 0, 0),
        ),
    ]
    db.session.add_all(households)
    db.session.commit()

    # 1b. Energy Nodes (1 for each household)
    nodes = [
        EnergyNode(id="node_house_a", household_id="house_a", node_type="RESIDENTIAL_SOLAR", source_type="SIMULATION", manual_generation_kw=6.8, manual_consumption_kw=2.1),
        EnergyNode(id="node_house_b", household_id="house_b", node_type="RESIDENTIAL_LOAD", source_type="SIMULATION", manual_generation_kw=1.2, manual_consumption_kw=4.0),
        EnergyNode(id="node_house_c", household_id="house_c", node_type="RESIDENTIAL_SOLAR", source_type="SIMULATION", manual_generation_kw=3.5, manual_consumption_kw=2.5),
        EnergyNode(id="node_house_d", household_id="house_d", node_type="RESIDENTIAL_LOAD", source_type="SIMULATION", manual_generation_kw=0.5, manual_consumption_kw=3.0),
        EnergyNode(id="node_house_e", household_id="house_e", node_type="RESIDENTIAL_SOLAR", source_type="SIMULATION", manual_generation_kw=5.0, manual_consumption_kw=1.8),
    ]
    db.session.add_all(nodes)
    db.session.commit()

    # 2. Community Battery (Central Energy Storage System)
    battery = Battery(
        id="community_battery_1",
        community_id="green_enclave_cluster",
        capacity_kwh=50.0,
        current_energy_kwh=20.0,
        current_soc=40.0,  # PPT Demo baseline: 40%
        round_trip_efficiency=0.90,
        min_reserve=20.0,   # PPT Demo baseline: 20%
        minimum_reserve_kwh=10.0,
        updated_at=now,
    )
    db.session.add(battery)
    db.session.commit()

    # 2b. Seed Household Energy Contributions (Ownership Tracking)
    contributions = [
        BatteryContribution(
            battery_id="community_battery_1",
            household_id="house_a",
            contributed_energy_kwh=10.0,
            usable_energy_kwh=9.0,
            remaining_credit_kwh=9.0,
            contribution_timestamp=now - datetime.timedelta(hours=2),
            status="ACTIVE",
        ),
        BatteryContribution(
            battery_id="community_battery_1",
            household_id="house_b",
            contributed_energy_kwh=1.0,
            usable_energy_kwh=0.9,
            remaining_credit_kwh=0.9,
            contribution_timestamp=now - datetime.timedelta(hours=1),
            status="ACTIVE",
        ),
        BatteryContribution(
            battery_id="community_battery_1",
            household_id="house_e",
            contributed_energy_kwh=5.0,
            usable_energy_kwh=4.5,
            remaining_credit_kwh=4.5,
            contribution_timestamp=now - datetime.timedelta(minutes=30),
            status="ACTIVE",
        ),
    ]
    db.session.add_all(contributions)

    # 2c. Seed Initial Battery Ledger Records
    ledger_records = [
        BatteryLedger(
            battery_id="community_battery_1",
            household_id="house_a",
            action_type="CONTRIBUTION",
            energy_kwh=10.0,
            usable_kwh=9.0,
            balance_after_kwh=10.0,
            soc_after_percent=20.0,
            economic_value_inr=54.90,
            policy_applied="PROPORTIONAL_OWNERSHIP",
            reason="House A midday solar surplus injection (10 kWh @ 90% efficiency = 9.0 kWh usable credit).",
            timestamp=now - datetime.timedelta(hours=2),
        ),
        BatteryLedger(
            battery_id="community_battery_1",
            household_id="house_b",
            action_type="CONTRIBUTION",
            energy_kwh=1.0,
            usable_kwh=0.9,
            balance_after_kwh=11.0,
            soc_after_percent=22.0,
            economic_value_inr=5.49,
            policy_applied="PROPORTIONAL_OWNERSHIP",
            reason="House B EV offload contribution (1.0 kWh @ 90% efficiency = 0.9 kWh usable credit).",
            timestamp=now - datetime.timedelta(hours=1),
        ),
        BatteryLedger(
            battery_id="community_battery_1",
            household_id="house_e",
            action_type="CONTRIBUTION",
            energy_kwh=5.0,
            usable_kwh=4.5,
            balance_after_kwh=16.0,
            soc_after_percent=32.0,
            economic_value_inr=27.45,
            policy_applied="PROPORTIONAL_OWNERSHIP",
            reason="House E solar villa contribution (5.0 kWh @ 90% efficiency = 4.5 kWh usable credit).",
            timestamp=now - datetime.timedelta(minutes=30),
        ),
    ]
    db.session.add_all(ledger_records)

    # 3. Deterministic PPT Demo Live Telemetry Readings
    demo_readings = [
        EnergyReading(
            household_id="house_a",
            timestamp=now,
            generation_kw=6.80,
            consumption_kw=2.10,
            battery_soc=85.0,
            grid_price=6.10,
            source="SIMULATED",
        ),
        EnergyReading(
            household_id="house_b",
            timestamp=now,
            generation_kw=1.20,
            consumption_kw=4.00,
            battery_soc=None,
            grid_price=6.10,
            source="SIMULATED",
        ),
        EnergyReading(
            household_id="house_c",
            timestamp=now,
            generation_kw=3.50,
            consumption_kw=2.20,
            battery_soc=50.0,
            grid_price=6.10,
            source="SIMULATED",
        ),
        EnergyReading(
            household_id="house_d",
            timestamp=now,
            generation_kw=0.00,
            consumption_kw=2.50,
            battery_soc=None,
            grid_price=6.10,
            source="SIMULATED",
        ),
        EnergyReading(
            household_id="house_e",
            timestamp=now,
            generation_kw=5.20,
            consumption_kw=1.80,
            battery_soc=70.0,
            grid_price=6.10,
            source="SIMULATED",
        ),
    ]
    db.session.add_all(demo_readings)

    # 4. Deterministic Optimization Decisions (PPT Demo scenario)
    decisions = [
        OptimizationDecision(
            timestamp=now - datetime.timedelta(minutes=5),
            source_household="house_a",
            target="house_b",
            energy_kwh=2.80,
            action="LOCAL_TRADE",
            reason="Routing 2.80 kW surplus from House A to satisfy local consumer deficit in House B.",
        ),
        OptimizationDecision(
            timestamp=now - datetime.timedelta(minutes=4),
            source_household="house_a",
            target="community_battery",
            energy_kwh=1.20,
            action="STORE",
            reason="Routing 1.20 kW remaining surplus to buffer community battery up to safe capacity.",
        ),
        OptimizationDecision(
            timestamp=now - datetime.timedelta(minutes=3),
            source_household="house_a",
            target="utility_grid",
            energy_kwh=0.70,
            action="GRID_EXPORT",
            reason="Exporting 0.70 kW residual surplus to utility grid after meeting local load & storage.",
        ),
    ]
    db.session.add_all(decisions)

    # 5. Energy Transactions
    transactions = [
        EnergyTransaction(
            seller_household_id="house_a",
            buyer_household_id="house_b",
            energy_kwh=2.80,
            price_per_kwh=4.50,
            total_value=12.60,
            status="COMPLETED",
            timestamp=now - datetime.timedelta(minutes=5),
        ),
        EnergyTransaction(
            seller_household_id="house_e",
            buyer_household_id="house_d",
            energy_kwh=2.50,
            price_per_kwh=4.50,
            total_value=11.25,
            status="COMPLETED",
            timestamp=now - datetime.timedelta(minutes=15),
        ),
    ]
    db.session.add_all(transactions)

    # 6. Baseline ML Predictions
    predictions = [
        Prediction(
            household_id="house_a",
            prediction_time=now + datetime.timedelta(hours=1),
            predicted_demand_kw=2.48,
            predicted_generation_kw=1.19,
            confidence=None,
            model_version="RandomForest-v1.0-baseline",
        ),
        Prediction(
            household_id="house_b",
            prediction_time=now + datetime.timedelta(hours=1),
            predicted_demand_kw=4.10,
            predicted_generation_kw=0.20,
            confidence=None,
            model_version="RandomForest-v1.0-baseline",
        ),
    ]
    db.session.add_all(predictions)

    # 7. Initial Market Orders
    offers = [
        MarketOffer(
            household_id="house_a",
            energy_kwh=4.70,
            min_price_per_kwh=4.00,
            remaining_kwh=4.70,
            status="OPEN",
            source="SIMULATED",
        ),
        MarketOffer(
            household_id="house_e",
            energy_kwh=3.40,
            min_price_per_kwh=4.10,
            remaining_kwh=3.40,
            status="OPEN",
            source="SIMULATED",
        ),
    ]
    requests = [
        MarketRequest(
            household_id="house_b",
            energy_kwh=2.80,
            max_price_per_kwh=5.00,
            remaining_kwh=2.80,
            status="OPEN",
            source="SIMULATED",
        ),
        MarketRequest(
            household_id="house_d",
            energy_kwh=2.50,
            max_price_per_kwh=4.80,
            remaining_kwh=2.50,
            status="OPEN",
            source="SIMULATED",
        ),
    ]
    db.session.add_all(offers)
    db.session.add_all(requests)

    db.session.commit()
    print("Deterministic seed data successfully populated with Battery Ownership for GridShare!")
