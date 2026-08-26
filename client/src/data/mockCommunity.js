// SIMULATION DATA — static fixture standing in for the community energy
// engine (see the project roadmap: server/ simulation engine + ml/ forecasts
// are not built yet). Shaped to match the normalized reading/forecast schema
// so wiring real API data later is a drop-in replacement, not a rewrite.

export const households = [
  { id: 'house-07', label: 'House 07', type: 'Solar Prosumer', generationKw: 6.8, consumptionKw: 2.1, batterySoc: null },
  { id: 'house-12', label: 'House 12', type: 'Solar + Battery Prosumer', generationKw: 4.3, consumptionKw: 2.8, batterySoc: 71 },
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
  renewablePct: 96, // illustrative — % of demand served by local renewables this instant
  batteryCapacityKwh: 20,
  batterySocPct: 58,
  energyTradedTodayKwh: 14.6,
  co2AvoidedKgToday: 9.2,
  gridImportPriceRs: 6.10,
}

export const recommendations = [
  {
    id: 'rec-1',
    title: 'Route surplus to House 34',
    detail: '2.8 kWh of community surplus can meet House 34\'s deficit directly instead of drawing from the grid at ₹6.10/kWh peak rate.',
    confidence: 'High',
  },
  {
    id: 'rec-2',
    title: 'Charge community battery',
    detail: 'Battery is at 58% — 1.2 kWh of remaining surplus can top it up before exporting anything to the grid.',
    confidence: 'High',
  },
  {
    id: 'rec-3',
    title: 'Export remainder to grid',
    detail: '0.7 kWh of surplus has no local demand or battery headroom left — exporting it captures value instead of curtailing generation.',
    confidence: 'Medium',
  },
]

export const recentActivity = [
  { id: 'act-1', time: '12:30 PM', text: 'House 07 surplus (4.7 kW) allocated: 2.8 kWh → House 34, 1.2 kWh → battery, 0.7 kWh → grid export', kind: 'trade' },
  { id: 'act-2', time: '12:14 PM', text: 'Community battery reached 58% state of charge', kind: 'battery' },
  { id: 'act-3', time: '11:52 AM', text: 'House 12 listed 1.5 kWh surplus on the local marketplace', kind: 'trade' },
  { id: 'act-4', time: '11:30 AM', text: 'Grid export rate updated to ₹6.10/kWh (peak window)', kind: 'export' },
]
