import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import FaIcon from '../components/icons/FaIcon';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import MetricCard from '../components/ui/MetricCard';
import DecisionTimeline from '../components/ui/DecisionTimeline';

export default function AiForecastView() {
  const navigate = useNavigate();

  // Forecast simulation parameters
  const [solarKw, setSolarKw] = useState(6.8);
  const [loadKw, setLoadKw] = useState(7.5);
  const [batterySoc, setBatterySoc] = useState(40);
  const [gridTariff, setGridTariff] = useState(6.10);
  const [p2pPrice, setP2pPrice] = useState(4.50);
  const [horizon, setHorizon] = useState('24H');
  const [selectedHour, setSelectedHour] = useState(12);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState(null);

  // 24-hour Diurnal Profile calculation
  const forecastSeries = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const solarCurve = [0, 0, 0, 0, 0, 0.1, 0.8, 2.2, 4.5, 6.2, 7.8, 8.4, 8.1, 7.2, 5.8, 3.9, 1.8, 0.4, 0, 0, 0, 0, 0, 0];
    const loadCurve = [2.8, 2.4, 2.2, 2.1, 2.3, 3.1, 4.8, 5.5, 5.1, 4.9, 5.2, 5.8, 5.4, 5.0, 5.3, 6.2, 7.8, 8.9, 8.4, 7.2, 5.8, 4.5, 3.6, 3.0];

    let runningSoc = batterySoc;

    return hours.map((hr) => {
      const gen = Math.round(solarCurve[hr] * (solarKw / 8.0) * 10) / 10;
      const con = Math.round(loadCurve[hr] * (loadKw / 6.0) * 10) / 10;
      const net = Math.round((gen - con) * 10) / 10;

      if (net > 0 && runningSoc < 95) {
        runningSoc = Math.min(95, runningSoc + net * 2.5);
      } else if (net < 0 && runningSoc > 10) {
        runningSoc = Math.max(10, runningSoc + net * 2.0);
      }

      return {
        time: `${String(hr).padStart(2, '0')}:00`,
        hour: hr,
        solar: gen,
        load: con,
        net: net,
        batterySoc: Math.round(runningSoc),
        p2pPotential: Math.max(0, net),
      };
    });
  }, [solarKw, loadKw, batterySoc]);

  const currentSlot = forecastSeries[selectedHour] || forecastSeries[12];
  const isSurplus = currentSlot.net > 0;

  // ML Recommendation & Reasoning
  const recommendation = useMemo(() => {
    if (isSurplus) {
      const tradeAmt = Math.min(currentSlot.net, 2.8);
      const estSavings = Math.round(tradeAmt * (gridTariff - p2pPrice) * 100) / 100;

      return {
        action: 'TRADE',
        actionLabel: 'Execute P2P Local Trade',
        energyAmount: tradeAmt,
        targetNode: 'House B (Consumer / Heavy EV)',
        confidence: 94.2,
        reasoning: [
          `Local surplus of +${currentSlot.net.toFixed(1)} kW projected for next ${horizon}.`,
          `Nearby peer demand active at House B (EV Charger active on Feeder A).`,
          `Battery reserve healthy at ${currentSlot.batterySoc}% (exceeds 10% reserve floor).`,
          `P2P tariff (₹${p2pPrice}/kWh) yields ₹${(tradeAmt * p2pPrice).toFixed(2)} and saves peer ₹${estSavings}.`,
        ],
        impact: {
          costSavings: estSavings,
          gridAvoidedKw: tradeAmt,
          selfConsumptionPercent: 88,
        },
      };
    } else {
      return {
        action: 'BATTERY_DISCHARGE',
        actionLabel: 'Discharge Central Battery Reserve',
        energyAmount: Math.abs(currentSlot.net),
        targetNode: 'Community Microgrid Bus',
        confidence: 91.0,
        reasoning: [
          `Local net deficit of ${Math.abs(currentSlot.net).toFixed(1)} kW active during low solar interval.`,
          `Central battery available at ${currentSlot.batterySoc}% SOC.`,
          `Discharging ESS avoids high utility peak import rates (₹${gridTariff}/kWh).`,
          `Blackout protection reserve preserved above 10% floor.`,
        ],
        impact: {
          costSavings: Math.round(Math.abs(currentSlot.net) * 1.80 * 100) / 100,
          gridAvoidedKw: Math.abs(currentSlot.net),
          selfConsumptionPercent: 75,
        },
      };
    }
  }, [currentSlot, isSurplus, gridTariff, p2pPrice, horizon]);

  const handleApplyDispatch = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setAppliedNotice(`Optimal dispatch applied: ${recommendation.actionLabel} for ${recommendation.energyAmount} kWh.`);
      setTimeout(() => setAppliedNotice(null), 5000);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto pb-8 select-none">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102019] tracking-tight">
              AI Energy Copilot & Predictive Dispatch
            </h1>
            <Badge variant="ai" size="sm">
              RULE-BASED SIMULATOR
            </Badge>
          </div>
          <p className="text-sm text-[#5D6B64] font-medium mt-1">
            Deterministic multi-horizon forecasting, explainable dispatch reasoning, and autonomous peer matching.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleApplyDispatch}
            isLoading={isApplying}
            icon={<FaIcon name="sparkles" />}
          >
            Apply Optimal Dispatch
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/network')}
            icon={<FaIcon name="network" />}
          >
            View Live Network
          </Button>
        </div>
      </div>

      {/* Applied Notice Banner */}
      {appliedNotice && (
        <div className="flex items-center justify-between rounded-xl border border-[#E2D9F8] bg-[#F0EBFF] px-4 py-3 text-sm text-[#7657D8] font-bold shadow-subtle animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2.5">
            <FaIcon name="checkCircle" className="text-base" />
            <span>{appliedNotice}</span>
          </div>
          <button type="button" onClick={() => setAppliedNotice(null)} className="text-[#7657D8] text-xs font-bold p-1">
            ✕
          </button>
        </div>
      )}

      {/* 🌟 1. PRIMARY AI KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Predicted Community Balance"
          value={`${isSurplus ? '+' : ''}${currentSlot.net.toFixed(1)} kW`}
          subtitle={`Forecast at ${currentSlot.time}`}
          iconName="energy"
          variant={isSurplus ? 'surplus' : 'deficit'}
          badge={isSurplus ? 'SURPLUS' : 'DEFICIT'}
        />

        <MetricCard
          title="Forecast Confidence"
          value={`${recommendation.confidence}%`}
          subtitle="Multi-horizon deterministic model"
          iconName="ai"
          variant="ai"
          delta="High Model Fidelity"
          deltaType="positive"
        />

        <MetricCard
          title="Renewable Self-Consumption"
          value={`${recommendation.impact.selfConsumptionPercent}%`}
          subtitle="Clean energy retained locally"
          iconName="solar"
          variant="solar"
          delta="+14% vs uncoordinated grid"
          deltaType="positive"
        />

        <MetricCard
          title="Hourly Economic Benefit"
          value={`+₹${recommendation.impact.costSavings.toFixed(2)}`}
          subtitle="Estimated community savings"
          iconName="rupee"
          variant="surplus"
          delta="vs standard peak tariff"
          deltaType="positive"
        />
      </div>

      {/* 🌟 2. SIGNATURE 5-STAGE AI OPERATING PIPELINE */}
      <div className="rounded-2xl border border-[#DDE5E0] bg-white p-5 sm:p-6 shadow-card">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE5E0] mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F0EBFF] text-[#7657D8] flex items-center justify-center text-sm">
              <FaIcon name="brain" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#102019]">
                Structured Intelligence Trace: State ➔ Action ➔ Impact
              </h3>
              <p className="text-xs text-[#5D6B64]">
                Transparent explanation of how GridShare evaluates real-time telemetry and triggers optimal dispatch
              </p>
            </div>
          </div>
          <Badge variant="ai" size="xs">
            ML-Ready Schema
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          
          {/* 1. CURRENT STATE */}
          <div className="p-3.5 rounded-xl border border-[#DDE5E0] bg-[#FBFCFB] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#83908A]">1. Current State</span>
              <FaIcon name="solar" className="text-[#E8A72B] text-xs" />
            </div>
            <div className="text-sm font-bold text-[#102019]">{solarKw} kW Solar Gen</div>
            <p className="text-xs text-[#5D6B64]">
              House A prosumer generation with {batterySoc}% battery reserve.
            </p>
          </div>

          {/* 2. FORECAST */}
          <div className="p-3.5 rounded-xl border border-[#DDE5E0] bg-[#FBFCFB] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#83908A]">2. ML Forecast</span>
              <FaIcon name="ai" className="text-[#7657D8] text-xs" />
            </div>
            <div className="text-sm font-bold text-[#102019]">{currentSlot.net > 0 ? `+${currentSlot.net} kW Surplus` : `${currentSlot.net} kW Deficit`}</div>
            <p className="text-xs text-[#5D6B64]">
              Projected 60-min balance across 5 community nodes.
            </p>
          </div>

          {/* 3. OPTIMAL ACTION */}
          <div className="p-3.5 rounded-xl border border-[#E2D9F8] bg-[#F0EBFF]/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#7657D8]">3. Optimal Action</span>
              <FaIcon name="sparkles" className="text-[#7657D8] text-xs" />
            </div>
            <div className="text-sm font-bold text-[#102019]">{recommendation.actionLabel}</div>
            <p className="text-xs text-[#5D6B64]">
              Allocate {recommendation.energyAmount} kWh to {recommendation.targetNode}.
            </p>
          </div>

          {/* 4. REASONING */}
          <div className="p-3.5 rounded-xl border border-[#DDE5E0] bg-[#FBFCFB] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#83908A]">4. Why This Action?</span>
              <FaIcon name="checkCircle" className="text-[#168A5A] text-xs" />
            </div>
            <div className="text-sm font-bold text-[#102019]">Cost & Buffer Safety</div>
            <p className="text-xs text-[#5D6B64]">
              P2P trade (₹4.50/kWh) saves ₹1.60/kWh vs peak grid import.
            </p>
          </div>

          {/* 5. EXPECTED IMPACT */}
          <div className="p-3.5 rounded-xl border border-[#DDE5E0] bg-[#E7F5EE] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#168A5A]">5. Expected Impact</span>
              <FaIcon name="energy" className="text-[#168A5A] text-xs" />
            </div>
            <div className="text-sm font-bold text-[#163A2B]">+₹{recommendation.impact.costSavings.toFixed(2)} Savings</div>
            <p className="text-xs text-[#5D6B64]">
              Zero grid congestion; 10% blackout reserve preserved.
            </p>
          </div>
        </div>
      </div>

      {/* 🌟 3. INTERACTIVE 24-HOUR FORECAST CHART & REASONING PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* TIME-SERIES VISUALIZER (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-[#DDE5E0] bg-white p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDE5E0]">
            <div>
              <h3 className="text-base font-bold text-[#102019]">
                24-Hour Multi-Horizon Forecast Curves
              </h3>
              <p className="text-xs text-[#5D6B64]">
                Diurnal solar curve (Amber), household load (Blue), and ESS SOC (Green)
              </p>
            </div>
            <div className="flex items-center space-x-1.5">
              {['6H', '12H', '24H'].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHorizon(h)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    horizon === h
                      ? 'bg-[#163A2B] text-white shadow-xs'
                      : 'bg-[#F5F7F6] text-[#5D6B64] hover:bg-[#EBF0ED]'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slider */}
          <div className="flex items-center space-x-3 text-xs pt-1">
            <span className="font-semibold text-[#5D6B64] whitespace-nowrap">Scrub Hour:</span>
            <input
              type="range"
              min="0"
              max="23"
              value={selectedHour}
              onChange={(e) => setSelectedHour(Number(e.target.value))}
              className="w-full accent-[#168A5A] cursor-pointer"
            />
            <span className="font-mono font-bold text-[#102019] w-14 text-right">
              {String(selectedHour).padStart(2, '0')}:00
            </span>
          </div>

          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8A72B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E8A72B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3678D4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3678D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE5E0" vertical={false} />
                <XAxis dataKey="time" stroke="#83908A" fontSize={11} tickLine={false} />
                <YAxis stroke="#83908A" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #DDE5E0', boxShadow: '0 4px 6px -1px rgba(16,32,25,0.05)' }}
                  formatter={(val, name) => [`${val} kW`, name === 'solar' ? 'Solar Gen' : name === 'load' ? 'Community Load' : 'Net Balance']}
                />
                <Area type="monotone" dataKey="solar" stroke="#E8A72B" strokeWidth={2} fillOpacity={1} fill="url(#solarGrad)" name="solar" />
                <Area type="monotone" dataKey="load" stroke="#3678D4" strokeWidth={2} fillOpacity={1} fill="url(#loadGrad)" name="load" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* EXPLAINABILITY & REASONING PANEL (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-[#DDE5E0] bg-white p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDE5E0]">
            <div>
              <h3 className="text-base font-bold text-[#102019]">
                Explainable Decision Reasoning
              </h3>
              <p className="text-xs text-[#5D6B64]">
                Auditable factors driving AI dispatch at {currentSlot.time}
              </p>
            </div>
            <Badge variant="ai" size="xs">
              Explainable AI
            </Badge>
          </div>

          <div className="space-y-2.5 text-xs">
            {recommendation.reasoning.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl border border-[#DDE5E0] bg-[#FBFCFB]">
                <FaIcon name="checkCircle" className="text-[#168A5A] text-xs mt-0.5 flex-shrink-0" />
                <span className="text-[#102019] leading-relaxed font-medium">{reason}</span>
              </div>
            ))}
          </div>

          {/* Alternative Dispatch Options Evaluated */}
          <div className="pt-2 border-t border-[#DDE5E0] space-y-2">
            <span className="text-[11px] uppercase font-bold text-[#83908A] block">
              Evaluated Alternatives
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl border border-[#DDE5E0] bg-[#F5F7F6]">
                <span className="font-bold text-[#102019] block">1. Utility Grid Feed</span>
                <span className="text-[#83908A] text-[11px]">₹3.20/kWh (Suboptimal)</span>
              </div>
              <div className="p-2.5 rounded-xl border border-[#DDE5E0] bg-[#F5F7F6]">
                <span className="font-bold text-[#102019] block">2. ESS Battery Store</span>
                <span className="text-[#168A5A] text-[11px]">Buffer Safe @ 40%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 4. DECISION TIMELINE COMPONENT */}
      <DecisionTimeline
        title="Predictive AI Decision Sequence"
        subtitle="Step-by-step chronological record of how the decision engine solved the multi-household dispatch"
      />
    </div>
  );
}
