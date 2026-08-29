import React, { useState } from 'react';
import FaIcon from '../icons/FaIcon';
import Button from '../ui/Button';
import { api } from '../../services/api';

export default function WeatherShockSimulator({ onShockApplied }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeShock, setActiveShock] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [shockResult, setShockResult] = useState(null);

  const presets = [
    {
      id: 'CLOUD_PASSAGE',
      label: 'Passing Cloud Cluster',
      type: 'CLOUD_COVER',
      severity: 0.6,
      desc: 'Simulates 60% solar irradiance drop from moving monsoon cloud cover in Guwahati.',
      icon: 'weatherCloud',
      color: 'amber'
    },
    {
      id: 'HEAVY_MONSOON',
      label: 'Monsoon Rain Storm',
      type: 'CLOUD_COVER',
      severity: 0.85,
      desc: 'Simulates 85% solar drop, pushing microgrid into immediate community deficit.',
      icon: 'weatherRain',
      color: 'blue'
    },
    {
      id: 'EV_SURGE',
      label: 'EV Cluster Charging Spike',
      type: 'EV_CHARGE_SPIKE',
      severity: 3.5,
      desc: 'Simulates +3.5 kW simultaneous residential EV charger activations on Feeder A.',
      icon: 'car',
      color: 'rose'
    }
  ];

  const handleRunShock = async (preset) => {
    setActiveShock(preset.id);
    setIsSimulating(true);
    setShockResult(null);

    try {
      const resp = await api.simulateCopilotShock({
        type: preset.type,
        severity: preset.severity
      });
      if (resp.data) {
        setShockResult(resp.data);
        if (onShockApplied) {
          onShockApplied(resp.data);
        }
      }
    } catch (err) {
      console.error('Failed to simulate shock:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = () => {
    setActiveShock(null);
    setShockResult(null);
    if (onShockApplied) {
      onShockApplied(null); // Resets to live state
    }
  };

  return (
    <div className="rounded-2xl border border-[#DDE4DF] bg-white p-4 sm:p-5 shadow-card space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#EEF2EF]">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-900 text-purple-300">
            <FaIcon name="bolt" className="text-xs" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#142019]">
                Weather & Load Shock Simulator
              </h3>
              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                HACKATHON DEMO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Stress-test Hornet AI real-time adaptation against rapid weather swings
            </p>
          </div>
        </div>

        {activeShock && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 underline"
          >
            Reset to Baseline
          </button>
        )}
      </div>

      {/* Shock Preset Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {presets.map((p) => {
          const isActive = activeShock === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleRunShock(p)}
              disabled={isSimulating}
              className={`p-3 rounded-xl border text-left transition-all ${
                isActive
                  ? 'border-purple-600 bg-purple-50/50 shadow-sm ring-1 ring-purple-600'
                  : 'border-[#DDE4DF] bg-[#FAFBF9] hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#142019]">{p.label}</span>
                {isActive && <span className="text-[10px] font-extrabold text-purple-700">ACTIVE</span>}
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                {p.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Shock Impact Result Banner */}
      {shockResult && (
        <div className="mt-2 p-3 rounded-xl bg-purple-900/5 border border-purple-200 text-xs space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between text-purple-900 font-bold">
            <span className="flex items-center gap-1">
              <FaIcon name="bolt" className="text-amber-600" />
              <span>{shockResult.summary}</span>
            </span>
            <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-purple-200">
              Hornet AI Adapted in 12ms
            </span>
          </div>
          <div className="text-[11px] text-purple-800">
            {shockResult.shocked_state?.reasoning?.[0] || 'Optimized energy routing adjusted immediately.'}
          </div>
        </div>
      )}
    </div>
  );
}
