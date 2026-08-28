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
    minSoc: 10,
    maxSoc: 100,
    reserveKwh: 5.0,
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
    }, 1500);
  };

  const handleExecuteDischarge = () => {
    if (battery.soc <= battery.minSoc) {
      setStatusMessage('⚠️ Blackout reserve floor reached (10%). Discharging halted for safety.');
      return;
    }
    setStatus('DISCHARGING');
    setActiveFlow({ type: 'DISCHARGE', kw: dischargeAmount });
    setStatusMessage(`Discharging ${dischargeAmount} kWh to support House B peak deficit.`);
    
    setTimeout(() => {
      setBattery((prev) => {
        const nextSoc = Math.max(10, prev.soc - Math.round((dischargeAmount / prev.capacity) * 100));
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
          socAfter: Math.max(10, battery.soc - Math.round((dischargeAmount / battery.capacity) * 100)),
          status: 'COMPLETED',
        },
        ...prev,
      ]);
      setStatusMessage(`Discharged ${dischargeAmount} kWh successfully.`);
      setTimeout(() => setStatusMessage(''), 4000);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto pb-8 select-none">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#142019] tracking-tight">
              Community Energy Storage System (ESS)
            </h1>
            <Badge variant="battery" size="sm">
              50 kWh Battery Twin
            </Badge>
          </div>
          <p className="text-sm text-[#5C6962] font-medium mt-1">
            Centralized lithium-iron-phosphate (LFP) storage with automated BMS reserve management and blackout protection.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => sceneRef.current?.resetCamera()}
            icon={<FaIcon name="camera" />}
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
        <div className="flex items-center justify-between rounded-2xl border border-[#DDE4DF] bg-[#E7F5EE] px-4 py-3 text-sm text-[#12372A] font-bold shadow-subtle animate-in fade-in">
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage('')} className="text-[#1C9A67] text-xs font-bold p-1">
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
          subtitle="Ready for P2P dispatch"
          iconName="energy"
          variant="surplus"
          delta="Above reserve threshold"
          deltaType="positive"
        />

        <MetricCard
          title="Blackout Reserve Floor"
          value={`${reservedKwh.toFixed(1)} kWh`}
          subtitle="10% protected minimum"
          iconName="shield"
          variant="default"
          delta="Emergency backup buffer"
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
      <div className="rounded-3xl border border-[#DDE4DF] bg-white p-6 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FFF3D7] text-[#E7A82D] flex items-center justify-center text-xs">
              <FaIcon name="battery" />
            </div>
            <span className="text-sm font-bold text-[#142019]">
              Community Storage Allocation Gauge
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-[#1C9A67]">
            {availableKwh.toFixed(1)} kWh Usable | {reservedKwh.toFixed(1)} kWh Reserved
          </span>
        </div>

        {/* Multi-segment battery bar */}
        <div className="h-4 w-full rounded-full bg-[#F5F6F2] border border-[#DDE4DF] overflow-hidden flex p-0.5">
          {/* Reserved Floor (10%) */}
          <div
            className="h-full bg-[#D95E5E] rounded-l-full"
            style={{ width: '10%' }}
            title="10% Emergency Reserve Floor"
          />
          {/* Usable Active Charge */}
          <div
            className="h-full bg-[#1C9A67] transition-all duration-500"
            style={{ width: `${Math.max(0, battery.soc - 10)}%` }}
            title={`${battery.soc - 10}% Available for P2P trading`}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-[#5C6962] font-medium pt-0.5">
          <span className="flex items-center gap-1.5 text-[#D95E5E]">
            <FaIcon name="shield" className="text-xs" />
            0–10% Reserve Floor (Protected)
          </span>
          <span className="flex items-center gap-1.5 text-[#1C9A67]">
            <FaIcon name="bolt" className="text-xs" />
            10–{battery.soc}% Available for Local Dispatch
          </span>
          <span className="text-[#7C8781]">
            {battery.soc}–100% Headroom
          </span>
        </div>
      </div>

      {/* 🌟 3. 3D DIGITAL RACK TWIN + DISPATCH CONTROLLER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 3D RACK TWIN (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-[#DDE4DF] bg-white p-5 sm:p-6 shadow-card space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDE4DF]">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#FFF3D7] text-[#E7A82D] flex items-center justify-center text-xs">
                <FaIcon name="battery" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#142019]">
                  Interactive 3D Storage Rack Twin
                </h3>
                <p className="text-xs text-[#5C6962]">
                  Click any cell module in the 3D rack to inspect voltage and temperature
                </p>
              </div>
            </div>
            <Badge variant="battery" size="xs">
              BMS Active
            </Badge>
          </div>

          <div className="h-[380px] w-full relative rounded-2xl overflow-hidden bg-[#F5F6F2]">
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
              <div className="flex items-center space-x-2 rounded-full border border-[#DDE4DF] bg-white/95 px-3 py-1 shadow-card backdrop-blur-md">
                <FaIcon name="bolt" className={`text-xs ${activeFlow ? 'text-[#1C9A67]' : 'text-[#7C8781]'}`} />
                <span className="text-xs font-bold text-[#142019]">
                  {activeFlow ? `Active Flow: ${activeFlow.type} (${activeFlow.kw} kW)` : 'BMS Standby'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CHARGE / DISCHARGE DISPATCH CONTROLLER (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-[#DDE4DF] bg-white p-5 sm:p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDE4DF]">
            <div>
              <h3 className="text-base font-bold text-[#142019]">
                Manual Storage Dispatch
              </h3>
              <p className="text-xs text-[#5C6962]">
                Inject prosumer solar yield or discharge to relieve local deficit
              </p>
            </div>
            <Badge variant="default" size="xs">
              Override
            </Badge>
          </div>

          {/* Quick Charge Action */}
          <div className="p-4 rounded-2xl border border-[#DDE4DF] bg-[#F5F6F2]/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#142019]">Store Excess Solar Yield</span>
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
                className="w-24 rounded-xl border border-[#DDE4DF] bg-white px-3 py-1.5 text-xs font-mono font-bold text-[#142019]"
              />
              <span className="text-xs text-[#5C6962]">kWh from House A</span>
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
          <div className="p-4 rounded-2xl border border-[#DDE4DF] bg-[#F5F6F2]/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#142019]">Discharge to Support Deficit</span>
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
                className="w-24 rounded-xl border border-[#DDE4DF] bg-white px-3 py-1.5 text-xs font-mono font-bold text-[#142019]"
              />
              <span className="text-xs text-[#5C6962]">kWh to House B</span>
              <Button
                variant="warning"
                size="sm"
                onClick={handleExecuteDischarge}
                disabled={status === 'DISCHARGING' || battery.soc <= battery.minSoc}
                className="flex-1 justify-center"
              >
                Discharge ESS
              </Button>
            </div>
          </div>

          {/* Blackout Reserve Notice */}
          <div className="p-3.5 rounded-2xl bg-[#FFF3D7]/60 border border-[#FDE7B4] text-xs text-[#142019] space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-[#E7A82D]">
              <FaIcon name="shield" />
              Automated Reserve Protection
            </span>
            <p className="text-[#5C6962] leading-relaxed text-[11.5px]">
              The BMS actively protects a 10% reserve threshold (5.0 kWh) to guarantee emergency lighting and circuit continuity during grid blackouts.
            </p>
          </div>
        </div>
      </div>

      {/* 🌟 4. EXPANDABLE ADVANCED BMS DIAGNOSTICS */}
      {isAdvancedOpen && (
        <div className="rounded-3xl border border-[#DDE4DF] bg-white p-6 shadow-card space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDE4DF]">
            <div>
              <h3 className="text-base font-bold text-[#142019]">
                Battery Management System (BMS) Hardware Diagnostics
              </h3>
              <p className="text-xs text-[#5C6962]">
                Rack-level thermal profiles, cell balancing, and telemetry status
              </p>
            </div>
            <Badge variant="ai" size="xs">
              Simulated Telemetry
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl border border-[#DDE4DF] bg-[#F5F6F2]/40">
              <span className="text-[#5C6962] text-[11px]">Bus Voltage</span>
              <div className="text-base font-mono font-bold text-[#142019] mt-0.5">400.0 V DC</div>
            </div>
            <div className="p-3.5 rounded-2xl border border-[#DDE4DF] bg-[#F5F6F2]/40">
              <span className="text-[#5C6962] text-[11px]">Internal Temperature</span>
              <div className="text-base font-mono font-bold text-[#1C9A67] mt-0.5">{battery.tempC}°C (Optimal)</div>
            </div>
            <div className="p-3.5 rounded-2xl border border-[#DDE4DF] bg-[#F5F6F2]/40">
              <span className="text-[#5C6962] text-[11px]">State of Health (SOH)</span>
              <div className="text-base font-mono font-bold text-[#1C9A67] mt-0.5">{battery.health}%</div>
            </div>
            <div className="p-3.5 rounded-2xl border border-[#DDE4DF] bg-[#F5F6F2]/40">
              <span className="text-[#5C6962] text-[11px]">Total Equivalent Cycles</span>
              <div className="text-base font-mono font-bold text-[#142019] mt-0.5">{battery.cycleCount} Cycles</div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 5. BATTERY ACTIVITY HISTORY LEDGER */}
      <div className="rounded-3xl border border-[#DDE4DF] bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE4DF]">
          <div>
            <h3 className="text-base font-bold text-[#142019]">
              Storage Dispatch & Activity History
            </h3>
            <p className="text-xs text-[#5C6962]">
              Audit trail of charge and discharge injections
            </p>
          </div>
          <Badge variant="default" size="xs">
            {history.length} Events Logged
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DDE4DF] bg-[#F5F6F2] text-[11px] font-bold uppercase tracking-wider text-[#5C6962]">
                <th className="px-3.5 py-2.5">Event ID</th>
                <th className="px-3.5 py-2.5">Time</th>
                <th className="px-3.5 py-2.5">Action</th>
                <th className="px-3.5 py-2.5">Source ➔ Destination</th>
                <th className="px-3.5 py-2.5 text-right">Energy (kWh)</th>
                <th className="px-3.5 py-2.5 text-right">SOC Transition</th>
                <th className="px-3.5 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F6F2] font-mono text-[12px]">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-[#F5F6F2]/30 transition">
                  <td className="px-3.5 py-3 font-bold text-[#142019]">{h.id}</td>
                  <td className="px-3.5 py-3 text-[#5C6962] font-sans">{h.time}</td>
                  <td className="px-3.5 py-3 font-sans">
                    <Badge variant={h.action === 'CHARGE' ? 'surplus' : 'warning'} size="xs">
                      {h.action}
                    </Badge>
                  </td>
                  <td className="px-3.5 py-3 font-sans text-[#142019]">{h.source} ➔ {h.dest}</td>
                  <td className="px-3.5 py-3 text-right font-bold text-[#142019]">{h.energyKwh.toFixed(1)} kWh</td>
                  <td className="px-3.5 py-3 text-right text-[#5C6962]">{h.socBefore}% ➔ <span className="font-bold text-[#1C9A67]">{h.socAfter}%</span></td>
                  <td className="px-3.5 py-3 text-right font-sans">
                    <span className="text-[#1C9A67] font-bold">COMPLETED ✓</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
