import React from 'react';
import FaIcon from '../icons/FaIcon';

export const ENERGY_MODES = [
  {
    id: 'AUTO',
    name: 'AUTO',
    iconName: 'ai',
    color: 'emerald',
    description: 'Solar ➔ Home Load ➔ Home Battery ➔ P2P ➔ Grid Export',
    details: 'AI balanced routing prioritizing home self-reliance, local battery storage, and peer marketplace trading before grid export.',
  },
  {
    id: 'SELF_USE',
    name: 'SELF USE',
    iconName: 'shield',
    color: 'blue',
    description: 'Solar ➔ Home Load ➔ Home Battery',
    details: 'Maximizes on-site solar consumption and battery charging. Never exports or sells until battery is at 100% capacity.',
  },
  {
    id: 'BATTERY_FIRST',
    name: 'BATTERY FIRST',
    iconName: 'battery',
    color: 'amber',
    description: 'Solar ➔ Home Battery (Target 100%)',
    details: 'Channels maximum solar generation to rapidly charge the home battery to ensure storm or peak-tariff resiliency.',
  },
  {
    id: 'SELL_SURPLUS',
    name: 'SELL SURPLUS',
    iconName: 'marketplace',
    color: 'amber',
    description: 'Solar ➔ Home Load ➔ P2P Marketplace',
    details: 'Aggressively lists excess rooftop energy on the P2P marketplace at ₹4.50/kWh to maximize prosumer earnings.',
  },
  {
    id: 'GRID_BACKUP',
    name: 'GRID BACKUP',
    iconName: 'grid',
    color: 'purple',
    description: 'Keep Battery Reserved • Grid Standby',
    details: 'Maintains home battery in full reserve for critical backup while utilizing grid energy during low tariff windows.',
  },
];

export default function HomeEnergyModes({ activeMode, onSelectMode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
        <div className="flex items-center space-x-2">
          <FaIcon name="energy" className="text-emerald-600 text-sm" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Energy Management Mode
          </h3>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold font-mono text-slate-700">
          MODE: {activeMode.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {ENERGY_MODES.map((mode) => {
          const isActive = activeMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectMode(mode.id)}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-150 ${
                isActive
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500/30'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center space-x-1.5 font-bold text-xs text-slate-900">
                  <FaIcon name={mode.iconName} className={isActive ? 'text-emerald-600' : 'text-slate-500'} />
                  <span>{mode.name}</span>
                </div>
                {isActive && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-tight">
                {mode.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
