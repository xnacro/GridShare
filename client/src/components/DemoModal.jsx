import React, { useState } from 'react';
import { api } from '../services/api';
import FaIcon from './icons/FaIcon';
import Badge from './ui/Badge';
import Button from './ui/Button';

export default function DemoModal({ isOpen, onClose, onScenarioExecuted }) {
  const [activeScenario, setActiveScenario] = useState('SOLAR_NOON');
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: Idle, 1: Before, 2: Analysis, 3: Decision, 4: After
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'SOLAR_NOON',
      name: 'High Solar Noon (12:00)',
      desc: 'Peak prosumer solar yield (+4.7 kW surplus), low baseline demand, charging ESS.',
      icon: 'solar',
      bgStyle: 'bg-gradient-to-br from-[#FFF7E4] to-[#FBECC7] border-[#E5A72D]/30 text-[#12382A]',
      activePill: 'bg-[#E5A72D] text-white',
      before: { gen: '6.8 kW', load: '2.1 kW', balance: '+4.7 kW Surplus', battery: '40% SOC' },
      analysis: 'Solar surplus exceeds household load. EV charging demand active at House B.',
      decision: 'Route 2.80 kW to House B (P2P @ ₹4.50), store 1.20 kW in ESS, export 0.70 kW to grid.',
      after: { p2p: '2.80 kWh Settled', batterySoc: '46% (+1.2 kWh)', savings: '₹4.48 Community Savings' },
    },
    {
      id: 'EVENING_PEAK',
      name: 'Evening Peak Hour (19:00)',
      desc: 'Zero solar generation, EV chargers active (-2.8 kW deficit), utility grid tariff ₹8.50/kWh.',
      icon: 'home',
      bgStyle: 'bg-gradient-to-br from-[#EDF3FD] to-[#E0ECFC] border-[#3979D0]/30 text-[#12382A]',
      activePill: 'bg-[#3979D0] text-white',
      before: { gen: '0.2 kW', load: '8.4 kW', balance: '-8.2 kW Deficit', battery: '65% SOC' },
      analysis: 'Severe grid congestion and peak utility tariff. Central ESS has sufficient charge.',
      decision: 'Discharge 4.0 kW from Community ESS to shave local peak; avoid ₹8.50/kWh utility import.',
      after: { p2p: '4.00 kWh ESS Discharged', batterySoc: '57%', savings: '₹14.00 Peak Tariff Avoided' },
    },
    {
      id: 'NORMAL_DAY',
      name: 'Normal Day Balance (10:00)',
      desc: 'Balanced generation and residential consumption, smooth bilateral trade equilibrium.',
      icon: 'network',
      bgStyle: 'bg-gradient-to-br from-[#E6F5EC] to-[#D7EFE0] border-[#1E9B67]/30 text-[#12382A]',
      activePill: 'bg-[#1E9B67] text-white',
      before: { gen: '4.5 kW', load: '3.8 kW', balance: '+0.7 kW Surplus', battery: '50% SOC' },
      analysis: 'Equilibrium state with moderate headroom. Local battery buffer safe.',
      decision: 'Maintain local self-sufficiency. Settle 0.5 kWh micro-trade with House C.',
      after: { p2p: '0.50 kWh Settled', batterySoc: '52%', savings: '₹0.80 Saved' },
    },
    {
      id: 'MONSOON',
      name: 'Monsoon Overcast',
      desc: 'Heavy cloud cover (0.4 kW solar), variable residential loads, relying on stored battery reserves.',
      icon: 'shield',
      bgStyle: 'bg-gradient-to-br from-[#EEF2ED] to-[#E3E8E2] border-[rgba(23,56,43,0.15)] text-[#12382A]',
      activePill: 'bg-[#12382A] text-white',
      before: { gen: '0.4 kW', load: '4.2 kW', balance: '-3.8 kW Deficit', battery: '80% SOC' },
      analysis: 'Cloud cover dampens solar generation across community. Pre-charged ESS available.',
      decision: 'Deploy stored monsoon battery reserves while preserving 20% emergency blackout floor.',
      after: { p2p: '3.00 kWh ESS Dispatched', batterySoc: '74%', savings: '100% Continuity Protected' },
    },
  ];

  const currentScen = scenarios.find((s) => s.id === activeScenario) || scenarios[0];

  const handleRunGuidedDemo = async () => {
    setIsRunning(true);
    setCurrentStep(1);

    try {
      await new Promise((r) => setTimeout(r, 600));
      setCurrentStep(2);

      await api.runDemoScenario();
      await new Promise((r) => setTimeout(r, 700));
      setCurrentStep(3);

      await new Promise((r) => setTimeout(r, 700));
      setCurrentStep(4);

      if (onScenarioExecuted) onScenarioExecuted();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsResetting(true);
      await api.resetDemo();
      setResetMessage('Baseline microgrid state restored.');
      setCurrentStep(0);
      if (onScenarioExecuted) onScenarioExecuted();
      setTimeout(() => setResetMessage(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#15221B]/50 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-[rgba(23,56,43,0.10)] p-6 sm:p-8 shadow-modal space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(23,56,43,0.08)]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#12382A] text-[#43CB8C] flex items-center justify-center text-lg flex-shrink-0">
              <FaIcon name="scenarios" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#15221B]">
                Interactive Scenario Engine
              </h2>
              <p className="text-xs text-[#5E6B63]">
                Evaluate microgrid balancing, continuous double auctions, and 20% battery reserve limits
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#5E6B63] hover:text-[#15221B] text-sm font-bold p-1.5 rounded-xl hover:bg-[#F5F7F3] transition"
          >
            ✕
          </button>
        </div>

        {/* Reset Notification */}
        {resetMessage && (
          <div className="rounded-2xl border border-[#1E9B67]/20 bg-[#E6F5EC] p-3 text-xs font-bold text-[#12382A] flex items-center gap-2">
            <FaIcon name="check" className="text-[#1E9B67]" />
            <span>{resetMessage}</span>
          </div>
        )}

        {/* 1. SCENARIO SELECTOR CARDS */}
        <div className="space-y-2.5">
          <div className="text-xs font-extrabold text-[#15221B] uppercase tracking-wider">
            1. Select Operating Condition
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {scenarios.map((s) => {
              const isSelected = activeScenario === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setActiveScenario(s.id);
                    setCurrentStep(0);
                  }}
                  className={`p-4 rounded-2xl border text-left transition duration-150 flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? `${s.bgStyle} shadow-sm ring-2 ring-[#12382A]/20`
                      : 'bg-[#F5F7F3]/50 border-[rgba(23,56,43,0.08)] text-[#15221B] hover:bg-white hover:border-[rgba(23,56,43,0.18)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <FaIcon name={s.icon} className="text-base text-[#12382A]" />
                    {isSelected && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${s.activePill}`}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-[#15221B]">{s.name}</div>
                    <p className="text-[11px] text-[#5E6B63] line-clamp-2 mt-1 leading-snug">{s.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. TIMELINE: BEFORE ➔ AI ANALYSIS ➔ DECISION ➔ IMPACT */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-extrabold text-[#15221B] uppercase tracking-wider">
            2. Real-Time Autonomous Microgrid Execution
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Step 1: Observed State */}
            <div className={`p-4 rounded-2xl border space-y-2 transition ${
              currentStep >= 1 ? 'bg-[#FFF7E4]/50 border-[#E5A72D]/30' : 'bg-[#F5F7F3]/40 border-[rgba(23,56,43,0.08)]'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold text-[#E5A72D]">
                <span>1. OBSERVE</span>
                {currentStep >= 1 && <FaIcon name="check" />}
              </div>
              <div className="text-xs font-extrabold text-[#15221B]">Grid Telemetry</div>
              <div className="text-[11px] text-[#5E6B63] space-y-0.5 font-mono">
                <div>Gen: {currentScen.before.gen}</div>
                <div>Load: {currentScen.before.load}</div>
                <div className="font-bold text-[#1E9B67]">{currentScen.before.balance}</div>
              </div>
            </div>

            {/* Step 2: AI Analysis */}
            <div className={`p-4 rounded-2xl border space-y-2 transition ${
              currentStep >= 2 ? 'bg-[#F1ECFF]/50 border-[#7358C8]/30' : 'bg-[#F5F7F3]/40 border-[rgba(23,56,43,0.08)]'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold text-[#7358C8]">
                <span>2. PREDICT</span>
                {currentStep >= 2 && <FaIcon name="check" />}
              </div>
              <div className="text-xs font-extrabold text-[#15221B]">Hornet AI Engine</div>
              <p className="text-[11px] text-[#5E6B63] leading-snug">{currentScen.analysis}</p>
            </div>

            {/* Step 3: Decision */}
            <div className={`p-4 rounded-2xl border space-y-2 transition ${
              currentStep >= 3 ? 'bg-[#E6F5EC]/50 border-[#1E9B67]/30' : 'bg-[#F5F7F3]/40 border-[rgba(23,56,43,0.08)]'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold text-[#1E9B67]">
                <span>3. OPTIMIZE</span>
                {currentStep >= 3 && <FaIcon name="check" />}
              </div>
              <div className="text-xs font-extrabold text-[#15221B]">P2P & Storage Dispatch</div>
              <p className="text-[11px] text-[#5E6B63] leading-snug">{currentScen.decision}</p>
            </div>

            {/* Step 4: Impact */}
            <div className={`p-4 rounded-2xl border space-y-2 transition ${
              currentStep >= 4 ? 'bg-[#EDF3FD]/50 border-[#3979D0]/30' : 'bg-[#F5F7F3]/40 border-[rgba(23,56,43,0.08)]'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold text-[#3979D0]">
                <span>4. SETTLE</span>
                {currentStep >= 4 && <FaIcon name="check" />}
              </div>
              <div className="text-xs font-extrabold text-[#15221B]">Community Impact</div>
              <div className="text-[11px] text-[#5E6B63] space-y-0.5">
                <div className="font-bold text-[#1E9B67]">{currentScen.after.p2p}</div>
                <div>Battery: {currentScen.after.batterySoc}</div>
                <div className="font-bold text-[#12382A]">{currentScen.after.savings}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. MODAL ACTION FOOTER */}
        <div className="pt-4 border-t border-[rgba(23,56,43,0.08)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
              isLoading={isResetting}
              icon={<FaIcon name="refresh" />}
            >
              Reset Microgrid Baseline
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          </div>

          <Button
            variant="primary"
            size="md"
            className="w-full sm:w-auto justify-center px-8 py-3 text-xs sm:text-sm font-bold shadow-md"
            onClick={handleRunGuidedDemo}
            isLoading={isRunning}
            icon={<FaIcon name="scenarios" className="text-[#43CB8C]" />}
          >
            {isRunning ? 'Executing Multi-Step Scenario...' : 'Run Scenario'}
          </Button>
        </div>

      </div>
    </div>
  );
}
