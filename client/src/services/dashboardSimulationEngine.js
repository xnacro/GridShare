/**
 * GridShare Dashboard Simulation & Real-Time Flow Calculation Engine
 * Calculates deterministic visual flow arcs between authentic community households:
 * Anjali (Prosumer), Prince (Consumer), Ayush (Balanced), Rahul (EV Consumer),
 * Community Battery, and Main Grid.
 */

export const DIURNAL_PROFILES = {
  solarMultiplier: [
    0, 0, 0, 0, 0, 0,
    0.05, 0.2, 0.45, 0.7, 0.9, 1.0,
    0.95, 0.85, 0.65, 0.4, 0.15, 0.05,
    0, 0, 0, 0, 0, 0
  ],
  loadMultiplier: [
    0.5, 0.45, 0.4, 0.4, 0.45, 0.6,
    0.85, 1.1, 1.0, 0.9, 0.85, 0.9,
    0.95, 0.9, 0.85, 0.9, 1.05, 1.25,
    1.4, 1.35, 1.2, 1.0, 0.75, 0.6
  ]
};

export const PRESET_SCENARIOS = {
  NORMAL_DAY: {
    name: 'Normal Day',
    description: 'Balanced solar irradiance with standard household diurnal demand',
    households: [
      { id: 'house_anjali', name: "Anjali's Home", type: 'Solar Prosumer', generation: 6.4, consumption: 2.2, hasSolar: true },
      { id: 'house_prince', name: "Prince's Home", type: 'High Load Consumer', generation: 0.8, consumption: 4.8, hasSolar: false },
      { id: 'house_ayush', name: "Ayush's Home", type: 'Balanced Prosumer', generation: 3.2, consumption: 3.1, hasSolar: true },
      { id: 'house_rahul', name: "Rahul's Home", type: 'EV Consumer', generation: 1.8, consumption: 5.2, hasSolar: true },
    ],
    battery: { soc: 50, capacity: 50, storedKwh: 25.0 },
    hour: 12,
  },
  HIGH_SOLAR: {
    name: 'High Solar Noon',
    description: 'Clear sky peak generation with high exportable community surplus',
    households: [
      { id: 'house_anjali', name: "Anjali's Home", type: 'Solar Prosumer', generation: 9.0, consumption: 2.0, hasSolar: true },
      { id: 'house_prince', name: "Prince's Home", type: 'High Load Consumer', generation: 1.2, consumption: 3.8, hasSolar: false },
      { id: 'house_ayush', name: "Ayush's Home", type: 'Balanced Prosumer', generation: 5.2, consumption: 2.4, hasSolar: true },
      { id: 'house_rahul', name: "Rahul's Home", type: 'EV Consumer', generation: 2.5, consumption: 3.0, hasSolar: true },
    ],
    battery: { soc: 70, capacity: 50, storedKwh: 35.0 },
    hour: 13,
  },
  HIGH_DEMAND: {
    name: 'High Demand Stress',
    description: 'Heavy EV charging and residential loads exceeding solar production',
    households: [
      { id: 'house_anjali', name: "Anjali's Home", type: 'Solar Prosumer', generation: 4.0, consumption: 4.5, hasSolar: true },
      { id: 'house_prince', name: "Prince's Home", type: 'High Load Consumer', generation: 0.5, consumption: 6.5, hasSolar: false },
      { id: 'house_ayush', name: "Ayush's Home", type: 'Balanced Prosumer', generation: 2.0, consumption: 4.2, hasSolar: true },
      { id: 'house_rahul', name: "Rahul's Home", type: 'EV Consumer', generation: 1.0, consumption: 7.2, hasSolar: true },
    ],
    battery: { soc: 30, capacity: 50, storedKwh: 15.0 },
    hour: 19,
  },
};

/**
 * Generates continuous 24-hour simulation history based on current household settings
 */
export function generate24HourProfile(households, currentHour = 12, currentBatterySoc = 50) {
  const baseTotalGen = households.reduce((sum, h) => sum + (h.hasSolar ? h.generation : 0), 0);
  const baseTotalCon = households.reduce((sum, h) => sum + h.consumption, 0);

  const points = [];
  let simulatedSoc = Math.max(20, currentBatterySoc - 10);

  for (let h = 6; h <= 22; h++) {
    const timeStr = `${String(h).padStart(2, '0')}:00`;
    const sMult = DIURNAL_PROFILES.solarMultiplier[h] || 0;
    const lMult = DIURNAL_PROFILES.loadMultiplier[h] || 1;

    const gen = Math.round(baseTotalGen * sMult * 10) / 10;
    const con = Math.round(baseTotalCon * (lMult / 1.1) * 10) / 10;
    const net = Math.round((gen - con) * 10) / 10;

    // Simulate battery charge/discharge behavior
    if (net > 0) {
      simulatedSoc = Math.min(95, simulatedSoc + net * 1.5);
    } else {
      simulatedSoc = Math.max(20, simulatedSoc + net * 1.2);
    }

    points.push({
      time: timeStr,
      hour: h,
      generation: gen,
      consumption: con,
      net,
      batterySoc: Math.round(simulatedSoc),
      isPeakHour: h >= 18 && h <= 21,
    });
  }

  return points;
}

/**
 * Calculates multi-tier deterministic energy dispatch flows
 */
export function calculateMicrogridFlows(households, battery, grid, positions) {
  const flows = [];
  const houseA = households.find((h) => h.id === 'house_anjali' || h.id === 'house_a') || { generation: 6.4, consumption: 2.2 };
  const houseB = households.find((h) => h.id === 'house_prince' || h.id === 'house_b') || { generation: 0.8, consumption: 4.8 };
  const houseC = households.find((h) => h.id === 'house_ayush' || h.id === 'house_c') || { generation: 3.2, consumption: 3.1 };

  const netA = Math.round((houseA.generation - houseA.consumption) * 100) / 100;
  const netB = Math.round((houseB.generation - houseB.consumption) * 100) / 100;
  const netC = Math.round((houseC.generation - houseC.consumption) * 100) / 100;

  const posA = positions['house_anjali'] || positions['house_a'];
  const posB = positions['house_prince'] || positions['house_b'];
  const posC = positions['house_ayush'] || positions['house_c'];

  // 1. Solar generation source flow to Anjali's Home if generating
  if (houseA.generation > 0.1 && positions['solarSun'] && posA) {
    flows.push({
      id: 'flow-sun-a',
      start: positions['solarSun'],
      end: posA,
      kw: houseA.generation,
      type: 'ENERGY',
      color: '#f59e0b',
      label: `Solar PV: ${houseA.generation.toFixed(1)} kW`,
      isActive: true,
    });
  }

  // 2. Prosumer P2P Energy Sharing to Consumer in Deficit (Anjali -> Prince)
  if (netA > 0.1 && netB < -0.1 && posA && posB) {
    const p2pTransfer = Math.min(netA, Math.abs(netB));
    flows.push({
      id: 'flow-p2p-a-b',
      start: posA,
      end: posB,
      kw: p2pTransfer,
      type: 'ENERGY',
      color: '#059669',
      label: `P2P Transfer: ${p2pTransfer.toFixed(1)} kW`,
      isActive: true,
    });
  }

  // 3. Ayush Sharing with Prince or Self-Balancing
  if (netC > 0.1 && netB < -0.1 && posC && posB) {
    const p2pCtoB = Math.min(netC, 1.0);
    flows.push({
      id: 'flow-p2p-c-b',
      start: posC,
      end: posB,
      kw: p2pCtoB,
      type: 'ENERGY',
      color: '#10b981',
      label: `P2P Share: ${p2pCtoB.toFixed(1)} kW`,
      isActive: true,
    });
  }

  // 4. Community Battery Buffer Flow (Anjali Surplus -> Battery)
  if (netA > 2.0 && battery.soc < 95 && posA && positions['COMMUNITY_BATTERY']) {
    const storageFlow = Math.min(netA - 2.0, 1.5);
    flows.push({
      id: 'flow-a-batt',
      start: posA,
      end: positions['COMMUNITY_BATTERY'],
      kw: storageFlow,
      type: 'ENERGY',
      color: '#0d9488',
      label: `Storage Buffer: ${storageFlow.toFixed(1)} kW`,
      isActive: true,
    });
  }

  // 5. Battery Discharge to Prince if deficit exists and battery > 20%
  if (netA <= 0 && netB < -0.5 && battery.soc > 20 && positions['COMMUNITY_BATTERY'] && posB) {
    const dischargeFlow = Math.min(Math.abs(netB), 2.5);
    flows.push({
      id: 'flow-batt-b',
      start: positions['COMMUNITY_BATTERY'],
      end: posB,
      kw: dischargeFlow,
      type: 'ENERGY',
      color: '#0d9488',
      label: `Battery Discharge: ${dischargeFlow.toFixed(1)} kW`,
      isActive: true,
    });
  }

  // 6. Utility Grid Export Flow (Remaining Surplus -> Grid)
  const totalNet = netA + netB + netC;
  if (totalNet > 0.5 && posA && positions['MAIN_UTILITY_GRID']) {
    const gridExport = Math.min(totalNet, 2.0);
    flows.push({
      id: 'flow-grid-export',
      start: posA,
      end: positions['MAIN_UTILITY_GRID'],
      kw: gridExport,
      type: 'ENERGY',
      color: '#2563eb',
      label: `Grid Export: ${gridExport.toFixed(1)} kW`,
      isActive: true,
    });
  }

  return flows;
}
