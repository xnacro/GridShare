# GridShare Frontend

Status as of 2026-08-27. Covers `client/` only. Everything described here runs against local mock data, there is no backend wired up yet (see Data boundary below).

## Stack

- React 19 + Vite 8, `react-router-dom` 7 for client-side routing
- Tailwind CSS v4 (`@tailwindcss/vite`) + HeroUI v3 (`@heroui/react`, `@heroui/styles`) for every UI primitive, no bespoke component library
- `framer-motion`, HeroUI's required peer dependency
- No charting or icon library: sparklines and the energy flow map are hand-built SVG, icons are a small hand-drawn set in `icons.jsx`
- Lint: `oxlint` (`npm run lint`), build: `npm run build`

## Structure

```
client/src/
  App.jsx              route table
  index.css            theme tokens, global overrides
  components/          shared UI building blocks
  pages/                the 5 routed surfaces
  data/mockCommunity.js single source of truth for all simulated data
```

## Routes

Defined in `App.jsx`, all nested under one `Layout` element.

| Path | Page | Purpose |
|---|---|---|
| `/` | `Dashboard.jsx` | Community overview, landing page |
| `/map` | `LiveMap.jsx` | Radial energy flow diagram |
| `/marketplace` | `Marketplace.jsx` | List / buy local surplus |
| `/recommendations` | `Recommendations.jsx` | Rule-based engine output, explained |
| `/home` | `MyHome.jsx` | Private single-household view (House 12) |

## Layout and shell (`components/Layout.jsx`)

Top bar: GridShare wordmark, pill-style nav (`NAV_ITEMS`) built from `NavLink`, and a light/dark theme toggle (`useTheme` from HeroUI, default `light`).

Route transitions show a skeleton before the real page renders. `RouteLoader` holds a 500ms timer and renders `PageSkeleton` while pending; `RouteTransition` wraps it and remounts it via `key={pathname}` on every navigation, so the loading state resets naturally instead of being synced from an effect. This fires on first load and on every subsequent navigation. It is a simulated loading delay, not a real network wait, there is nothing to fetch yet.

`PageSkeleton.jsx` is one generic shimmer layout (title bar, stat-row blocks, two large card blocks) reused across all 5 pages, since they share roughly that shape.

## Theme (`index.css`)

Light-first, per `CLAUDE.MD` §13. Four brand colors:

- Soft Sage Mint `#E2F0CC`, light-mode background
- Near-Black Green `#011207`, light-mode text / dark-mode background
- Dark Forest Green `#012F13`, dark-mode surface / light-mode primary accent
- Apple Green `#8BC53D`, dark-mode primary accent, `success`, positive/surplus indicators

Tokens are set as CSS custom properties under `:root`/`.light` and `.dark`/`[data-theme="dark"]`, then consumed through HeroUI's own `--background`/`--foreground`/`--surface`/`--accent` variables. `danger` and `warning` are deliberately left at HeroUI's default red/amber, not mapped onto the green scale, so surplus and deficit stay visually distinguishable (an all-green palette can't encode both).

Two extra tokens exist to fix contrast problems that came up while building:
- `--accent-soft` / `--accent-soft-foreground` / `--accent-soft-hover`: HeroUI derives its soft/tinted accent tokens from `--accent` at low opacity, but `--accent` in light mode is Dark Forest Green (intentionally dark for button-text contrast), so a tint of it reads gray, not green. These are rebased on Apple Green instead.
- `--accent-vivid`: same problem for solid decorative fills (illustration details, sparkline highlights, activity dots). `--accent` stays dark on purpose; `--accent-vivid` is Apple Green for anything that doesn't need button-text contrast.

Two global component overrides, since HeroUI's defaults didn't hold up on this palette:
- `.card--default { border: 1px solid var(--border); }`: HeroUI's Card ships with no border, only a faint shadow. On a pale background the card fill and page background were nearly the same color, so cards were invisible without this.
- `.card__title { font-size: 1rem; font-weight: 700; }`: HeroUI's default card title weight matched ordinary body text, so section headers didn't read as headers.

## Data boundary (`data/mockCommunity.js`)

Everything on every page reads from this one file. It is explicitly a stand-in for the simulation engine described in the project roadmap (`server/` + `ml/`, not built yet), shaped to match the normalized reading/forecast schema so a real API becomes a drop-in replacement later rather than a rewrite. Every page carries a visible "Simulated data" chip per `CLAUDE.MD` §15.

Exports:
- `households`: 5 entries (id, label, type, generationKw, consumptionKw, batterySoc). House 12 additionally carries `batteryCapacityKwh`/`batteryReservePct` and is treated as the demo user throughout the app (My Home, Marketplace's seller/buyer identity).
- `communitySnapshot`: aggregate totals (generation, consumption, net, renewable %), community battery state (capacity, SOC, reserve, charge rate), `energyTradedTodayKwh`, `co2AvoidedKgToday`, `gridImportPriceRs`, `gridFlowKw`.
- `batterySocTrend`, `generationTrend`, `consumptionTrend`, `renewableTrend`: same morning window (8 AM to 12:30 PM), each ending at its matching `communitySnapshot` value, feeding the Dashboard's sparklines.
- `recommendations`: 3 entries (kind, title, detail, confidence), each with an `inputs` array of the actual numbers behind the suggestion (e.g. surplus kW, deficit kW, grid price) so a recommendation can be checked against the state that produced it.
- `recentActivity`: 7 timestamped events (8:05 AM to 12:30 PM), each tagged with a `kind` (`trade` / `battery` / `export`) used to pick an icon and color.

`components/kindTaxonomy.js` centralizes the `kind` → icon/tone mapping (`KIND_ICONS`, `KIND_TONES`, `TONE_CLASSES`), shared by Dashboard and Recommendations so it only exists in one place.

## Pages

### Dashboard (`/`)

Landing page, answers "what's happening in my community right now."

- Hero section: headline that reads the live surplus/deficit off `communitySnapshot`, a custom `HeroIllustration` (hand-built SVG network diagram, not a stock image) with a `RotatingBadge` overlay, links to Live Map and Recommendations.
- Live snapshot: 8 icon-badge `StatCard`s (generation, consumption, surplus/deficit, renewable share, battery, energy traded, CO₂ avoided, grid price), 4 of them carry a `Sparkline` trend.
- Households card: one row per household, generation/consumption numbers, a surplus/deficit chip, and a magnitude bar scaled against the largest net in the set.
- Battery reserve card: progress bar plus a stored/reserve/available breakdown and a SOC sparkline.
- Recommendations and Recent activity cards: each shows a short preview (2 and 3 items) with a "See more" button that opens the full list in a modal (`SeeMoreModal`) when the underlying list is longer than the preview.

### Live Map (`/map`)

Not a literal street map, an abstract radial network diagram (`components/EnergyFlowMap.jsx`): a battery hub at the center, a grid node, and the 5 households arranged around it. Household positions are computed once from polar coordinates in a percentage coordinate space.

Two layers share those coordinates:
- A background SVG draws the edges: line thickness scales with each household's net kW relative to the largest in the set, an `<animateMotion>` dot rides each edge in the direction of actual flow, plus an arrowhead marker as a non-color direction cue.
- A foreground HTML layer places one real, focusable element per node, each a HeroUI `Tooltip.Trigger` around a colored circle, revealing household type/generation/consumption on hover or keyboard focus rather than by default (nothing sensitive shown unless asked for).

Surplus is `success` green, deficit is `danger` red, consistent with the rest of the app. The page also shows a net-flow chip row (exporting count, importing count, net kW) and a legend card underneath explaining the color and thickness encoding.

### Marketplace (`/marketplace`)

Conceptual local energy exchange, local component state only, resets on reload, no persistence or backend yet.

- Sell form: hard-coded to sell from House 12 only (fixed, no household picker), amount capped to House 12's current surplus, price per kWh, a computed total. Disables itself with an explanation if House 12 currently has no surplus. Selling any other household's energy is not possible by construction, not just hidden in the UI.
- Open listings: seeded with 3 listings from other households plus House 12's own. Buy button is hidden on your own listing (no self-trade). Preview of 3, "See more" opens the full list in a modal.
- Recent trades: a settled-trade ledger, starts with 1 seeded trade and grows as listings are bought. Preview of 2.
- Both "List for sale" and "Buy" go through a shared `ConfirmDialog` (wraps HeroUI's `AlertDialog`) before anything mutates state: clicking the action button only opens a confirmation showing the household, amount, price, and total, the actual state update happens on explicit Confirm.

### Intelligence / Recommendations (`/recommendations`)

Same `recommendations` data as the Dashboard, presented in full with the actual numbers behind each suggestion:
- Each recommendation shows its `inputs` as a row of labeled chips (e.g. "Community surplus: 4.7 kW"), so a suggestion can be checked against the state that produced it instead of taken on faith. Preview of 2 of 3, "See more" for the rest.
- "How the engine decides" card: the real rule-based priority order from `CLAUDE.MD` §10 (battery reserve first, then local trade, then grid export) as a 3-step numbered list, this is a live, working policy, not a forecast.
- "Forecasting layer" card at the bottom: states plainly that weather-aware solar/demand forecasting is planned but not built (`ml/` doesn't exist yet), kept intentionally honest rather than implied.

### My Home (`/home`)

Private view for House 12 only, per `CLAUDE.MD` §7.5. Other households don't see this detail.

- 3 icon-badge stat cards: generation, consumption, surplus/deficit.
- Battery reserve card: same stored/reserve/available breakdown pattern as the Dashboard's community battery card, scaled to House 12's own 5 kWh capacity.
- Earnings card: today and this-week totals.
- Selling preferences card: minimum sell price and a reserve-before-selling percentage (`NumberField`s), local state only.
- Automated trading card: two `Switch` toggles (auto-sell above minimum price, charge-first-before-selling), explicitly cosmetic, there is no engine yet to act on them, the card says so.
- Trading history card: preview of 2 of 5 seeded trades, "See more" opens the full list in a modal.

## Shared components

| File | What it is |
|---|---|
| `SeeMoreModal.jsx` | Thin controlled wrapper around HeroUI's `Modal`, used by all 6 preview/expand cards (Dashboard's Recommendations and Recent activity, Marketplace's Open listings and Recent trades, Recommendations' Current recommendations, My Home's Trading history) |
| `ConfirmDialog.jsx` | Thin controlled wrapper around HeroUI's `AlertDialog`, used by Marketplace's List/Buy actions |
| `EnergyFlowMap.jsx` | The Live Map's radial diagram, described above |
| `HeroIllustration.jsx` | Dashboard hero's custom SVG network illustration |
| `RotatingBadge.jsx` | Small rotating badge overlay on the hero illustration |
| `Sparkline.jsx` | Small trend chart used on stat cards and the battery cards, current point in accent, history in de-emphasis gray, no legend (single series) |
| `PageSkeleton.jsx` | Generic loading placeholder, shared by every route via `Layout.jsx` |
| `icons.jsx` | Hand-built icon set, no icon library dependency |
| `kindTaxonomy.js` | `KIND_ICONS` / `KIND_TONES` / `TONE_CLASSES`, the `trade`/`battery`/`export` → icon/color mapping shared by Dashboard and Recommendations |

## What's simulated vs. real

Real, working logic today:
- The rule-based recommendation priority order shown on the Intelligence page (battery reserve, then local trade, then export) matches `CLAUDE.MD` §10, it's just not wired to an actual engine loop yet, the recommendations themselves are fixture data, not computed live.
- Household surplus/deficit math (`generationKw - consumptionKw`) is computed live from the fixture on every page that shows it.
- Marketplace buy/sell state transitions (listing → trade ledger) are real React state changes, driven by real user actions, just not persisted or backed by a real matching engine.

Not real yet, and labeled as such in the UI:
- All generation/consumption/battery numbers are static fixture data, not a live simulator tick.
- No forecasting (`ml/` service doesn't exist).
- No backend, no database, no persistence across reloads, no real settlement.

## Known gaps / next steps

- No page currently talks to a backend, `server/` exists in the repo but the frontend doesn't call it yet.
- Marketplace trade state doesn't affect a household's `generationKw`/`consumptionKw` after a sale, there's no engine to recompute that yet.
- Selling preferences and automated trading toggles on My Home are not enforced by anything.
- The simulation engine (live ticking data, WebSocket/SSE updates) described in the project roadmap has not been started.
