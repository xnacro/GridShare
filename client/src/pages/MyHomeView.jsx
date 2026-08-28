import React, { useState, useEffect, useRef, useMemo } from 'react';
import ResidentialHouseCanvas3D from '../components/home-3d/ResidentialHouseCanvas3D';
import MetricCard from '../components/ui/MetricCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import FaIcon from '../components/icons/FaIcon';

export default function MyHomeView() {
  // Household State
  const [energyMode, setEnergyMode] = useState('AUTO'); // 'AUTO' | 'SELF_USE' | 'BATTERY_FIRST' | 'SELL_SURPLUS' | 'GRID_BACKUP'
  const [solarBaseKw, setSolarBaseKw] = useState(5.2);
  const [batterySoc, setBatterySoc] = useState(68.0);
  const [statusMessage, setStatusMessage] = useState('');

  // Appliance Loads
  const [appliances, setAppliances] = useState({
    livingRoom: { name: 'Living Room Lights & Media', kw: 0.4, active: true, icon: 'tv' },
    kitchen: { name: 'Kitchen Appliances & Induction', kw: 0.8, active: true, icon: 'plug' },
    ac: { name: 'Inverter Air Conditioner (24°C)', kw: 1.2, active: true, icon: 'fan' },
    ev: { name: 'Level 2 Electric Vehicle Charger', kw: 3.3, active: false, icon: 'charging' },
    waterHeater: { name: 'Smart Heat Pump Water Heater', kw: 0.9, active: false, icon: 'power' },
  });

  const [activityLogs, setActivityLogs] = useState([
    { time: '11:15', action: 'Battery Charge', energy: 1.5, source: 'Rooftop Solar', dest: 'Home Storage', status: 'COMPLETED' },
    { time: '11:45', action: 'P2P Peer Sale', energy: 2.0, source: 'Solar Surplus', dest: 'House B (EV)', status: 'COMPLETED' },
    { time: '12:00', action: 'Auto Load Shift', energy: 1.2, source: 'Solar Array', dest: 'Air Conditioning', status: 'ACTIVE' },
  ]);

  const toggleAppliance = (key) => {
    setAppliances((prev) => {
      const nextState = !prev[key].active;
      const appName = prev[key].name;
      setStatusMessage(`${nextState ? 'Energized' : 'Paused'} ${appName}.`);
      setTimeout(() => setStatusMessage(''), 3000);
      return {
        ...prev,
        [key]: { ...prev[key], active: nextState },
      };
    });
  };

  const totalApplianceKw = useMemo(() => {
    return Object.values(appliances)
      .filter((a) => a.active)
      .reduce((sum, a) => sum + a.kw, 0);
  }, [appliances]);

  const netHomeKw = solarBaseKw - totalApplianceKw;
  const isSurplus = netHomeKw >= 0;

  const energyModes = [
    {
      id: 'AUTO',
      name: 'Auto AI Operating Mode',
      desc: 'Algorithmically minimizes grid import, buffers battery reserves, and sells excess prosumer energy.',
      recommended: true,
      icon: 'sparkles',
    },
    {
      id: 'SELF_USE',
      name: 'Self-Consumption First',
      desc: 'Prioritizes powering all active home appliances before battery storage or external grid export.',
      icon: 'home',
    },
    {
      id: 'BATTERY_FIRST',
      name: 'Battery Buffer Priority',
      desc: 'Diverts 100% of solar generation into home ESS until 95% state of charge is attained.',
      icon: 'battery',
    },
    {
      id: 'SELL_SURPLUS',
      name: 'Maximize P2P Marketplace',
      desc: 'Lists available solar headroom on the peer market to maximize monthly community earnings.',
      icon: 'trade',
    },
    {
      id: 'GRID_BACKUP',
      name: 'Blackout Defense Mode',
      desc: 'Locks full battery capacity for critical home circuits in anticipation of utility outages.',
      icon: 'shield',
    },
  ];

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto pb-8 select-none">

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102019] tracking-tight">
              My Home Prosumer Energy Cockpit
            </h1>
            <Badge variant="surplus" size="sm">
              House A (Prosumer)
            </Badge>
          </div>
          <p className="text-sm text-[#5D6B64] font-medium mt-1">
            Real-time rooftop solar generation, smart appliance load balancing, and autonomous energy mode selection.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="ai" size="sm">
            Mode: {energyMode}
          </Badge>
        </div>
      </div>

      {/* Dynamic Status Notification */}
      {statusMessage && (
        <div className="flex items-center justify-between rounded-xl border border-[#DDE5E0] bg-[#E7F5EE] px-4 py-2.5 text-sm text-[#163A2B] font-bold shadow-subtle animate-in fade-in">
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage('')} className="text-[#168A5A] text-xs font-bold p-1">
            ✕
          </button>
        </div>
      )}

      {/* 🌟 1. PRIMARY HOUSEHOLD METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Rooftop Solar Gen"
          value={`${solarBaseKw.toFixed(1)} kW`}
          subtitle="Monocrystalline solar yield"
          iconName="solar"
          variant="solar"
          delta="Peak noon irradiance"
          deltaType="positive"
        />

        <MetricCard
          title="Active Home Load"
          value={`${totalApplianceKw.toFixed(1)} kW`}
          subtitle={`${Object.values(appliances).filter((a) => a.active).length} active appliances`}
          iconName="home"
          variant="default"
          delta="Optimized by AI"
          deltaType="neutral"
        />

        <MetricCard
          title="Net Home Balance"
          value={`${isSurplus ? '+' : ''}${netHomeKw.toFixed(1)} kW`}
          subtitle={isSurplus ? 'Surplus ready for P2P trading' : 'Importing from battery'}
          iconName="energy"
          variant={isSurplus ? 'surplus' : 'deficit'}
          badge={isSurplus ? 'SURPLUS' : 'DEFICIT'}
        />

        <MetricCard
          title="Home ESS Battery"
          value={`${batterySoc.toFixed(0)}%`}
          subtitle="10 kWh residential storage"
          iconName="battery"
          variant="battery"
          badge="HEALTHY"
        />
      </div>

      {/* 🌟 2. SMART OPERATING MODES SELECTOR */}
      <div className="rounded-2xl border border-[#DDE5E0] bg-white p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#102019]">
              Smart Home Energy Modes
            </h3>
            <p className="text-xs text-[#5D6B64]">
              Select how your household manages solar allocation, battery reserve, and peer trading
            </p>
          </div>
          <Badge variant="ai" size="xs">
            Intelligent Dispatch
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          {energyModes.map((mode) => {
            const isSelected = energyMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setEnergyMode(mode.id);
                  setStatusMessage(`Switched home operating profile to ${mode.name}.`);
                  setTimeout(() => setStatusMessage(''), 4000);
                }}
                className={`p-3.5 rounded-xl border text-left transition duration-150 flex flex-col justify-between space-y-2 ${isSelected
                    ? 'bg-[#163A2B] text-white border-[#163A2B] shadow-sm'
                    : 'bg-[#FBFCFB] border-[#DDE5E0] text-[#102019] hover:bg-white hover:border-[#CBD5CF]'
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <FaIcon
                      name={mode.icon}
                      className={`text-sm ${isSelected ? 'text-[#34B978]' : 'text-[#5D6B64]'}`}
                    />
                    {mode.recommended && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${isSelected ? 'bg-[#34B978] text-[#163A2B]' : 'bg-[#E7F5EE] text-[#168A5A]'
                        }`}>
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className={`text-xs font-bold mt-2 ${isSelected ? 'text-white' : 'text-[#102019]'}`}>
                    {mode.name}
                  </div>
                </div>
                <p className={`text-[11px] leading-snug line-clamp-2 ${isSelected ? 'text-[#CBD5CF]' : 'text-[#83908A]'}`}>
                  {mode.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🌟 3. 3D RESIDENTIAL HOUSE TWIN + APPLIANCE MANAGER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* 3D RESIDENTIAL HOUSE CANVAS (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-[#DDE5E0] bg-white p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDE5E0]">
            <div>
              <h3 className="text-base font-bold text-[#102019]">
                3D Residential Architectural Twin
              </h3>
              <p className="text-xs text-[#5D6B64]">
                Spatial visualization of rooftop solar panels, living spaces, and battery circuit
              </p>
            </div>
            <Badge variant="surplus" size="xs">
              House A Twin
            </Badge>
          </div>

          <div className="h-[400px] w-full relative rounded-xl overflow-hidden bg-[#F5F7F6]">
            <ResidentialHouseCanvas3D
              solarGen={solarBaseKw}
              consumption={totalApplianceKw}
              batterySoc={batterySoc}
              appliances={appliances}
              energyMode={energyMode}
            />

            {/* Micro Overlay */}
            <div className="absolute top-3 left-3 pointer-events-none">
              <div className="flex items-center space-x-2 rounded-full border border-[#DDE5E0] bg-white/95 px-3 py-1 shadow-card backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-[#168A5A] animate-pulse" />
                <span className="text-xs font-bold text-[#102019]">
                  {isSurplus ? `Surplus: +${netHomeKw.toFixed(1)} kW` : `Deficit: ${netHomeKw.toFixed(1)} kW`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* APPLIANCE LOAD CONTROLLER (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-[#DDE5E0] bg-white p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDE5E0]">
            <div>
              <h3 className="text-base font-bold text-[#102019]">
                Smart Appliance Load Balancing
              </h3>
              <p className="text-xs text-[#5D6B64]">
                Toggle household circuits to shift peak consumption
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#168A5A]">
              Total: {totalApplianceKw.toFixed(1)} kW
            </span>
          </div>

          <div className="space-y-2.5">
            {Object.entries(appliances).map(([key, app]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[#DDE5E0] bg-[#FBFCFB] hover:bg-white transition"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${app.active ? 'bg-[#E7F5EE] text-[#168A5A]' : 'bg-[#F5F7F6] text-[#83908A]'
                    }`}>
                    <FaIcon name={app.icon || 'power'} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#102019]">{app.name}</div>
                    <div className="text-[11px] font-mono text-[#83908A]">{app.kw} kW draw</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleAppliance(key)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${app.active ? 'bg-[#168A5A]' : 'bg-[#DDE5E0]'
                    }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${app.active ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Quick Solar Slider */}
          <div className="p-3.5 rounded-xl bg-[#FFF4D8]/50 border border-[#F7E7BE] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#E8A72B] flex items-center gap-1.5">
                <FaIcon name="solar" />
                Simulate Solar Irradiance
              </span>
              <span className="font-mono font-bold text-[#102019]">{solarBaseKw.toFixed(1)} kW</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="8.0"
              step="0.2"
              value={solarBaseKw}
              onChange={(e) => setSolarBaseKw(Number(e.target.value))}
              className="w-full accent-[#E8A72B] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 🌟 4. HOUSEHOLD RECENT ACTIVITY LOG */}
      <div className="rounded-2xl border border-[#DDE5E0] bg-white p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE5E0]">
          <div>
            <h3 className="text-base font-bold text-[#102019]">
              Household Dispatch & Activity Log
            </h3>
            <p className="text-xs text-[#5D6B64]">
              Recent automated solar allocations, battery dispatches, and peer transactions
            </p>
          </div>
          <Badge variant="default" size="xs">
            {activityLogs.length} Events Logged
          </Badge>
        </div>

        <div className="space-y-2.5">
          {activityLogs.map((log, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3.5 rounded-xl border border-[#DDE5E0] bg-[#FBFCFB] hover:bg-white text-xs transition"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#E7F5EE] text-[#168A5A] flex items-center justify-center text-xs">
                  <FaIcon name="trade" />
                </div>
                <div>
                  <div className="font-bold text-[#102019]">{log.action}</div>
                  <div className="text-[11px] text-[#83908A]">{log.time} • {log.source} ➔ {log.dest}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-bold text-[#168A5A]">+{log.energy.toFixed(1)} kWh</div>
                <Badge variant="surplus" size="xs">{log.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
