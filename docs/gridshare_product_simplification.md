# GridShare — Product Simplification Framework

This document simplifies the entire GridShare platform down to the essential concepts required for users, evaluators, and stakeholders.

---

## 1. Core Mental Model (5 Essential Concepts)

Users should never be forced to understand complex ML hyperparameters, raw SQL schemas, or internal routing vectors. The entire product collapses into 5 clear concepts:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     MY HOME     │ ────► │    COMMUNITY    │ ◄──── │    HORNET AI    │
│  "What is my    │       │  "Are we in     │       │  "What will     │
│   energy state  │       │   surplus or    │       │   happen next   │
│   right now?"   │       │   deficit?"     │       │   and why?"     │
└─────────────────┘       └────────┬────────┘       └─────────────────┘
                                   │
                  ┌────────────────┴────────────────┐
                  ▼                                 ▼
        ┌───────────────────┐             ┌───────────────────┐
        │    P2P MARKET     │             │ COMMUNITY STORAGE │
        │ "Who wants to buy │             │ "How much clean   │
        │  or sell energy   │             │  energy is saved  │
        │  at fair rates?"  │             │  in our battery?" │
        └───────────────────┘             └───────────────────┘
```

---

## 2. The 5 Core Questions Answered by GridShare

1. **MY HOME** (`/my-home`):
   - *Question*: *"Am I producing more solar than I'm using?"*
   - *Answer*: Real-time solar generation (kW), home load (kW), and net balance (Surplus / Deficit).

2. **COMMUNITY OVERVIEW** (`/` or `/dashboard`):
   - *Question*: *"Is our microgrid self-sufficient today?"*
   - *Answer*: Total community generation vs. demand, battery reserve status, and local renewable fraction.

3. **HORNET AI OPERATING SYSTEM** (`/ai`):
   - *Question*: *"What will happen in the next 15 minutes, and what action is recommended?"*
   - *Answer*: 15-minute demand & solar forecasts, uncertainty corridor, recommended dispatch action (Trade / Store / Export), and explainable rationale.

4. **P2P MARKETPLACE** (`/marketplace`):
   - *Question*: *"Can I sell my surplus to a neighbor or buy clean power cheaper than the grid?"*
   - *Answer*: Transparent order book matching rooftop solar with local consumers at fair tariffs (₹4.50/kWh).

5. **COMMUNITY BATTERY** (`/battery`):
   - *Question*: *"How much stored energy do I personally own in our neighborhood battery?"*
   - *Answer*: Central 50 kWh ESS state, 90% efficiency accounting, and proportional equity credits preventing unfair depletion.

---

## 3. What to Remove from the Primary View

To maintain high editorial quality, the following technical details are separated from the primary interface:
- **Raw ML Model Tensors & Coefficients**: Kept in collapsible "Technical Architecture View" or API inspection.
- **Microcontroller Hardware Pinouts / Baud Rates**: Kept in the secondary Devices page.
- **Direct Database ID Numbers**: Replaced with human-friendly labels (e.g. "House A (Prosumer)" instead of `08c3b7a1-ff44...`).
- **Internal Optimization Solver Multipliers**: Replaced with plain-language bullet points in "Why This Plan?".
