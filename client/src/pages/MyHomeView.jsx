import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ResidentialHouseCanvas3D from '../components/home-3d/ResidentialHouseCanvas3D';
import HeroMetric from '../components/ui/HeroMetric';
import GlassSurface from '../components/ui/GlassSurface';
import SectionHeader from '../components/ui/SectionHeader';
import FaIcon from '../components/icons/FaIcon';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function MyHomeView() {
  const { user, profile, household, energyNode } = useAuth();

  // Operating Mode State
  const [energyMode, setEnergyMode] = useState('AUTO'); // 'AUTO' | 'SELF_USE' | 'BATTERY_FIRST' | 'SELL_SURPLUS' | 'GRID_BACKUP'
  const [batterySoc, setBatterySoc] = useState(68.0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSavingSource, setIsSavingSource] = useState(false);

  // Live Backend Energy State
  const [sourceType, setSourceType] = useState(energyNode?.source_type || 'SIMULATION');
  const [solarKw, setSolarKw] = useState(household?.household_type === 'CONSUMER' ? 1.0 : 6.4);
  const [manualGenInput, setManualGenInput] = useState(6.4);
  const [manualConInput, setManualConInput] = useState(2.2);

  // Appliance Circuit Loads
  const isConsumerHousehold = household?.household_type === 'CONSUMER' || household?.id === 'house_prince' || household?.id === 'house_rahul';
  const [appliances, setAppliances] = useState({
    livingRoom: { name: 'Living Room Lights & Media', kw: 0.4, active: true, icon: 'tv' },
    kitchen: { name: 'Kitchen Induction & Refrigerator', kw: 0.8, active: true, icon: 'plug' },
    ac: { name: 'Inverter Air Conditioner (24°C)', kw: 1.2, active: true, icon: 'fan' },
    ev: { name: 'Level 2 Electric Vehicle Charger', kw: isConsumerHousehold ? 3.2 : 1.5, active: isConsumerHousehold, icon: 'charging' },
    waterHeater: { name: 'Smart Heat Pump Water Heater', kw: 0.9, active: false, icon: 'plug' },
  });

  const [activityLogs] = useState([
    { time: '11:15', action: 'Battery Charge', energy: 1.5, source: 'Rooftop Solar', dest: 'Home Storage', status: 'COMPLETED' },
    { time: '11:45', action: 'P2P Peer Sale', energy: 2.0, source: 'Solar Surplus', dest: "Prince's Home (EV)", status: 'COMPLETED' },
    { time: '12:00', action: 'Auto Load Shift', energy: 1.2, source: 'Solar Array', dest: 'Air Conditioning', status: 'ACTIVE' },
  ]);

  // Fetch verified user energy from backend
  const fetchEnergy = async () => {
    try {
      const res = await api.getMyEnergy();
      if (res.data?.status === 'SUCCESS') {
        const e = res.data.energy;
        const n = res.data.node;
        setSourceType(n.source_type || 'SIMULATION');
        setSolarKw(e.generation_kw);
        setManualGenInput(n.manual_generation_kw || e.generation_kw);
        setManualConInput(n.manual_consumption_kw || e.consumption_kw);
        if (e.battery_soc) setBatterySoc(e.battery_soc);
      }
    } catch (err) {
      console.warn('Using local fallback energy state:', err);
    }
  };

  useEffect(() => {
    fetchEnergy();
    const interval = setInterval(fetchEnergy, 6000);
    return () => clearInterval(interval);
  }, [household?.id]);

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

  const handleSaveSourceConfig = async () => {
    setIsSavingSource(true);
    try {
      await api.updateMyEnergySource({
        source_type: sourceType,
        manual_generation_kw: manualGenInput,
        manual_consumption_kw: manualConInput,
      });
      setStatusMessage(`Energy source updated to ${sourceType} with ${manualGenInput} kW generation.`);
      await fetchEnergy();
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      setStatusMessage('Failed to update energy source configuration.');
    } finally {
      setIsSavingSource(false);
    }
  };

  const totalApplianceKw = useMemo(() => {
    if (sourceType === 'MANUAL') {
      return manualConInput;
    }
    return Object.values(appliances)
      .filter((a) => a.active)
      .reduce((sum, a) => sum + a.kw, 0);
  }, [appliances, sourceType, manualConInput]);

  const activeGenKw = sourceType === 'MANUAL' ? manualGenInput : solarKw;
  const netHomeKw = activeGenKw - totalApplianceKw;
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
      icon: 'marketplace',
    },
    {
      id: 'GRID_BACKUP',
      name: 'Blackout Defense Mode',
      desc: 'Locks full battery capacity for critical home circuits in anticipation of utility outages.',
      icon: 'shield',
    },
  ];

  const householdTitle = household?.name || 'My Residence';
  const householdType = household?.household_type || (isSurplus ? 'PROSUMER' : 'CONSUMER');

  return (
    <div className="space-y-6 max-w-[1520px] mx-auto pb-12 select-none animate-fadeIn">
      
      {/* 🌟 1. COMPACT PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[rgba(23,34,29,0.06)]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#041D0D]">
              {householdTitle} Cockpit
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E2F0CC] text-[#012F13] border border-[#BED69E]">
              {householdType}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4A5B4F] mt-0.5">
            {isSurplus
              ? `Generating +${netHomeKw.toFixed(1)} kW surplus solar energy ready to share or buffer in community ESS`
              : `Drawing ${Math.abs(netHomeKw).toFixed(1)} kW clean power to support active household circuits`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('appliance-manager');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-xl bg-[#012F13] hover:bg-[#0B3E1D] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <FaIcon name="sliders" className="text-[#8BC53D]" />
            <span>Load Balancing</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('data-source-panel');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#BED69E] text-[#011207] text-xs font-bold hover:bg-[#F4F9EB] transition flex items-center gap-1.5 shadow-xs"
          >
            <FaIcon name="devices" />
            <span>Data Source</span>
          </button>
        </div>
      </div>

      {/* Dynamic Status Notification */}
      {statusMessage && (
        <div className="flex items-center justify-between rounded-2xl border border-[#DCE4DE] bg-[#E6F5EC] px-4 py-3 text-xs sm:text-sm text-[#12382A] font-bold shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <FaIcon name="check" className="text-[#1E9B67]" />
            <span>{statusMessage}</span>
          </div>
          <button type="button" onClick={() => setStatusMessage('')} className="text-[#1E9B67] text-xs p-1 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* 🌟 2. METRIC STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <HeroMetric
          label="Solar Generation"
          value={activeGenKw.toFixed(1)}
          unit="kW"
          subtitle={sourceType === 'MANUAL' ? 'Manual user override' : 'Simulated diurnal physics'}
          iconName="solar"
          variant="solar"
        />

        <HeroMetric
          label="Active Household Load"
          value={totalApplianceKw.toFixed(1)}
          unit="kW"
          subtitle="Household circuits & appliances"
          iconName="home"
          variant="default"
        />

        <HeroMetric
          label="Net Home Balance"
          value={`${isSurplus ? '+' : ''}${netHomeKw.toFixed(1)}`}
          unit="kW"
          subtitle={isSurplus ? 'Clean surplus for local trading' : 'Importing from local peers'}
          iconName="network"
          variant={isSurplus ? 'emerald' : 'deficit'}
        />

        <HeroMetric
          label="Home Battery SOC"
          value={`${batterySoc.toFixed(0)}%`}
          unit="SOC"
          subtitle="10 kWh residential storage"
          iconName="battery"
          variant="solar"
        />
      </div>

      {/* 🌟 3. 3D RESIDENTIAL ARCHITECTURAL TWIN + SMART APPLIANCES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT: 3D RESIDENTIAL HOUSE CANVAS (7 cols) */}
        <div className="lg:col-span-7 glass-card rounded-xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(23,34,29,0.06)]">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-xs">
                <FaIcon name="home" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#17221D]">
                  3D Residential Architectural Twin
                </h3>
                <p className="text-xs text-[#5E6963]">
                  Spatial view of rooftop panels, living circuits, and home storage
                </p>
              </div>
            </div>
            <Badge variant="surplus" size="xs">
              {householdTitle}
            </Badge>
          </div>

          <div className="h-[380px] w-full relative rounded-xl overflow-hidden bg-[#F6F7F4] border border-[rgba(23,34,29,0.05)]">
            <ResidentialHouseCanvas3D
              solarGen={activeGenKw}
              consumption={totalApplianceKw}
              batterySoc={batterySoc}
              appliances={appliances}
              energyMode={energyMode}
            />

            {/* Floating Glass Surplus Pill */}
            <div className="absolute top-3 left-3 pointer-events-none p-2 rounded-xl gs-glass shadow-xs flex items-center gap-2">
              <FaIcon name="solar" className="text-[#1E9B68] text-xs" />
              <span className="text-xs font-bold text-[#17221D]">
                {isSurplus ? `Surplus: +${netHomeKw.toFixed(1)} kW` : `Deficit: ${netHomeKw.toFixed(1)} kW`}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: SMART APPLIANCE BALANCER (5 cols) */}
        <div id="appliance-manager" className="lg:col-span-5 glass-card rounded-xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(23,34,29,0.06)]">
            <div>
              <h3 className="text-base font-extrabold text-[#17221D]">
                Appliance Load Balancing
              </h3>
              <p className="text-xs text-[#5E6963]">
                Toggle smart circuits to shift peak consumption
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#1E9B68]">
              Total: {totalApplianceKw.toFixed(1)} kW
            </span>
          </div>

          <div className="space-y-2.5">
            {Object.entries(appliances).map(([key, app]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#F6F7F4] border border-[rgba(23,34,29,0.06)] hover:bg-white transition"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${
                    app.active ? 'bg-[#E8F6EE] text-[#1E9B68]' : 'bg-[#F6F7F4] text-[#89938D]'
                  }`}>
                    <FaIcon name={app.icon || 'plug'} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#17221D]">{app.name}</div>
                    <div className="text-[11px] font-mono text-[#5E6963]">{app.kw} kW draw</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleAppliance(key)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    app.active ? 'bg-[#1E9B68]' : 'bg-[#DCE4DE]'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      app.active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Quick Simulation Slider if in simulation */}
          {sourceType === 'SIMULATION' && (
            <div className="p-3.5 rounded-xl bg-[#FFF7E4] border border-[#E5A72D]/20 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#E5A72D] flex items-center gap-1.5">
                  <FaIcon name="solar" />
                  Simulate Solar Irradiance
                </span>
                <span className="font-mono font-bold text-[#17221D]">{solarKw.toFixed(1)} kW</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="8.0"
                step="0.2"
                value={solarKw}
                onChange={(e) => setSolarKw(Number(e.target.value))}
                className="w-full accent-[#E5A72D] cursor-pointer"
              />
            </div>
          )}
        </div>

      </div>

      {/* 🌟 4. SMART ENERGY MODES */}
      <div className="glass-card rounded-xl p-6 sm:p-8 space-y-4">
        <SectionHeader
          title="Smart Household Operating Modes"
          subtitle="Configure how your home allocates solar energy, preserves battery reserve, and participates in P2P trading"
          rightAction={
            <Badge variant="ai" size="xs">
              Automated Dispatch
            </Badge>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-1">
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
                className={`p-4 rounded-xl border text-left transition duration-150 flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-[#12392B] text-white border-[#12392B] shadow-xs'
                    : 'bg-[#F6F7F4] border-[rgba(23,34,29,0.08)] text-[#17221D] hover:bg-white hover:border-[#1E9B68]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <FaIcon
                      name={mode.icon}
                      className={`text-sm ${isSelected ? 'text-[#43CB8C]' : 'text-[#5E6963]'}`}
                    />
                    {mode.recommended && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        isSelected ? 'bg-[#43CB8C] text-[#12392B]' : 'bg-[#E8F6EE] text-[#1E9B68]'
                      }`}>
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className={`text-xs font-bold mt-2 ${isSelected ? 'text-white' : 'text-[#17221D]'}`}>
                    {mode.name}
                  </div>
                </div>
                <p className={`text-[11px] leading-snug line-clamp-2 ${isSelected ? 'text-[#DCE4DE]' : 'text-[#5E6963]'}`}>
                  {mode.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🌟 5. DATA SOURCE & INGESTION MODE (SIMULATION vs MANUAL) */}
      <div id="data-source-panel" className="glass-card rounded-xl p-6 sm:p-8 space-y-4">
        <SectionHeader
          title="Energy Data Source & Ingestion Mode"
          subtitle="Choose between physics-based diurnal simulation or manual test inputs"
          rightAction={
            <Badge variant="surplus" size="xs">
              Multi-Tenant Scoped
            </Badge>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => setSourceType('SIMULATION')}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              sourceType === 'SIMULATION'
                ? 'bg-[#E8F6EE] border-[#1E9B68] ring-2 ring-[#1E9B68]/20'
                : 'bg-[#F6F7F4] border-[rgba(23,34,29,0.08)] hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-[#17221D]">SIMULATION Mode</span>
              <Badge variant={sourceType === 'SIMULATION' ? 'surplus' : 'default'} size="xs">
                DIURNAL
              </Badge>
            </div>
            <p className="text-xs text-[#5E6963]">
              Continuous physical simulation calculated from NSRDB Guwahati satellite irradiance models.
            </p>
          </div>

          <div
            onClick={() => setSourceType('MANUAL')}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              sourceType === 'MANUAL'
                ? 'bg-[#F3EEFC] border-[#7358C7] ring-2 ring-[#7358C7]/20'
                : 'bg-[#F6F7F4] border-[rgba(23,34,29,0.08)] hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-[#17221D]">MANUAL Override Mode</span>
              <Badge variant={sourceType === 'MANUAL' ? 'ai' : 'default'} size="xs">
                CUSTOM kW
              </Badge>
            </div>
            <p className="text-xs text-[#5E6963]">
              Manually set generation and demand to stress test microgrid balances, tariffs, and P2P matching.
            </p>
          </div>
        </div>

        {/* Manual Configuration Inputs */}
        {sourceType === 'MANUAL' && (
          <div className="p-4 rounded-xl border border-[#7358C7]/30 bg-[#F3EEFC]/30 space-y-3 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17221D]">Manual Solar Generation (kW)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={manualGenInput}
                  onChange={(e) => setManualGenInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-[rgba(23,34,29,0.12)] bg-white px-3 py-2 text-xs font-mono font-bold text-[#17221D] focus:border-[#7358C7] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17221D]">Manual Household Load (kW)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={manualConInput}
                  onChange={(e) => setManualConInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-[rgba(23,34,29,0.12)] bg-white px-3 py-2 text-xs font-mono font-bold text-[#17221D] focus:border-[#7358C7] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-[#5E6963]">
                Resulting Balance:{' '}
                <strong className={manualGenInput - manualConInput >= 0 ? 'text-[#1E9B68]' : 'text-[#D45C5C]'}>
                  {manualGenInput - manualConInput >= 0 ? `+${(manualGenInput - manualConInput).toFixed(2)}` : (manualGenInput - manualConInput).toFixed(2)} kW
                </strong>
              </span>

              <Button
                variant="primary"
                size="sm"
                className="rounded-xl"
                onClick={handleSaveSourceConfig}
                isLoading={isSavingSource}
                icon={<FaIcon name="check" />}
              >
                Apply to Microgrid
              </Button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
