// Seed definitions for the 5 households, matching client/src/data/mockCommunity.js
// one-for-one (same ids/labels/types) so this is a recognizable continuation
// of the existing frontend fixture, not a new cast of households.
//
// generationAtDemoKw/consumptionAtDemoKw are the target output at
// DEMO_HOUR_OF_DAY (12:30 PM) -- household.js uses these to calibrate each
// household's installedKwp/baseLoadKw against solarModel/demandModel, so the
// live simulation reproduces the original mock's numbers at that instant and
// varies realistically away from it.

export const HOUSEHOLD_ARCHETYPES = [
  {
    id: 'house-07',
    label: 'House 07',
    type: 'Solar Prosumer',
    demandProfile: 'residential',
    generationAtDemoKw: 6.8,
    consumptionAtDemoKw: 2.1,
    battery: null,
  },
  {
    id: 'house-12',
    label: 'House 12',
    type: 'Solar + Battery Prosumer',
    demandProfile: 'residential',
    generationAtDemoKw: 4.3,
    consumptionAtDemoKw: 2.8,
    battery: {
      capacityKwh: 5,
      initialSocKwh: 3.55, // 71%
      reservePct: 20,
      maxChargeRateKw: 2,
      maxDischargeRateKw: 2,
    },
  },
  {
    id: 'house-34',
    label: 'House 34',
    type: 'EV Household',
    demandProfile: 'ev',
    generationAtDemoKw: 1.2,
    consumptionAtDemoKw: 4.0,
    battery: null,
  },
  {
    id: 'house-21',
    label: 'House 21',
    type: 'Non-Solar Consumer',
    demandProfile: 'residential',
    generationAtDemoKw: 0,
    consumptionAtDemoKw: 2.6,
    battery: null,
  },
  {
    id: 'house-45',
    label: 'House 45',
    type: 'Low-Consumption Home',
    demandProfile: 'residential',
    generationAtDemoKw: 3.4,
    consumptionAtDemoKw: 1.9,
    battery: null,
  },
]
