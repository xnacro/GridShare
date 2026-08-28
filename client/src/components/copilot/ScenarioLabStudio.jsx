import React, { useState } from 'react';
import FaIcon from '../icons/FaIcon';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { api } from '../../services/api';

export default function ScenarioLabStudio({ currentHousehold, baselineData }) {
  const [activePreset, setActivePreset] = useState(null);
  const [solarDelta, setSolarDelta] = useState(0);
  const [demandDelta, setDemandDelta] = useState(0);
  const [batterySoc, setBatterySoc] = useState(baselineData?.current_state?.battery_soc || 50);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const presets = [
    {
      id: 'CLOUD_COVER',
      title: 'Passing Cloud Cover',
      desc: '-60% solar irradiance drop',
      icon: 'cloud-sun',
      color: '#E5A72D',
      solar: -60,
      demand: 0,
      soc: 40,
    },
    {
      id: 'EV_CHARGE_SPIKE',
      title: 'EV Charging Surge',
      desc: '+80% unexpected fast charging load',
      icon: 'bolt',
      color: '#3C78CC',
      solar: 0,
      demand: 80,
      soc: 35,
    },
    {
      id: 'MONSOON_DROP',
      title: 'Monsoon Overcast',
      desc: '-85% solar drop & sustained deficit',
      icon: 'cloud',
      color: '#5E6963',
      solar: -85,
      demand: 15,
      soc: 25,
    },
    {
      id: 'BATTERY_LOW',
      title: 'Low Storage Reserve',
      desc: 'Battery drops to 15% emergency floor',
      icon: 'battery-quarter',
      color: '#D45C5C',
      solar: -20,
      demand: 10,
      soc: 15,
    }
  ];

  const handleApplyPreset = (preset) => {
    setActivePreset(preset.id);
    setSolarDelta(preset.solar);
    setDemandDelta(preset.demand);
    setBatterySoc(preset.soc);
    runSimulation(preset.solar, preset.demand, preset.soc);
  };

  const runSimulation = async (s = solarDelta, d = demandDelta, b = batterySoc) => {
    setIsSimulating(true);
    try {
      const resp = await api.simulateScenario({
        solar_delta_percent: s,
        demand_delta_percent: d,
        battery_soc: b,
        household_id: currentHousehold !== 'COMMUNITY' ? currentHousehold : undefined,
      });

      if (resp.data && resp.data.shocked_state) {
        setSimulationResult(resp.data.shocked_state);
      }
    } catch (e) {
      console.error('Simulation error:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  const bForecast = baselineData?.forecast;
  const sForecast = simulationResult?.forecast || bForecast;
  const sDecision = simulationResult?.decision || baselineData?.decision;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Simulation Banner Notice */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#E5A72D]/10 border border-[#E5A72D]/20 text-xs">
        <div className="flex items-center space-x-2 text-[#E5A72D]">
          <FaIcon name="sliders-h" className="text-sm" />
          <span className="font-bold uppercase tracking-wider">What-If Simulation Sandbox</span>
        </div>
        <Badge variant="solar" size="xs">
          Virtual In-Memory State • Zero Ledger Mutation
        </Badge>
      </div>

      {/* 1. Shock Presets Row */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#17221D] mb-2.5">
          1-Click Preset Operational Scenarios:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p)}
              className={`p-3.5 rounded-xl text-left border transition flex flex-col justify-between space-y-2 ${
                activePreset === p.id
                  ? 'bg-white border-[#1E9B68] shadow-md ring-2 ring-[#1E9B68]/20'
                  : 'bg-white/80 hover:bg-white border-[rgba(23,34,29,0.08)] shadow-subtle'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-xs text-[#17221D]">{p.title}</span>
                <FaIcon name={p.icon} style={{ color: p.color }} className="text-xs" />
              </div>
              <p className="text-[11px] text-[#5E6963]">{p.desc}</p>
              <span className="text-[10px] text-[#1E9B68] font-bold">Simulate Shock →</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Custom Interactive Parameter Sliders */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[rgba(23,34,29,0.06)]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#17221D]">
            Custom Parameter Tuning
          </h4>
          <span className="text-xs text-[#5E6963]">Adjust inputs to stress-test AI response</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Solar Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-[#5E6963]">Solar Variation</span>
              <span className="font-bold text-[#E5A72D]">{solarDelta > 0 ? `+${solarDelta}` : solarDelta}%</span>
            </div>
            <input
              type="range"
              min="-90"
              max="50"
              step="5"
              value={solarDelta}
              onChange={(e) => {
                setActivePreset(null);
                setSolarDelta(Number(e.target.value));
              }}
              className="w-full accent-[#E5A72D] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#89938D]">
              <span>-90% (Dense Clouds)</span>
              <span>+50% (Clear Peak)</span>
            </div>
          </div>

          {/* Demand Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-[#5E6963]">Demand Variation</span>
              <span className="font-bold text-[#3C78CC]">{demandDelta > 0 ? `+${demandDelta}` : demandDelta}%</span>
            </div>
            <input
              type="range"
              min="-50"
              max="150"
              step="5"
              value={demandDelta}
              onChange={(e) => {
                setActivePreset(null);
                setDemandDelta(Number(e.target.value));
              }}
              className="w-full accent-[#3C78CC] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#89938D]">
              <span>-50% (Idle Mode)</span>
              <span>+150% (Heavy Load)</span>
            </div>
          </div>

          {/* Battery SOC Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-[#5E6963]">Battery Storage SOC</span>
              <span className="font-bold text-[#1E9B68]">{batterySoc}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={batterySoc}
              onChange={(e) => {
                setActivePreset(null);
                setBatterySoc(Number(e.target.value));
              }}
              className="w-full accent-[#1E9B68] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#89938D]">
              <span>10% (Critical)</span>
              <span>100% (Full)</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => runSimulation()}
            disabled={isSimulating}
          >
            {isSimulating ? 'Simulating...' : 'Run Custom Simulation'}
          </Button>
        </div>
      </div>

      {/* 3. Before vs After Comparison Result */}
      {simulationResult && (
        <div className="glass-card rounded-xl p-5 space-y-4 border-l-4 border-l-[#7358C7] animate-slideUp">
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(23,34,29,0.06)]">
            <div className="flex items-center space-x-2">
              <FaIcon name="brain" className="text-[#7358C7] text-xs" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#17221D]">
                Simulation Outcome & Adaptive AI Decision
              </h4>
            </div>
            <Badge variant="ai" size="xs">
              Live Scenario Evaluation
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
            <div className="bg-[#F8FAF9] p-3 rounded-lg border border-[rgba(23,34,29,0.06)]">
              <span className="text-[10px] uppercase font-bold text-[#5E6963]">Simulated Solar</span>
              <p className="text-base font-bold text-[#E5A72D] mt-0.5">{sForecast?.solar_kw} kW</p>
              <span className="text-[10px] text-[#89938D]">Baseline: {bForecast?.solar_kw} kW</span>
            </div>

            <div className="bg-[#F8FAF9] p-3 rounded-lg border border-[rgba(23,34,29,0.06)]">
              <span className="text-[10px] uppercase font-bold text-[#5E6963]">Simulated Demand</span>
              <p className="text-base font-bold text-[#3C78CC] mt-0.5">{sForecast?.demand_kw} kW</p>
              <span className="text-[10px] text-[#89938D]">Baseline: {bForecast?.demand_kw} kW</span>
            </div>

            <div className="bg-[#F8FAF9] p-3 rounded-lg border border-[rgba(23,34,29,0.06)]">
              <span className="text-[10px] uppercase font-bold text-[#5E6963]">Net Balance</span>
              <p className={`text-base font-bold mt-0.5 ${sForecast?.balance_kw >= 0 ? 'text-[#1E9B68]' : 'text-[#D45C5C]'}`}>
                {sForecast?.balance_kw >= 0 ? `+${sForecast?.balance_kw}` : sForecast?.balance_kw} kW
              </p>
              <span className="text-[10px] text-[#89938D]">Safe kWh: {sForecast?.safe_tradeable_kwh || 0}</span>
            </div>

            <div className="bg-[#EBF7F1] p-3 rounded-lg border border-[#1E9B68]/20 flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold text-[#1E9B68]">Adaptive AI Action</span>
              <p className="text-xs font-bold text-[#17221D] mt-1">{sDecision?.action_label}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
