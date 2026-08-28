import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ResidentialHouseCanvas3D from '../components/home-3d/ResidentialHouseCanvas3D';
import PageHero from '../components/ui/PageHero';
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
    <div className="space-y-8 max-w-[1520px] mx-auto pb-12 select-none animate-fadeIn">
      
      {/* 🌟 1. MY HOME HERO */}
      <PageHero
        category="YOUR HOUSEHOLD COCKPIT"
        statusBadge={householdType}
        statusVariant={isSurplus ? 'surplus' : 'deficit'}
        title="Welcome Home •"
        highlightText={
          isSurplus
            ? `You're currently producing ${netHomeKw.toFixed(1)} kW more than you need.`
            : `Drawing ${Math.abs(netHomeKw).toFixed(1)} kW clean power to meet active household load.`
        }
        subtitle="Manage rooftop solar allocation, smart appliance circuits, and bilateral peer sales for your residence."
        supportingFacts={[
          { label: 'Rooftop Solar', value: `${activeGenKw.toFixed(1)} kW`, icon: 'solar' },
          { label: 'Active Load', value: `${totalApplianceKw.toFixed(1)} kW`, icon: 'home' },
          { label: 'Net Balance', value: `${isSurplus ? '+' : ''}${netHomeKw.toFixed(1)} kW`, icon: 'network' },
        ]}
        primaryAction={{
          label: 'Smart Load Balancing',
          icon: 'sliders',
          onClick: () => {
            const el = document.getElementById('appliance-manager');
            el?.scrollIntoView({ behavior: 'smooth' });
          },
        }}
        secondaryAction={{
          label: 'Configure Data Source',
          icon: 'devices',
          onClick: () => {
            const el = document.getElementById('data-source-panel');
            el?.scrollIntoView({ behavior: 'smooth' });
          },
        }}
      />

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
        <div className="lg:col-span-7 rounded-3xl bg-white border border-[rgba(23,56,43,0.08)] p-6 shadow-card flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(23,56,43,0.06)]">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#E6F5EC] text-[#1E9B67] flex items-center justify-center text-xs">
                <FaIcon name="home" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#15221B]">
                  3D Residential Architectural Twin
                </h3>
                <p className="text-xs text-[#5E6B63]">
                  Spatial view of rooftop panels, living circuits, and home storage
                </p>
              </div>
            </div>
            <Badge variant="surplus" size="xs">
              {householdTitle}
            </Badge>
          </div>

          <div className="h-[380px] w-full relative rounded-2xl overflow-hidden bg-[#EEF2ED]/60 border border-[rgba(23,56,43,0.05)]">
            <ResidentialHouseCanvas3D
              solarGen={activeGenKw}
              consumption={totalApplianceKw}
              batterySoc={batterySoc}
              appliances={appliances}
              energyMode={energyMode}
            />

            {/* Floating Glass Surplus Pill */}
            <div className="absolute top-3 left-3 pointer-events-none p-2 rounded-2xl gs-glass shadow-sm flex items-center gap-2">
              <FaIcon name="solar" className="text-[#1E9B67] text-xs" />
              <span className="text-xs font-bold text-[#15221B]">
                {isSurplus ? `Surplus: +${netHomeKw.toFixed(1)} kW` : `Deficit: ${netHomeKw.toFixed(1)} kW`}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: SMART APPLIANCE BALANCER (5 cols) */}
        <div id="appliance-manager" className="lg:col-span-5 rounded-3xl bg-white border border-[rgba(23,56,43,0.08)] p-6 shadow-card flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(23,56,43,0.06)]">
            <div>
              <h3 className="text-base font-extrabold text-[#15221B]">
                Appliance Load Balancing
              </h3>
              <p className="text-xs text-[#5E6B63]">
                Toggle smart circuits to shift peak consumption
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#1E9B67]">
              Total: {totalApplianceKw.toFixed(1)} kW
            </span>
          </div>

          <div className="space-y-2.5">
            {Object.entries(appliances).map(([key, app]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F5F7F3]/60 border border-[rgba(23,56,43,0.06)] hover:bg-white transition"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${
                    app.active ? 'bg-[#E6F5EC] text-[#1E9B67]' : 'bg-[#F5F7F3] text-[#8A948E]'
                  }`}>
                    <FaIcon name={app.icon || 'plug'} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#15221B]">{app.name}</div>
                    <div className="text-[11px] font-mono text-[#5E6B63]">{app.kw} kW draw</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleAppliance(key)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    app.active ? 'bg-[#1E9B67]' : 'bg-[#DCE4DE]'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                      app.active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* Quick Simulation Slider if in simulation */}
          {sourceType === 'SIMULATION' && (
            <div className="p-3.5 rounded-2xl bg-[#FFF7E4]/60 border border-[#E5A72D]/20 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#E5A72D] flex items-center gap-1.5">
                  <FaIcon name="solar" />
                  Simulate Solar Irradiance
                </span>
                <span className="font-mono font-bold text-[#15221B]">{solarKw.toFixed(1)} kW</span>
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
      <div className="rounded-3xl bg-white border border-[rgba(23,56,43,0.08)] p-6 sm:p-8 shadow-card space-y-4">
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
                className={`p-4 rounded-2xl border text-left transition duration-150 flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-[#12382A] text-white border-[#12382A] shadow-md'
                    : 'bg-[#F5F7F3]/40 border-[rgba(23,56,43,0.08)] text-[#15221B] hover:bg-white hover:border-[#1E9B67]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <FaIcon
                      name={mode.icon}
                      className={`text-sm ${isSelected ? 'text-[#43CB8C]' : 'text-[#5E6B63]'}`}
                    />
                    {mode.recommended && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        isSelected ? 'bg-[#43CB8C] text-[#12382A]' : 'bg-[#E6F5EC] text-[#1E9B67]'
                      }`}>
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className={`text-xs font-bold mt-2 ${isSelected ? 'text-white' : 'text-[#15221B]'}`}>
                    {mode.name}
                  </div>
                </div>
                <p className={`text-[11px] leading-snug line-clamp-2 ${isSelected ? 'text-[#DCE4DE]' : 'text-[#5E6B63]'}`}>
                  {mode.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🌟 5. DATA SOURCE & INGESTION MODE (SIMULATION vs MANUAL) */}
      <div id="data-source-panel" className="rounded-3xl bg-white border border-[rgba(23,56,43,0.08)] p-6 sm:p-8 shadow-card space-y-4">
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
            className={`p-4 rounded-2xl border cursor-pointer transition ${
              sourceType === 'SIMULATION'
                ? 'bg-[#E6F5EC]/50 border-[#1E9B67] ring-2 ring-[#1E9B67]/20'
                : 'bg-[#F5F7F3]/40 border-[rgba(23,56,43,0.08)] hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-[#15221B]">SIMULATION Mode</span>
              <Badge variant={sourceType === 'SIMULATION' ? 'surplus' : 'default'} size="xs">
                DIURNAL
              </Badge>
            </div>
            <p className="text-xs text-[#5E6B63]">
              Continuous physical simulation calculated from NSRDB Guwahati satellite irradiance models.
            </p>
          </div>

          <div
            onClick={() => setSourceType('MANUAL')}
            className={`p-4 rounded-2xl border cursor-pointer transition ${
              sourceType === 'MANUAL'
                ? 'bg-[#F1ECFF]/50 border-[#7358C8] ring-2 ring-[#7358C8]/20'
                : 'bg-[#F5F7F3]/40 border-[rgba(23,56,43,0.08)] hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-[#15221B]">MANUAL Override Mode</span>
              <Badge variant={sourceType === 'MANUAL' ? 'ai' : 'default'} size="xs">
                CUSTOM kW
              </Badge>
            </div>
            <p className="text-xs text-[#5E6B63]">
              Manually set generation and demand to stress test microgrid balances, tariffs, and P2P matching.
            </p>
          </div>
        </div>

        {/* Manual Configuration Inputs */}
        {sourceType === 'MANUAL' && (
          <div className="p-4 rounded-2xl border border-[#7358C8]/30 bg-[#F1ECFF]/20 space-y-3 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#15221B]">Manual Solar Generation (kW)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={manualGenInput}
                  onChange={(e) => setManualGenInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-[rgba(23,56,43,0.12)] bg-white px-3 py-2 text-xs font-mono font-bold text-[#15221B] focus:border-[#7358C8] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#15221B]">Manual Household Load (kW)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={manualConInput}
                  onChange={(e) => setManualConInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-[rgba(23,56,43,0.12)] bg-white px-3 py-2 text-xs font-mono font-bold text-[#15221B] focus:border-[#7358C8] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-[#5E6B63]">
                Resulting Balance:{' '}
                <strong className={manualGenInput - manualConInput >= 0 ? 'text-[#1E9B67]' : 'text-[#D65D5D]'}>
                  {manualGenInput - manualConInput >= 0 ? `+${(manualGenInput - manualConInput).toFixed(2)}` : (manualGenInput - manualConInput).toFixed(2)} kW
                </strong>
              </span>

              <Button
                variant="primary"
                size="sm"
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
