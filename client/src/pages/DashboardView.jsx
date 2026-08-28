import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  INITIAL_DEMO_STATE,
  computeHouseholdStates,
} from '../services/marketEngine';
import {
  generate24HourProfile,
  calculateMicrogridFlows,
} from '../services/dashboardSimulationEngine';
import MarketplaceScene3D, { MARKET_3D_POSITIONS } from '../components/energy-map-3d/MarketplaceScene3D';
import LiveEnergyChart from '../components/LiveEnergyChart';
import TradeConfirmationModal from '../components/marketplace/TradeConfirmationModal';
import DecisionTimeline from '../components/ui/DecisionTimeline';
import FaIcon from '../components/icons/FaIcon';
import MetricCard from '../components/ui/MetricCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function DashboardView({ onOpenDemoModal }) {
  const navigate = useNavigate();

  // Master Microgrid State
  const [households] = useState(INITIAL_DEMO_STATE.households);
  const [battery] = useState(INITIAL_DEMO_STATE.battery);
  const [grid] = useState(INITIAL_DEMO_STATE.grid);
  const [orders] = useState({
    sellOrders: [
      { id: 'GS-SELL-001', household_id: 'house_a', energy_kwh: 2.0, min_price_per_kwh: 4.5, remaining_kwh: 2.0, status: 'OPEN' }
    ],
    buyOrders: [],
  });
  const [transactions, setTransactions] = useState([
    { id: 'TX-GS-001', time: '12:30', sellerId: 'HOUSE_A', buyerId: 'HOUSE_B', energyKwh: 2.0, pricePerKwh: 4.5, totalValue: 9.0, paymentStatus: 'SETTLED', energyFlowStatus: 'TRANSFERRED', status: 'COMPLETED' },
    { id: 'TX-GS-002', time: '11:45', sellerId: 'HOUSE_C', buyerId: 'HOUSE_D', energyKwh: 1.5, pricePerKwh: 4.8, totalValue: 7.2, paymentStatus: 'SETTLED', energyFlowStatus: 'TRANSFERRED', status: 'COMPLETED' }
  ]);

  // Live Hornet AI Insights State
  const [copilotData, setCopilotData] = useState(null);
  const [copilotLoading, setCopilotLoading] = useState(true);

  // Simulation Clock & Node Selection
  const [currentHour] = useState(12);
  const [selectedNode, setSelectedNode] = useState('house_a');
  const [isAiExecuting, setIsAiExecuting] = useState(false);
  const [aiExecutionMessage, setAiExecutionMessage] = useState('');

  // Confirmation Modal
  const [activePurchase] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const sceneRef = useRef();

  // Fetch live copilot insights from backend
  useEffect(() => {
    let isMounted = true;
    const fetchCopilot = async () => {
      try {
        const res = await api.getCopilotInsights();
        if (isMounted && res?.data?.status === 'SUCCESS') {
          setCopilotData(res.data.data);
        }
      } catch (err) {
        console.warn('Using default copilot metrics for dashboard view:', err);
      } finally {
        if (isMounted) setCopilotLoading(false);
      }
    };
    fetchCopilot();
    return () => { isMounted = false; };
  }, []);

  // Compute live household accounting
  const computedHouseholds = useMemo(() => {
    return computeHouseholdStates(households, orders.sellOrders, orders.buyOrders, transactions);
  }, [households, orders, transactions]);

  // Dynamic 3D Flows
  const activeFlows = useMemo(() => {
    return calculateMicrogridFlows(households, battery, grid, MARKET_3D_POSITIONS);
  }, [households, battery, grid]);

  // Dynamic 24h Time-Series Profile
  const chartHistory = useMemo(() => {
    return generate24HourProfile(households, currentHour, battery.soc);
  }, [households, currentHour, battery.soc]);

  // Total Community Primary Metrics
  const totalGen = computedHouseholds.reduce((sum, h) => sum + h.generation, 0);
  const totalCon = computedHouseholds.reduce((sum, h) => sum + h.consumption, 0);
  const netCommunity = Math.round((totalGen - totalCon) * 100) / 100;
  const isSurplus = netCommunity >= 0;

  // Execute AI Recommendation trigger
  const handleExecuteRecommendation = () => {
    setIsAiExecuting(true);
    setAiExecutionMessage('Connecting House A with House B for local peer exchange...');
    setTimeout(() => {
      setTransactions((prev) => [
        {
          id: `TX-GS-00${prev.length + 1}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sellerId: 'HOUSE_A',
          buyerId: 'HOUSE_B',
          energyKwh: 1.0,
          pricePerKwh: 4.5,
          totalValue: 4.5,
          paymentStatus: 'SETTLED',
          energyFlowStatus: 'TRANSFERRED',
          status: 'COMPLETED',
        },
        ...prev,
      ]);
      setIsAiExecuting(false);
      setAiExecutionMessage('Great match! 1.0 kWh shared locally @ ₹4.50/kWh.');
      setTimeout(() => setAiExecutionMessage(''), 4000);
    }, 800);
  };

  // Safe fallback values if copilot API is offline
  const aiForecast = copilotData?.forecast || {
    predicted_solar_kw: 5.84,
    predicted_demand_kw: 4.21,
    predicted_net_balance_kw: 1.63,
  };
  const aiInterval = copilotData?.prediction_interval || {
    solar_lower_kw: 5.31,
    solar_upper_kw: 6.28,
  };
  const aiRec = copilotData?.recommendation || {
    action: 'LOCAL_TRADE',
    headline: 'Trade 1.0 kWh locally (House A → House B)',
    summary: 'Local prosumer surplus is available at House A while House B has active EV demand.',
  };
  const aiReasoning = copilotData?.reasoning || [
    'Surplus expected to remain positive through afternoon peak',
    'Local demand detected at House B (EV charging session active)',
    'Community battery reserve is healthy (>20% emergency floor preserved)',
    'P2P clearing tariff ₹4.50/kWh saves community vs ₹6.10 grid rate',
  ];

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto pb-8 select-none">
      
      {/* 🌟 1. EXECUTIVE HERO GREETING */}
      <div className="rounded-3xl border border-[#DCE4DE] bg-white p-6 sm:p-8 shadow-card relative overflow-hidden">
        {/* Subtle ambient light accents */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#E7F6EE]/80 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-12 h-48 w-48 rounded-full bg-[#F1EDFF]/60 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#E7F6EE] text-[#209B67] text-[11px] font-bold uppercase tracking-wider">
                COMMUNITY OVERVIEW
              </span>
              <Badge variant={isSurplus ? 'surplus' : 'deficit'} size="xs">
                {isSurplus ? 'NET SURPLUS' : 'NET DEFICIT'}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#15211B] tracking-tight leading-tight">
              {isSurplus
                ? `Your community has ${netCommunity.toFixed(1)} kW clean surplus to share today.`
                : `Your community is drawing ${Math.abs(netCommunity).toFixed(1)} kW from backup storage.`}
            </h1>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm font-semibold text-[#5E6A63]">
              <span className="flex items-center gap-1.5 text-[#15211B]">
                <FaIcon name="solar" className="text-[#E7AA31] text-xs" />
                {totalGen.toFixed(1)} kW generated
              </span>
              <span className="text-[#C7D2CB]">•</span>
              <span className="flex items-center gap-1.5 text-[#15211B]">
                <FaIcon name="home" className="text-[#397BD2] text-xs" />
                {totalCon.toFixed(1)} kW consumed
              </span>
              <span className="text-[#C7D2CB]">•</span>
              <span className="flex items-center gap-1.5 text-[#15211B]">
                <FaIcon name="battery" className="text-[#D79A27] text-xs" />
                {battery.soc.toFixed(0)}% battery storage
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#87918B] font-medium pt-1">
              GridShare coordinates residential rooftop solar, central battery buffers, and bilateral trading across Guwahati.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <Button
              variant="ai"
              size="md"
              onClick={() => navigate('/ai')}
              icon={<FaIcon name="ai" />}
            >
              Hornet AI Hub
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/marketplace')}
              icon={<FaIcon name="marketplace" />}
            >
              P2P Market
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/network')}
              icon={<FaIcon name="network" />}
            >
              3D Twin
            </Button>
          </div>
        </div>
      </div>

      {/* Dynamic Action Toast */}
      {aiExecutionMessage && (
        <div className="flex items-center justify-between rounded-2xl border border-[#DCE4DE] bg-[#E7F6EE] px-4 py-3 text-sm text-[#12392B] font-bold shadow-subtle animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2.5">
            <FaIcon name="sparkles" className="text-[#209B67] text-sm" />
            <span>{aiExecutionMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setAiExecutionMessage('')}
            className="text-[#209B67] hover:text-[#15211B] text-xs font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 🌟 2. PRIMARY PROMINENT METRIC CARDS (P0 Clarity) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Generation"
          value={`${totalGen.toFixed(1)} kW`}
          subtitle="Active prosumer solar array"
          iconName="solar"
          variant="solar"
          delta="+1.2 kW vs baseline"
          deltaType="positive"
        />

        <MetricCard
          title="Community Load"
          value={`${totalCon.toFixed(1)} kW`}
          subtitle="Residential household draw"
          iconName="home"
          variant="default"
          delta="Normal cluster demand"
          deltaType="neutral"
        />

        <MetricCard
          title="Net Balance"
          value={`${isSurplus ? '+' : ''}${netCommunity.toFixed(1)} kW`}
          subtitle={isSurplus ? "Clean energy surplus" : "Energy deficit (discharging ESS)"}
          iconName="network"
          variant={isSurplus ? "surplus" : "deficit"}
          badge={isSurplus ? "SURPLUS" : "DEFICIT"}
          delta={isSurplus ? "Local self-sufficiency active" : "Drawing from battery buffer"}
          deltaType={isSurplus ? "positive" : "negative"}
        />

        <MetricCard
          title="Battery SOC"
          value={`${battery.soc.toFixed(0)}%`}
          subtitle="Central 50 kWh ESS asset"
          iconName="battery"
          variant="battery"
          badge="HEALTHY"
          delta="20% reserve floor preserved"
          deltaType="positive"
        />
      </div>

      {/* 🌟 3. 3D DIGITAL TWIN + EMBEDDED HORNET AI PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* CENTERPIECE 3D SPATIAL DIGITAL TWIN (65% width) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <div className="flex flex-col h-full rounded-3xl border border-[#DCE4DE] bg-white p-5 sm:p-6 shadow-card">
            
            {/* 3D Viewport Header Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE4DE]">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#E7F6EE] text-[#209B67] flex items-center justify-center text-sm flex-shrink-0">
                  <FaIcon name="network" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#15211B] tracking-tight">
                    Spatial Microgrid Digital Twin
                  </h3>
                  <p className="text-xs text-[#5E6A63]">
                    Guwahati residential topology, rooftop vectors & bilateral conduits
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => sceneRef.current?.resetCamera()}
                  className="px-2.5 py-1 rounded-lg border border-[#DCE4DE] bg-[#F5F7F3] text-xs font-semibold text-[#15211B] hover:bg-white transition"
                  title="Reset Camera Angle"
                >
                  <FaIcon name="rotate" className="mr-1 text-[11px] text-[#5E6A63]" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => sceneRef.current?.topView()}
                  className="hidden sm:inline-flex px-2.5 py-1 rounded-lg border border-[#DCE4DE] bg-[#F5F7F3] text-xs font-semibold text-[#15211B] hover:bg-white transition"
                  title="Overhead Perspective"
                >
                  Top-Down
                </button>
              </div>
            </div>

            {/* 3D Scene Viewport */}
            <div className="mt-4 h-[380px] sm:h-[420px] w-full relative rounded-2xl overflow-hidden bg-[#F5F7F3]">
              <MarketplaceScene3D
                ref={sceneRef}
                households={computedHouseholds}
                battery={battery}
                grid={grid}
                activeFlows={activeFlows}
                selectedNode={selectedNode}
                onSelectNode={(nodeId) => setSelectedNode(nodeId)}
              />

              {/* Floating Active Conduits Pill */}
              <div className="absolute top-3 left-3 pointer-events-none">
                <div className="flex items-center space-x-2 rounded-full border border-[#DCE4DE] bg-white/95 px-3 py-1 shadow-card backdrop-blur-md">
                  <FaIcon name="bolt" className="text-[#209B67] text-xs" />
                  <span className="text-xs font-bold text-[#15211B]">
                    {activeFlows.length > 0 ? `${activeFlows.length} Active Flow Conduits` : 'Microgrid Baseline Ready'}
                  </span>
                </div>
              </div>
            </div>

            {/* Node Quick Selector Footer */}
            <div className="mt-3.5 pt-3 border-t border-[#DCE4DE] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-[#5E6A63] font-medium">Select Household Node:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {computedHouseholds.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setSelectedNode(h.id)}
                    className={`px-3 py-1 rounded-xl font-bold transition text-xs ${
                      selectedNode === h.id
                        ? 'bg-[#12392B] text-white shadow-xs'
                        : 'bg-[#F5F7F3] text-[#5E6A63] hover:text-[#15211B] border border-[#DCE4DE]'
                    }`}
                  >
                    {h.name.split(' ')[0]} {h.name.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AUTHORITATIVE HORNET AI EXECUTIVE CARD (35% width) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <div className="flex flex-col h-full rounded-3xl border border-[#E2D9F8] bg-[#FBFCFA] p-5 sm:p-6 shadow-card space-y-4">
            
            {/* Hornet AI Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#E2D9F8]">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F1EDFF] text-[#7359C8] flex items-center justify-center text-base flex-shrink-0">
                  <FaIcon name="ai" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#15211B]">
                    Hornet AI Dispatch
                  </h3>
                  <div className="text-xs text-[#7359C8] font-semibold">
                    15-Min Horizon Forecast
                  </div>
                </div>
              </div>
              <Badge variant="ai" size="xs">
                {copilotLoading ? 'SYNCING...' : 'LIVE FORECAST'}
              </Badge>
            </div>

            {/* Predicted Balance & Forecast Range */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl border border-[#DCE4DE] bg-white">
              <div>
                <span className="text-[11px] text-[#5E6A63] font-semibold block uppercase tracking-wider">
                  Predicted Net
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-[#209B67]">
                  {aiForecast.predicted_net_balance_kw >= 0 ? '+' : ''}
                  {aiForecast.predicted_net_balance_kw?.toFixed(2) || '+1.63'} kW
                </span>
                <span className="text-[10.5px] text-[#87918B] block mt-0.5">
                  Solar {aiForecast.predicted_solar_kw?.toFixed(1) || '5.8'} kW • Load {aiForecast.predicted_demand_kw?.toFixed(1) || '4.2'} kW
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#5E6A63] font-semibold block uppercase tracking-wider">
                  Forecast Range
                </span>
                <div className="text-lg sm:text-xl font-bold text-[#7359C8] mt-0.5">
                  {aiInterval.solar_lower_kw?.toFixed(2) || '5.31'}–{aiInterval.solar_upper_kw?.toFixed(2) || '6.28'} <span className="text-xs text-[#5E6A63]">kW</span>
                </div>
                <span className="text-[10px] text-[#87918B] block mt-0.5">
                  Empirical ensemble bounds
                </span>
              </div>
            </div>

            {/* Recommended Action Card */}
            <div className="rounded-2xl border border-[#DCE4DE] bg-white p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#7359C8]">
                  Optimal Dispatch Action
                </span>
                <Badge variant="surplus" size="xs">
                  {aiRec.action || 'LOCAL_TRADE'}
                </Badge>
              </div>
              <div className="text-sm font-bold text-[#15211B]">
                {aiRec.headline || 'TRADE 1.0 kWh LOCALLY (House A → House B)'}
              </div>
              <p className="text-xs text-[#5E6A63] leading-relaxed">
                {aiRec.summary || 'Peer exchange settles @ ₹4.50/kWh, yielding ₹4.50 revenue and saving House B ₹1.60 vs grid tariff.'}
              </p>
            </div>

            {/* Why This Action? Reasoning Box */}
            <div className="rounded-2xl bg-[#F1EDFF]/40 border border-[#E2D9F8] p-3.5 space-y-2 text-xs">
              <span className="font-bold text-[#7359C8] uppercase tracking-wide text-[10.5px] block">
                Explainable Decision Rules:
              </span>
              <ul className="space-y-1.5 text-[#15211B] text-[11.5px]">
                {aiReasoning.slice(0, 3).map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <FaIcon name="check" className="text-[#209B67] text-xs mt-0.5 flex-shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons with Human Governance */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteRecommendation}
                isLoading={isAiExecuting}
                className="w-full justify-center"
                icon={<FaIcon name="check" />}
              >
                Approve Dispatch
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/ai')}
                className="w-full sm:w-auto justify-center"
              >
                Open Hornet AI
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 4. OBSERVE -> PREDICT -> OPTIMIZE -> TRADE DECISION TIMELINE */}
      <DecisionTimeline
        title="Hornet AI 4-Step Orchestration Sequence"
        subtitle="Live trace of how GridShare observes telemetry, forecasts multi-horizon load, and settles bilateral orders"
      />

      {/* 🌟 5. COMMUNITY PERFORMANCE + RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 24-HOUR ENERGY PROFILE (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-[#DCE4DE] bg-white p-5 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE4DE] mb-3">
            <div>
              <h3 className="text-base font-bold text-[#15211B]">
                24-Hour Diurnal Energy Profile
              </h3>
              <p className="text-xs text-[#5E6A63]">
                Solar generation curve vs community demand load in Guwahati
              </p>
            </div>
            <Badge variant="solar" size="xs">
              Diurnal Model
            </Badge>
          </div>

          <LiveEnergyChart data={chartHistory} height={260} />
        </div>

        {/* RECENT SETTLED TRADES & ACTIVITY (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-[#DCE4DE] bg-white p-5 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE4DE] mb-3">
            <div>
              <h3 className="text-base font-bold text-[#15211B]">
                Settled P2P Transactions
              </h3>
              <p className="text-xs text-[#5E6A63]">
                Bilateral microgrid ledger transactions
              </p>
            </div>
            <Badge variant="surplus" size="xs">
              {transactions.length} Settled
            </Badge>
          </div>

          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-2xl border border-[#DCE4DE] bg-[#F5F7F3]/40 hover:bg-white text-xs transition"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#E7F6EE] text-[#209B67] flex items-center justify-center">
                    <FaIcon name="marketplace" />
                  </div>
                  <div>
                    <div className="font-bold text-[#15211B]">{tx.sellerId} ➔ {tx.buyerId}</div>
                    <div className="text-[11px] text-[#87918B]">{tx.time} • {tx.energyKwh} kWh @ ₹{tx.pricePerKwh}/kWh</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#209B67]">₹{tx.totalValue.toFixed(2)}</div>
                  <span className="text-[10px] text-[#87918B] font-semibold">SETTLED</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🌟 6. SECONDARY METRICS: COMMUNITY IMPACT */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
        <div className="rounded-3xl border border-[#DCE4DE] bg-white p-5 shadow-card">
          <span className="text-xs font-semibold text-[#87918B] block">P2P Energy Traded</span>
          <span className="text-xl sm:text-2xl font-extrabold text-[#15211B] mt-1 block">28.4 kWh</span>
          <span className="text-[11px] text-[#209B67] font-semibold">100% clean solar</span>
        </div>

        <div className="rounded-3xl border border-[#DCE4DE] bg-white p-5 shadow-card">
          <span className="text-xs font-semibold text-[#87918B] block">Grid Peak Shaved</span>
          <span className="text-xl sm:text-2xl font-extrabold text-[#397BD2] mt-1 block">14.2 kW</span>
          <span className="text-[11px] text-[#5E6A63]">Substation relief</span>
        </div>

        <div className="rounded-3xl border border-[#DCE4DE] bg-white p-5 shadow-card">
          <span className="text-xs font-semibold text-[#87918B] block">Estimated CO2 Avoided</span>
          <span className="text-xl sm:text-2xl font-extrabold text-[#209B67] mt-1 block">23.3 kg</span>
          <span className="text-[11px] text-[#87918B]">vs coal baseline</span>
        </div>

        <div className="rounded-3xl border border-[#DCE4DE] bg-white p-5 shadow-card">
          <span className="text-xs font-semibold text-[#87918B] block">Community Savings</span>
          <span className="text-xl sm:text-2xl font-extrabold text-[#12392B] mt-1 block">₹142.50</span>
          <span className="text-[11px] text-[#209B67] font-semibold">vs utility peak tariff</span>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <TradeConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          purchaseDetails={activePurchase}
          onConfirmTrade={() => {
            setIsConfirmModalOpen(false);
            setAiExecutionMessage('Trade confirmed and settled successfully.');
          }}
        />
      )}
    </div>
  );
}
