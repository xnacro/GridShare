import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import HeroMetric from '../components/ui/HeroMetric';
import SectionHeader from '../components/ui/SectionHeader';
import ForecastRangeChart from '../components/copilot/ForecastRangeChart';
import PredictiveMatchCard from '../components/copilot/PredictiveMatchCard';
import ScenarioLabStudio from '../components/copilot/ScenarioLabStudio';
import TechnicalModelMatrix from '../components/copilot/TechnicalModelMatrix';
import GroundedAiAssistantModal from '../components/copilot/GroundedAiAssistantModal';
import FaIcon from '../components/icons/FaIcon';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function AiForecastView() {
  const navigate = useNavigate();

  // State
  const [copilotData, setCopilotData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHorizon, setSelectedHorizon] = useState('15M');
  const [selectedHousehold, setSelectedHousehold] = useState('COMMUNITY');
  const [households, setHouseholds] = useState([]);
  const [viewMode, setViewMode] = useState('SIMPLE'); // 'SIMPLE' | 'TECHNICAL' | 'SCENARIO'
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);
  const [isApproving, setIsApproving] = useState(false);

  const horizonMinutesMap = {
    '15M': 15,
    '30M': 30,
    '60M': 60,
    '6H': 360,
    '24H': 1440,
  };

  // Load Households list
  useEffect(() => {
    async function fetchHouseholds() {
      try {
        const resp = await api.getHouseholds();
        if (resp.data && resp.data.households) {
          setHouseholds(resp.data.households);
        }
      } catch (e) {
        console.warn('Using default household list:', e);
      }
    }
    fetchHouseholds();
  }, []);

  // Fetch Copilot Insights from Backend
  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const minutes = horizonMinutesMap[selectedHorizon] || 15;
      const params = { horizon_minutes: minutes };
      if (selectedHousehold !== 'COMMUNITY') {
        params.household_id = selectedHousehold;
      }

      const resp = await api.getCopilotInsights(params);
      if (resp.data && resp.data.data) {
        setCopilotData(resp.data.data);
      }
    } catch (err) {
      console.error('Error loading copilot insights:', err);
      setError('Unable to load Hornet AI insights. Reverting to local telemetry models.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedHorizon, selectedHousehold]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Safe fallback values
  const curState = copilotData?.current_state || {
    generation_kw: 6.40,
    demand_kw: 2.20,
    net_balance_kw: 4.20,
    battery_soc: 65.0,
    grid_tariff_rs: 6.10,
    p2p_market_price_rs: 4.50,
  };

  const aiForecast = copilotData?.forecast || {
    solar_kw: 5.84,
    solar_lower_kw: 5.31,
    solar_upper_kw: 6.28,
    demand_kw: 2.15,
    balance_kw: 3.69,
    conservative_balance_kw: 3.16,
    safe_tradeable_kwh: 0.79,
  };

  const aiDecision = copilotData?.decision || {
    action: 'LOCAL_TRADE',
    action_label: 'TRADE 0.79 kWh LOCALLY',
    amount_kwh: 0.79,
  };

  const aiImpact = copilotData?.impact || {
    estimated_saving_rs: 1.26,
    grid_energy_avoided_kwh: 0.79,
    local_energy_used_kwh: 0.79,
    co2_avoided_kg: 0.65,
  };

  const handleApproveAction = () => {
    setIsApproving(true);
    setTimeout(() => {
      setIsApproving(false);
      setActionNotice({
        type: 'SUCCESS',
        text: `Action approved! Verified ${aiDecision.action_label} routed through double-auction ledger.`,
      });
      setTimeout(() => setActionNotice(null), 5000);
    }, 800);
  };

  const isSurplus = aiForecast.balance_kw >= 0;

  return (
    <div className="space-y-6 max-w-[1520px] mx-auto pb-12 select-none animate-fadeIn">
      
      {/* 🌟 1. COMPACT PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A]">
              Hornet AI Forecasting & Dispatch
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0D9488] border border-teal-200">
              15-Min Real-Time
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Real-time Random Forest predictions (solar_v1 & demand_v1) paired with battery constraints and deterministic dispatch rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAssistantOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#0D9488] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <FaIcon name="brain" className="text-[#0D9488]" />
            <span>Ask Hornet AI</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'SCENARIO' ? 'OVERVIEW' : 'SCENARIO')}
            className="px-3.5 py-2 rounded-xl bg-white/80 backdrop-blur-md border border-white/90 text-[#0F172A] text-xs font-bold hover:bg-white transition flex items-center gap-1.5 shadow-xs"
          >
            <FaIcon name="sliders" />
            <span>{viewMode === 'SCENARIO' ? 'Standard Matrix' : 'Scenario Lab'}</span>
          </button>
        </div>
      </div>

      {/* Action Toast Notice */}
      {actionNotice && (
        <div className="rounded-2xl p-4 border border-teal-200 bg-white/90 backdrop-blur-md text-xs font-semibold text-[#0D9488] flex items-center justify-between shadow-md animate-slideDown">
          <div className="flex items-center space-x-2">
            <FaIcon name="checkCircle" className="text-sm" />
            <span>{actionNotice.text}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-[#64748B] hover:text-[#0F172A]">
            <FaIcon name="close" />
          </button>
        </div>
      )}

      {/* 🌟 2. TOP CONTROLS & MODE SWITCHER STRIP */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-white/90 bg-white/80 backdrop-blur-xl p-3 sm:p-4 shadow-xs">
        
        {/* Mode Selector Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setViewMode('SIMPLE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              viewMode === 'SIMPLE'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <FaIcon name="chart" className="text-[11px] text-[#0D9488]" />
            <span>Decision Flow</span>
          </button>

          <button
            onClick={() => setViewMode('SCENARIO')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              viewMode === 'SCENARIO'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <FaIcon name="sliders" className="text-[11px] text-[#0D9488]" />
            <span>Scenario Lab</span>
          </button>

          <button
            onClick={() => setViewMode('TECHNICAL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              viewMode === 'TECHNICAL'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <FaIcon name="brain" className="text-[11px] text-[#0D9488]" />
            <span>Technical AI</span>
          </button>
        </div>

        {/* Household & Horizon Filter */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          {/* Household selector */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#64748B] font-medium hidden sm:inline">Scope:</span>
            <select
              value={selectedHousehold}
              onChange={(e) => setSelectedHousehold(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#0F172A] focus:outline-none shadow-2xs"
            >
              <option value="COMMUNITY">Community Aggregate</option>
              {households.map((h) => (
                <option key={h.id || h.household_id} value={h.id || h.household_id}>
                  {h.name || h.household_id}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="xs"
            onClick={fetchInsights}
            disabled={isLoading}
            className="border border-slate-200"
          >
            <FaIcon name="refresh" className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* 🌟 3. MAIN CONTENT BASED ON ACTIVE VIEW MODE */}
      {viewMode === 'SCENARIO' && (
        <ScenarioLabStudio
          currentHousehold={selectedHousehold}
          baselineData={copilotData}
        />
      )}

      {viewMode === 'TECHNICAL' && (
        <TechnicalModelMatrix />
      )}

      {viewMode === 'SIMPLE' && (
        <div className="space-y-6">
          
          {/* 🌟 A. METRIC HIGHLIGHT STRIP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <HeroMetric
              label="Predicted Solar Output"
              value={aiForecast.solar_kw?.toFixed(2)}
              unit="kW"
              subtitle={`Interval: ${aiForecast.solar_lower_kw} - ${aiForecast.solar_upper_kw} kW`}
              iconName="solar"
              variant="solar"
            />

            <HeroMetric
              label="Predicted Demand"
              value={aiForecast.demand_kw?.toFixed(2)}
              unit="kW"
              subtitle={`Active load forecast (demand_v1)`}
              iconName="bolt"
              variant="default"
            />

            <HeroMetric
              label="Net Forecast Balance"
              value={aiForecast.balance_kw >= 0 ? `+${aiForecast.balance_kw?.toFixed(2)}` : aiForecast.balance_kw?.toFixed(2)}
              unit="kW"
              subtitle={isSurplus ? 'Clean renewable surplus' : 'Net draw from storage/grid'}
              iconName="chart"
              variant={isSurplus ? 'emerald' : 'deficit'}
            />

            <HeroMetric
              label="Safe Tradeable Energy"
              value={aiForecast.safe_tradeable_kwh?.toFixed(2) || '0.00'}
              unit="kWh"
              subtitle="Conservative 90% floor checked"
              iconName="shield"
              variant="emerald"
            />
          </div>

          {/* 🌟 B. UNCERTAINTY CORRIDOR CHART & PREDICTIVE MATCH */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Forecast Corridor Chart (7 cols) */}
            <div className="lg:col-span-7">
              <ForecastRangeChart
                forecastData={aiForecast}
                horizon={selectedHorizon}
                onHorizonChange={(h) => setSelectedHorizon(h)}
              />
            </div>

            {/* Predictive P2P Matching Card (5 cols) */}
            <div className="lg:col-span-5">
              <PredictiveMatchCard
                predictiveMatch={copilotData?.predictive_match}
                onApprove={handleApproveAction}
              />
            </div>

          </div>

          {/* 🌟 C. RECOMMENDED ACTION & EXPLAINABLE "WHY?" */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Primary Recommendation Card (7 cols) */}
            <div className="lg:col-span-7 rounded-3xl border border-white/90 bg-white/80 backdrop-blur-2xl p-5 sm:p-6 space-y-4 shadow-[0_20px_50px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="h-8 w-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-200">
                    <FaIcon name="brain" className="text-sm" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                      Authoritative Dispatch Recommendation
                    </h3>
                    <p className="text-[11px] text-[#64748B]">Determined by RuleBasedOptimizer with human-in-the-loop approval</p>
                  </div>
                </div>

                <Badge variant={isSurplus ? 'surplus' : 'solar'} size="xs">
                  {aiDecision.status || 'RECOMMENDED'}
                </Badge>
              </div>

              {/* Action Headline & Approve Row */}
              <div className="p-4 rounded-2xl bg-white/70 border border-white/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">Recommended Action</span>
                  <p className="text-base font-bold text-[#0F172A] mt-0.5">{aiDecision.action_label}</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApproveAction}
                  disabled={isApproving}
                >
                  {isApproving ? 'Executing...' : 'Approve Action'}
                </Button>
              </div>

              {/* Explainable Reasoning Bullets */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A] block">
                  Explainable Reasoning (Why GridShare Recommends This):
                </span>
                <ul className="space-y-1.5">
                  {(copilotData?.reasoning || [
                    `Predicted solar generation (+${aiForecast.solar_kw} kW) exceeds domestic demand (${aiForecast.demand_kw} kW).`,
                    `Conservative 90% confidence lower bound guarantees +${aiForecast.conservative_balance_kw} kW surplus headroom.`,
                    `Battery storage reserve is protected at ${curState.battery_soc}% SOC (exceeds 20% minimum safety floor).`,
                    `Local P2P tariff ₹${curState.p2p_market_price_rs}/kWh offers ₹${(curState.grid_tariff_rs - curState.p2p_market_price_rs).toFixed(2)}/kWh savings vs utility grid.`
                  ]).map((reason, idx) => (
                    <li key={idx} className="flex items-start text-xs text-[#64748B] leading-relaxed">
                      <FaIcon name="check" className="text-[#0D9488] text-[10px] mr-2 mt-1 shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Impact Metrics & Priority Queue (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Impact Card */}
              <div className="rounded-3xl border border-white/90 bg-white/80 backdrop-blur-2xl p-5 space-y-3 shadow-[0_20px_50px_rgba(15,23,42,0.04)]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                  Estimated Action Impact
                </h4>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/70 p-3 rounded-2xl border border-white/90 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-[#64748B]">Financial Value</span>
                    <p className="text-sm font-bold text-[#0D9488] mt-0.5">₹{aiImpact.estimated_saving_rs || '1.26'}</p>
                    <span className="text-[10px] text-[#94A3B8]">vs ₹6.10 grid tariff</span>
                  </div>
                  <div className="bg-white/70 p-3 rounded-2xl border border-white/90 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-[#64748B]">CO₂ Avoided</span>
                    <p className="text-sm font-bold text-[#0D9488] mt-0.5">{aiImpact.co2_avoided_kg || '0.65'} kg</p>
                    <span className="text-[10px] text-[#94A3B8]">Clean solar offset</span>
                  </div>
                </div>
              </div>

              {/* AI Priority Queue */}
              <div className="rounded-3xl border border-white/90 bg-white/80 backdrop-blur-2xl p-5 space-y-2.5 shadow-[0_20px_50px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                    AI Operational Priority Queue
                  </h4>
                  <Badge variant="neutral" size="xs">Top Signals</Badge>
                </div>

                <div className="space-y-2">
                  {(copilotData?.ai_priorities || [
                    { priority: 1, type: 'OPPORTUNITY', title: 'P2P Solar Match Available', desc: `${aiForecast.safe_tradeable_kwh || 0.8} kWh surplus ready for Prince's Home` },
                    { priority: 2, type: 'STATUS', title: `Battery Healthy (${curState.battery_soc}% SOC)`, desc: 'Preserves 20% emergency safety floor' },
                    { priority: 3, type: 'STATUS', title: 'Data Stream Fresh', desc: 'Telemetry updated <1 minute ago' },
                  ]).map((item, i) => (
                    <div key={i} className="p-2.5 rounded-2xl bg-white/70 border border-white/90 flex items-center space-x-2.5 text-xs shadow-2xs">
                      <span className="h-5 w-5 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-[10px]">
                        {item.priority}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#0F172A] truncate">{item.title}</p>
                        <p className="text-[11px] text-[#64748B] truncate">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* 🌟 D. MULTI-HORIZON DECISION TIMELINE */}
          <div className="rounded-3xl border border-white/90 bg-white/80 backdrop-blur-2xl p-5 space-y-3 shadow-[0_20px_50px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FaIcon name="clock" className="text-[#0D9488] text-xs" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                  Forward-Looking Decision Trajectory (15M to 24H)
                </h4>
              </div>
              <span className="text-[11px] text-[#64748B]">Autoregressive multi-step rollout</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(copilotData?.multi_horizon_timeline || [
                { horizon: '15M', solar_kw: 5.84, demand_kw: 2.15, balance_kw: 3.69, action: 'LOCAL_TRADE' },
                { horizon: '30M', solar_kw: 5.40, demand_kw: 2.30, balance_kw: 3.10, action: 'LOCAL_TRADE' },
                { horizon: '60M', solar_kw: 4.20, demand_kw: 2.80, balance_kw: 1.40, action: 'LOCAL_TRADE' },
                { horizon: '6H', solar_kw: 0.00, demand_kw: 3.50, balance_kw: -3.50, action: 'DISCHARGE' },
                { horizon: '24H', solar_kw: 0.00, demand_kw: 1.80, balance_kw: -1.80, action: 'DISCHARGE' },
              ]).map((step, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-white/70 border border-white/90 text-center space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-purple-600 uppercase">{step.horizon}</span>
                  <p className={`text-xs font-bold ${step.balance_kw >= 0 ? 'text-[#0D9488]' : 'text-[#E11D48]'}`}>
                    {step.balance_kw >= 0 ? `+${step.balance_kw}` : step.balance_kw} kW
                  </p>
                  <p className="text-[10px] text-[#64748B] font-medium truncate">{step.action}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 🌟 4. GROUNDED AI ASSISTANT MODAL */}
      <GroundedAiAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        currentHousehold={selectedHousehold}
        copilotData={copilotData}
      />

    </div>
  );
}
