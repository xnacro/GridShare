// Central knobs for the simulation, per CLAUDE.MD §9 (deterministic/reproducible)
// and §15 (simulated data must stay clearly labeled and easy to reason about).

export const DEMO_HOUSEHOLD_ID = 'house-12'

// Seeded PRNG seed. Same seed -> same noise sequence -> same demo every run.
export const SIM_SEED = 20260827

// One real-world tick, and how much simulated time it covers at 1x speed.
export const TICK_INTERVAL_MS = 2000
export const DEFAULT_SPEED_MULTIPLIER = 60 // 1 sim hour ~= 1 real minute
export const LIVE_SPEED_MULTIPLIER = 1

// The pitch deck's own worked example (CLAUDE.MD §8) happens at 12:30 PM.
// "Jump to demo" snaps the simulated clock here.
export const DEMO_HOUR_OF_DAY = 12.5

// Community battery (CLAUDE.MD §9: capacity, SOC, charge/discharge, reserve).
export const COMMUNITY_BATTERY = {
  capacityKwh: 20,
  initialSocKwh: 11.6, // 58%, matches the original mock snapshot
  reservePct: 20,
  maxChargeRateKw: 5,
  maxDischargeRateKw: 5,
}

export const GRID_IMPORT_PRICE_RS = 6.10

// How many points each sparkline trend keeps (matches the mock's 6-point window).
export const TREND_WINDOW = 12

// How many recentActivity entries to retain.
export const ACTIVITY_LOG_LIMIT = 20

export const KIND = {
  TRADE: 'trade',
  BATTERY: 'battery',
  EXPORT: 'export',
  ALERT: 'alert',
}
