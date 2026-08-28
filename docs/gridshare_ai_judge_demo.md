# GridShare AI — 3-Minute Live Judge Demonstration Script

This is the exact step-by-step presentation script to demonstrate GridShare and Hornet AI to hackathon judges in under 3 minutes.

---

### Timing & Stage Breakdown

```
[0:00 - 0:30]  Problem & Mission
[0:30 - 1:00]  Live Community Microgrid Overview
[1:00 - 2:00]  Hornet AI 6-Step Decision Pipeline
[2:00 - 2:40]  Weather Shock Stress-Test (Passing Cloud Simulation)
[2:40 - 3:00]  Review, Confirmation & Impact Summary
```

---

### Step 1: Hook & Problem (0:00 – 0:30)
**Action**: Start on the Dashboard ([http://localhost:5173/](http://localhost:5173/)).  
**Spoken Script**:
> *"Good morning judges. In India, residential rooftop solar is booming, but community microgrids face a fundamental coordination problem: Solar generation peaks at noon when people are away, while demand surges in the evening.  
> Without intelligence, prosumers dump energy to the grid for pennies, while neighbors buy expensive fossil power.  
> GridShare solves this with **Hornet AI** — an operating system that observes telemetry, forecasts load and solar with zero data leakage, and executes risk-aware peer-to-peer energy routing."*

---

### Step 2: Live Community State (0:30 – 1:00)
**Action**: Point to the Top Metric Cards and the 3D Digital Twin on the Dashboard.  
**Spoken Script**:
> *"Here on the Overview screen, GridShare is actively observing our 5-household cluster in Guwahati.  
> House A is currently generating **6.8 kW** with only **2.1 kW** of consumption — giving a massive **+4.7 kW surplus**.  
> Across the street, House B has an electric vehicle charging with a **2.8 kW deficit**.  
> Our central community battery is sitting safely at **40% state of charge**.  
> Now let’s open **Hornet AI** to see how GridShare orchestrates this future."*

---

### Step 3: Hornet AI 6-Step Decision Pipeline (1:00 – 2:00)
**Action**: Click the purple **"Ask Hornet AI"** button (or click `Hornet AI` in the top navigation pill: [http://localhost:5173/ai](http://localhost:5173/ai)).  
**Spoken Script**:
> *"This is the **Hornet AI Operating Hub**. It runs a live 6-step loop:  
> 1. **Current State**: We start with our observed telemetry.  
> 2. **Forecast**: We run two distinct machine learning models: `demand_v1` (150 trees trained on 2M benchmark points) predicting load, and `solar_v1` (150 trees trained on Guwahati NSRDB satellite data) predicting atmospheric irradiance.  
> 3. **Risk & Prediction Interval**: Notice we don't display fake confidence percentages. We calculate an empirical prediction corridor — here showing **5.31 to 6.28 kW** based on tree ensemble variance.  
> 4. **Recommendation**: Hornet AI feeds this into our deterministic optimizer, recommending **TRADE 1.0 kWh LOCALLY**.  
> 5. **Explainable Reasoning**: Look at these 4 verified rules: It tells us exactly why it chose a local trade — because House B needs power, the battery is above its 20% emergency floor, and the ₹4.50 P2P rate beats the ₹6.10 grid tariff.  
> 6. **Expected Impact**: It saves the community real rupees while eliminating fossil grid import."*

---

### Step 4: Weather Shock Simulator (2:00 – 2:40)
**Action**: Scroll down to the **Weather & Load Shock Simulator** card and click **"Passing Cloud Cluster"**.  
**Spoken Script**:
> *"Now, what happens when weather changes unexpectedly? Let’s simulate a sudden Guwahati monsoon cloud passage (-60% solar drop).  
> In just 12 milliseconds, Hornet AI re-calculates the net balance.  
> Look at the adaptation: The microgrid shifted from surplus into deficit. Hornet AI instantly throttles export and activates clean battery discharge to prevent expensive grid penalties while strictly protecting our 20% emergency reserve floor."*

---

### Step 5: Review & Confirmation (2:40 – 3:00)
**Action**: Scroll back up to the recommendation box and click **"Review & Confirm"** then **"Confirm Dispatch"**.  
**Spoken Script**:
> *"Finally, machine learning never executes blind financial trades. Hornet AI enforces human-in-the-loop governance.  
> We click 'Review & Confirm' $\rightarrow$ 'Confirm Dispatch', and the optimal routing plan is approved.  
> That is GridShare: Real ML, physics-based uncertainty, deterministic safety, and real economic value for renewable communities. Thank you!"*
