# GridShare AI — Beginner-Friendly User & Educational Guide

Welcome to the **GridShare AI Guide**! This document explains how GridShare's intelligence engine works in simple language, with concrete examples, analogies, and zero unnecessary jargon.

---

## 1. GridShare in One Minute

Imagine a neighborhood where some houses have rooftop solar panels and others do not:
- **At 1:00 PM on a sunny day**, House A produces far more solar electricity than it uses (a **surplus**).
- **At the exact same time**, House B is charging an Electric Vehicle and needs extra power (a **deficit**).
- **Without GridShare**: House A sells surplus power back to the government utility company at a low feed-in tariff (e.g. ₹3.00/kWh), while House B buys power from the utility grid at a high tariff (e.g. ₹6.10/kWh). Both neighbors lose money to the middleman.
- **With GridShare & Hornet AI**: The community coordinates automatically. House A sells power directly to House B across the local microgrid at a fair peer-to-peer (P2P) price (₹4.50/kWh). House A earns more money, House B pays less money, and the community battery is kept charged for nighttime emergencies.

---

## 2. What is Machine Learning (ML)?

**Traditional Programming**: A human writes strict rules:
$$\text{Input Data} + \text{Rules (written by human)} \longrightarrow \text{Output}$$

**Machine Learning**: A computer looks at thousands of historical examples, discovers the underlying patterns on its own, and creates a mathematical model:
$$\text{Historical Data} + \text{Actual Outcomes} \longrightarrow \text{Trained Model}$$

Once trained, we feed **new live data** into this model to predict what will happen next.

---

## 3. What is Forecasting?

Forecasting means **predicting the future based on past and present observations**.
- In weather: *"It rained yesterday and humidity is 90% right now $\rightarrow$ 80% chance of rain in 1 hour."*
- In GridShare: *"House A used 2.1 kW power over the last 15 minutes and it is a Sunday afternoon $\rightarrow$ predicted load is 2.25 kW over the next 15 minutes."*

---

## 4. What is a "Feature"?

A **feature** is an individual piece of input information given to the machine learning model so it can make a prediction.
- If you were predicting house prices, features might be: *number of bedrooms, square footage, neighborhood*.
- In GridShare, features are: *current hour of the day, day of the week, power used 15 minutes ago, power used 1 hour ago, current solar elevation angle, temperature, humidity*.

---

## 5. What is a "Target"?

The **target** is the single exact value the machine learning model is trying to predict.
- For our demand model (`demand_v1`): The target is **active household power consumption 15 minutes in the future (in kW)**.
- For our solar model (`solar_v1`): The target is **atmospheric solar irradiance ($GHI$) 15 minutes in the future (in $\text{W/m}^2$)**.

---

## 6. What is `demand_v1`?

`demand_v1` is GridShare's **Household Demand Forecaster**.
- **Model Type**: Random Forest Regressor (150 decision trees, max depth 18).
- **Training Data**: 2,075,259 sequential 1-minute electricity readings resampled to 15-minute intervals from the international benchmark *UCI Individual Household Electric Power Consumption* dataset.
- **How it Works**: It looks at 32 features (recent power history, time of day, cyclical sine/cosine timestamps) and outputs the predicted power consumption in kilowatts ($\text{kW}$).
- **Accuracy**: It achieves a Test Mean Absolute Error (MAE) of **0.235 kW** on unseen holdout test data, outperforming baseline persistence models by **18.9%**.

---

## 7. What is `solar_v1`?

`solar_v1` is GridShare's **Solar Resource Forecaster**.
- **Model Type**: Random Forest Regressor (150 decision trees, max depth 18).
- **Location**: Calibrated for Guwahati, Assam, India ($26.13^\circ\text{N}, 91.74^\circ\text{E}$).
- **Training Data**: High-resolution 15-minute satellite solar data from the official *NSRDB / NREL Meteosat IODC* dataset (35,040 intervals for 2019).
- **How it Works**: It looks at 27 physical atmospheric features (recent irradiance lags, solar elevation angle proxy, temperature, humidity, wind) and predicts the atmospheric sunlight intensity ($GHI$).
- **Accuracy**: It achieves a Daytime Root Mean Squared Error (RMSE) of **50.19 W/m²** and an $R^2$ score of **0.9789** on unseen test data.

---

## 8. What is GHI vs. Actual PV Power?

This is a critical distinction:
- **$GHI$ (Global Horizontal Irradiance)**: Measures physical raw sunlight energy reaching 1 square meter of flat ground. It is measured in **$\text{W/m}^2$** (Watts per square meter). On a bright clear midday in Guwahati, $GHI \approx 900\text{--}1000\text{ W/m}^2$. At night, $GHI = 0$.
- **PV Electrical Power**: The actual usable alternating current ($\text{kW}$) produced by solar panels on a rooftop.

To turn raw sunlight ($GHI$) into usable power ($\text{kW}$), GridShare uses an explicit, physical conversion formula:
$$\text{Estimated PV Power (kW)} = \left(\frac{GHI}{1000}\right) \times \text{Capacity (kWp)} \times \text{Panel Efficiency} \times \text{Inverter Loss Factor}$$

*Example*: If $GHI = 800\text{ W/m}^2$, with a $4.0\text{ kWp}$ panel system, $18\%$ panel efficiency proxy, and $86\%$ system derate factor:
$$\text{Estimated PV} = \left(\frac{800}{1000}\right) \times 4.0 \times 0.18 \times 0.86 = 0.495\text{ kW}$$

---

## 9. What is Uncertainty & Prediction Range?

No AI model can predict the future with 100% certainty. Clouds can suddenly pass over panels, or an occupant can turn on an electric oven unexpectedly.

Instead of outputting a single number and pretending to be omniscient, GridShare calculates a **Forecast Range (Prediction Interval)**:
- **Best Estimate Point Forecast**: e.g., $5.84\text{ kW}$
- **Conservative Lower Bound**: e.g., $5.31\text{ kW}$ (what happens if cloud cover increases)
- **Upper Bound**: e.g., $6.28\text{ kW}$ (what happens if the sky is crystal clear)

**Analogy**: If a weather app says *"It will be 24°C today (range 22°C–26°C)"*, you know to bring a light jacket just in case. In GridShare, knowing the lower bound allows the optimizer to make safe trading decisions that won't leave the community short on power.

---

## 10. What is Predicted Net Balance?

The predicted net balance is calculated by subtracting predicted demand from predicted generation:
$$\text{Predicted Net Balance (kW)} = \text{Predicted Solar Generation (kW)} - \text{Predicted Household Demand (kW)}$$

- **Positive ($+$)**: Community has a **Surplus** (extra clean energy available to sell or store).
- **Negative ($-$)**: Community has a **Deficit** (energy shortage that must be supplied by the battery or utility grid).
- **Zero ($0$)**: Perfectly balanced.

---

## 11. What does the Optimizer do?

The **Optimizer** (`RuleBasedOptimizer`) is the decision-making brain. Once it knows the predicted balance, it decides where every kilowatt of energy should flow using a strict priority hierarchy:

1. **Priority 1: Local P2P Trade (`LOCAL_TRADE`)**:
   Match neighbors who have extra power with neighbors who need power. This keeps money inside the community.
2. **Priority 2: Battery Charging (`STORE`)**:
   If there is still surplus solar after serving all neighbors, charge the 50 kWh central community battery so power is stored for the evening.
3. **Priority 3: Utility Grid Export (`GRID_EXPORT`)**:
   If the battery is completely full ($100\%\text{ SOC}$), export the remaining power to the main utility grid for feed-in credits.
4. **Priority 4: Battery Discharge (`DISCHARGE`)**:
   If the community has a deficit, draw clean power from the community battery (as long as battery SOC is above the $20\%$ emergency floor).
5. **Priority 5: Utility Grid Import (`GRID_IMPORT`)**:
   If the battery hits its $20\%$ safety reserve floor, import electricity from the main utility grid to prevent blackouts.

---

## 12. What is the Battery Reserve Floor?

The community battery has a capacity of **50 kWh**. However, the optimizer is strictly forbidden from draining the battery down to $0\%$.

- **Reserve Floor ($20\%$)**: The bottom $10\text{ kWh}$ of the battery is locked as an **Emergency Blackout Reserve**.
- **Usable Energy**: Only energy above $20\%\text{ SOC}$ can be discharged for everyday cost optimization.

**Everyday Analogy**: Think of your car's fuel tank having a 5-liter reserve light. You can drive using the top 80% of the tank, but the system keeps the bottom 20% untouched so you never stall on the highway.

---

## 13. What is P2P Energy Trading?

**Peer-to-Peer (P2P)** trading means buying and selling electricity directly between community members over local distribution wires without relying on an energy broker.

- **Utility Grid Buying Price**: ₹6.10 / kWh
- **Utility Grid Selling Feed-in Price**: ₹3.00 / kWh
- **GridShare P2P Clearing Price**: ₹4.50 / kWh
  - The **Seller** earns ₹4.50 instead of ₹3.00 (+50% higher revenue).
  - The **Buyer** pays ₹4.50 instead of ₹6.10 (26% cost savings).

---

## 14. What is the Difference Between Prediction, Recommendation, and Execution?

| Stage | Question Answered | Example | Can it change state? |
| :--- | :--- | :--- | :--- |
| **Prediction** | *What is going to happen?* | "Solar output will be 5.84 kW in 15 minutes." | ❌ No |
| **Recommendation** | *What should we do?* | "Hornet AI recommends trading 1.0 kWh to House B." | ❌ No |
| **User Approval** | *Does the user agree?* | User clicks `[ Review & Confirm ]`. | ❌ No |
| **Execution** | *Did the trade happen?* | Smart meter switch / blockchain trade is recorded. | ✅ Yes |

**Key Principle**: Machine learning makes predictions, but never automatically executes financial trades without passing through safety constraints and human oversight.

---

## 15. Real vs. Simulated in GridShare Today

| Component | Status | Source |
| :--- | :--- | :--- |
| **`demand_v1` Model** | **REAL ML** | Trained Random Forest model running live inference on CPU. |
| **`solar_v1` Model** | **REAL ML** | Trained Random Forest model running live inference on CPU. |
| **Optimizer Logic** | **REAL CODE** | Deterministic Python priority engine calculating exact routing. |
| **Uncertainty Bounds** | **REAL MATH** | Tree ensemble variance and empirical prediction intervals. |
| **Live Household Telemetry** | **SIMULATED** | Seeded realistic microgrid profiles representing 5 Guwahati homes. |
| **Physical Wire Inverters** | **CONCEPTUAL** | Energy routing decisions are calculated and tracked in software; physical smart meter hardware switches are not yet attached. |
