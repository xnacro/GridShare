import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { allocate } from '../src/sim/decisionEngine.js'
import { Battery } from '../src/sim/battery.js'
import { SimulationEngine } from '../src/sim/engine.js'

const EPS = 1e-6

describe('energy balance: allocate() never creates or destroys energy', () => {
  test('randomized households/batteries reconcile every time', () => {
    for (let trial = 0; trial < 200; trial++) {
      const householdCount = 2 + Math.floor(Math.random() * 6)
      const households = Array.from({ length: householdCount }, (_, i) => ({
        id: `h${i}`,
        label: `H${i}`,
        generationKw: Math.random() * 8,
        consumptionKw: Math.random() * 8,
      }))
      const totalNetKw = households.reduce((sum, h) => sum + (h.generationKw - h.consumptionKw), 0)

      const battery = new Battery({
        capacityKwh: 20,
        initialSocKwh: Math.random() * 20,
        reservePct: Math.floor(Math.random() * 50),
        maxChargeRateKw: 1 + Math.random() * 10,
        maxDischargeRateKw: 1 + Math.random() * 10,
      })
      const dtHours = 0.1 + Math.random() * 2

      const result = allocate({ households, battery, dtHours, gridPriceRs: 6.1 })

      // Matching conserves total net power.
      const conserved = result.surplusRemainingKw - result.deficitRemainingKw
      assert.ok(Math.abs(conserved - totalNetKw) < EPS, `matching did not conserve energy: ${conserved} vs ${totalNetKw}`)

      // Never both a grid import and export in the same tick.
      assert.ok(result.gridExportKw === 0 || result.gridImportKw === 0)

      const batteryDeltaKw = result.batteryDeltaKwh / dtHours
      if (result.surplusRemainingKw > EPS) {
        assert.ok(
          Math.abs(result.surplusRemainingKw - batteryDeltaKw - result.gridExportKw) < EPS,
          'surplus not fully accounted for by battery + export',
        )
        assert.equal(result.gridImportKw, 0)
      } else if (result.deficitRemainingKw > EPS) {
        assert.ok(
          Math.abs(result.deficitRemainingKw - batteryDeltaKw - result.gridImportKw) < EPS,
          'deficit not fully accounted for by battery + import',
        )
        assert.equal(result.gridExportKw, 0)
      }

      // Battery never leaves its physical bounds.
      assert.ok(battery.socKwh >= -EPS && battery.socKwh <= battery.capacityKwh + EPS)
    }
  })
})

describe('SimulationEngine resilience (§21: one bad household must not crash the dashboard)', () => {
  test('a throwing household falls back to last-known values, others unaffected', () => {
    const engine = new SimulationEngine()
    const target = engine.households[0]
    // Forces solarModel's `installedKwp * ...` to throw via valueOf, the way
    // any unexpected bad reading would -- exercises the real try/catch path
    // in engine.js's _readHousehold rather than a re-implementation of it.
    target.installedKwp = { valueOf() { throw new Error('sensor fault') } }

    engine.clock.resume()
    engine.clock.tick()

    const snapshot = engine.getSnapshot()
    assert.equal(snapshot.households.length, engine.households.length)
    for (const h of snapshot.households) {
      assert.ok(Number.isFinite(h.generationKw), `${h.id} generationKw not finite`)
      assert.ok(Number.isFinite(h.consumptionKw), `${h.id} consumptionKw not finite`)
    }
    assert.ok(
      snapshot.recentActivity.some((a) => a.kind === 'alert'),
      'expected an alert activity entry for the failed household',
    )
  })
})

describe('SimulationEngine multi-tick stability', () => {
  test('battery SOC and community snapshot stay well-formed over many ticks', () => {
    const engine = new SimulationEngine()
    engine.clock.resume()
    for (let i = 0; i < 100; i++) {
      engine.clock.tick()
    }
    const snapshot = engine.getSnapshot()
    assert.ok(snapshot.communitySnapshot.batterySocPct >= 0 && snapshot.communitySnapshot.batterySocPct <= 100)
    for (const h of snapshot.households) {
      if (h.batterySoc !== null) {
        assert.ok(h.batterySoc >= 0 && h.batterySoc <= 100)
      }
      assert.ok(h.generationKw >= 0)
      assert.ok(h.consumptionKw >= 0)
    }
    assert.ok(snapshot.communitySnapshot.energyTradedTodayKwh >= 0)
    assert.ok(snapshot.communitySnapshot.co2AvoidedKgToday >= 0)
  })

  test('reset() returns to a fresh, well-formed state', () => {
    const engine = new SimulationEngine()
    engine.clock.resume()
    for (let i = 0; i < 10; i++) engine.clock.tick()
    engine.reset()
    const snapshot = engine.getSnapshot()
    assert.equal(engine.clock.simHour, 8)
    assert.equal(snapshot.communitySnapshot.energyTradedTodayKwh, 0)
  })

  test('jumpToDemo() lands exactly at 12:30 PM', () => {
    const engine = new SimulationEngine()
    engine.jumpToDemo()
    assert.equal(engine.clock.simHour, 12.5)
  })
})
