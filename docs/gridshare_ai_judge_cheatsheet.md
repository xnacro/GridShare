# GridShare AI — Judge & Evaluator One-Page Cheat Sheet

This cheat sheet provides **one-sentence executive answers** followed by **precise technical proof** for every critical question a hackathon judge or technical evaluator will ask.

---

### 1. WHAT IS GRIDSHARE?
- **One-Sentence Answer**: GridShare is an AI-powered operating platform for community microgrids that coordinates peer-to-peer renewable energy trading, battery storage, and grid stability.
- **Technical Detail**: Built on a 4-layer loop: `OBSERVE (Telemetry) → PREDICT (demand_v1 + solar_v1) → OPTIMIZE (Priority Dispatch) → TRADE (Double-Auction P2P Settlement)`.

---

### 2. WHAT IS OUR INNOVATION?
- **One-Sentence Answer**: Instead of reactive dashboards or black-box chatbots, GridShare connects machine learning forecasts with a risk-aware deterministic optimizer that guarantees explainability and safety.
- **Technical Detail**: We separate physical resource prediction ($GHI$) from demand forecasting ($kW$), evaluate prediction intervals via tree ensemble variance, and enforce a $20\%$ hard battery reserve floor.

---

### 3. WHY MACHINE LEARNING INSTEAD OF SIMPLE RULES?
- **One-Sentence Answer**: Solar irradiance and household power consumption change rapidly with weather and human behavior, and ML captures complex non-linear diurnal patterns that fixed rules cannot anticipate.
- **Technical Detail**: `demand_v1` improves MAE over persistence baseline by **18.9%** ($0.235\text{ kW}$ vs $0.290\text{ kW}$); `solar_v1` beats persistence by **43.4%** in daytime MAE ($23.58\text{ W/m}^2$ vs $41.66\text{ W/m}^2$).

---

### 4. WHY TWO SEPARATE MODELS?
- **One-Sentence Answer**: Solar irradiance is governed by atmospheric physics and solar geometry, whereas household demand is driven by human behavioral habits; training one combined model creates confounding and data leakage.
- **Technical Detail**: Decoupling allows `solar_v1` to run on regional Guwahati NSRDB satellite data while `demand_v1` adapts to individual smart meter load profiles.

---

### 5. WHAT DOES `demand_v1` DO?
- **One-Sentence Answer**: It forecasts active household electrical demand 15 minutes into the future.
- **Technical Detail**: 150-tree Random Forest regressor trained on 2,075,259 sequential samples from UCI Individual Household dataset; Test MAE: **0.2353 kW**, RMSE: **0.3935 kW**, $R^2$: **0.7581**.

---

### 6. WHAT DOES `solar_v1` DO?
- **One-Sentence Answer**: It forecasts atmospheric solar irradiance ($GHI$) for Guwahati, Assam 15 minutes ahead.
- **Technical Detail**: 150-tree Random Forest regressor trained on 35,040 15-minute intervals from official 2019 NSRDB Meteosat satellite data; Test Daytime RMSE: **50.19 W/m²**, Daytime MAE: **23.58 W/m²**, $R^2$: **0.9789**.

---

### 7. WHAT IS GHI?
- **One-Sentence Answer**: Global Horizontal Irradiance ($GHI$) is the total physical sunlight energy falling on a horizontal surface, measured in Watts per square meter ($\text{W/m}^2$).
- **Technical Detail**: It is converted into estimated AC power ($\text{kW}$) via an explicit PV formula: $\text{PV (kW)} = \left(\frac{GHI}{1000}\right) \times 4.0\text{ kWp} \times 0.18 \times 0.86$.

---

### 8. WHAT IS MAE (Mean Absolute Error)?
- **One-Sentence Answer**: MAE measures the average magnitude of prediction errors in the same units as the target (kW or W/m²), treating all mistakes linearly.
- **Technical Detail**: $\text{MAE} = \frac{1}{n}\sum_{i=1}^{n}|y_i - \hat{y}_i|$. `demand_v1` error is $0.235\text{ kW}$; `solar_v1` daytime error is $23.58\text{ W/m}^2$.

---

### 9. WHAT IS RMSE (Root Mean Squared Error)?
- **One-Sentence Answer**: RMSE measures prediction error while penalizing large outliers much more heavily than small errors.
- **Technical Detail**: $\text{RMSE} = \sqrt{\frac{1}{n}\sum_{i=1}^{n}(y_i - \hat{y}_i)^2}$. Useful for solar power because sudden cloud ramp mistakes cause large grid disruptions.

---

### 10. WHAT IS $R^2$ (Coefficient of Determination)?
- **One-Sentence Answer**: $R^2$ measures the percentage of variance in the data explained by the model compared to a naive mean guess (1.0 is a perfect score).
- **Technical Detail**: `demand_v1` achieves $R^2 = 0.7581$ (explains 75.8% of load variance); `solar_v1` achieves $R^2 = 0.9789$ (explains 97.9% of solar variance).

---

### 11. WHAT IS DATA LEAKAGE AND HOW DID YOU PREVENT IT?
- **One-Sentence Answer**: Data leakage occurs when future information accidentally enters the training set, causing artificially high benchmark scores that fail in real life.
- **Technical Detail**: We enforced strict chronological train/val/test splits, lagged only past observations ($t-15m, t-30m, \dots$), engineered causal features prior to splitting, and verified zero temporal overlap with an automated leakage test.

---

### 12. WHAT IS UNCERTAINTY IN GRIDSHARE?
- **One-Sentence Answer**: Uncertainty is the spread of predictions across the 150 trees in our Random Forest ensemble, defining a realistic prediction corridor rather than a misleading single number.
- **Technical Detail**: $\text{Corridor} = [\hat{y} - 1.96\sigma_{\text{trees}}, \hat{y} + 1.96\sigma_{\text{trees}}]$. We never fabricate arbitrary "95% confidence" percentages.

---

### 13. HOW DOES THE OPTIMIZER WORK?
- **One-Sentence Answer**: It allocates energy in strict economic and physical priority: 1) Local P2P trade, 2) Community battery charging, 3) Grid export, 4) Battery discharge, 5) Grid import.
- **Technical Detail**: Fully deterministic, explainable Python service (`RuleBasedOptimizer`) returning audited reasons for every kilowatt routed.

---

### 14. WHY NOT TRADE ALL PREDICTED SURPLUS?
- **One-Sentence Answer**: If a sudden cloud passes by, selling 100% of the optimistic surplus would force the microgrid into an immediate deficit, triggering expensive grid penalties.
- **Technical Detail**: Hornet AI offers energy bounded by the conservative lower bound ($\text{solar\_lower\_kw} - \text{demand\_kw}$) to guarantee a safety margin.

---

### 15. WHAT HAPPENS IF THE FORECAST IS WRONG?
- **One-Sentence Answer**: The microgrid automatically absorbs discrepancies using the 50 kWh community battery and utility grid fallback without power interruption.
- **Technical Detail**: Inverters re-balance at millisecond timescales; the $20\%$ reserve floor guarantees emergency power even during complete model failure.

---

### 16. WHAT IS THE BATTERY RESERVE FLOOR?
- **One-Sentence Answer**: It is the bottom 20% (10 kWh) of the community battery locked exclusively for blackout protection and emergency resilience.
- **Technical Detail**: The optimizer can only discharge between $20\%$ and $100\%\text{ SOC}$ for everyday arbitrage.

---

### 17. WHAT IS REAL VS SIMULATED?
- **One-Sentence Answer**: The ML models (`demand_v1`, `solar_v1`), optimizer logic, uncertainty math, and REST APIs are 100% real code; the physical smart meter hardware and rooftop sensors are currently simulated with deterministic seed data.
- **Technical Detail**: Ready for physical ESP32 / MQTT smart meter hardware telemetry via the already implemented `TelemetryService.ingest_reading()` interface.
