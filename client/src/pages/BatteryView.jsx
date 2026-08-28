import React, { useState, useRef } from 'react';
import InteractiveBatteryTwin3D from '../components/battery/InteractiveBatteryTwin3D';
import MetricCard from '../components/ui/MetricCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import FaIcon from '../components/icons/FaIcon';

export default function BatteryView() {
  // Battery State (Single Source of Truth)
  const [battery, setBattery] = useState({
    soc: 60,
    capacity: 50.0,
    storedKwh: 30.0,
    minSoc: 20, // Authoritative 20% Emergency Reserve Floor
    maxSoc: 100,
    reserveKwh: 10.0,
    maxChargePower: 10.0,
    maxDischargePower: 10.0,
    efficiency: 94,
    health: 98,
    cycleCount: 142,
    tempC: 27.5,
    voltage: 400.0,
  });

  const households = [
    { id: 'house_a', name: 'House A (Solar Champion)', generation: 6.8, consumption: 2.1, surplus: 4.7 },
    { id: 'house_b', name: 'House B (EV Consumer)', generation: 1.2, consumption: 4.0, surplus: 0.0, deficit: 2.8 },
    { id: 'house_c', name: 'House C (Prosumer Villa)', generation: 3.5, consumption: 2.2, surplus: 1.3 },
  ];

  const [status, setStatus] = useState('IDLE');
  const [activeFlow, setActiveFlow] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedModule, setSelectedModule] = useState(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Quick Charge/Discharge controls
  const [chargeAmount, setChargeAmount] = useState(2.0);
  const [dischargeAmount, setDischargeAmount] = useState(2.0);

  // History Ledger
  const [history, setHistory] = useState([
    {
      id: 'ACT-001',
      time: '11:15',
      action: 'CHARGE',
      source: 'House A (Solar)',
      dest: 'Central ESS',
      energyKwh: 2.0,
      usableKwh: 1.88,
      socBefore: 56,
      socAfter: 60,
      status: 'COMPLETED',
    },
    {
      id: 'ACT-002',
      time: '11:45',
      action: 'DISCHARGE',
      source: 'Central ESS',
      dest: 'House B (EV Load)',
      energyKwh: 2.5,
      usableKwh: 2.5,
      socBefore: 65,
      socAfter: 60,
      status: 'COMPLETED',
    }
  ]);

  const sceneRef = useRef();

  const availableKwh = Math.max(0, (battery.capacity * (battery.soc - battery.minSoc)) / 100);
  const reservedKwh = (battery.capacity * battery.minSoc) / 100;

  const handleExecuteCharge = () => {
    if (battery.soc >= 95) {
      setStatusMessage('⚠️ Battery storage is already near peak capacity (95%).');
      return;
    }
    setStatus('CHARGING');
    setActiveFlow({ type: 'CHARGE', kw: chargeAmount });
    setStatusMessage(`Buffering ${chargeAmount} kWh excess solar yield into Community ESS.`);
    
    setTimeout(() => {
      setBattery((prev) => {
        const nextSoc = Math.min(95, prev.soc + Math.round((chargeAmount / prev.capacity) * 100));
        return { ...prev, soc: nextSoc, storedKwh: (prev.capacity * nextSoc) / 100 };
      });
      setStatus('IDLE');
      setActiveFlow(null);
      setHistory((prev) => [
        {
          id: `ACT-00${prev.length + 1}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'CHARGE',
          source: 'House A (Solar)',
          dest: 'Central ESS',
          energyKwh: chargeAmount,
          usableKwh: Math.round(chargeAmount * 0.94 * 10) / 10,
          socBefore: battery.soc,
          socAfter: Math.min(95, battery.soc + Math.round((chargeAmount / battery.capacity) * 100)),
          status: 'COMPLETED',
        },
        ...prev,
      ]);
      setStatusMessage(`Charged ${chargeAmount} kWh successfully.`);
      setTimeout(() => setStatusMessage(''), 4000);
    }, 1200);
  };

  const handleExecuteDischarge = () => {
    if (battery.soc <= battery.minSoc) {
      setStatusMessage('⚠️ Blackout reserve floor reached (20%). Discharging halted to ensure emergency resilience.');
      return;
    }
    setStatus('DISCHARGING');
    setActiveFlow({ type: 'DISCHARGE', kw: dischargeAmount });
    setStatusMessage(`Discharging ${dischargeAmount} kWh to support House B peak deficit.`);
    
    setTimeout(() => {
      setBattery((prev) => {
        const nextSoc = Math.max(20, prev.soc - Math.round((dischargeAmount / prev.capacity) * 100));
        return { ...prev, soc: nextSoc, storedKwh: (prev.capacity * nextSoc) / 100 };
      });
      setStatus('IDLE');
      setActiveFlow(null);
      setHistory((prev) => [
        {
          id: `ACT-00${prev.length + 1}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'DISCHARGE',
          source: 'Central ESS',
          dest: 'House B (EV Load)',
          energyKwh: dischargeAmount,
          usableKwh: dischargeAmount,
          socBefore: battery.soc,
          socAfter: Math.max(20, battery.soc - Math.round((dischargeAmount / battery.capacity) * 100)),
          status: 'COMPLETED',
        },
        ...prev,
      ]);
      setStatusMessage(`Discharged ${dischargeAmount} kWh successfully.`);
      setTimeout(() => setStatusMessage(''), 4000);
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto pb-8 select-none">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#15211B] tracking-tight">
              Community Energy Storage System (ESS)
            </h1>
            <Badge variant="battery" size="sm">
              50 kWh Asset
            </Badge>
          </div>
          <p className="text-sm text-[#5E6A63] font-medium mt-1">
            Centralized lithium-iron-phosphate (LFP) storage with automated 20% reserve floor protection and virtual prosumer accounting.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => sceneRef.current?.resetCamera()}
            icon={<FaIcon name="rotate" />}
          >
            Reset Angle
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            icon={<FaIcon name="sliders" />}
          >
            {isAdvancedOpen ? 'Hide Diagnostics' : 'BMS Diagnostics'}
          </Button>
        </div>
      </div>

      {/* Dynamic Status Notification */}
      {statusMessage && (
        <div className="flex items-center justify-between rounded-2xl border border-[#DCE4DE] bg-[#E7F6EE] px-4 py-3 text-sm text-[#12392B] font-bold shadow-subtle animate-in fade-in">
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage('')} className="text-[#209B67] text-xs font-bold p-1">
            ✕
          </button>
        </div>
      )}

      {/* 🌟 1. PRIMARY BATTERY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="State of Charge (SOC)"
          value={`${battery.soc}%`}
          subtitle={`${(battery.capacity * battery.soc / 100).toFixed(1)} of ${battery.capacity} kWh`}
          iconName="battery"
          variant="battery"
          badge="HEALTHY"
          delta={`${battery.health}% State of Health`}
          deltaType="positive"
        />

        <MetricCard
          title="Available Dispatch Energy"
          value={`${availableKwh.toFixed(1)} kWh`}
          subtitle="Ready for P2P trading"
          iconName="network"
          variant="surplus"
          delta="Above reserve threshold"
          deltaType="positive"
        />

        <MetricCard
          title="Emergency Reserve Floor"
          value={`${reservedKwh.toFixed(1)} kWh`}
          subtitle="20% protected minimum"
          iconName="shield"
          variant="default"
          delta="Blackout resilience buffer"
          deltaType="neutral"
        />

        <MetricCard
          title="Roundtrip Efficiency"
          value={`${battery.efficiency}%`}
          subtitle="94% bidirectional efficiency"
          iconName="solar"
          variant="ai"
          delta="142 charge cycles logged"
          deltaType="positive"
        />
      </div>

      {/* 🌟 2. VISUAL BATTERY SOC GAUGE STRIP */}
      <div className="rounded-3xl border border-[#DCE4DE] bg-white p-6 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FFF3D7] text-[#E7AA31] flex items-center justify-center text-xs">
              <FaIcon name="battery" />
            </div>
            <span className="text-sm font-bold text-[#15211B]">
              Community Storage Allocation Gauge
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-[#209B67]">
            {availableKwh.toFixed(1)} kWh Usable | {reservedKwh.toFixed(1)} kWh Reserved (20%)
          </span>
        </div>

        {/* Multi-segment battery bar */}
        <div className="h-4 w-full rounded-full bg-[#F5F7F3] border border-[#DCE4DE] overflow-hidden flex p-0.5">
          {/* Reserved Floor (20%) */}
          <div
            className="h-full bg-[#D85D5D] rounded-l-full"
            style={{ width: '20%' }}
            title="20% Emergency Reserve Floor (Blackout Resilience)"
          />
          {/* Usable Active Charge */}
          <div
            className="h-full bg-[#209B67] transition-all duration-500"
            style={{ width: `${Math.max(0, battery.soc - 20)}%` }}
            title={`${Math.max(0, battery.soc - 20)}% Available for P2P trading`}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-[#5E6A63] font-medium pt-0.5">
          <span className="flex items-center gap-1.5 text-[#D85D5D]">
            <FaIcon name="shield" className="text-xs" />
            0–20% Reserve Floor (Locked for Emergency)
          </span>
          <span className="flex items-center gap-1.5 text-[#209B67]">
            <FaIcon name="bolt" className="text-xs" />
            20–{battery.soc}% Available for Local Dispatch
          </span>
          <span className="text-[#87918B]">
            {battery.soc}–100% Headroom
          </span>
        </div>
      </div>

      {/* 🌟 3. 3D DIGITAL RACK TWIN + DISPATCH CONTROLLER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 3D RACK TWIN (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-[#DCE4DE] bg-white p-5 sm:p-6 shadow-card space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE4DE]">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#FFF3D7] text-[#E7AA31] flex items-center justify-center text-xs">
                <FaIcon name="battery" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#15211B]">
                  Interactive 3D Storage Rack Twin
                </h3>
                <p className="text-xs text-[#5E6A63]">
                  Click any cell module in the 3D rack to inspect voltage and cell temperature
                </p>
              </div>
            </div>
            <Badge variant="battery" size="xs">
              BMS Active
            </Badge>
          </div>

          <div className="h-[380px] w-full relative rounded-2xl overflow-hidden bg-[#F5F7F3]">
            <InteractiveBatteryTwin3D
              ref={sceneRef}
              battery={battery}
              status={status}
              activeFlow={activeFlow}
              selectedModule={selectedModule?.id}
              onSelectModule={(m) => {
                setSelectedModule(m);
                setStatusMessage(`Inspecting ${m.name}: ${m.voltage}V, ${m.temp}°C, ${m.soc}% SOC.`);
              }}
              households={households}
            />

            {/* Clean Micro Badge Overlay */}
            <div className="absolute top-3 left-3 pointer-events-none">
              <div className="flex items-center space-x-2 rounded-full border border-[#DCE4DE] bg-white/95 px-3 py-1 shadow-card backdrop-blur-md">
                <FaIcon name="bolt" className={`text-xs ${activeFlow ? 'text-[#209B67]' : 'text-[#87918B]'}`} />
                <span className="text-xs font-bold text-[#15211B]">
                  {activeFlow ? `Active Flow: ${activeFlow.type} (${activeFlow.kw} kW)` : 'BMS Standby'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CHARGE / DISCHARGE DISPATCH CONTROLLER (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-[#DCE4DE] bg-white p-5 sm:p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE4DE]">
            <div>
              <h3 className="text-base font-bold text-[#15211B]">
                Manual Storage Dispatch
              </h3>
              <p className="text-xs text-[#5E6A63]">
                Inject prosumer solar yield or discharge to relieve local deficit
              </p>
            </div>
            <Badge variant="default" size="xs">
              Override
            </Badge>
          </div>

          {/* Quick Charge Action */}
          <div className="p-4 rounded-2xl border border-[#DCE4DE] bg-[#F5F7F3]/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#15211B]">Store Excess Solar Yield</span>
              <Badge variant="surplus" size="xs">Charge</Badge>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="0.5"
                max="5.0"
                step="0.5"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(Number(e.target.value))}
                className="w-24 rounded-xl border border-[#DCE4DE] bg-white px-3 py-1.5 text-xs font-mono font-bold text-[#15211B]"
              />
              <span className="text-xs text-[#5E6A63]">kWh from House A</span>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteCharge}
                disabled={status === 'CHARGING' || battery.soc >= 95}
                className="flex-1 justify-center"
              >
                Store in ESS
              </Button>
            </div>
          </div>

          {/* Quick Discharge Action */}
          <div className="p-4 rounded-2xl border border-[#DCE4DE] bg-[#F5F7F3]/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#15211B]">Discharge to Support Deficit</span>
              <Badge variant="warning" size="xs">Discharge</Badge>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="0.5"
                max="5.0"
                step="0.5"
                value={dischargeAmount}
                onChange={(e) => setDischargeAmount(Number(e.target.value))}
                className="w-24 rounded-xl border border-[#DCE4DE] bg-white px-3 py-1.5 text-xs font-mono font-bold text-[#15211B]"
              />
              <span className="text-xs text-[#5E6A63]">kWh to House B</span>
              <Button
                variant="warning"
                size="sm"
                onClick={handleExecuteDischarge}
                disabled={status === 'DISCHARGING' || battery.soc <= 20}
                className="flex-1 justify-center"
              >
                Discharge
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 4. BMS DIAGNOSTICS & PROSUMER OWNERSHIP TABLE */}
      {isAdvancedOpen && (
        <div className="rounded-3xl border border-[#DCE4DE] bg-white p-6 shadow-card space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE4DE]">
            <div>
              <h3 className="text-base font-bold text-[#15211B]">
                BMS Diagnostics & Virtual Storage Ledger
              </h3>
              <p className="text-xs text-[#5E6A63]">
                Cell balancing, thermal telemetry, and prosumer equity shares
              </p>
            </div>
            <Badge variant="ai" size="xs">
              Diagnostics Active
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#F5F7F3] border border-[#DCE4DE]">
              <span className="text-[#87918B] block font-sans">Pack Voltage</span>
              <span className="text-base font-bold text-[#15211B]">{battery.voltage.toFixed(1)} V</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F7F3] border border-[#DCE4DE]">
              <span className="text-[#87918B] block font-sans">Operating Temp</span>
              <span className="text-base font-bold text-[#209B67]">{battery.tempC.toFixed(1)} °C</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F7F3] border border-[#DCE4DE]">
              <span className="text-[#87918B] block font-sans">Total Cycles</span>
              <span className="text-base font-bold text-[#15211B]">{battery.cycleCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F7F3] border border-[#DCE4DE]">
              <span className="text-[#87918B] block font-sans">Max C-Rate</span>
              <span className="text-base font-bold text-[#7359C8]">0.5C (25 kW)</span>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 5. RECENT BATTERY DISPATCH LEDGER */}
      <div className="rounded-3xl border border-[#DCE4DE] bg-white p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE4DE]">
          <div>
            <h3 className="text-base font-bold text-[#15211B]">
              Storage Event Ledger
            </h3>
            <p className="text-xs text-[#5E6A63]">
              Chronological ledger of charge and discharge injections
            </p>
          </div>
          <Badge variant="surplus" size="xs">
            {history.length} Events Logged
          </Badge>
        </div>

        <div className="space-y-2.5">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-[#DCE4DE] bg-[#F5F7F3]/40 text-xs"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${
                  item.action === 'CHARGE' ? 'bg-[#E7F6EE] text-[#209B67]' : 'bg-[#FFF3D7] text-[#E7AA31]'
                }`}>
                  <FaIcon name={item.action === 'CHARGE' ? 'bolt' : 'battery'} />
                </div>
                <div>
                  <div className="font-bold text-[#15211B]">{item.source} ➔ {item.dest}</div>
                  <div className="text-[11px] text-[#87918B]">{item.time} • {item.energyKwh} kWh ({item.action})</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-[#15211B]">{item.socBefore}% ➔ {item.socAfter}% SOC</div>
                <Badge variant="surplus" size="xs">
                  {item.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
