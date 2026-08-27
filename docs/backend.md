# GridShare Backend

Status as of 2026-08-28. Covers `server/` only. The simulation engine, decision logic, marketplace store, and REST/SSE API are implemented and tested. The frontend consumes live snapshots via SSE (`client/src/context/CommunityContext.jsx`) and posts marketplace actions to `/api/market/*`.

## Stack

- Node.js (ES modules), Express 5
- In-process state only: no database, no Redis, no message broker
- Real-time push via Server-Sent Events (SSE), not WebSockets
- `dotenv` for `PORT` (default 5000)
- Tests: Node's built-in `node:test` runner (`npm test`)
- Dev: `nodemon` (`npm run dev`), prod: `node app.js` (`npm start`)

## Structure

```
server/
  app.js                 entry point: loads env, starts store, binds port
  src/
    app.js               createApp() factory (used by tests)
    api/
      cors.js            hand-written dev CORS middleware
      errorHandler.js    central 4xx/5xx JSON error responses
      routes/
        community.js     snapshot + single-household reads
        market.js        listings + trades
        sim.js           pause/resume/reset/speed/jump controls
        stream.js        SSE push on every tick
    config/
      constants.js       sim knobs (seed, tick rate, battery, demo hour)
      archetypes.js      5 household seed definitions
    market/
      store.js           in-memory listings + settled trades
    sim/
      engine.js          tick loop, aggregates, trends, activity, recommendations
      clock.js           simulated wall clock (pause, speed, jump)
      household.js       builds calibrated household state from archetypes
      battery.js         rate-limited, reserve-bounded SOC model
      solarModel.js      bell-curve generation + noise
      demandModel.js     residential/EV demand curves + noise
      decisionEngine.js  rule-based allocation (local match, battery, grid)
      rng.js             seeded mulberry32 PRNG (deterministic demos)
    state/
      store.js           ties engine + market, fans out SSE updates
  test/
    battery.test.js
    decisionEngine.test.js
    engine.test.js
    market.test.js
```

## Running

```bash
cd server
npm install
cp .env.example .env   # optional, PORT defaults to 5000
npm run dev            # nodemon, restarts on file change
# or
npm start
```

Health check: `GET http://localhost:5000/` returns `GridShare API Server`.

## API

All routes are under `/api`. CORS allows `*` for local dev (Vite client on a different port).

### Community

| Method | Path | Response |
|---|---|---|
| `GET` | `/api/community` | Full snapshot (households, community totals, trends, recommendations, activity, market state, sim status) |
| `GET` | `/api/households/:id` | Single household object, or `404` |

### Simulation control

| Method | Path | Body | Response |
|---|---|---|---|
| `GET` | `/api/sim/status` | | `{ mode, simHour, speedMultiplier }` |
| `POST` | `/api/sim/control` | `{ action, speed? }` | Updated clock status |

`action` must be one of: `pause`, `resume`, `reset`, `setSpeed`, `jumpToDemo`.

- `reset`: rewinds to 8:00 AM, rebuilds all household/battery state, clears market listings/trades.
- `jumpToDemo`: same as reset but snaps the clock to 12:30 PM (`DEMO_HOUR_OF_DAY`), the pitch-deck scenario from `CLAUDE.MD` §8.
- `setSpeed`: requires `speed` (positive number). Default is `60` (1 sim hour per real minute). `1` is real-time.

### Marketplace

| Method | Path | Body | Response |
|---|---|---|---|
| `GET` | `/api/market/listings` | | Open listings array |
| `POST` | `/api/market/listings` | `{ sellerId, kwh, priceRs }` | `201` listing, or `4xx` |
| `GET` | `/api/market/trades` | | Settled trades array |
| `POST` | `/api/market/trades` | `{ listingId, buyerId }` | `201` trade, or `4xx` |

Marketplace rules enforced server-side:
- Only `house-12` (the demo user household) can list surplus. Other sellers get `403`.
- `kwh` and `priceRs` must be positive numbers.
- Listed `kwh` cannot exceed the seller's current surplus (`generationKw - consumptionKw`).
- A household cannot buy its own listing (`400`).
- Buying a listing that no longer exists returns `409`.

### Real-time stream

| Method | Path | Protocol |
|---|---|---|
| `GET` | `/api/stream` | SSE |

On connect, sends one `snapshot` event immediately with the full state. After that, sends a `snapshot` event on every simulation tick (and whenever market mutations happen). A comment ping every 15s keeps idle connections alive.

Client usage:

```js
const es = new EventSource('http://localhost:5000/api/stream')
es.addEventListener('snapshot', (e) => {
  const data = JSON.parse(e.data)
  // data shape matches GET /api/community
})
```

## State layer (`state/store.js`)

Single in-process `Store` (exported as `store` singleton):

- Owns one `SimulationEngine` and one `MarketStore`.
- `MarketStore` holds a reference to `engine.households` (the same array, mutated in place across ticks and resets).
- Extends `EventEmitter`: emits `update` with a fresh snapshot after every clock tick and after every market mutation/reset.
- `getSnapshot()` merges engine output + market state + `simStatus`.

No persistence across server restarts. Deliberate for hackathon scope.

## Simulation engine

### Clock (`sim/clock.js`)

- Ticks every `TICK_INTERVAL_MS` (2000ms real time).
- Each tick advances simulated time by `(tickIntervalMs / 3_600_000) * speedMultiplier` hours.
- Starts at 8:00 AM (matches the frontend mock's trend window).
- While paused, emits `tick` with `dtHours = 0` (readings freeze, RNG does not advance).

### Households (`config/archetypes.js` + `sim/household.js`)

Five households, same ids/labels/types as `client/src/data/mockCommunity.js`:

| ID | Type | Battery |
|---|---|---|
| `house-07` | Solar Prosumer | none |
| `house-12` | Solar + Battery Prosumer | 5 kWh, 71% initial SOC |
| `house-34` | EV Household | none |
| `house-21` | Non-Solar Consumer | none |
| `house-45` | Low-Consumption Home | none |

Each archetype carries `generationAtDemoKw` / `consumptionAtDemoKw` targets at 12:30 PM. `buildHouseholds()` calibrates `installedKwp` and `baseLoadKw` so the live sim reproduces those fixture numbers at `DEMO_HOUR_OF_DAY` and varies realistically away from it.

### Generation and demand models

- **Solar** (`solarModel.js`): cosine bell curve between 6 AM and 6 PM, normalized to peak at 12:30 PM. Output = `installedKwp * curve * weatherFactor * (1 + noise)`. Weather factor is wired for future use (defaults to 1).
- **Demand** (`demandModel.js`): two-hump residential curve (morning + evening peaks). EV profile adds an overnight charging bump. Output = `baseLoadKw * curve * (1 + noise)`.
- **RNG** (`rng.js`): seeded mulberry32 (`SIM_SEED = 20260827`), one independent stream per household per reading type. Same seed produces the same demo every run.

### Per-tick pipeline (`sim/engine.js`)

On each tick with `dtHours > 0`:

1. Read generation/consumption for every household (falls back to last-known values if a model throws, logs an `alert` activity entry).
2. Apply household-level battery logic first (currently only `house-12`): charge on surplus, discharge on deficit.
3. Run community-level `allocate()` on the post-battery net balances.
4. Update aggregates: totals, renewable %, grid flow, energy traded today, CO₂ avoided (labeled metric using 0.82 kg/kWh factor).
5. Log activity entries for trades, battery moves, grid import/export.
6. Build live recommendations from the allocation result.
7. Push trend points (generation, consumption, renewable %, community battery SOC), capped at `TREND_WINDOW` (12 points).

### Community battery

Configured in `constants.js`:

- 20 kWh capacity, 58% initial SOC (11.6 kWh), 20% reserve
- 5 kW max charge/discharge rate

Same `Battery` class as household batteries (`sim/battery.js`): rate-limited charge/discharge, SOC clamped to capacity, discharge blocked below reserve floor.

## Decision engine (`sim/decisionEngine.js`)

Rule-based priority per `CLAUDE.MD` §10. Self-consumption is already netted before this runs.

1. **Local matching** (`matchLocalTrades`): greedy two-pointer waterfall. Largest surplus feeds largest deficit first (tie-broken by household id for determinism). Produces `matches[]` with `{ fromId, fromLabel, toId, toLabel, kw }`.
2. **Community battery**: charge remaining surplus, or discharge to cover remaining deficit.
3. **Grid**: export unassigned surplus, or import unmet deficit.

Pinned regression test reproduces the §8 worked example: House A (+4.7 kW) / House B (−2.8 kW) → 2.8 kW direct match, 1.2 kWh to battery, 0.7 kW grid export.

## Snapshot schema

`GET /api/community` and SSE `snapshot` events return:

```js
{
  households: [{
    id, label, type,
    generationKw, consumptionKw,
    batterySoc,                    // null if no battery
    batteryCapacityKwh?,           // house-12 only
    batteryReservePct?,            // house-12 only
  }],
  communitySnapshot: {
    timestamp,                     // formatted sim time, e.g. "12:30 PM"
    totalGenerationKw, totalConsumptionKw, netKw,
    renewablePct,
    batteryCapacityKwh, batterySocPct, batteryReservePct, batteryChargeRateKw,
    energyTradedTodayKwh, co2AvoidedKgToday,
    gridImportPriceRs, gridFlowKw, // positive = export, negative = import
  },
  batterySocTrend, generationTrend, consumptionTrend, renewableTrend,
    // each: [{ time: "8:00 AM", pct: 42.3 }, ...]
  recommendations: [{
    id, kind, title, detail, confidence,
    inputs: [{ label, value, tone }],
  }],
  recentActivity: [{
    id, time, text, kind,          // kind: trade | battery | export | alert
  }],
  market: {
    listings: [{ id, sellerId, sellerLabel, kwh, priceRs }],
    trades: [{ id, time, sellerLabel, buyerLabel, kwh, priceRs }],
  },
  simStatus: { mode, simHour, speedMultiplier },
}
```

Field names and shapes are intentionally aligned with `client/src/data/mockCommunity.js` so the frontend can swap mock imports for API calls with minimal reshaping.

## Tests

Run from `server/`:

```bash
npm test
```

| File | What it covers |
|---|---|
| `battery.test.js` | SOC bounds, reserve floor, rate limiting, adversarial charge/discharge |
| `decisionEngine.test.js` | §8 regression, local trade matching splits, allocate energy balance |
| `engine.test.js` | Randomized energy-balance invariants across 200 trials, jump-to-demo calibration |
| `market.test.js` | Ownership rule (house-12 only), quantity/price validation, self-trade rejection |

## Integration boundary

The frontend is live-wired:

| Frontend surface | Backend source |
|---|---|
| All pages (dashboard, map, recommendations, my home) | SSE `/api/stream` snapshot events via `CommunityContext` |
| Marketplace list/buy | `POST /api/market/listings`, `POST /api/market/trades` (`client/src/lib/api.js`) |
| Recommendations, activity, trends | Computed live each tick in the engine, pushed with every snapshot |
| Sim controls | `POST /api/sim/control` exists but no UI exposes it yet |

`client/src/data/mockCommunity.js` is no longer imported by the app; it remains in the repo only as a schema reference.

## What's simulated vs. real

Real, working logic today:
- Live ticking simulation with deterministic seeded noise.
- Rule-based allocation engine (local trade → battery → grid) with regression-tested energy balance.
- Household and community battery physics (capacity, reserve, rate limits).
- Marketplace validation and ownership enforcement.
- Recommendations derived from actual allocation state each tick, with `inputs` chips matching the frontend schema.
- SSE push on every state change.

Not real yet, and should stay labeled as simulated in any UI that consumes this API:
- All generation/consumption readings are synthetic model output, not smart-meter data.
- No weather feed connected (`weatherFactor` is always 1).
- No forecasting layer (`ml/` does not exist).
- Marketplace trades are conceptual: buying a listing records a trade but does not mutate household generation/consumption.
- No authentication, no multi-tenant isolation, no persistence across server restarts.
- CO₂ avoided is a labeled estimate, not measured.

## Known gaps / next steps

- Expose sim controls in the UI (pause, jump to demo) for live presentations.
- Make marketplace trades affect household balances (or route them through the decision engine).
- Add selling preferences / auto-trade toggles from My Home as server-side policy on `house-12`.
- Optional: seed initial marketplace listings on `jumpToDemo`.
