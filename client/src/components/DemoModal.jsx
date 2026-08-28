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
      icon: 'energy',
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
      decision: 'Deploy stored monsoon battery reserves while preserving 10% blackout floor.',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102019]/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-2xl border border-[#DDE5E0] bg-white p-6 shadow-modal animate-in zoom-in-95 duration-150 space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#DDE5E0]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-full bg-[#FFF4D8] px-2.5 py-0.5 text-[11px] font-bold text-[#E8A72B] border border-[#F7E7BE] uppercase tracking-wider">
                Guided Scenarios Engine
              </span>
              <Badge variant="ai" size="xs">
                Deterministic Presentation Mode
              </Badge>
            </div>
            <h3 className="text-xl font-bold text-[#102019] mt-1.5">
              Community 101: Architectural Demonstration
            </h3>
            <p className="text-xs text-[#5D6B64]">
              Simulate dynamic physical and market conditions to evaluate automated peer dispatch
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#83908A] hover:text-[#102019] text-sm font-bold p-1 rounded-lg hover:bg-[#F5F7F6]"
          >
            ✕
          </button>
        </div>

        {/* Scenario Selection Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {scenarios.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActiveScenario(s.id);
                setCurrentStep(0);
              }}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-1.5 ${
                activeScenario === s.id
                  ? 'bg-[#163A2B] text-white border-[#163A2B] shadow-sm'
                  : 'bg-[#FBFCFB] border-[#DDE5E0] text-[#102019] hover:bg-[#F5F7F6]'
              }`}
            >
              <div className="flex items-center justify-between">
                <FaIcon name={s.icon} className={activeScenario === s.id ? 'text-[#34B978]' : 'text-[#5D6B64]'} />
                <span className={`text-[10px] font-bold ${activeScenario === s.id ? 'text-[#CBD5CF]' : 'text-[#83908A]'}`}>
                  Preset
                </span>
              </div>
              <span className={`text-xs font-bold ${activeScenario === s.id ? 'text-white' : 'text-[#102019]'}`}>
                {s.name}
              </span>
            </button>
          ))}
        </div>

        {/* 4-Stage Guided Demonstration Flow: BEFORE ➔ ANALYSIS ➔ DECISION ➔ AFTER */}
        <div className="rounded-xl border border-[#DDE5E0] bg-[#FBFCFB] p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#102019] uppercase tracking-wider">
              {currentScen.name} Sequence
            </span>
            {isRunning && (
              <span className="text-xs font-bold text-[#168A5A] animate-pulse">
                Executing Stage {currentStep} of 4...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            
            {/* 1. BEFORE */}
            <div className={`p-3 rounded-xl border transition ${
              currentStep >= 1 ? 'border-[#168A5A] bg-[#E7F5EE]' : 'border-[#DDE5E0] bg-white'
            }`}>
              <div className="flex items-center justify-between font-bold text-[#102019] mb-1">
                <span>1. BEFORE</span>
                {currentStep >= 1 && <FaIcon name="checkCircle" className="text-[#168A5A] text-xs" />}
              </div>
              <div className="space-y-0.5 text-[11px] text-[#5D6B64]">
                <div>Gen: <strong>{currentScen.before.gen}</strong></div>
                <div>Load: <strong>{currentScen.before.load}</strong></div>
                <div className="text-[#168A5A] font-bold">{currentScen.before.balance}</div>
              </div>
            </div>

            {/* 2. GRIDSHARE ANALYSIS */}
            <div className={`p-3 rounded-xl border transition ${
              currentStep >= 2 ? 'border-[#7657D8] bg-[#F0EBFF]' : 'border-[#DDE5E0] bg-white'
            }`}>
              <div className="flex items-center justify-between font-bold text-[#102019] mb-1">
                <span>2. ANALYSIS</span>
                {currentStep >= 2 && <FaIcon name="checkCircle" className="text-[#7657D8] text-xs" />}
              </div>
              <p className="text-[11px] text-[#5D6B64] leading-snug">
                {currentScen.analysis}
              </p>
            </div>

            {/* 3. DECISION */}
            <div className={`p-3 rounded-xl border transition ${
              currentStep >= 3 ? 'border-[#168A5A] bg-[#E7F5EE]' : 'border-[#DDE5E0] bg-white'
            }`}>
              <div className="flex items-center justify-between font-bold text-[#102019] mb-1">
                <span>3. DECISION</span>
                {currentStep >= 3 && <FaIcon name="checkCircle" className="text-[#168A5A] text-xs" />}
              </div>
              <p className="text-[11px] text-[#5D6B64] leading-snug">
                {currentScen.decision}
              </p>
            </div>

            {/* 4. AFTER */}
            <div className={`p-3 rounded-xl border transition ${
              currentStep >= 4 ? 'border-[#168A5A] bg-[#E7F5EE]' : 'border-[#DDE5E0] bg-white'
            }`}>
              <div className="flex items-center justify-between font-bold text-[#102019] mb-1">
                <span>4. AFTER</span>
                {currentStep >= 4 && <FaIcon name="checkCircle" className="text-[#168A5A] text-xs" />}
              </div>
              <div className="space-y-0.5 text-[11px] text-[#5D6B64]">
                <div>{currentScen.after.p2p}</div>
                <div>ESS: <strong>{currentScen.after.batterySoc}</strong></div>
                <div className="text-[#168A5A] font-bold">{currentScen.after.savings}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 border-t border-[#DDE5E0] flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isResetting || isRunning}
            icon={<FaIcon name="refresh" className={isResetting ? 'animate-spin' : ''} />}
          >
            Reset to Clean Baseline
          </Button>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Button variant="secondary" size="sm" onClick={onClose} className="flex-1 sm:flex-initial">
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunGuidedDemo}
              isLoading={isRunning}
              icon={<FaIcon name="play" />}
              className="flex-1 sm:flex-initial"
            >
              {isRunning ? 'Executing...' : 'Run Guided Scenario'}
            </Button>
          </div>
        </div>

        {resetMessage && (
          <p className="text-center text-xs font-semibold text-[#168A5A]">{resetMessage}</p>
        )}
      </div>
    </div>
  );
}
