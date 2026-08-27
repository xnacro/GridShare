// SIMULATION DATA: static fixture standing in for the community energy
// engine (see the project roadmap: server/ simulation engine + ml/ forecasts
// are not built yet). Shaped to match the normalized reading/forecast schema
// so wiring real API data later is a drop-in replacement, not a rewrite.

export const households = [
  { id: 'house-07', label: 'House 07', type: 'Solar Prosumer', generationKw: 6.8, consumptionKw: 2.1, batterySoc: null },
  { id: 'house-12', label: 'House 12', type: 'Solar + Battery Prosumer', generationKw: 4.3, consumptionKw: 2.8, batterySoc: 71, batteryCapacityKwh: 5, batteryReservePct: 20 },
  { id: 'house-34', label: 'House 34', type: 'EV Household', generationKw: 1.2, consumptionKw: 4.0, batterySoc: null },
  { id: 'house-21', label: 'House 21', type: 'Non-Solar Consumer', generationKw: 0, consumptionKw: 2.6, batterySoc: null },
  { id: 'house-45', label: 'House 45', type: 'Low-Consumption Home', generationKw: 3.4, consumptionKw: 1.9, batterySoc: null },
]

const totalGenerationKw = households.reduce((sum, h) => sum + h.generationKw, 0)
const totalConsumptionKw = households.reduce((sum, h) => sum + h.consumptionKw, 0)

export const communitySnapshot = {
  timestamp: '2026-08-27T12:30:00',
  totalGenerationKw,
  totalConsumptionKw,
  netKw: totalGenerationKw - totalConsumptionKw,
  renewablePct: 96, // illustrative: % of demand served by local renewables this instant
  batteryCapacityKwh: 20,
  batterySocPct: 58,
  batteryReservePct: 20, // minimum charge the engine won't discharge below, kept for outages
  batteryChargeRateKw: 1.2, // current charge rate, matches the "Charge community battery" recommendation
  energyTradedTodayKwh: 14.6,
  co2AvoidedKgToday: 9.2,
  gridImportPriceRs: 6.10,
  gridFlowKw: 0.7, // positive means exporting to the grid, matches the recent-activity export event
}

// Battery state of charge through the morning, ending at the current
// communitySnapshot.batterySocPct value.
export const batterySocTrend = [
  { time: '8 AM', pct: 22 },
  { time: '9 AM', pct: 31 },
  { time: '10 AM', pct: 40 },
  { time: '11 AM', pct: 48 },
  { time: '12 PM', pct: 53 },
  { time: '12:30 PM', pct: 58 },
]

// Same morning window for the three headline "Live snapshot" stats, each
// trend ending at its matching communitySnapshot value.
export const generationTrend = [
  { time: '8 AM', pct: 3.5 },
  { time: '9 AM', pct: 6.8 },
  { time: '10 AM', pct: 10.2 },
  { time: '11 AM', pct: 13.1 },
  { time: '12 PM', pct: 15.0 },
  { time: '12:30 PM', pct: 15.7 },
]

export const consumptionTrend = [
  { time: '8 AM', pct: 9.8 },
  { time: '9 AM', pct: 10.5 },
  { time: '10 AM', pct: 11.6 },
  { time: '11 AM', pct: 12.4 },
  { time: '12 PM', pct: 13.0 },
  { time: '12:30 PM', pct: 13.4 },
]

export const renewableTrend = [
  { time: '8 AM', pct: 38 },
  { time: '9 AM', pct: 55 },
  { time: '10 AM', pct: 72 },
  { time: '11 AM', pct: 85 },
  { time: '12 PM', pct: 92 },
  { time: '12:30 PM', pct: 96 },
]

// Each recommendation's `inputs` are the actual numbers behind the
// decision, not decoration, so a recommendation can be checked against
// the state that produced it rather than taken on faith.
export const recommendations = [
  {
    id: 'rec-1',
    kind: 'trade',
    title: 'Route surplus to House 34',
    detail: '2.8 kWh of community surplus can meet House 34\'s deficit directly instead of drawing from the grid at ₹6.10/kWh peak rate.',
    confidence: 'High',
    inputs: [
      { label: 'Community surplus', value: '4.7 kW', tone: 'success' },
      { label: 'House 34 deficit', value: '−2.8 kW', tone: 'danger' },
      { label: 'Grid price', value: '₹6.10/kWh', tone: 'default' },
    ],
  },
  {
    id: 'rec-2',
    kind: 'battery',
    title: 'Charge community battery',
    detail: 'Battery is at 58%. 1.2 kWh of remaining surplus can top it up before exporting anything to the grid.',
    confidence: 'High',
    inputs: [
      { label: 'Battery charge', value: '58%', tone: 'accent' },
      { label: 'Remaining surplus', value: '1.2 kWh', tone: 'success' },
      { label: 'Reserve threshold', value: '20%', tone: 'default' },
    ],
  },
  {
    id: 'rec-3',
    kind: 'export',
    title: 'Export remainder to grid',
    detail: '0.7 kWh of surplus has no local demand or battery headroom left. Exporting it captures value instead of curtailing generation.',
    confidence: 'Medium',
    inputs: [
      { label: 'Unassigned surplus', value: '0.7 kWh', tone: 'success' },
      { label: 'Local demand', value: 'None left', tone: 'default' },
      { label: 'Grid export rate', value: '₹6.10/kWh', tone: 'default' },
    ],
  },
]

export const recentActivity = [
  { id: 'act-1', time: '12:30 PM', text: 'House 07 surplus (4.7 kW) allocated: 2.8 kWh → House 34, 1.2 kWh → battery, 0.7 kWh → grid export', kind: 'trade' },
  { id: 'act-2', time: '12:14 PM', text: 'Community battery reached 58% state of charge', kind: 'battery' },
  { id: 'act-3', time: '11:52 AM', text: 'House 12 listed 1.5 kWh surplus on the local marketplace', kind: 'trade' },
  { id: 'act-4', time: '11:30 AM', text: 'Grid export rate updated to ₹6.10/kWh (peak window)', kind: 'export' },
  { id: 'act-5', time: '10:20 AM', text: 'Community battery reached 40% state of charge', kind: 'battery' },
  { id: 'act-6', time: '9:15 AM', text: 'House 07 crossed into surplus as morning generation ramped up', kind: 'trade' },
  { id: 'act-7', time: '8:05 AM', text: 'Community battery at 22% overnight, simulation day started', kind: 'battery' },
]
