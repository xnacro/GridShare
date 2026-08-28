import React, { useState } from 'react';
import FaIcon from '../icons/FaIcon';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function AiDecisionPipeline({
  copilotData,
  isLoading,
  onRefresh,
  onSelectAction,
}) {
  const [activeTab, setActiveTab] = useState('PIPELINE'); // 'PIPELINE', 'REASONING', 'RISK'
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [workflowState, setWorkflowState] = useState('RECOMMENDED'); // 'RECOMMENDED', 'REVIEWING', 'CONFIRMED'

  if (isLoading && !copilotData) {
    return (
      <div className="rounded-2xl border border-[#DDE4DF] bg-white p-8 text-center shadow-card animate-pulse">
        <div className="mx-auto h-8 w-8 rounded-full bg-[#E7F5EE] flex items-center justify-center text-[#1C9A67] mb-3">
          <FaIcon name="ai" className="animate-spin text-sm" />
        </div>
        <p className="text-sm font-bold text-[#142019]">Synthesizing AI Copilot Pipeline...</p>
        <p className="text-xs text-slate-500 mt-1">Combining demand_v1 load + solar_v1 irradiance models</p>
      </div>
    );
  }

  const data = copilotData || {};
  const current = data.current_state || {};
  const forecast = data.forecast || {};
  const decision = data.decision || {};
  const risk = data.risk_check || {};
  const reasoning = data.reasoning || [];
  const impact = data.impact || {};

  const isSurplus = (forecast.balance_kw || 0) >= 0;
  const solarRangeStr = `${(forecast.solar_lower_kw ?? 0).toFixed(2)} – ${(forecast.solar_upper_kw ?? 0).toFixed(2)} kW`;
  const ghiRangeStr = `${Math.round(forecast.lower_ghi ?? 0)} – ${Math.round(forecast.upper_ghi ?? 0)} W/m²`;

  const handleReviewClick = () => {
    setIsReviewOpen(true);
    setWorkflowState('REVIEWING');
  };

  const handleConfirmAction = () => {
    setWorkflowState('CONFIRMED');
    if (onSelectAction) {
      onSelectAction(decision);
    }
  };

  return (
    <div className="rounded-2xl border border-[#DDE4DF] bg-white shadow-card overflow-hidden">
      {/* 🧭 Header & Pipeline Progress Bar */}
      <div className="p-4 sm:p-5 border-b border-[#EEF2EF] bg-gradient-to-r from-[#FAFBF9] to-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#12251D] text-white shadow-sm">
            <FaIcon name="ai" className="text-lg text-[#39C985]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold tracking-tight text-[#142019]">
                GridShare AI Copilot Decision Pipeline
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F5EE] text-[#1C9A67] border border-[#DDE4DF]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1C9A67] animate-pulse mr-1" />
                Live 6-Step Loop
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Authoritative multi-model energy orchestration (demand_v1 + solar_v1 + deterministic dispatch)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs"
          >
            <FaIcon name="refresh" className={`mr-1.5 text-xs ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Re-evaluating...' : 'Refresh Copilot'}</span>
          </Button>
        </div>
      </div>

      {/* 📊 6-Step Visual Progression Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b border-[#EEF2EF] divide-x divide-[#EEF2EF] bg-[#FCFDFB] text-xs">
        {/* 1. Current State */}
        <div className="p-3 sm:p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>1. Current</span>
            <span className="text-[#1C9A67]">OBSERVE</span>
          </div>
          <div className="text-sm font-extrabold text-[#142019]">
            {current.net_balance_kw >= 0 ? `+${current.net_balance_kw?.toFixed(2)}` : current.net_balance_kw?.toFixed(2)} kW
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between">
            <span>Gen: {current.generation_kw?.toFixed(1)}k</span>
            <span>Load: {current.demand_kw?.toFixed(1)}k</span>
          </div>
        </div>

        {/* 2. Forecast */}
        <div className="p-3 sm:p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>2. Forecast</span>
            <span className="text-indigo-600">PREDICT</span>
          </div>
          <div className={`text-sm font-extrabold ${isSurplus ? 'text-[#1C9A67]' : 'text-amber-600'}`}>
            {isSurplus ? `+${forecast.balance_kw?.toFixed(2)}` : forecast.balance_kw?.toFixed(2)} kW
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between">
            <span>PV: {forecast.solar_kw?.toFixed(1)}k</span>
            <span>Load: {forecast.demand_kw?.toFixed(1)}k</span>
          </div>
        </div>

        {/* 3. Risk & Interval */}
        <div className="p-3 sm:p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>3. Risk Check</span>
            <span className={risk.cloud_volatility_risk === 'HIGH' ? 'text-rose-600 font-bold' : 'text-slate-500'}>
              {risk.cloud_volatility_risk || 'LOW'}
            </span>
          </div>
          <div className="text-xs font-bold text-slate-800 font-mono">
            {solarRangeStr}
          </div>
          <div className="text-[10px] text-slate-500 truncate" title="Empirical ensemble prediction corridor">
            PV Forecast Range
          </div>
        </div>

        {/* 4. Recommendation */}
        <div className="p-3 sm:p-3.5 space-y-1 bg-[#F6FAF8]">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#1C9A67]">
            <span>4. Action</span>
            <span className="font-bold">OPTIMIZE</span>
          </div>
          <div className="text-xs font-extrabold text-[#12251D] truncate" title={decision.action_label}>
            {decision.action || 'BALANCED'}
          </div>
          <div className="text-[10px] font-semibold text-[#1C9A67]">
            {decision.amount_kwh ? `${decision.amount_kwh?.toFixed(1)} kWh proposed` : 'Self-balanced'}
          </div>
        </div>

        {/* 5. Reasoning */}
        <div className="p-3 sm:p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>5. Logic</span>
            <span className="text-blue-600">EXPLAIN</span>
          </div>
          <div className="text-xs font-bold text-slate-800">
            {reasoning.length} verified rules
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            {reasoning[0] || 'State aligned.'}
          </div>
        </div>

        {/* 6. Impact */}
        <div className="p-3 sm:p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>6. Impact</span>
            <span className="text-emerald-600">SAVINGS</span>
          </div>
          <div className="text-sm font-extrabold text-[#142019]">
            {impact.estimated_saving_rs ? `₹${impact.estimated_saving_rs.toFixed(2)}` : 'Optimized'}
          </div>
          <div className="text-[10px] text-slate-500">
            {impact.grid_energy_avoided_kwh ? `${impact.grid_energy_avoided_kwh.toFixed(1)} kWh avoided` : 'Zero grid spill'}
          </div>
        </div>
      </div>

      {/* 🎯 Main Detail View */}
      <div className="p-5 space-y-5">
        
        {/* Recommendation Hero Box */}
        <div className="rounded-xl border border-[#DDE4DF] bg-gradient-to-br from-[#FAFBF9] to-[#F2F7F4] p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#12251D] text-white">
                RECOMMENDED ACTION
              </span>
              <span className="text-xs font-bold text-slate-500 font-mono">
                Horizon: +{data.horizon_minutes || 15} Min
              </span>
            </div>
            
            <h3 className="text-lg sm:text-xl font-black text-[#142019] tracking-tight">
              {decision.action_label || 'MAINTAIN BALANCED SELF-CONSUMPTION'}
            </h3>

            <p className="text-xs text-slate-600 font-medium max-w-2xl">
              Derived deterministically from the predicted <span className="font-bold text-[#142019]">{isSurplus ? 'surplus' : 'deficit'} ({forecast.balance_kw > 0 ? `+${forecast.balance_kw}` : forecast.balance_kw} kW)</span> while strictly preserving community battery reserve ≥ {risk.battery_reserve_protected ? '20% safety floor' : 'rebalancing'}.
            </p>
          </div>

          {/* Workflow Action Buttons (Review -> Confirm -> Executed) */}
          <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
            {workflowState === 'RECOMMENDED' && (
              <Button
                variant="primary"
                onClick={handleReviewClick}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold shadow-sm"
              >
                <span>Review & Confirm</span>
                <FaIcon name="arrowRight" className="ml-2 text-xs" />
              </Button>
            )}

            {workflowState === 'REVIEWING' && (
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setWorkflowState('RECOMMENDED')}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmAction}
                  className="text-xs bg-[#1C9A67] hover:bg-[#158055] text-white font-bold"
                >
                  Confirm Dispatch
                </Button>
              </div>
            )}

            {workflowState === 'CONFIRMED' && (
              <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#E7F5EE] text-[#1C9A67] font-bold text-xs border border-[#1C9A67]/20">
                <FaIcon name="check" className="mr-1.5" />
                <span>Action Approved for Dispatch</span>
              </div>
            )}
          </div>
        </div>

        {/* 2-Column: Explainable Reasoning (Left) & Risk-Aware Check (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* LEFT: Structured Reasoning (Why?) */}
          <div className="lg:col-span-7 rounded-xl border border-[#DDE4DF] bg-white p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#E7F5EE] text-[#1C9A67]">
                  <FaIcon name="check" className="text-xs" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#142019]">
                  Why GridShare Recommends This
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-400 font-mono">
                Model: {data.models_used?.optimizer || 'Rule Engine v1.0'}
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              {reasoning.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2.5 text-xs text-slate-700">
                  <span className="h-4 w-4 rounded-full bg-[#E7F5EE] text-[#1C9A67] flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">
                    ✓
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Risk-Aware Bounds & Safety Margin */}
          <div className="lg:col-span-5 rounded-xl border border-[#DDE4DF] bg-white p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                  <FaIcon name="shield" className="text-xs" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#142019]">
                  Risk-Aware Safety Check
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-400 font-mono">
                {risk.cloud_volatility_risk || 'LOW'} VOLATILITY
              </span>
            </div>

            <div className="space-y-2 text-xs pt-1">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Expected Net Surplus:</span>
                <span className="font-bold text-[#142019]">
                  {forecast.balance_kw >= 0 ? `+${forecast.balance_kw?.toFixed(2)}` : forecast.balance_kw?.toFixed(2)} kW
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Conservative Lower Bound:</span>
                <span className="font-bold text-slate-700 font-mono">
                  {forecast.conservative_balance_kw >= 0 ? `+${forecast.conservative_balance_kw?.toFixed(2)}` : forecast.conservative_balance_kw?.toFixed(2)} kW
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Solar Forecast Range:</span>
                <span className="font-bold text-slate-700 font-mono">
                  {solarRangeStr}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">GHI Atmospheric Range:</span>
                <span className="font-bold text-slate-700 font-mono">
                  {ghiRangeStr}
                </span>
              </div>

              <div className="flex justify-between py-1 pt-1.5">
                <span className="text-slate-500">Battery Reserve Protected:</span>
                <span className="inline-flex items-center font-bold text-[#1C9A67]">
                  <FaIcon name="check" className="mr-1 text-[10px]" />
                  {risk.battery_reserve_protected ? 'Preserved (≥20%)' : 'Rebalancing'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
