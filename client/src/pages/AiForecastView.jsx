import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FaIcon from '../components/icons/FaIcon';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import MetricCard from '../components/ui/MetricCard';
import AiDecisionPipeline from '../components/copilot/AiDecisionPipeline';
import ForecastRangeChart from '../components/copilot/ForecastRangeChart';
import WeatherShockSimulator from '../components/copilot/WeatherShockSimulator';
import { api } from '../services/api';

export default function AiForecastView() {
  const navigate = useNavigate();

  // State
  const [copilotData, setCopilotData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHorizon, setSelectedHorizon] = useState('15M');
  const [selectedHousehold, setSelectedHousehold] = useState('COMMUNITY');
  const [households, setHouseholds] = useState([]);
  const [actionNotice, setActionNotice] = useState(null);

  // Map string horizon to minutes
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

  // Fetch Authoritative Copilot Insights from Backend
  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const minutes = horizonMinutesMap[selectedHorizon] || 15;
      const params = {
        horizon_minutes: minutes,
      };
      if (selectedHousehold !== 'COMMUNITY') {
        params.household_id = selectedHousehold;
      }

      const resp = await api.getCopilotInsights(params);
      if (resp.data && resp.data.data) {
        setCopilotData(resp.data.data);
      }
    } catch (err) {
      console.error('Error loading copilot insights:', err);
      setError('Unable to connect to Hornet AI service. Please ensure backend is running.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedHorizon, selectedHousehold]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Handle Simulation Shock Applied
  const handleShockApplied = (shockResult) => {
    if (shockResult && shockResult.shocked_state) {
      setCopilotData(shockResult.shocked_state);
      setActionNotice(`Simulation active: ${shockResult.summary}`);
    } else {
      fetchInsights();
      setActionNotice(null);
    }
  };

  // Handle Dispatch Approved
  const handleSelectAction = (decision) => {
    setActionNotice(`Dispatch Plan Approved: ${decision.action_label}. Grid routing prepared.`);
    setTimeout(() => setActionNotice(null), 6000);
  };

  const [viewMode, setViewMode] = useState('SIMPLE'); // 'SIMPLE', 'ADVANCED'
  const [showGuide, setShowGuide] = useState(true);

  const current = copilotData?.current_state || {};
  const forecast = copilotData?.forecast || {};
  const decision = copilotData?.decision || {};
  const risk = copilotData?.risk_check || {};
  const impact = copilotData?.impact || {};

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto pb-8 select-none">
      
      {/* 🌟 Top Header: Title, Mode Toggle & Context Switchers */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#142019]">
              Hornet AI
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#12251D] text-white">
              Autonomous Energy Advisor
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Real-time solar & load forecasting that automatically calculates the most profitable energy action.
          </p>
        </div>

        {/* Filters & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Simple vs Advanced Toggle */}
          <div className="flex items-center bg-[#F5F6F2] p-1 rounded-xl border border-[#DDE4DF] text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('SIMPLE')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'SIMPLE'
                  ? 'bg-white text-[#142019] shadow-subtle'
                  : 'text-slate-500 hover:text-[#142019]'
              }`}
            >
              🌱 Simple View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('ADVANCED')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'ADVANCED'
                  ? 'bg-white text-[#142019] shadow-subtle'
                  : 'text-slate-500 hover:text-[#142019]'
              }`}
            >
              🔬 Technical ML View
            </button>
          </div>

          {/* Household Selector */}
          <div className="flex items-center space-x-1.5">
            <select
              value={selectedHousehold}
              onChange={(e) => setSelectedHousehold(e.target.value)}
              className="rounded-xl border border-[#DDE4DF] bg-white px-3 py-2 text-xs font-bold text-[#142019] shadow-subtle focus:outline-none focus:ring-2 focus:ring-[#1C9A67]/20"
            >
              <option value="COMMUNITY">Entire Community</option>
              {households.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.household_type})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 💡 Quick-Start 3-Step Guide Banner (Collapsible) */}
      {showGuide && (
        <div className="rounded-2xl border border-[#1C9A67]/30 bg-gradient-to-r from-[#E7F5EE]/80 via-white to-[#E7F5EE]/50 p-4 sm:p-5 shadow-subtle relative">
          <button
            type="button"
            onClick={() => setShowGuide(false)}
            className="absolute top-3 right-3 text-xs font-bold text-slate-400 hover:text-slate-700"
          >
            ✕ Hide Guide
          </button>
          
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-base">🐝</span>
            <h3 className="text-sm font-extrabold text-[#142019]">
              How Hornet AI Works (in 3 Simple Steps)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-[#DDE4DF] shadow-2xs space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-[#142019]">
                <span className="h-5 w-5 rounded-full bg-[#E7F5EE] text-[#1C9A67] flex items-center justify-center text-xs">1</span>
                <span>Observe & Predict</span>
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Hornet AI monitors real-time solar irradiance and household load, forecasting whether you will have <strong>surplus power</strong> or <strong>power deficit</strong> in the next 15 minutes.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#DDE4DF] shadow-2xs space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-[#142019]">
                <span className="h-5 w-5 rounded-full bg-[#E7F5EE] text-[#1C9A67] flex items-center justify-center text-xs">2</span>
                <span>Optimize & Protect</span>
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                It calculates the most profitable action (Trade locally at ₹4.50 vs Grid ₹6.10), while keeping your <strong>battery reserve safe (≥20%)</strong>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#DDE4DF] shadow-2xs space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-[#142019]">
                <span className="h-5 w-5 rounded-full bg-[#E7F5EE] text-[#1C9A67] flex items-center justify-center text-xs">3</span>
                <span>Review & Approve</span>
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Click <strong>"Review & Confirm"</strong> to approve the proposed energy action. Hornet AI never trades without your review.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 Action Feedback Toast */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-[#E7F5EE] border border-[#1C9A67]/30 text-xs font-bold text-[#1C9A67] flex items-center justify-between animate-fadeIn shadow-subtle">
          <div className="flex items-center space-x-2">
            <FaIcon name="check" className="text-sm" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-xs font-bold underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 🚨 Error Banner if any */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <Button size="sm" variant="secondary" onClick={fetchInsights}>
            Retry
          </Button>
        </div>
      )}

      {/* 📊 1. Core 6-Step Decision Pipeline */}
      <AiDecisionPipeline
        copilotData={copilotData}
        isLoading={isLoading}
        onRefresh={fetchInsights}
        onSelectAction={handleSelectAction}
      />

      {/* 📈 2. Multi-Horizon Forecast Corridor Chart */}
      <ForecastRangeChart
        forecastData={forecast}
        horizon={selectedHorizon}
        onHorizonChange={setSelectedHorizon}
      />

      {/* ⚡ 3. Weather Shock Simulator for Hackathon Demonstrations */}
      <WeatherShockSimulator onShockApplied={handleShockApplied} />

      {/* 🧭 4. Model Architecture & Provenance Metadata */}
      <div className="rounded-2xl border border-[#DDE4DF] bg-white p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#EEF2EF]">
          <div className="flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#12251D] text-white">
              <FaIcon name="shield" className="text-xs text-[#39C985]" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#142019]">
              ML Models & Dispatch Engine Provenance
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Validated Zero-Leakage Architecture
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#EEF2EF] space-y-1">
            <div className="flex items-center justify-between font-bold">
              <span className="text-[#142019]">Demand Model</span>
              <span className="font-mono text-[#1C9A67]">demand_v1</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              150-Tree Random Forest trained on 2M+ records. Test MAE: 0.235 kW, R²: 0.758.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#EEF2EF] space-y-1">
            <div className="flex items-center justify-between font-bold">
              <span className="text-[#142019]">Solar Resource Model</span>
              <span className="font-mono text-[#D97706]">solar_v1</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Guwahati NSRDB satellite model (35k intervals). Daytime RMSE: 50.19 W/m², R²: 0.979.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#EEF2EF] space-y-1">
            <div className="flex items-center justify-between font-bold">
              <span className="text-[#142019]">Routing Optimizer</span>
              <span className="font-mono text-blue-600">Rule Engine v1.0</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Deterministic priority: Local P2P Match → Battery Store → Grid Export / Discharge.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
