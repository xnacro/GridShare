import { SimClock } from './clock.js'
import { buildHouseholds } from './household.js'
import { Battery } from './battery.js'
import { generationKw } from './solarModel.js'
import { consumptionKw } from './demandModel.js'
import { allocate } from './decisionEngine.js'
import { createRngFactory } from './rng.js'
import {
  SIM_SEED,
  COMMUNITY_BATTERY,
  GRID_IMPORT_PRICE_RS,
  DEMO_HOUR_OF_DAY,
  TREND_WINDOW,
  ACTIVITY_LOG_LIMIT,
  KIND,
} from '../config/constants.js'

const CO2_KG_PER_KWH = 0.82 // typical grid emission factor, used only to label "CO2 avoided"

function formatTime(simHour) {
  const totalMinutes = Math.round(simHour * 60) % (24 * 60)
  const h24 = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  const period = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export class SimulationEngine {
  constructor() {
    this.rngFor = createRngFactory(SIM_SEED)
    this.clock = new SimClock()
    this.gridPriceRs = GRID_IMPORT_PRICE_RS
    this._resetState()
    this.clock.on('tick', (dtHours) => this._onTick(dtHours))
    // Populate a real snapshot immediately so a client hitting the API
    // right after server start doesn't see an empty/zeroed state while
    // waiting for the first real interval tick.
    this._onTick(1 / 3600)
  }

  _resetState() {
    // Mutate the existing households array in place rather than
    // reassigning it: MarketStore is handed this array once at
    // construction and expects it to keep reflecting live state across
    // reset()/jumpToDemo(), not go stale pointing at an abandoned array.
    const fresh = buildHouseholds()
    if (this.households) {
      this.households.length = 0
      this.households.push(...fresh)
    } else {
      this.households = fresh
    }
    this.communityBattery = new Battery(COMMUNITY_BATTERY)
    this.energyTradedTodayKwh = 0
    this.co2AvoidedKgToday = 0
    this.gridFlowKw = 0
    this.recommendations = []
    this.recentActivity = []
    this.trends = {
      batterySocTrend: [],
      generationTrend: [],
      consumptionTrend: [],
      renewableTrend: [],
    }
    this._activitySeq = 0
  }

  start() {
    this.clock.start()
  }

  stop() {
    this.clock.stop()
  }

  pause() {
    this.clock.pause()
  }

  resume() {
    this.clock.resume()
  }

  setSpeed(multiplier) {
    this.clock.setSpeed(multiplier)
  }

  reset() {
    this._resetState()
    this.clock.setHour(8)
    this.clock.resume()
    // A negligible dtHours populates the snapshot immediately without
    // advancing simHour away from the exact reset point.
    this._onTick(1 / 3600)
  }

  jumpToDemo() {
    this._resetState()
    this.clock.setHour(DEMO_HOUR_OF_DAY)
    this.clock.resume()
    this._onTick(1 / 3600)
  }

  // A household model throwing must not take the rest of the dashboard
  // down with it (CLAUDE.MD §21). Falls back to the household's last-known
  // -good values and logs a visible alert instead.
  _readHousehold(h, simHour) {
    try {
      const gen = generationKw({ installedKwp: h.installedKwp, hourOfDay: simHour, rng: this.rngFor(`${h.id}:gen`) })
      const cons = consumptionKw({ baseLoadKw: h.baseLoadKw, hourOfDay: simHour, profile: h.demandProfile, rng: this.rngFor(`${h.id}:cons`) })
      h.lastGenerationKw = gen
      h.lastConsumptionKw = cons
      return { generationKw: gen, consumptionKw: cons }
    } catch (err) {
      this._logActivity(KIND.ALERT, `${h.label} reading unavailable, using last known values`)
      return { generationKw: h.lastGenerationKw, consumptionKw: h.lastConsumptionKw }
    }
  }

  _onTick(dtHours) {
    // Paused: freeze exactly as-is, don't jitter readings or burn rng draws.
    if (dtHours <= 0) return

    const simHour = this.clock.simHour

    const readings = this.households.map((h) => ({ h, ...this._readHousehold(h, simHour) }))

    // Household-level batteries (currently just house-12) absorb their own
    // surplus/deficit first, self-consumption before community sharing,
    // before the remainder joins the community-wide allocation.
    const postPersonalBattery = readings.map(({ h, generationKw: gen, consumptionKw: cons }) => {
      let netKw = gen - cons
      if (h.battery && dtHours > 0) {
        if (netKw > 0) {
          const storedKwh = h.battery.charge(netKw * dtHours, dtHours)
          netKw -= storedKwh / dtHours
        } else if (netKw < 0) {
          const drawnKwh = h.battery.discharge(-netKw * dtHours, dtHours)
          netKw += drawnKwh / dtHours
        }
      }
      return { id: h.id, label: h.label, generationKw: gen, consumptionKw: cons, netKw }
    })

    const allocation = allocate({
      households: postPersonalBattery.map((h) => ({ id: h.id, label: h.label, generationKw: h.netKw, consumptionKw: 0 })),
      battery: this.communityBattery,
      dtHours,
      gridPriceRs: this.gridPriceRs,
    })

    const totalGenerationKw = readings.reduce((sum, r) => sum + r.generationKw, 0)
    const totalConsumptionKw = readings.reduce((sum, r) => sum + r.consumptionKw, 0)
    const netKw = totalGenerationKw - totalConsumptionKw

    this.gridFlowKw = allocation.gridExportKw - allocation.gridImportKw
    const tradedKwh = allocation.matches.reduce((sum, m) => sum + m.kw, 0) * dtHours
    this.energyTradedTodayKwh += tradedKwh
    this.co2AvoidedKgToday += totalGenerationKw * dtHours * CO2_KG_PER_KWH
    this._logAllocationActivity(allocation, dtHours)
    this.recommendations = this._buildRecommendations(allocation)

    const renewablePct = totalConsumptionKw > 0
      ? clamp(((totalConsumptionKw - allocation.gridImportKw) / totalConsumptionKw) * 100, 0, 100)
      : 100

    this.households.forEach((h) => {
      const reading = readings.find((r) => r.h.id === h.id)
      h.generationKw = reading.generationKw
      h.consumptionKw = reading.consumptionKw
      h.batterySoc = h.battery ? Math.round(h.battery.socPct) : null
    })

    this._pushTrendPoint('generationTrend', totalGenerationKw)
    this._pushTrendPoint('consumptionTrend', totalConsumptionKw)
    this._pushTrendPoint('renewableTrend', renewablePct)
    this._pushTrendPoint('batterySocTrend', this.communityBattery.socPct)

    this._netKw = netKw
    this._totalGenerationKw = totalGenerationKw
    this._totalConsumptionKw = totalConsumptionKw
    this._renewablePct = renewablePct
  }

  _pushTrendPoint(key, value) {
    const arr = this.trends[key]
    arr.push({ time: formatTime(this.clock.simHour), pct: round1(value) })
    if (arr.length > TREND_WINDOW) arr.shift()
  }

  _logActivity(kind, text) {
    this._activitySeq += 1
    this.recentActivity.unshift({ id: `act-${this._activitySeq}`, time: formatTime(this.clock.simHour), text, kind })
    if (this.recentActivity.length > ACTIVITY_LOG_LIMIT) this.recentActivity.length = ACTIVITY_LOG_LIMIT
  }

  _logAllocationActivity(allocation, dtHours) {
    for (const m of allocation.matches) {
      this._logActivity(KIND.TRADE, `${m.fromLabel} surplus routed: ${round1(m.kw)} kW → ${m.toLabel}`)
    }
    if (allocation.batteryDirection === 'charging' && allocation.batteryDeltaKwh > 0.01) {
      this._logActivity(KIND.BATTERY, `Community battery charged ${round1(allocation.batteryDeltaKwh)} kWh, now ${round1(this.communityBattery.socPct)}% charged`)
    } else if (allocation.batteryDirection === 'discharging' && allocation.batteryDeltaKwh > 0.01) {
      this._logActivity(KIND.BATTERY, `Community battery discharged ${round1(allocation.batteryDeltaKwh)} kWh, now ${round1(this.communityBattery.socPct)}% charged`)
    }
    if (allocation.gridExportKw > 0.01) {
      this._logActivity(KIND.EXPORT, `${round1(allocation.gridExportKw)} kW exported to grid at ₹${this.gridPriceRs.toFixed(2)}/kWh`)
    } else if (allocation.gridImportKw > 0.01) {
      this._logActivity(KIND.EXPORT, `${round1(allocation.gridImportKw)} kW imported from grid at ₹${this.gridPriceRs.toFixed(2)}/kWh`)
    }
  }

  _buildRecommendations(allocation) {
    const recs = []
    for (const m of allocation.matches) {
      recs.push({
        id: `rec-trade-${m.fromId}-${m.toId}`,
        kind: KIND.TRADE,
        title: `Route surplus to ${m.toLabel}`,
        detail: `${round1(m.kw)} kW of ${m.fromLabel}'s surplus can meet ${m.toLabel}'s deficit directly instead of drawing from the grid at ₹${this.gridPriceRs.toFixed(2)}/kWh.`,
        confidence: 'High',
        inputs: [
          { label: `${m.fromLabel} surplus`, value: `${round1(m.kw)} kW`, tone: 'success' },
          { label: `${m.toLabel} deficit`, value: `−${round1(m.kw)} kW`, tone: 'danger' },
          { label: 'Grid price', value: `₹${this.gridPriceRs.toFixed(2)}/kWh`, tone: 'default' },
        ],
      })
    }
    // Rate-based (kW), not the tick's kWh amount: kWh scales with dtHours
    // (tick length), which would make this flicker in and out right after
    // reset()/jumpToDemo()'s deliberately tiny population tick. kW reflects
    // "what's happening right now" regardless of tick length.
    if (allocation.batteryDirection === 'charging' && allocation.batteryDeltaKw > 0.01) {
      recs.push({
        id: 'rec-battery-charge',
        kind: KIND.BATTERY,
        title: 'Charge community battery',
        detail: `Battery is at ${round1(this.communityBattery.socPct)}%. ${round1(allocation.batteryDeltaKw)} kW of remaining surplus can top it up before exporting anything to the grid.`,
        confidence: 'High',
        inputs: [
          { label: 'Battery charge', value: `${round1(this.communityBattery.socPct)}%`, tone: 'accent' },
          { label: 'Remaining surplus', value: `${round1(allocation.surplusRemainingKw)} kW`, tone: 'success' },
          { label: 'Reserve threshold', value: `${this.communityBattery.reservePct}%`, tone: 'default' },
        ],
      })
    }
    if (allocation.batteryDirection === 'discharging' && allocation.batteryDeltaKw > 0.01) {
      recs.push({
        id: 'rec-battery-discharge',
        kind: KIND.BATTERY,
        title: 'Draw from community battery',
        detail: `Battery is at ${round1(this.communityBattery.socPct)}%, above its ${this.communityBattery.reservePct}% reserve. ${round1(allocation.batteryDeltaKw)} kW can cover local deficit before importing from the grid at ₹${this.gridPriceRs.toFixed(2)}/kWh.`,
        confidence: 'High',
        inputs: [
          { label: 'Battery charge', value: `${round1(this.communityBattery.socPct)}%`, tone: 'accent' },
          { label: 'Remaining deficit', value: `${round1(allocation.deficitRemainingKw)} kW`, tone: 'danger' },
          { label: 'Reserve threshold', value: `${this.communityBattery.reservePct}%`, tone: 'default' },
        ],
      })
    }
    if (allocation.gridExportKw > 0.01) {
      recs.push({
        id: 'rec-export',
        kind: KIND.EXPORT,
        title: 'Export remainder to grid',
        detail: `${round1(allocation.gridExportKw)} kWh of surplus has no local demand or battery headroom left. Exporting it captures value instead of curtailing generation.`,
        confidence: 'Medium',
        inputs: [
          { label: 'Unassigned surplus', value: `${round1(allocation.gridExportKw)} kWh`, tone: 'success' },
          { label: 'Local demand', value: 'None left', tone: 'default' },
          { label: 'Grid export rate', value: `₹${this.gridPriceRs.toFixed(2)}/kWh`, tone: 'default' },
        ],
      })
    }
    if (allocation.gridImportKw > 0.01) {
      recs.push({
        id: 'rec-import',
        kind: KIND.EXPORT,
        title: 'Import remainder from grid',
        detail: `${round1(allocation.gridImportKw)} kWh of deficit has no local surplus or battery headroom left to cover it, importing at ₹${this.gridPriceRs.toFixed(2)}/kWh.`,
        confidence: 'Medium',
        inputs: [
          { label: 'Unmet deficit', value: `${round1(allocation.gridImportKw)} kWh`, tone: 'danger' },
          { label: 'Local surplus', value: 'None left', tone: 'default' },
          { label: 'Grid import rate', value: `₹${this.gridPriceRs.toFixed(2)}/kWh`, tone: 'default' },
        ],
      })
    }
    return recs
  }

  getSnapshot() {
    return {
      households: this.households.map((h) => ({
        id: h.id,
        label: h.label,
        type: h.type,
        generationKw: round1(h.generationKw),
        consumptionKw: round1(h.consumptionKw),
        batterySoc: h.batterySoc,
        ...(h.battery ? { batteryCapacityKwh: h.battery.capacityKwh, batteryReservePct: h.battery.reservePct } : {}),
      })),
      communitySnapshot: {
        timestamp: `${formatTime(this.clock.simHour)}`,
        totalGenerationKw: round1(this._totalGenerationKw ?? 0),
        totalConsumptionKw: round1(this._totalConsumptionKw ?? 0),
        netKw: round1(this._netKw ?? 0),
        renewablePct: Math.round(this._renewablePct ?? 100),
        batteryCapacityKwh: this.communityBattery.capacityKwh,
        batterySocPct: Math.round(this.communityBattery.socPct),
        batteryReservePct: this.communityBattery.reservePct,
        batteryChargeRateKw: this.communityBattery.maxChargeRateKw,
        energyTradedTodayKwh: round1(this.energyTradedTodayKwh),
        co2AvoidedKgToday: round1(this.co2AvoidedKgToday),
        gridImportPriceRs: this.gridPriceRs,
        gridFlowKw: round1(this.gridFlowKw),
      },
      ...this.trends,
      recommendations: this.recommendations,
      recentActivity: this.recentActivity,
    }
  }
}

function round1(n) {
  return Math.round(n * 10) / 10
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}
