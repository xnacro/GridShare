import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { Battery } from '../src/sim/battery.js'

describe('Battery bounds', () => {
  test('SOC never exceeds capacity under repeated over-charge', () => {
    const b = new Battery({ capacityKwh: 10, initialSocKwh: 9, reservePct: 0, maxChargeRateKw: 100, maxDischargeRateKw: 100 })
    for (let i = 0; i < 20; i++) b.charge(5, 1)
    assert.ok(b.socKwh <= 10 + 1e-9)
    assert.ok(b.socKwh >= 0)
  })

  test('SOC never drops below 0 under repeated over-discharge with reserve 0', () => {
    const b = new Battery({ capacityKwh: 10, initialSocKwh: 1, reservePct: 0, maxChargeRateKw: 100, maxDischargeRateKw: 100 })
    for (let i = 0; i < 20; i++) b.discharge(5, 1)
    assert.ok(b.socKwh >= 0 - 1e-9)
  })

  test('discharge never crosses the reserve floor on its own', () => {
    const b = new Battery({ capacityKwh: 10, initialSocKwh: 5, reservePct: 30, maxChargeRateKw: 100, maxDischargeRateKw: 100 })
    for (let i = 0; i < 20; i++) b.discharge(5, 1)
    assert.ok(b.socKwh >= 3 - 1e-9) // 30% of 10 = 3kWh reserve
  })

  test('charge/discharge are rate-limited by dtHours', () => {
    const b = new Battery({ capacityKwh: 100, initialSocKwh: 0, reservePct: 0, maxChargeRateKw: 5, maxDischargeRateKw: 5 })
    const stored = b.charge(10, 1) // requesting 10kWh in 1h, rate caps at 5kW*1h=5kWh
    assert.ok(Math.abs(stored - 5) < 1e-9)
  })

  test('adversarial alternating charge/discharge stays in bounds', () => {
    const b = new Battery({ capacityKwh: 5, initialSocKwh: 2.5, reservePct: 20, maxChargeRateKw: 3, maxDischargeRateKw: 3 })
    for (let i = 0; i < 50; i++) {
      b.charge(Math.random() * 10, 0.5)
      b.discharge(Math.random() * 10, 0.5)
      assert.ok(b.socKwh >= -1e-9 && b.socKwh <= 5 + 1e-9, `socKwh out of bounds: ${b.socKwh}`)
    }
  })
})
