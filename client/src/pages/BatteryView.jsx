import React, { useState, useRef, useMemo, useEffect } from 'react';
import InteractiveBatteryTwin3D, { BATTERY_VIEW_POSITIONS } from '../components/battery/InteractiveBatteryTwin3D';
import MetricCard from '../components/ui/MetricCard';
import Badge from '../components/ui/Badge';
import Button, { IconButton } from '../components/ui/Button';
import FaIcon from '../components/icons/FaIcon';

export default function BatteryView() {
  // Battery State (Single Source of Truth)
  const [battery, setBattery] = useState({
    soc: 60,
    capacity: 20.0,
    storedKwh: 12.0,
    minSoc: 10,
    maxSoc: 100,
    reserveKwh: 2.0,
    maxChargePower: 5.0,
    maxDischargePower: 5.0,
    efficiency: 92, // 92% roundtrip efficiency
    health: 98,
    cycleCount: 124,
    tempC: 28.0,
    voltage: 400.0,
    current: 0.0,
  });

  const [households, setHouseholds] = useState([
    { id: 'house_a', name: 'House A (Solar Champion)', generation: 6.8, consumption: 2.1, surplus: 4.7 },
    { id: 'house_b', name: 'House B (EV Consumer)', generation: 1.2, consumption: 4.0, surplus: 0.0, deficit: 2.8 },
    { id: 'house_c', name: 'House C (Prosumer Villa)', generation: 3.5, consumption: 2.2, surplus: 1.3 },
  ]);

  // Operational State
  const [status, setStatus] = useState('IDLE'); // 'IDLE', 'PREPARING', 'CHARGING', 'DISCHARGING', 'FULL', 'EMPTY'
  const [activeFlow, setActiveFlow] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedModule, setSelectedModule] = useState(null);

  // Charge Form
  const [chargeSource, setChargeSource] = useState('house_a');
  const [chargeAmount, setChargeAmount] = useState(1.5);
  const [chargePower, setChargePower] = useState(1.5);

  // Discharge Form
  const [dischargeDest, setDischargeDest] = useState('house_b');
  const [dischargeAmount, setDischargeAmount] = useState(1.5);
  const [dischargePower, setDischargePower] = useState(1.5);

  // Battery Activity Ledger
  const [history, setHistory] = useState([
    {
      id: 'ACT-001',
      time: '10:15',
      action: 'CHARGE',
      source: 'House A (Solar)',
      dest: 'Community ESS',
      energyKwh: 1.5,
      usableKwh: 1.38,
      lossKwh: 0.12,
      socBefore: 53,
      socAfter: 60,
      status: 'COMPLETED',
    },
    {
      id: 'ACT-002',
      time: '10:45',
      action: 'DISCHARGE',
      source: 'Community ESS',
      dest: 'House B (EV Load)',
      energyKwh: 2.0,
      usableKwh: 2.0,
      lossKwh: 0.0,
      socBefore: 70,
      socAfter: 60,
      status: 'COMPLETED',
    }
  ]);

  const sceneRef = useRef();

  // Computations
  const availableStored = Math.max(0, battery.storedKwh - battery.reserveKwh);
  const availableHeadroom = Math.max(0, battery.capacity - battery.storedKwh);

  // Selected Source surplus
  const currentSourceHouse = households.find((h) => h.id === chargeSource);
  const availableSourceSurplus = chargeSource === 'MAIN_UTILITY_GRID' ? 99.0 : currentSourceHouse?.surplus || 0.0;

  // 1. MANUAL CHARGE EXECUTION
  const handleCharge = () => {
    if (status === 'CHARGING' || status === 'DISCHARGING') return;

    // Validation 1: Available surplus
    if (chargeAmount > availableSourceSurplus) {
      setStatusMessage(`⚠️ Insufficient surplus: ${currentSourceHouse?.name || chargeSource} only has ${availableSourceSurplus.toFixed(1)} kWh.`);
      return;
    }

    // Validation 2: Remaining capacity
    if (chargeAmount > availableHeadroom) {
      setStatusMessage(`⚠️ Exceeds capacity: Battery only has ${availableHeadroom.toFixed(1)} kWh headroom before 100% SOC.`);
      return;
    }

    // Validation 3: Charge power limit
    if (chargePower > battery.maxChargePower) {
      setStatusMessage(`⚠️ Charge power ${chargePower} kW exceeds safety limit of ${battery.maxChargePower} kW.`);
      return;
    }

    setStatus('PREPARING');
    setStatusMessage(`Preparing transfer of ${chargeAmount.toFixed(1)} kWh from ${chargeSource.toUpperCase()} to Community ESS...`);

    const sourcePos = BATTERY_VIEW_POSITIONS[chargeSource] || [-4.2, 0, 1.2];
    const battPos = BATTERY_VIEW_POSITIONS.COMMUNITY_BATTERY;

    // 92% round-trip efficiency
    const storedIncrement = Math.round(chargeAmount * (battery.efficiency / 100) * 100) / 100;
    const loss = Math.round((chargeAmount - storedIncrement) * 100) / 100;

    setTimeout(() => {
      setStatus('CHARGING');
      setActiveFlow({
        id: `flow-charge-${Date.now()}`,
        start: sourcePos,
        end: battPos,
        kw: chargePower,
        type: 'CHARGE',
        color: '#059669',
      });
      setBattery((prev) => ({
        ...prev,
        current: Number((chargePower * 1000 / prev.voltage).toFixed(1)),
        tempC: Number((prev.tempC + 0.3).toFixed(1)),
      }));

      // Timed execution: 2.8s
      setTimeout(() => {
        const socBefore = battery.soc;
        const newStored = Math.min(battery.capacity, Math.round((battery.storedKwh + storedIncrement) * 100) / 100);
        const newSoc = Math.min(100, Math.round((newStored / battery.capacity) * 100));

        setBattery((prev) => ({
          ...prev,
          storedKwh: newStored,
          soc: newSoc,
          current: 0.0,
        }));

        // Deduct surplus from source household if local
        if (chargeSource !== 'MAIN_UTILITY_GRID') {
          setHouseholds((prev) =>
            prev.map((h) =>
              h.id === chargeSource
                ? { ...h, surplus: Math.max(0, Math.round((h.surplus - chargeAmount) * 100) / 100) }
                : h
            )
          );
        }

        // Add to history
        const newAct = {
          id: `ACT-${String(history.length + 1).padStart(3, '0')}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'CHARGE',
          source: currentSourceHouse?.name || chargeSource.toUpperCase(),
          dest: 'Community ESS',
          energyKwh: chargeAmount,
          usableKwh: storedIncrement,
          lossKwh: loss,
          socBefore: socBefore,
          socAfter: newSoc,
          status: 'COMPLETED',
        };
        setHistory((prev) => [newAct, ...prev]);

        setStatus(newSoc >= 100 ? 'FULL' : 'IDLE');
        setActiveFlow(null);
        setStatusMessage(`✅ CHARGE COMPLETE: Stored +${storedIncrement.toFixed(2)} kWh in ESS (${battery.efficiency}% η, loss: ${loss} kWh). New SOC: ${newSoc}%.`);
      }, 2600);
    }, 400);
  };

  // 2. MANUAL DISCHARGE EXECUTION
  const handleDischarge = () => {
    if (status === 'CHARGING' || status === 'DISCHARGING') return;

    // Validation 1: Reserve limit check
    if (dischargeAmount > availableStored) {
      setStatusMessage(`⚠️ Reserve limit reached: Battery cannot discharge below ${battery.reserveKwh} kWh (${battery.minSoc}% SOC).`);
      return;
    }

    // Validation 2: Discharge power limit
    if (dischargePower > battery.maxDischargePower) {
      setStatusMessage(`⚠️ Discharge power ${dischargePower} kW exceeds safety limit of ${battery.maxDischargePower} kW.`);
      return;
    }

    setStatus('PREPARING');
    setStatusMessage(`Preparing dispatch of ${dischargeAmount.toFixed(1)} kWh from Community ESS to ${dischargeDest.toUpperCase()}...`);

    const battPos = BATTERY_VIEW_POSITIONS.COMMUNITY_BATTERY;
    const destPos = BATTERY_VIEW_POSITIONS[dischargeDest] || [4.2, 0, 1.2];

    setTimeout(() => {
      setStatus('DISCHARGING');
      setActiveFlow({
        id: `flow-discharge-${Date.now()}`,
        start: battPos,
        end: destPos,
        kw: dischargePower,
        type: 'DISCHARGE',
        color: '#0284c7',
      });
      setBattery((prev) => ({
        ...prev,
        current: Number((dischargePower * 1000 / prev.voltage).toFixed(1)),
        tempC: Number((prev.tempC + 0.2).toFixed(1)),
      }));

      // Timed execution: 2.8s
      setTimeout(() => {
        const socBefore = battery.soc;
        const newStored = Math.max(0, Math.round((battery.storedKwh - dischargeAmount) * 100) / 100);
        const newSoc = Math.max(0, Math.round((newStored / battery.capacity) * 100));

        setBattery((prev) => ({
          ...prev,
          storedKwh: newStored,
          soc: newSoc,
          current: 0.0,
        }));

        // Reduce deficit for destination household
        if (dischargeDest !== 'MAIN_UTILITY_GRID') {
          setHouseholds((prev) =>
            prev.map((h) =>
              h.id === dischargeDest
                ? { ...h, deficit: Math.max(0, Math.round(((h.deficit || 0) - dischargeAmount) * 100) / 100) }
                : h
            )
          );
        }

        // Add to history
        const newAct = {
          id: `ACT-${String(history.length + 1).padStart(3, '0')}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'DISCHARGE',
          source: 'Community ESS',
          dest: households.find((h) => h.id === dischargeDest)?.name || dischargeDest.toUpperCase(),
          energyKwh: dischargeAmount,
          usableKwh: dischargeAmount,
          lossKwh: 0.0,
          socBefore: socBefore,
          socAfter: newSoc,
          status: 'COMPLETED',
        };
        setHistory((prev) => [newAct, ...prev]);

        setStatus(newSoc <= battery.minSoc ? 'EMPTY' : 'IDLE');
        setActiveFlow(null);
        setStatusMessage(`✅ DISCHARGE COMPLETE: Dispatched ${dischargeAmount.toFixed(2)} kWh to ${dischargeDest.toUpperCase()}. New SOC: ${newSoc}%.`);
      }, 2600);
    }, 400);
  };

  // 3. Load Demo Preset
  const handleLoadDemo = () => {
    setBattery({
      soc: 60,
      capacity: 20.0,
      storedKwh: 12.0,
      minSoc: 10,
      maxSoc: 100,
      reserveKwh: 2.0,
      maxChargePower: 5.0,
      maxDischargePower: 5.0,
      efficiency: 92,
      health: 98,
      cycleCount: 124,
      tempC: 28.0,
      voltage: 400.0,
      current: 0.0,
    });
    setHouseholds([
      { id: 'house_a', name: 'House A (Solar Champion)', generation: 6.8, consumption: 2.1, surplus: 4.7 },
      { id: 'house_b', name: 'House B (EV Consumer)', generation: 1.2, consumption: 4.0, surplus: 0.0, deficit: 2.8 },
      { id: 'house_c', name: 'House C (Prosumer Villa)', generation: 3.5, consumption: 2.2, surplus: 1.3 },
    ]);
    setChargeSource('house_a');
    setDischargeDest('house_b');
    setChargeAmount(1.5);
    setDischargeAmount(1.5);
    setStatus('IDLE');
    setActiveFlow(null);
    setStatusMessage('Battery Demo Loaded: 12 / 20 kWh (60% SOC). House A surplus: 4.7 kWh, House B deficit: 2.8 kWh.');
    if (sceneRef.current) sceneRef.current.resetCamera();
  };

  // 4. Reset
  const handleReset = () => {
    setBattery((prev) => ({
      ...prev,
      soc: 60,
      storedKwh: 12.0,
      tempC: 28.0,
      current: 0.0,
    }));
    setStatus('IDLE');
    setActiveFlow(null);
    setSelectedModule(null);
    setStatusMessage('Battery state reset to default 60% SOC baseline.');
    if (sceneRef.current) sceneRef.current.resetCamera();
  };

  return (
    <div className="space-y-4 max-w-[1680px] mx-auto pb-6 select-none">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-teal-400 shadow-md">
            <FaIcon name="battery" className="text-lg" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Community Battery ESS</h2>
              <Badge variant="battery" size="xs">
                {battery.capacity} kWh Buffer
              </Badge>
              <Badge variant={status === 'CHARGING' || status === 'DISCHARGING' ? 'surplus' : 'default'} size="xs">
                {status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Centralized lithium-iron phosphate storage for community peak shaving and microgrid balancing.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleLoadDemo}
            icon={<FaIcon name="sparkles" />}
          >
            Load Demo
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            icon={<FaIcon name="refresh" />}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* 🌟 1. SECOND ROW: LIVE BATTERY KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          title="Battery SOC"
          value={`${battery.soc?.toFixed(0)}%`}
          subtitle={`${battery.storedKwh?.toFixed(1)} / ${battery.capacity} kWh`}
          iconName="battery"
          variant="battery"
        />

        <MetricCard
          title="Operating State"
          value={status}
          subtitle="BMS Active"
          iconName="activity"
          variant={status === 'CHARGING' ? 'surplus' : status === 'DISCHARGING' ? 'ai' : 'default'}
        />

        <MetricCard
          title="Charge Headroom"
          value={availableHeadroom.toFixed(1)}
          unit="kWh"
          subtitle="Buffer Space"
          iconName="trendingUp"
          variant="surplus"
        />

        <MetricCard
          title="Round-Trip η"
          value={`${battery.efficiency}%`}
          subtitle="8% Thermal Loss"
          iconName="energy"
          variant="default"
        />

        <MetricCard
          title="Health (SOH)"
          value={`${battery.health}%`}
          subtitle={`${battery.cycleCount} Cycles`}
          iconName="shield"
          variant="ai"
        />

        <MetricCard
          title="Core Temp"
          value={`${battery.tempC}°C`}
          subtitle="Normal Cooling"
          iconName="temperatureHalf"
          variant="default"
        />
      </div>

      {/* Dynamic Status / Narrative Banner */}
      {statusMessage && (
        <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-xs text-teal-950 shadow-2xs">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="font-semibold">{statusMessage}</span>
          </div>
          <button type="button" onClick={() => setStatusMessage('')} className="text-teal-700 hover:text-teal-950 font-bold text-xs p-0.5">
            ✕
          </button>
        </div>
      )}

      {/* 🌟 2. MAIN 3-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* LEFT COLUMN: Manual Charge & Discharge Controls (~22%) */}
        <div className="lg:col-span-3 space-y-3">
          {/* CHARGE CONTROL CARD */}
          <div className="rounded-xl border border-emerald-200 bg-white p-3.5 shadow-card space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-emerald-100">
              <div className="flex items-center space-x-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-white shadow-2xs">
                  <FaIcon name="solar" className="text-xs" />
                </div>
                <span className="font-extrabold text-[11px] uppercase tracking-wide text-emerald-950">
                  Charge Battery
                </span>
              </div>
              <span className="font-mono text-[9px] font-bold text-emerald-700">
                Max: 5 kW
              </span>
            </div>

            {/* Source Selector */}
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Select Source:</span>
              <select
                value={chargeSource}
                onChange={(e) => setChargeSource(e.target.value)}
                disabled={status === 'CHARGING' || status === 'DISCHARGING'}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="house_a">House A (Surplus: +4.7 kWh)</option>
                <option value="house_c">House C (Surplus: +1.3 kWh)</option>
                <option value="MAIN_UTILITY_GRID">Utility Grid (Tariff: ₹6/kWh)</option>
              </select>
            </div>

            {/* Amount & Power */}
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <span className="text-[9.5px] text-slate-500 font-medium">Energy (kWh):</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={Math.min(availableSourceSurplus, availableHeadroom)}
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(Number(e.target.value) || 0)}
                  disabled={status === 'CHARGING' || status === 'DISCHARGING'}
                  className="w-full rounded border border-slate-300 bg-white px-1.5 py-0.8 text-[11px] font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <span className="text-[9.5px] text-slate-500 font-medium">Power (kW):</span>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="5.0"
                  value={chargePower}
                  onChange={(e) => setChargePower(Number(e.target.value) || 0)}
                  disabled={status === 'CHARGING' || status === 'DISCHARGING'}
                  className="w-full rounded border border-slate-300 bg-white px-1.5 py-0.8 text-[11px] font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Efficiency Preview */}
            <div className="rounded bg-emerald-50/50 border border-emerald-100 p-1.5 text-[9.5px] text-emerald-900 font-mono">
              Input: <strong>{chargeAmount} kWh</strong> ➔ Stored: <strong>{(chargeAmount * 0.92).toFixed(2)} kWh</strong> (Loss: {(chargeAmount * 0.08).toFixed(2)} kWh)
            </div>

            <button
              type="button"
              onClick={handleCharge}
              disabled={status === 'CHARGING' || status === 'DISCHARGING' || battery.soc >= 100}
              className="flex w-full items-center justify-center space-x-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 text-xs font-bold shadow-2xs transition active:scale-95 disabled:opacity-40"
            >
              <FaIcon name="arrowDown" className="text-xs" />
              <span>{status === 'CHARGING' ? 'CHARGING ESS...' : 'CHARGE BATTERY'}</span>
            </button>
          </div>

          {/* DISCHARGE CONTROL CARD */}
          <div className="rounded-xl border border-blue-200 bg-white p-3 shadow-card space-y-2 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-blue-100">
              <div className="flex items-center space-x-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-600 text-white shadow-2xs">
                  <FaIcon name="battery" className="text-xs" />
                </div>
                <span className="font-extrabold text-[11px] uppercase tracking-wide text-blue-950">
                  Discharge Battery
                </span>
              </div>
              <span className="font-mono text-[9px] font-bold text-blue-700">
                Avail: {availableStored.toFixed(1)} kWh
              </span>
            </div>

            {/* Destination Selector */}
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Select Destination:</span>
              <select
                value={dischargeDest}
                onChange={(e) => setDischargeDest(e.target.value)}
                disabled={status === 'CHARGING' || status === 'DISCHARGING'}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="house_b">House B (Deficit: -2.8 kW)</option>
                <option value="house_a">House A (Load: 2.1 kW)</option>
                <option value="house_c">House C (Load: 2.2 kW)</option>
                <option value="MAIN_UTILITY_GRID">Utility Grid (Export: ₹6/kWh)</option>
              </select>
            </div>

            {/* Amount & Power */}
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <span className="text-[9.5px] text-slate-500 font-medium">Energy (kWh):</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={availableStored}
                  value={dischargeAmount}
                  onChange={(e) => setDischargeAmount(Number(e.target.value) || 0)}
                  disabled={status === 'CHARGING' || status === 'DISCHARGING'}
                  className="w-full rounded border border-slate-300 bg-white px-1.5 py-0.8 text-[11px] font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <span className="text-[9.5px] text-slate-500 font-medium">Power (kW):</span>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="5.0"
                  value={dischargePower}
                  onChange={(e) => setDischargePower(Number(e.target.value) || 0)}
                  disabled={status === 'CHARGING' || status === 'DISCHARGING'}
                  className="w-full rounded border border-slate-300 bg-white px-1.5 py-0.8 text-[11px] font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Reserve Alert */}
            <div className="rounded bg-blue-50/50 border border-blue-100 p-1.5 text-[9.5px] text-blue-900 font-mono">
              Reserve Floor: <strong>{battery.reserveKwh} kWh ({battery.minSoc}% SOC)</strong> • Protected against blackout.
            </div>

            <button
              type="button"
              onClick={handleDischarge}
              disabled={status === 'CHARGING' || status === 'DISCHARGING' || availableStored <= 0.1}
              className="flex w-full items-center justify-center space-x-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-1.5 text-xs font-bold shadow-2xs transition active:scale-95 disabled:opacity-40"
            >
              <FaIcon name="arrowUp" className="text-xs" />
              <span>{status === 'DISCHARGING' ? 'DISCHARGING ESS...' : 'DISCHARGE BATTERY'}</span>
            </button>
          </div>
        </div>

        {/* CENTER COLUMN: 3D Community ESS Digital Twin (~58%) */}
        <div className="lg:col-span-6 xl:col-span-6">
          <div className="flex flex-col h-full rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-card space-y-2">
            {/* 3D Header Bar & Camera Controls */}
            <div className="flex items-center justify-between px-1 text-xs">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                <span className="font-extrabold text-[11px] uppercase tracking-wide text-slate-900">
                  3D Community ESS Digital Twin
                </span>
              </div>

              <div className="flex items-center space-x-1 text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => sceneRef.current?.resetCamera()}
                  className="rounded border border-slate-200 bg-slate-50 px-2 py-0.8 text-slate-700 hover:bg-slate-100 transition"
                  title="Default View"
                >
                  <FaIcon name="camera" className="mr-1 text-slate-500 text-xs" />
                  Reset View
                </button>
                <button
                  type="button"
                  onClick={() => sceneRef.current?.moduleCloseUp()}
                  className="rounded border border-slate-200 bg-slate-50 px-2 py-0.8 text-slate-700 hover:bg-slate-100 transition hidden sm:inline"
                  title="Rack Modules View"
                >
                  Module View
                </button>
                <button
                  type="button"
                  onClick={() => sceneRef.current?.topView()}
                  className="rounded border border-slate-200 bg-slate-50 px-2 py-0.8 text-slate-700 hover:bg-slate-100 transition hidden sm:inline"
                  title="Overhead View"
                >
                  Top View
                </button>
              </div>
            </div>

            {/* 3D Canvas */}
            <div className="h-[460px] xl:h-[490px] w-full relative rounded-xl overflow-hidden">
              <InteractiveBatteryTwin3D
                ref={sceneRef}
                battery={battery}
                status={status}
                activeFlow={activeFlow}
                selectedSource={chargeSource}
                selectedDestination={dischargeDest}
                selectedModule={selectedModule?.id}
                onSelectModule={(m) => {
                  setSelectedModule(m);
                  setStatusMessage(`Inspecting ${m.name}: ${m.voltage}V, ${m.temp}°C, ${m.soc}% SOC.`);
                }}
                households={households}
              />

              {/* Floating micro status badge */}
              <div className="absolute top-2.5 left-2.5 pointer-events-none">
                <div className="flex items-center space-x-1.5 rounded-full border border-slate-200 bg-white/95 px-2.5 py-0.5 shadow-2xs backdrop-blur-md">
                  <span className={`h-1.5 w-1.5 rounded-full ${activeFlow ? 'bg-teal-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span className="text-[10px] font-bold text-slate-800">
                    {activeFlow ? `Active Flow • ${activeFlow.type === 'CHARGE' ? 'Charging' : 'Discharging'} (${activeFlow.kw} kW)` : 'Digital Twin • Click Module to Inspect'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Telemetry, Safety & Module Inspector (~20%) */}
        <div className="lg:col-span-3 xl:col-span-3 space-y-2.5">
          {/* SIMULATED TELEMETRY PANEL */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-card space-y-2 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="font-extrabold text-[11px] text-slate-900">
                Simulated ESS Telemetry
              </span>
              <span className="rounded bg-teal-50 px-1.5 py-0.2 text-[8.5px] font-bold text-teal-800 border border-teal-200">
                BMS Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[10.5px] font-mono">
              <div className="rounded bg-slate-50 p-1.5">
                <span className="text-[9px] text-slate-500 uppercase block">Bus Voltage</span>
                <span className="font-bold text-slate-900">{battery.voltage.toFixed(0)} V</span>
              </div>
              <div className="rounded bg-slate-50 p-1.5">
                <span className="text-[9px] text-slate-500 uppercase block">Current</span>
                <span className="font-bold text-slate-900">{battery.current > 0 ? `${battery.current} A` : '0.0 A'}</span>
              </div>
              <div className="rounded bg-slate-50 p-1.5">
                <span className="text-[9px] text-slate-500 uppercase block">Active Power</span>
                <span className="font-bold text-teal-800">{activeFlow ? `${activeFlow.kw} kW` : '0.0 kW'}</span>
              </div>
              <div className="rounded bg-slate-50 p-1.5">
                <span className="text-[9px] text-slate-500 uppercase block">Cell Health</span>
                <span className="font-bold text-emerald-700">{battery.health}% SOH</span>
              </div>
            </div>

            {/* Safety Interlocks */}
            <div className="space-y-1 pt-1 border-t border-slate-100 text-[10px]">
              <div className="flex justify-between items-center text-slate-600">
                <span>Thermal State:</span>
                <span className="text-emerald-700 font-bold">28°C (Normal ✓)</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Overcharge Protect:</span>
                <span className="text-emerald-700 font-bold">Armed (100% max ✓)</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Deep-Discharge Floor:</span>
                <span className="text-emerald-700 font-bold">2.0 kWh (10% ✓)</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Power Limiter:</span>
                <span className="text-emerald-700 font-bold">5.0 kW Max ✓</span>
              </div>
            </div>
          </div>

          {/* MODULE INSPECTOR (WHEN CLICKED IN 3D) */}
          <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-3 shadow-card space-y-1.5 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-teal-100">
              <span className="font-extrabold text-[11px] text-teal-950">
                {selectedModule ? selectedModule.name : 'Module Inspector'}
              </span>
              <span className="text-[9px] font-mono text-teal-800 font-bold">
                {selectedModule ? `${selectedModule.soc}% SOC` : 'Click 3D Module'}
              </span>
            </div>

            {selectedModule ? (
              <div className="space-y-1 text-[10.5px] font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-600">Rack Voltage:</span>
                  <span className="font-bold text-slate-900">{selectedModule.voltage} V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Module Temp:</span>
                  <span className="font-bold text-emerald-700">{selectedModule.temp}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Health State:</span>
                  <span className="font-bold text-emerald-800">NORMAL ✓</span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 leading-tight">
                Click any of the 4 horizontal modular cell racks in the 3D battery to inspect real-time module-level voltage and temperature.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 🌟 3. BOTTOM ROW: BATTERY ACTIVITY & AUDIT TRAIL */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-card space-y-2 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <FaIcon name="history" className="text-teal-700 text-sm" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Battery Activity History & Storage Ledger
            </h3>
          </div>
          <span className="font-mono text-xs font-bold text-slate-500">
            {history.length} Events Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Destination</th>
                <th className="px-3 py-2 text-right">Transfer (kWh)</th>
                <th className="px-3 py-2 text-right">Stored/Usable (kWh)</th>
                <th className="px-3 py-2 text-right">Loss (kWh)</th>
                <th className="px-3 py-2 text-center">SOC Progression</th>
                <th className="px-3 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-3 py-2 text-slate-500">{h.time}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded px-1.5 py-0.2 text-[9px] font-bold ${
                      h.action === 'CHARGE'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}>
                      {h.action}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-sans font-bold text-slate-900">{h.source}</td>
                  <td className="px-3 py-2 font-sans font-bold text-slate-900">{h.dest}</td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900">{h.energyKwh.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-bold text-teal-800">{h.usableKwh.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-slate-400">{h.lossKwh > 0 ? `${h.lossKwh.toFixed(2)}` : '0.00'}</td>
                  <td className="px-3 py-2 text-center font-bold text-slate-800">{h.socBefore}% ➔ {h.socAfter}%</td>
                  <td className="px-3 py-2 text-right text-emerald-700 font-bold">{h.status} ✓</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
