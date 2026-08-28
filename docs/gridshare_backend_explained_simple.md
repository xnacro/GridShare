# GridShare — The Backend Explained Simply

This document explains the entire GridShare architecture in plain, accessible language for project owners, evaluators, and stakeholders.

---

### 👤 USER — *"Who am I?"*
Every person logging into GridShare has a user profile. Whether you log in with Google, an email/password, or click a fast demo profile (House A, House B, House C), GridShare knows who you are and pairs you with your specific home.

---

### 🏡 HOUSEHOLD — *"Which home is mine?"*
GridShare manages a neighborhood cluster (e.g. Green Enclave). Each household is either a **Prosumer** (generates rooftop solar energy) or a **Consumer** (draws power for heavy loads and EV charging). Your dashboard only shows your home's private numbers.

---

### 📊 TELEMETRY — *"What is happening right now?"*
Every 15 minutes (or in real-time simulation), smart meters report two key numbers:
1. **Generation (kW)**: How much power your solar panels are producing.
2. **Consumption (kW)**: How much power your appliances and EV are using.
GridShare calculates your **Net Balance**:
$$\text{Net Balance} = \text{Generation} - \text{Consumption}$$
If positive, you have **Surplus** to share. If negative, you have a **Deficit** and need energy.

---

### 🤖 ML (HORNET AI) — *"What will happen in the next 15 minutes?"*
GridShare does not guess. It runs two machine learning models:
1. **Demand Forecaster (`demand_v1`)**: Trained on real household power consumption data. It looks at historical usage patterns, time of day, and day of the week to predict upcoming demand.
2. **Solar Forecaster (`solar_v1`)**: Trained on satellite solar irradiance data. It computes solar elevation angles and atmospheric conditions to predict how much sunlight will hit your rooftop.

---

### 🌫️ UNCERTAINTY — *"How sure are we?"*
Because clouds can suddenly pass over solar panels, GridShare calculates an **Uncertainty Corridor**. By comparing 150 individual decision trees inside our Random Forest model, it provides both an expected forecast and a safe conservative lower bound.

---

### ⚖️ OPTIMIZER — *"What is the best action to take?"*
GridShare runs a deterministic rule optimizer with a strict 4-tier priority hierarchy:
1. **Tier 1 (Local Trade)**: If a neighbor needs power, sell surplus directly to them at a discount (₹4.50/kWh).
2. **Tier 2 (Store in Battery)**: If the neighborhood has extra surplus, charge the community battery to prepare for the evening peak.
3. **Tier 3 (Export to Grid)**: If the battery is full, export remaining power to the utility grid via feed-in tariffs.
4. **Tier 4 (Backup Support)**: If in deficit, discharge the battery first; import from the utility grid only as a last resort.

---

### 🤝 MARKETPLACE — *"Who should trade and at what price?"*
The P2P marketplace operates a **Continuous Double Auction**:
- Prosumers list surplus energy at a minimum asking price (e.g. ₹4.00/kWh).
- Consumers list energy needs at a maximum budget (e.g. ₹5.00/kWh).
- The market matches them at the fair midpoint price (**₹4.50/kWh**).
- The seller earns more than grid feed-in rates (₹3.50), and the buyer pays less than grid retail rates (₹6.10).

---

### 🔋 COMMUNITY BATTERY — *"How do we share one big neighborhood battery fairly?"*
Instead of every house buying an expensive private battery, the community shares a central 50 kWh Energy Storage System (ESS):
- **90% Round-Trip Efficiency**: When you inject 10 kWh, the system credits you with 9.0 kWh of usable energy (accounting for 10% conversion heat loss).
- **Proportional Ownership**: If you contributed 90% of the energy in the battery and a neighbor contributed 10%, future evening withdrawals are allocated in exact 9:1 proportion. No one can unfairly deplete someone else's stored energy.

---

### 🎯 SCENARIOS — *"Can you prove this works during disruptions?"*
GridShare includes a 1-click scenario engine:
- **Sunny Afternoon (Demo Mode)**: Recreates the exact PPT demonstration state with clean, reproducible results.
- **Weather Shock**: Simulates sudden heavy cloud cover (-60% solar) and demonstrates Hornet AI instantly switching from grid export to battery discharge to protect the community.
- **Instant Reset**: Wipes test data and returns the database to clean baseline seed data in under 0.2 seconds.
