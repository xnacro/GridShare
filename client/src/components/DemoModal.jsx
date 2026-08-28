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
      variant: 'solar',
      before: { gen: '6.8 kW', load: '2.1 kW', balance: '+4.7 kW Surplus', battery: '40% SOC' },
      analysis: 'Solar surplus exceeds local household demand. Proximity demand active at House B.',
      decision: 'Route 2.80 kW to House B (P2P @ ₹4.50), store 1.20 kW in ESS, export 0.70 kW to grid.',
      after: { p2p: '2.80 kWh Settled', batterySoc: '46% (+1.2 kWh)', savings: '₹4.48 Community Savings' },
    },
    {
      id: 'EVENING_PEAK',
      name: 'Evening Peak Hour (19:00)',
      desc: 'Zero solar generation, EV chargers active (-2.8 kW deficit), utility grid tariff ₹8.50/kWh.',
      icon: 'home',
      variant: 'deficit',
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
      variant: 'surplus',
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
      variant: 'warning',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#15211B]/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-3xl border border-[#DCE4DE] bg-white p-6 shadow-modal animate-in zoom-in-95 duration-150 space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#DCE4DE]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-full bg-[#FFF3D7] px-2.5 py-0.5 text-[11px] font-bold text-[#E7AA31] border border-[#F7E7BE] uppercase tracking-wider">
                Guided Scenarios Engine
              </span>
              <Badge variant="ai" size="xs">
                Deterministic Simulation Mode
              </Badge>
            </div>
            <h3 className="text-xl font-extrabold text-[#15211B] mt-1.5">
              Microgrid Scenario Workbench
            </h3>
            <p className="text-xs text-[#5E6A63]">
              Simulate dynamic physical and weather conditions to evaluate automated peer dispatch
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#87918B] hover:text-[#15211B] text-sm font-bold p-1 rounded-lg hover:bg-[#F5F7F3]"
          >
            ✕
          </button>
        </div>

        {/* Scenario Selection Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {scenarios.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActiveScenario(s.id);
                setCurrentStep(0);
              }}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between space-y-1.5 ${
                activeScenario === s.id
                  ? 'bg-[#12392B] text-white border-[#12392B] shadow-sm'
                  : 'bg-[#FBFCFA] border-[#DCE4DE] text-[#15211B] hover:bg-[#F5F7F3]'
              }`}
            >
              <div className="flex items-center justify-between">
                <FaIcon name={s.icon} className={`text-xs ${activeScenario === s.id ? 'text-[#41C98A]' : 'text-[#5E6A63]'}`} />
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  activeScenario === s.id ? 'bg-[#41C98A] text-[#12392B]' : 'bg-[#E7F6EE] text-[#209B67]'
                }`}>
                  {s.id === 'SOLAR_NOON' ? 'NOON' : s.id === 'EVENING_PEAK' ? 'PEAK' : s.id === 'MONSOON' ? 'STORM' : 'MID'}
                </span>
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">{s.name}</div>
                <div className={`text-[10px] mt-0.5 leading-snug line-clamp-2 ${activeScenario === s.id ? 'text-[#C7D2CB]' : 'text-[#87918B]'}`}>
                  {s.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* 4-Step Scenario Progression Flow */}
        <div className="p-4 rounded-2xl border border-[#DCE4DE] bg-[#F5F7F3]/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#15211B] uppercase tracking-wide">
              {currentScen.name} Sequence Execution
            </span>
            <div className="flex items-center space-x-1 text-[11px] font-mono text-[#87918B]">
              <span>Step:</span>
              <strong className="text-[#209B67]">{currentStep === 0 ? 'Ready' : `${currentStep} of 4`}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
            {/* Step 1: Before */}
            <div className={`p-3 rounded-xl border transition ${
              currentStep >= 1 ? 'bg-white border-[#209B67] shadow-xs' : 'bg-white/60 border-[#DCE4DE] text-[#87918B]'
            }`}>
              <div className="flex items-center space-x-1.5 font-bold text-[#15211B] mb-1">
                <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep >= 1 ? 'bg-[#E7F6EE] text-[#209B67]' : 'bg-[#F5F7F3] text-[#87918B]'
                }`}>1</span>
                <span>Before State</span>
              </div>
              <div className="text-[11px] space-y-0.5 text-[#5E6A63]">
                <div>Gen: <strong>{currentScen.before.gen}</strong></div>
                <div>Load: <strong>{currentScen.before.load}</strong></div>
                <div>Net: <strong>{currentScen.before.balance}</strong></div>
              </div>
            </div>

            {/* Step 2: Analysis */}
            <div className={`p-3 rounded-xl border transition ${
              currentStep >= 2 ? 'bg-white border-[#7359C8] shadow-xs' : 'bg-white/60 border-[#DCE4DE] text-[#87918B]'
            }`}>
              <div className="flex items-center space-x-1.5 font-bold text-[#15211B] mb-1">
                <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep >= 2 ? 'bg-[#F1EDFF] text-[#7359C8]' : 'bg-[#F5F7F3] text-[#87918B]'
                }`}>2</span>
                <span>AI Risk Analysis</span>
              </div>
              <p className="text-[10.5px] text-[#5E6A63] leading-snug">
                {currentScen.analysis}
              </p>
            </div>

            {/* Step 3: Decision */}
            <div className={`p-3 rounded-xl border transition ${
              currentStep >= 3 ? 'bg-white border-[#397BD2] shadow-xs' : 'bg-white/60 border-[#DCE4DE] text-[#87918B]'
            }`}>
              <div className="flex items-center space-x-1.5 font-bold text-[#15211B] mb-1">
                <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep >= 3 ? 'bg-[#EAF2FC] text-[#397BD2]' : 'bg-[#F5F7F3] text-[#87918B]'
                }`}>3</span>
                <span>Optimal Routing</span>
              </div>
              <p className="text-[10.5px] text-[#5E6A63] leading-snug">
                {currentScen.decision}
              </p>
            </div>

            {/* Step 4: After */}
            <div className={`p-3 rounded-xl border transition ${
              currentStep >= 4 ? 'bg-white border-[#209B67] shadow-xs' : 'bg-white/60 border-[#DCE4DE] text-[#87918B]'
            }`}>
              <div className="flex items-center space-x-1.5 font-bold text-[#15211B] mb-1">
                <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] ${
                  currentStep >= 4 ? 'bg-[#E7F6EE] text-[#209B67]' : 'bg-[#F5F7F3] text-[#87918B]'
                }`}>4</span>
                <span>Impact Result</span>
              </div>
              <div className="text-[11px] space-y-0.5 text-[#5E6A63]">
                <div>P2P: <strong>{currentScen.after.p2p}</strong></div>
                <div>ESS: <strong>{currentScen.after.batterySoc}</strong></div>
                <div className="text-[#209B67]"><strong>{currentScen.after.savings}</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            isLoading={isResetting}
            icon={<FaIcon name="rotate" />}
          >
            Reset to Baseline
          </Button>

          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunGuidedDemo}
              isLoading={isRunning}
              icon={<FaIcon name="sparkles" />}
            >
              Run Scenario
            </Button>
          </div>
        </div>

        {resetMessage && (
          <div className="text-center text-xs text-[#209B67] font-semibold">
            {resetMessage}
          </div>
        )}
      </div>
    </div>
  );
}
