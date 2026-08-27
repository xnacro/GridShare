# GridShare

**An intelligent coordination layer for distributed community energy.**

GridShare is not just a peer-to-peer electricity marketplace. It is a community energy operating layer that observes real-time generation and consumption across a neighborhood, predicts what happens next, decides how to optimize storage and local trade, and only then executes that decision, with P2P trading as one mechanism inside a larger system, not the whole product.

> Observe → Predict → Optimize → Trade

Built by **Team Nyxelle** for the **AVINYA 2026** hackathon.

## What it does

A community of households, each with its own solar generation, consumption, and (for some) battery storage, is simulated continuously by a backend engine. Every tick, the engine:

1. Nets each household's own generation against its own consumption.
2. Matches local surplus against local deficit directly, household to household, before touching anything else.
3. Charges the community battery from any surplus left over, or discharges it to cover any deficit left over, respecting a reserve floor.
4. Sends whatever's still unmatched to the grid, as an export or an import.

The frontend shows this live: a community dashboard, an animated energy flow map, a conceptual buy/sell marketplace, an explainable recommendations feed grounded in the engine's actual numbers, and a private household view.

All data is simulated. There is no real hardware, no real utility connection, and no real money changes hands anywhere in this prototype. Every simulated surface says so.

## Project structure

```
client/   React 19 + Vite + HeroUI v3 + Tailwind v4, 5-page dashboard, live via SSE
server/   Express backend: deterministic simulation engine, rule-based decision engine,
          in-memory marketplace, REST + Server-Sent Events API
ml/       Reserved for a future forecasting service, not built yet
docs/     Architecture and build notes (see docs/frontend.md, docs/backend.md)
```

## Status

| Layer | State |
|---|---|
| Frontend (5 pages) | Built, live-wired to the backend via SSE |
| Simulation engine | Built: household models, community + household batteries, rule-based allocation, 22 passing tests |
| Marketplace | Live buy/sell against the real backend, ownership enforced server-side |
| Real-time updates | Server-Sent Events (`/api/stream`), one shared connection, auto-reconnecting |
| Forecasting (`ml/`) | Not started, explicitly out of scope for the current build |
| Persistence | None yet, in-memory only, by design for this stage |

See [`docs/frontend.md`](docs/frontend.md) and [`docs/backend.md`](docs/backend.md) for full breakdowns of each layer.

## Running it locally

Two processes, both required for the app to show live data.

**Backend**

```bash
cd server
npm install
npm start          # http://localhost:5000
npm test           # runs the simulation engine's test suite
```

**Frontend**

```bash
cd client
npm install
npm run dev         # http://localhost:5173
```

The client reads the backend's address from `VITE_API_BASE_URL` (see `client/.env.example`), defaulting to `http://localhost:5000`. Start the backend first: the frontend subscribes to `/api/stream` on load and shows a clear unreachable state if no snapshot arrives within 10 seconds.

Optional sim controls (pause, reset, jump to the 12:30 PM demo) are available via `POST /api/sim/control`; see [`docs/backend.md`](docs/backend.md) for the full API.

## Tech stack

- **Frontend**: React 19, Vite, react-router-dom, Tailwind CSS v4, HeroUI v3
- **Backend**: Node.js, Express 5, Server-Sent Events, `node:test`
- No database, no message broker, no external services: everything runs as two local processes

## Why this approach

The judging criteria reward solution innovation, technical feasibility, scalability, and sustainability impact, not infrastructure for its own sake. GridShare deliberately stays simple where simplicity is the more impressive choice: an in-memory simulation instead of a database that adds operational risk for a demo, Server-Sent Events instead of a heavier real-time stack, a seeded deterministic engine so a live demo never breaks from randomness. The architecture is built to make the next stages (real smart-meter data, real batteries, real forecasting) a natural extension rather than a rewrite.

## Team

Team Nyxelle: Ayush, Prince Tiwari.
