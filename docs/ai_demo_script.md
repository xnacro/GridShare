# GridShare AI — Judge & Evaluator Demonstration Script

**Target Time**: 2–3 minutes  
**Goal**: Demonstrate real ML inference, uncertainty quantification, mathematical safety constraints, dynamic multi-tenant personalization, and shock simulation.

---

### Step 1: Open GridShare AI Intelligence Center (`/ai`)
- **Action**: Log in as **Anjali Sharma** (`anjali@gridshare.io` / `admin@123`).
- **Narrative**:
  > *"Welcome to GridShare AI — the central intelligence layer for community microgrids. Rather than a static dashboard, GridShare uses an active 10-step decision pipeline: Observe $\rightarrow$ Forecast $\rightarrow$ Uncertainty Corridor $\rightarrow$ Constraints $\rightarrow$ Recommendation $\rightarrow$ Explainability $\rightarrow$ User Approval."*
- **Visuals**:
  - Show the clean centered hero: *"Your energy forecast, explained."*
  - Point to the live numbers: **Solar Generation** ($6.4\text{ kW}$), **Predicted Demand** ($2.15\text{ kW}$), **Surplus Balance** ($+3.69\text{ kW}$), **Safe Tradeable Energy** ($0.79\text{ kWh}$).

---

### Step 2: Inspect Uncertainty & Conservative Safety Floor
- **Action**: Highlight the **Forecast & Uncertainty Corridor** chart and the **Safe Tradeable Energy** badge.
- **Narrative**:
  > *"Notice that GridShare never sells the unconstrained surplus. Our Random Forest ensemble measures tree variance to generate a 90% confidence lower bound. Only energy above this conservative corridor is considered safe to trade, protecting against unexpected cloud dips."*

---

### Step 3: Predictive P2P Matching & Explainable "Why?"
- **Action**: Point to the **Predictive Match Card** (Anjali Sharma $\leftrightarrow$ Prince Patel).
- **Narrative**:
  > *"GridShare AI proactively pairs Anjali's forecasted surplus with Prince's heavy household demand. Every recommendation is accompanied by deterministic, explainable reasons: verified surplus, nearby proximity, healthy 65% battery SOC, and ₹1.60/kWh peer savings versus the grid."*

---

### Step 4: Multi-Tenant Switch (Prince Patel — Consumer Deficit)
- **Action**: Click the profile avatar and switch to **Prince Patel**.
- **Narrative**:
  > *"Switching to Prince Patel. Notice how the AI pipeline instantly re-evaluates: Prince has high load ($4.8\text{ kW}$) and small solar ($1.0\text{ kWp}$). The AI immediately pivots from recommending a sale to recommending a P2P local purchase from Anjali, bypassing expensive grid tariffs."*

---

### Step 5: Live Weather Shock Simulation (Cloud Drop & EV Spike)
- **Action**: Switch back to Anjali or click **"Simulate Weather Shock"** $\rightarrow$ select **"Passing Cloud Cover (-60% Solar)"**.
- **Narrative**:
  > *"What happens during an unexpected weather shock? Let's simulate a sudden monsoon cloud cover. Watch the forecast drop in real time: solar collapses, surplus turns to deficit, and GridShare AI immediately changes its recommendation from 'Local Trade' to 'Preserve & Discharge Battery', shielding the community from grid import penalties."*

---

### Step 6: Technical AI & Model Benchmarks
- **Action**: Toggle to **"Technical View"**.
- **Narrative**:
  > *"For system engineers and judges, the Technical View exposes full ML model metrics: Random Forest $R^2 = 0.9789$ on solar and $R^2 = 0.7581$ on demand, outperforming persistence baselines by 20%, along with complete feature importances and mathematical constraint proofs."*
