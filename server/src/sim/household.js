import { HOUSEHOLD_ARCHETYPES } from '../config/archetypes.js'
import { DEMO_HOUR_OF_DAY } from '../config/constants.js'
import { solarCurve } from './solarModel.js'
import { demandCurve } from './demandModel.js'
import { Battery } from './battery.js'

// Builds the live household state from the archetype seed list, calibrating
// each household's installedKwp/baseLoadKw so the simulation reproduces the
// original mock's figures at DEMO_HOUR_OF_DAY (12:30 PM) and varies
// realistically away from it. See archetypes.js for the target values.
export function buildHouseholds() {
  const solarPeak = solarCurve(DEMO_HOUR_OF_DAY) || 1
  return HOUSEHOLD_ARCHETYPES.map((a) => ({
    id: a.id,
    label: a.label,
    type: a.type,
    demandProfile: a.demandProfile,
    installedKwp: a.generationAtDemoKw > 0 ? a.generationAtDemoKw / solarPeak : 0,
    baseLoadKw: a.consumptionAtDemoKw / demandCurve(DEMO_HOUR_OF_DAY, a.demandProfile),
    battery: a.battery ? new Battery(a.battery) : null,
    // last-known-good values, used as a fallback if a model call throws (§21)
    lastGenerationKw: a.generationAtDemoKw,
    lastConsumptionKw: a.consumptionAtDemoKw,
  }))
}
