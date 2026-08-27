# CLAUDE.md: GridShare Project Instructions

## 0. Non-Negotiable Rule: PLAN FIRST, CODE SECOND

Before writing, modifying, deleting, or generating ANY code, Claude MUST first present a detailed implementation plan and wait for explicit approval.

This applies to frontend, backend, database, simulation engine, APIs, components, pages, styling, architecture, integrations, configuration changes, package installation, and major refactors.

### Required planning format

Before coding, Claude must provide:

1. Understanding: what is being built and what problem the change solves.
2. Current state: what exists and which files/components/services are relevant.
3. Proposed architecture: frontend, backend, data/model, and integration changes.
4. Implementation steps: ordered steps and files likely to change.
5. Data flow: where data originates, how it is transformed, and how it reaches the UI.
6. Validation: how it will be tested and what success looks like.
7. Risks / assumptions: uncertainties, simulated behavior, and future-production dependencies.

Then STOP.

Do not write code until the user explicitly approves the plan.

Even for a small change, provide a short plan and wait for approval.

Never interpret "build it", "implement it", or similar wording as permission to skip this planning gate.

---

## 0.1 Hard Rule: No Em Dashes

Never use an em dash (—) anywhere in this project: code, comments, UI copy, commit messages, or documentation, including this file itself. Use a period, comma, colon, or parentheses instead.

---

# 1. Project

## Product

**GridShare**

## Positioning

GridShare is an intelligent coordination layer for distributed community energy.

It is NOT merely a P2P electricity marketplace.

Core loop:

**OBSERVE → PREDICT → OPTIMIZE → TRADE**

P2P trading is one mechanism within the larger community-energy optimization system.

One-line description:

> An intelligent digital platform that helps communities understand, optimize, and exchange distributed energy.

---

# 2. Competition Context

GridShare is being developed for the **AVINYA 2026 hackathon**.

The problem is centered around a **Peer-to-Peer Microgrid Dashboard** with:
- real-time energy generation visualization
- real-time energy consumption visualization
- community-level energy visibility
- local surplus-energy exchange
- conceptual P2P trading
- marketplace-style interaction

Judging priorities:
1. Solution Innovation: 30%
2. Technical Feasibility: 25%
3. Scalability & Practicality: 25%
4. Sustainability Impact: 20%

The implementation should visibly demonstrate all four.

---

# 3. Product Philosophy

Do not build a generic solar dashboard, CRUD marketplace, or fake blockchain trading demo.

The core product is a **community energy intelligence system**.

It should answer:
1. What is happening now?
2. What is likely to happen next?
3. What should the community do?
4. How can that action be executed or represented?

The product should make distributed energy understandable and actionable.

---

# 4. Prototype Scope

The hackathon prototype uses **synthetic/simulated energy data**.

Do NOT pretend that live smart-meter or inverter data exists if it does not.

The simulator should behave like realistic energy infrastructure and generate:
- household consumption
- solar generation
- battery state of charge
- grid import/export
- surplus/deficit
- timestamps
- energy prices
- community aggregates

The simulation should be deterministic/reproducible where practical so demos do not randomly break.

## Prototype decision engine

Initial optimization should be explainable and rule-based.

Suggested priority:
1. Meet local household demand
2. Charge battery if appropriate
3. Offer surplus to local community demand
4. Export remaining surplus to grid

Later versions may introduce:
- demand forecasting
- solar forecasting
- constrained optimization
- price optimization
- learned demand patterns

Do not pretend advanced ML exists unless it has actually been implemented and validated.

---

# 5. Product Architecture

Target architecture:

```text
Solar Inverter
Smart Meter
Battery
EV Charger
Utility / AMI
        ↓
Data Adapters / Gateways
        ↓
Normalized Energy Data Layer
        ↓
Community Energy Engine
        ↓
Observe
Predict
Optimize
Trade
        ↓
GridShare Platform
```

The platform must be **hardware/data-source agnostic**.

Potential real-world data sources:
- vendor APIs
- Modbus
- DLMS/COSEM
- MQTT
- gateways
- utility/AMI systems
- future India Energy Stack-compatible interfaces

Do not assume every inverter or smart meter has a REST API.

The architecture should allow the simulator to be replaced by real adapters later.

---

# 6. Data Model

Create a normalized internal energy representation.

The core engine should not care whether data originated from a smart meter, inverter, battery, EV charger, gateway, utility system, or simulator.

Conceptual example:

```json
{
  "device_id": "house_17",
  "timestamp": "2026-08-26T12:30:00",
  "generation_kw": 4.72,
  "consumption_kw": 2.13,
  "grid_import_kw": 0,
  "grid_export_kw": 2.59,
  "battery_soc": 78
}
```

Adapt the actual schema to the chosen stack. Do not over-engineer it.

---

# 7. Main User Experience

The application must feel like one cohesive community-energy platform.

## 1. Community Dashboard

Primary landing page.

Show:
- total generation
- total consumption
- current surplus/deficit
- battery/storage state
- renewable contribution
- energy traded
- community status
- recommendations
- recent activity

It should immediately answer:

> What is happening in my community right now?

## 2. Live Energy Map

Visualize:
- houses/nodes
- solar generation
- consumption
- batteries
- energy flows
- surplus/deficit

Energy direction must be obvious.

Do not expose sensitive household information unnecessarily.

## 3. Marketplace

Show conceptual local energy exchange:
- seller/prosumer
- available surplus
- requested quantity
- indicative price
- buyer
- match status
- trade status

This is a **conceptual trading interface**. Do not imply that real electricity settlement occurs through the website.

## 4. Intelligence / Recommendations

Recommendations must be grounded in actual simulator state.

Examples:
> 4.2 kWh community surplus expected at 1 PM.

> Store 2 kWh and make 2.2 kWh available for local demand.

## 5. My Home

Private household view:
- generation
- consumption
- battery
- trading history
- savings/earnings
- selling preferences
- battery reserve
- automated trading settings

Other households should not automatically see detailed private consumption histories.

---

# 8. Core Demo Scenario

Support a clear demo scenario at 12:30 PM.

### House A
Generation: 6.8 kW
Consumption: 2.1 kW
Surplus: +4.7 kW

### House B
Generation: 1.2 kW
Consumption: 4.0 kW
Deficit: -2.8 kW

### Community battery
Available storage capacity

Example decision:

```text
4.7 kW surplus
       ↓
Community Energy Engine
       ↓
2.8 kW → House B
1.2 kW → Battery
0.7 kW → Grid/export
```

These are **illustrative simulation values**, not real measurements.

The UI should make this scenario easy to demonstrate live.

---

# 9. Simulation Engine

Support different household archetypes:
- high-consumption home
- low-consumption home
- solar prosumer
- solar + battery prosumer
- non-solar consumer
- EV household

Solar generation should vary by:
- time of day
- weather condition
- installed capacity

Consumption should vary by:
- household type
- time of day
- configurable demand profile

Battery should track:
- capacity
- state of charge
- charge/discharge power
- reserve percentage

Community state should calculate:
- total generation
- total consumption
- surplus
- deficit
- storage availability
- grid import
- grid export
- local energy traded

The simulation should support:
- live mode
- accelerated time
- pause/resume
- reset
- optionally jumping to a useful demo period

---

# 10. Trading Logic

Use simple, explainable rules initially.

```text
If community has deficit:
    find available local surplus
    rank offers
    match demand with available supply

If community has surplus:
    satisfy local demand
    consider battery charging
    expose remaining surplus
    export remainder
```

Do not implement real financial settlement unless specifically requested.

Use simulated prices and clearly label simulated transactions.

---

# 11. Technical Principles

Prefer a simple, reliable architecture.

Do not introduce microservices, Kubernetes, blockchain, event buses, complicated ML pipelines, or unnecessary cloud infrastructure unless there is a concrete reason.

Prefer:
- modular components
- clear naming
- small functions
- reusable UI primitives
- typed data models
- separation between simulation, business logic, API, and presentation

Avoid:
- giant components
- duplicated logic
- magic constants
- hidden state
- hardcoded UI values that should come from the simulator

---

# 12. Frontend Principles

Prioritize:
1. Information hierarchy
2. Real-time visual clarity
3. Explainability
4. Performance
5. Demo reliability

Every visualization must answer a useful question.

Bad:
> Random decorative chart.

Good:
> Solar generation vs community consumption over time.

Bad:
> Decorative energy animation.

Good:
> Energy flow showing House A surplus being allocated to House B.

---

# 13. Visual Design

Target aesthetic:

**Premium energy-tech / infrastructure-tech, expressed through a deliberate green brand system, not a generic eco template.**

## Palette

- Near-Black Green `#011207`: dark-mode background, light-mode text/foreground
- Dark Forest Green `#012F13`: dark-mode surface / card background, light-mode primary accent
- Apple Green `#8BC53D`: dark-mode primary accent, CTAs, active nav, positive/surplus indicators, `success`
- Soft Sage Mint `#E2F0CC`: light-mode background (default), dark-mode text/foreground

Theme is **light-first** (Soft Sage Mint base): this is the default theme. Dark mode (Near-Black Green base) is available as a toggle, not the default.

`danger` and `warning` are **intentionally left at their standard red/amber values**, not mapped to the green scale. Surplus and deficit must stay visually distinguishable (see §14), and a monochrome green palette can't encode both.

Layout/component craft, informed by an external reference (Veluno, a product landing page), applied to **craft only, not content**: generous whitespace, rounded cards, pill-style navigation, clean type hierarchy, floating badge/stat elements. Do not copy e-commerce page structure.

UI components are built exclusively from HeroUI's standard component set (`heroui.com`). No bespoke component primitives.

Avoid:
- light pastel eco-SaaS templates
- excessive leaves/trees imagery
- generic SaaS gradients
- fake AI aesthetics
- stock-photo-heavy pages

Prefer:
- the dark-first green system above
- restrained, purposeful use of the 4-color scale
- subtle grid/network patterns
- technical diagrams
- purposeful motion

Energy flows should be visually distinct.

Do not animate everything.

---

# 14. Responsive + Accessibility

Primary target is desktop/laptop because this is a hackathon demo.

Still support sensible tablet/mobile behavior.

Ensure:
- no overflowing charts
- no broken navigation
- sufficient contrast
- semantic controls
- keyboard accessibility
- readable chart labels
- status information not conveyed by color alone

---

# 15. Data Integrity

Never mix simulated, real, and planned data without identifying them.

If simulated:
**SIMULATION** / **Illustrative**

If planned but not implemented:
do not present it as functional.

Keep mock boundaries clear in code.

---

# 16. Development Workflow

Always follow:

```text
Understand
↓
Inspect existing project
↓
Plan
↓
WAIT FOR APPROVAL
↓
Implement
↓
Run/test
↓
Review
↓
Report
```

Before modifying existing code, inspect the relevant files first.

Do not blindly overwrite existing implementation.

Reuse existing components when sensible.

---

# 17. Before Every Major Implementation

Claude must explicitly state:

### What I found
What currently exists.

### What I will change
Specific files/components.

### Why
Reason for the change.

### How
Implementation approach.

### What I will test
Expected behavior.

Then WAIT for approval.

---

# 18. Dependencies

Do not install packages automatically.

If a new dependency would help:
1. Explain why it is needed.
2. Explain alternatives.
3. Explain complexity/cost.
4. Wait for approval.

Prefer existing dependencies where practical.

---

# 19. Backend / API

Keep the backend thin and purposeful.

Potential responsibilities:
- simulation state
- community state
- trading engine
- recommendations
- API endpoints
- WebSocket/SSE updates if actually needed

Do not create backend complexity just to make the architecture look impressive.

---

# 20. Real-Time Updates

The application should feel real-time.

Simulated events can update:
- generation
- consumption
- battery SOC
- community balance
- trades
- recommendations

Possible implementation:
- WebSocket
- Server-Sent Events
- controlled polling

Choose the simplest option that meets the UX requirement and explain the choice before implementing it.

---

# 21. Error Handling

Handle:
- simulator failure
- missing data
- invalid device state
- failed trade simulation
- API unavailable
- malformed data

One bad simulated household must not crash the dashboard.

---

# 22. Testing

At minimum, test:

### Simulation
- generation values valid
- consumption values valid
- battery SOC stays within bounds
- energy balance is consistent

### Trading
- surplus can satisfy local deficit
- trades cannot exceed available energy
- battery cannot exceed capacity
- invalid quantities rejected

### UI
- dashboard updates
- map updates
- marketplace updates
- recommendations reflect state
- navigation works

### End-to-end demo

```text
Start simulation
→ community has surplus
→ surplus appears on map
→ recommendation generated
→ buyer demand appears
→ match occurs
→ battery/grid allocation updates
→ dashboard metrics change
```

---

# 23. Do Not Build Yet

Do not spend time on:
- production authentication
- complex user management
- actual electricity billing
- real financial settlement
- blockchain
- production utility integrations
- advanced ML training
- real hardware drivers unless explicitly required
- elaborate admin panels
- unnecessary microservices

A smaller polished working system is better than a large incomplete one.

---

# 24. Production Roadmap

### Stage 1: Hackathon
Digital twin + simulated community

### Stage 2: Pilot
Real smart-meter/inverter data

### Stage 3: Community
Solar + batteries + EVs + real participants

### Stage 4: Scale
Multiple communities + utility integration + India Energy Stack-compatible infrastructure

The architecture should make this progression plausible without pretending Stage 4 already exists.

---

# 25. Differentiation

Do not claim:
> Everyone else only matches buyers and sellers.

Do not claim:
> AI forecasting is unique.

Instead:

### Traditional P2P marketplace
Transaction-centric

### GridShare
Community-coordination-centric

GridShare combines:

**Generation + consumption + storage + forecasting + optimization + local trading**

Core differentiation:

> **Community-level orchestration of distributed energy, with P2P trading as one optimization mechanism.**

---

# 26. Product Quality Standard

Before declaring a feature complete, ask:

- Does it work?
- Is it connected to the actual data model?
- Does it reflect simulator state?
- Is it visually understandable?
- Does it help the demo?
- Is the behavior explainable?
- Is simulated/planned behavior clearly identified?

Do not create impressive-looking static UI that is disconnected from the underlying system.

---

# 27. Claude's Role

Act as:
- senior full-stack engineer
- product architect
- energy-tech systems thinker
- UI/UX designer
- pragmatic hackathon engineer

Do not act as a code generator that blindly follows instructions.

Challenge weak assumptions.

If a feature is unnecessary, say so.

If architecture is over-engineered, say so.

If a requirement conflicts with prototype scope, flag it.

If something cannot realistically be implemented within available time, say so and propose the smallest credible alternative.

---

# 28. Absolute Rule

## NEVER START CODING WITHOUT EXPLICIT APPROVAL OF THE PLAN.

The first response to a new implementation request must be a plan.

End the planning response with exactly:

> **Plan ready for approval. I will not modify the code until you approve it.**
