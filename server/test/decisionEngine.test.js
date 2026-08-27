import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { allocate, matchLocalTrades } from '../src/sim/decisionEngine.js'
import { Battery } from '../src/sim/battery.js'

const EPS = 1e-9

describe('decisionEngine: CLAUDE.MD §8 worked example (pinned regression)', () => {
  test('House A +4.7kW surplus / House B -2.8kW deficit -> 2.8 direct, 1.2 battery, 0.7 export', () => {
    const households = [
      { id: 'house-a', label: 'House A', generationKw: 6.8, consumptionKw: 2.1 }, // net +4.7
      { id: 'house-b', label: 'House B', generationKw: 1.2, consumptionKw: 4.0 }, // net -2.8
    ]
    // headroom exactly 1.2 kWh (20 - 18.8), reserve 0 so it doesn't interfere,
    // rate high enough not to bind -- isolates the scenario to headroom only.
    const battery = new Battery({
      capacityKwh: 20,
      initialSocKwh: 18.8,
      reservePct: 0,
      maxChargeRateKw: 10,
      maxDischargeRateKw: 10,
    })

    const result = allocate({ households, battery, dtHours: 1, gridPriceRs: 6.1 })

    assert.equal(result.matches.length, 1)
    assert.equal(result.matches[0].fromId, 'house-a')
    assert.equal(result.matches[0].toId, 'house-b')
    assert.ok(Math.abs(result.matches[0].kw - 2.8) < EPS)

    assert.ok(Math.abs(result.batteryDeltaKwh - 1.2) < EPS)
    assert.equal(result.batteryDirection, 'charging')
    assert.ok(Math.abs(result.gridExportKw - 0.7) < EPS)
    assert.equal(result.gridImportKw, 0)
  })
})

describe('matchLocalTrades', () => {
  test('splits one surplus across two deficits', () => {
    const nets = [
      { id: 'a', label: 'A', netKw: 5 },
      { id: 'b', label: 'B', netKw: -2 },
      { id: 'c', label: 'C', netKw: -1 },
    ]
    const { matches, surplusRemainingKw, deficitRemainingKw } = matchLocalTrades(nets)
    const totalMatched = matches.reduce((sum, m) => sum + m.kw, 0)
    assert.ok(Math.abs(totalMatched - 3) < EPS)
    assert.ok(Math.abs(surplusRemainingKw - 2) < EPS)
    assert.equal(deficitRemainingKw, 0)
  })

  test('no surplus and no deficit -> no matches', () => {
    const { matches, surplusRemainingKw, deficitRemainingKw } = matchLocalTrades([
      { id: 'a', label: 'A', netKw: 0 },
    ])
    assert.equal(matches.length, 0)
    assert.equal(surplusRemainingKw, 0)
    assert.equal(deficitRemainingKw, 0)
  })
})

describe('allocate: deficit branch', () => {
  test('deficit remaining after matching draws from battery then grid', () => {
    const households = [
      { id: 'a', label: 'A', generationKw: 0, consumptionKw: 5 }, // net -5
    ]
    const battery = new Battery({
      capacityKwh: 10,
      initialSocKwh: 3, // reserve 20% of 10 = 2kWh reserve, so 1kWh available
      reservePct: 20,
      maxChargeRateKw: 10,
      maxDischargeRateKw: 10,
    })
    const result = allocate({ households, battery, dtHours: 1, gridPriceRs: 6.1 })
    assert.equal(result.matches.length, 0)
    assert.ok(Math.abs(result.batteryDeltaKwh - 1) < EPS)
    assert.equal(result.batteryDirection, 'discharging')
    assert.ok(Math.abs(result.gridImportKw - 4) < EPS)
    assert.equal(result.gridExportKw, 0)
  })
})
