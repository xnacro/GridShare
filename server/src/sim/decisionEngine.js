// Rule-based priority engine, CLAUDE.MD §10:
//   deficit -> find local surplus, rank, match
//   surplus -> satisfy local demand, consider battery, expose remainder, export
// Self-consumption is already netted out before this runs (generationKw -
// consumptionKw per household), so "meet local household demand" is step 0.
const EPSILON = 1e-9

// Greedy two-pointer waterfall: largest surplus feeds largest deficit first
// (tie-broken by household id for determinism), splitting across multiple
// counterparties as needed. Pure function, no side effects.
export function matchLocalTrades(householdNets) {
  const surplus = householdNets
    .filter((h) => h.netKw > EPSILON)
    .map((h) => ({ ...h }))
    .sort((a, b) => b.netKw - a.netKw || a.id.localeCompare(b.id))
  const deficit = householdNets
    .filter((h) => h.netKw < -EPSILON)
    .map((h) => ({ ...h, needKw: -h.netKw }))
    .sort((a, b) => b.needKw - a.needKw || a.id.localeCompare(b.id))

  const matches = []
  let si = 0
  let di = 0
  while (si < surplus.length && di < deficit.length) {
    const s = surplus[si]
    const d = deficit[di]
    const kw = Math.min(s.netKw, d.needKw)
    if (kw > EPSILON) {
      matches.push({ fromId: s.id, fromLabel: s.label, toId: d.id, toLabel: d.label, kw })
      s.netKw -= kw
      d.needKw -= kw
    }
    if (s.netKw <= EPSILON) si++
    if (d.needKw <= EPSILON) di++
  }

  const surplusRemainingKw = surplus.reduce((sum, s) => sum + Math.max(s.netKw, 0), 0)
  const deficitRemainingKw = deficit.reduce((sum, d) => sum + Math.max(d.needKw, 0), 0)

  return { matches, surplusRemainingKw, deficitRemainingKw }
}

// households: [{ id, label, generationKw, consumptionKw }]
// battery: a sim/battery.js Battery instance (mutated in place by charge/discharge)
// Returns the full allocation for this tick. Pure aside from the battery
// mutation, which is the one piece of state this function is meant to own.
export function allocate({ households, battery, dtHours, gridPriceRs }) {
  const householdNets = households.map((h) => ({
    id: h.id,
    label: h.label,
    netKw: h.generationKw - h.consumptionKw,
  }))

  const { matches, surplusRemainingKw, deficitRemainingKw } = matchLocalTrades(householdNets)

  let batteryDeltaKwh = 0
  let batteryDirection = 'idle'
  if (surplusRemainingKw > EPSILON) {
    batteryDeltaKwh = battery.charge(surplusRemainingKw * dtHours, dtHours)
    batteryDirection = batteryDeltaKwh > EPSILON ? 'charging' : 'idle'
  } else if (deficitRemainingKw > EPSILON) {
    batteryDeltaKwh = battery.discharge(deficitRemainingKw * dtHours, dtHours)
    batteryDirection = batteryDeltaKwh > EPSILON ? 'discharging' : 'idle'
  }

  const batteryDeltaKw = dtHours > 0 ? batteryDeltaKwh / dtHours : 0
  const gridExportKw = surplusRemainingKw > EPSILON ? Math.max(surplusRemainingKw - batteryDeltaKw, 0) : 0
  const gridImportKw = deficitRemainingKw > EPSILON ? Math.max(deficitRemainingKw - batteryDeltaKw, 0) : 0

  return {
    householdNets,
    matches,
    surplusRemainingKw,
    deficitRemainingKw,
    batteryDeltaKwh,
    batteryDeltaKw,
    batteryDirection,
    gridExportKw,
    gridImportKw,
    gridPriceRs,
  }
}
