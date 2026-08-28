import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
import OverviewHero3D from '../components/dashboard/OverviewHero3D';
import TradeConfirmationModal from '../components/marketplace/TradeConfirmationModal';
import FaIcon from '../components/icons/FaIcon';

export default function DashboardView({ onOpenDemoModal }) {
  const navigate = useNavigate();
  const { user, profile, household } = useAuth();

  // User Greeting Identity
  const userName = profile?.display_name || user?.email?.split('@')[0] || 'Rahul';
  const householdName = household?.name || 'My Home';

  // Dynamic Time-of-Day Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 17 || hour < 4) return 'Good evening';
    if (hour >= 12) return 'Good afternoon';
    return 'Good morning';
  }, []);

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
    { id: 'TX-GS-001', time: '10:20 AM', sellerName: 'My Home', buyerName: 'Eco House', energyKwh: 2.0, pricePerKwh: 4.5, totalValue: 9.0, status: 'SETTLED', icon: 'home' },
    { id: 'TX-GS-002', time: '10:15 AM', sellerName: 'Community Battery', buyerName: 'ESS Storage', energyKwh: 1.2, pricePerKwh: 4.5, totalValue: 5.4, status: 'STORED', icon: 'battery' },
    { id: 'TX-GS-003', time: '10:10 AM', sellerName: 'Grid Export', buyerName: 'Utility Feed-in', energyKwh: 0.7, pricePerKwh: 3.5, totalValue: 2.45, status: 'EXPORTED', icon: 'grid' },
    { id: 'TX-GS-004', time: '10:05 AM', sellerName: 'Sunshine Home', buyerName: 'Solar Generation', energyKwh: 1.6, pricePerKwh: 0.0, totalValue: 0.0, status: 'GENERATED', icon: 'solar' },
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
  const [activePurchase, setActivePurchase] = useState(null);
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
        console.warn('Using fallback copilot metrics:', err);
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

  // Total Community Primary Metrics
  const totalGen = computedHouseholds.reduce((sum, h) => sum + h.generation, 0);
  const totalCon = computedHouseholds.reduce((sum, h) => sum + h.consumption, 0);
  const netCommunity = Math.round((totalGen - totalCon) * 100) / 100;
  const isSurplus = netCommunity >= 0;

  // Execute AI Recommendation trigger
  const handleExecuteRecommendation = () => {
    setIsAiExecuting(true);
    setAiExecutionMessage('Routing 1.0 kWh local solar trade from My Home to Eco House @ ₹4.50/kWh...');
    setTimeout(() => {
      setTransactions((prev) => [
        {
          id: `TX-GS-00${prev.length + 1}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sellerName: 'My Home',
          buyerName: 'Eco House',
          energyKwh: 1.0,
          pricePerKwh: 4.5,
          totalValue: 4.5,
          status: 'SETTLED',
          icon: 'home',
        },
        ...prev,
      ]);
      setIsAiExecuting(false);
      setAiExecutionMessage('Match completed! 1.0 kWh shared locally @ ₹4.50/kWh.');
      setTimeout(() => setAiExecutionMessage(''), 4000);
    }, 800);
  };

  // AI Fallbacks
  const aiForecast = copilotData?.forecast || {
    solar_kw: 5.84,
    demand_kw: 4.21,
    balance_kw: 1.63,
    lower_ghi: 5.31,
    upper_ghi: 6.28,
  };
  const aiInterval = copilotData?.risk_check?.forecast_range_solar_kw || [5.31, 6.28];
  const aiDecision = copilotData?.decision || {
    action: 'LOCAL_TRADE',
    action_label: 'Trade 1.0 kWh locally (My Home → Eco House)',
    amount_kwh: 1.0,
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 select-none animate-fadeIn">
      
      {/* 🌟 1. EXPANDED SEAMLESS HERO SECTION (Fjalla One Typography & Leftward Fading 3D Microgrid) */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-[rgba(23,34,29,0.08)] shadow-xs min-h-[380px] lg:min-h-[420px]">
        
        {/* Background Expanded 3D Scene anchored to the right with smooth leftward fade */}
        <div className="absolute top-0 right-0 bottom-0 w-full lg:w-[65%] pointer-events-auto">
          <OverviewHero3D
            generation={totalGen}
            myHomeNet={4.7}
            batterySoc={battery.soc}
            heavyLoadNet={-2.8}
            gridExchange={-0.8}
          />
        </div>

        {/* Foreground Content: Fjalla One Headline, Friendly Greeting & Clean CTAs */}
        <div className="relative z-10 p-6 sm:p-8 lg:p-10 max-w-xl pointer-events-auto flex flex-col justify-center min-h-[380px] lg:min-h-[420px] space-y-4">
          
          {/* Greeting */}
          <div className="font-fjalla text-xl sm:text-2xl font-normal text-[#5E6963] tracking-wide">
            {greeting}, {userName} <span className="inline-block">👋</span>
          </div>

          {/* Main Headline in Crisp Fjalla One Typography */}
          <div className="space-y-1 pt-0.5">
            <div className="font-fjalla text-2xl sm:text-3xl lg:text-[34px] font-normal text-[#17221D] tracking-wide leading-tight">
              Your community has
            </div>
            <div className="font-fjalla text-4xl sm:text-5xl lg:text-[54px] font-normal text-[#1E9B68] tracking-wide flex items-center gap-2.5 leading-none">
              <span>+{netCommunity.toFixed(1)} kW</span>
              <span className="text-3xl sm:text-4xl text-[#1E9B68]">🍃</span>
            </div>
            <div className="font-fjalla text-lg sm:text-xl lg:text-[22px] font-normal text-[#17221D] tracking-wide leading-tight">
              of clean energy available to share.
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center space-x-3 pt-3 flex-wrap gap-y-2">
            <button
              type="button"
              onClick={() => navigate('/ai')}
              className="px-5 py-2.5 rounded-xl bg-[#12392B] hover:bg-[#174A37] text-white text-xs sm:text-sm font-bold shadow-xs transition flex items-center space-x-2 active:scale-98"
            >
              <FaIcon name="sparkles" className="text-[#43CB8C]" />
              <span>Ask Hornet AI</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/network')}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F6F7F4] text-[#17221D] text-xs sm:text-sm font-bold border border-[rgba(23,34,29,0.12)] shadow-xs transition flex items-center space-x-1.5 active:scale-98"
            >
              <FaIcon name="network" className="text-xs text-[#5E6963]" />
              <span>Explore Energy Network</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/marketplace')}
              className="px-3 py-2.5 text-xs sm:text-sm font-bold text-[#1E9B68] hover:underline"
            >
              View Marketplace →
            </button>
          </div>

        </div>
      </div>

      {/* 🌟 2. METRIC CARDS STRIP (White Unified Card with 4 Columns + Sparkline) */}
      <div className="rounded-2xl bg-white border border-[rgba(23,34,29,0.08)] p-5 sm:p-6 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-center">
        
        {/* Col 1: NET COMMUNITY BALANCE */}
        <div>
          <div className="font-fjalla text-[11px] font-normal uppercase tracking-wider text-[#5E6963]">
            NET COMMUNITY BALANCE
          </div>
          <div className="font-fjalla text-2xl sm:text-3xl font-normal text-[#1E9B68] mt-0.5">
            +{netCommunity.toFixed(1)} kW
          </div>
          <div className="text-xs text-[#5E6963] font-medium mt-0.5">
            Clean surplus
          </div>
        </div>

        {/* Col 2: TOTAL GENERATION */}
        <div>
          <div className="font-fjalla text-[11px] font-normal uppercase tracking-wider text-[#5E6963]">
            TOTAL GENERATION
          </div>
          <div className="font-fjalla text-2xl sm:text-3xl font-normal text-[#17221D] mt-0.5">
            {totalGen.toFixed(1)} kW
          </div>
          <div className="text-xs text-[#1E9B68] font-bold flex items-center gap-1 mt-0.5">
            <span>↑ 12%</span>
            <span className="text-[#5E6963] font-normal">vs yesterday</span>
          </div>
        </div>

        {/* Col 3: TOTAL DEMAND */}
        <div>
          <div className="font-fjalla text-[11px] font-normal uppercase tracking-wider text-[#5E6963]">
            TOTAL DEMAND
          </div>
          <div className="font-fjalla text-2xl sm:text-3xl font-normal text-[#17221D] mt-0.5">
            {totalCon.toFixed(1)} kW
          </div>
          <div className="text-xs text-[#1E9B68] font-bold flex items-center gap-1 mt-0.5">
            <span>↑ 8%</span>
            <span className="text-[#5E6963] font-normal">vs yesterday</span>
          </div>
        </div>

        {/* Col 4: BATTERY STATE */}
        <div>
          <div className="font-fjalla text-[11px] font-normal uppercase tracking-wider text-[#5E6963]">
            BATTERY STATE
          </div>
          <div className="font-fjalla text-2xl sm:text-3xl font-normal text-[#1E9B68] mt-0.5">
            {battery.soc.toFixed(0)}%
          </div>
          <div className="text-xs text-[#5E6963] font-medium mt-0.5">
            8.0 / 20 kWh usable
          </div>
        </div>

        {/* Col 5: Mini Sparkline & View Link */}
        <div className="flex flex-col justify-between items-end space-y-2">
          <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 24" fill="none">
            <path
              d="M0 16 Q 15 8, 30 14 T 60 8 T 85 15 T 100 6"
              stroke="#1E9B68"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M0 16 Q 15 8, 30 14 T 60 8 T 85 15 T 100 6 L 100 24 L 0 24 Z"
              fill="url(#sparklineGrad)"
              opacity="0.25"
            />
            <defs>
              <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E9B68" />
                <stop offset="100%" stopColor="#1E9B68" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          <button
            type="button"
            onClick={() => navigate('/network')}
            className="text-xs font-bold text-[#1E9B68] hover:underline flex items-center gap-1"
          >
            <span>View Energy Flow</span>
            <span>→</span>
          </button>
        </div>

      </div>

      {/* Dynamic Action Notification Banner */}
      {aiExecutionMessage && (
        <div className="flex items-center justify-between rounded-xl border border-[#1E9B68]/20 bg-[#E8F6EE] px-4 py-3 text-xs sm:text-sm text-[#12392B] font-bold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <FaIcon name="check" className="text-[#1E9B68]" />
            <span>{aiExecutionMessage}</span>
          </div>
          <button type="button" onClick={() => setAiExecutionMessage('')} className="text-[#1E9B68] text-xs p-1 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* 🌟 3. EXPANDED TWO-PANEL CORE WORKSPACE (65% Full-Bleed 3D Simulation with Glass Overlay | 35% Hornet AI) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Expanded Panel: LIVE MICROGRID FLOW (8 cols ~ 65% width, Full-Bleed Glass Canvas) */}
        <div className="lg:col-span-8 rounded-3xl bg-white border border-[rgba(23,34,29,0.08)] shadow-xs relative overflow-hidden h-[460px] sm:h-[500px] lg:h-[530px] flex flex-col justify-between select-none">
          
          {/* Full-Bleed 3D Microgrid Viewport */}
          <div className="absolute inset-0 w-full h-full">
            <MarketplaceScene3D
              ref={sceneRef}
              households={computedHouseholds}
              battery={battery}
              grid={grid}
              activeFlows={activeFlows}
              selectedNode={selectedNode}
              onSelectNode={(node) => setSelectedNode(node.id)}
            />
          </div>

          {/* Top Floating Frosted Glass Header Bar */}
          <div className="relative z-10 m-3 sm:m-4.5 p-3 sm:p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-sm flex items-center justify-between pointer-events-auto">
            <div>
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1E9B68] animate-pulse" />
                <h3 className="font-fjalla text-sm sm:text-base font-normal uppercase tracking-wider text-[#17221D]">
                  Live Microgrid Flow
                </h3>
              </div>
              <p className="text-xs text-[#5E6963] mt-0.5 hidden sm:block">
                Real-time energy routing & bilateral power exchanges
              </p>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => sceneRef.current?.resetCamera?.()}
                className="px-3 py-1.5 text-xs font-bold text-[#17221D] bg-white/95 hover:bg-white rounded-xl border border-[rgba(23,34,29,0.08)] shadow-xs transition flex items-center gap-1.5"
              >
                <span>↺</span>
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={() => sceneRef.current?.setTopDownView?.()}
                className="px-3 py-1.5 text-xs font-bold text-[#17221D] bg-white/95 hover:bg-white rounded-xl border border-[rgba(23,34,29,0.08)] shadow-xs transition"
              >
                Top-Down
              </button>
            </div>
          </div>

          {/* Bottom Floating Frosted Glass Legend Bar */}
          <div className="relative z-10 m-3 sm:m-4.5 self-start p-2 sm:p-2.5 px-4 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-sm flex items-center space-x-4 text-xs text-[#5E6963] pointer-events-auto">
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-[#1E9B68]" />
              <span className="font-medium">Surplus Flow</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-[#D45C5C]" />
              <span className="font-medium">Deficit Flow</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-[#DDA12A]" />
              <span className="font-medium">Battery Flow</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-[#3C78CC]" />
              <span className="font-medium">Grid Flow</span>
            </div>
          </div>
        </div>

        {/* Right Panel: HORNET AI — NEXT 15 MINUTES (4 cols ~ 35% width) */}
        <div className="lg:col-span-4 rounded-3xl bg-white border border-[rgba(23,34,29,0.08)] p-6 shadow-xs flex flex-col justify-between space-y-4 h-[460px] sm:h-[500px] lg:h-[530px]">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-[#7358C7]" />
                <h3 className="font-fjalla text-base font-normal uppercase tracking-wider text-[#17221D]">
                  Hornet AI — Next 15 Minutes
                </h3>
              </div>

              <span className="font-fjalla text-xs font-normal text-[#7358C7] bg-[#F1EDFF] px-2.5 py-0.5 rounded-full border border-[#7358C7]/20">
                Next 15 min
              </span>
            </div>
            <p className="text-xs text-[#5E6963] mt-1">
              Predictive ML forecast, uncertainty corridor & optimal action
            </p>
          </div>

          {/* 3 Mini Forecast Boxes */}
          <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-2xl bg-[#F6F7F4] border border-[rgba(23,34,29,0.06)]">
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-[9px] font-bold uppercase text-[#5E6963]">
                <FaIcon name="solar" className="text-[#DDA12A]" />
                <span>SOLAR</span>
              </div>
              <div className="font-fjalla text-sm sm:text-base font-normal text-[#DDA12A]">
                {aiForecast.solar_kw?.toFixed(2) || '5.84'} kW
              </div>
            </div>

            <div className="space-y-0.5 border-x border-[rgba(23,34,29,0.08)]">
              <div className="flex items-center justify-center gap-1 text-[9px] font-bold uppercase text-[#5E6963]">
                <FaIcon name="home" className="text-[#17221D]" />
                <span>DEMAND</span>
              </div>
              <div className="font-fjalla text-sm sm:text-base font-normal text-[#17221D]">
                {aiForecast.demand_kw?.toFixed(2) || '4.21'} kW
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-[9px] font-bold uppercase text-[#5E6963]">
                <FaIcon name="network" className="text-[#1E9B68]" />
                <span>BALANCE</span>
              </div>
              <div className="font-fjalla text-sm sm:text-base font-normal text-[#1E9B68]">
                +{aiForecast.balance_kw?.toFixed(2) || '1.63'} kW
              </div>
            </div>
          </div>

          {/* Forecast Range (Uncertainty) Slider Bar */}
          <div className="space-y-1.5 px-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#5E6963] font-medium">Forecast Range (Uncertainty)</span>
              <span className="font-fjalla font-normal text-[#7358C7]">
                {Array.isArray(aiInterval) ? `${aiInterval[0]?.toFixed(2)} kW — ${aiInterval[1]?.toFixed(2)} kW` : '5.31 kW — 6.28 kW'}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-[#DDA12A]/30 via-[#7358C7] to-[#1E9B68]/40 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#7358C7] shadow-xs" />
            </div>
          </div>

          {/* Recommended Action Box */}
          <div className="p-3.5 rounded-2xl bg-[#E8F6EE]/70 border border-[#1E9B68]/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-fjalla text-xs font-normal uppercase tracking-wider text-[#1E9B68]">
                RECOMMENDED ACTION
              </span>
              <span className="font-fjalla text-xs font-normal text-[#1E9B68] bg-white px-2 py-0.5 rounded-md border border-[#1E9B68]/20">
                ₹4.50 / kWh
              </span>
            </div>
            <div className="font-fjalla text-xs sm:text-sm font-normal text-[#12392B]">
              {aiDecision.action_label || 'Trade 1.0 kWh locally (My Home → Eco House)'}
            </div>
            <p className="text-[11px] text-[#5E6963] leading-snug">
              Local surplus is available and nearby demand is active. This trade maximizes self-consumption and reduces grid dependence.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleExecuteRecommendation}
              disabled={isAiExecuting}
              className="flex-1 justify-center py-2.5 rounded-xl bg-[#1E9B68] hover:bg-[#168557] text-white text-xs font-bold shadow-xs transition active:scale-98 disabled:opacity-50"
            >
              {isAiExecuting ? 'Executing...' : 'Review Decision →'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/ai')}
              className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-[#F6F7F4] text-[#17221D] text-xs font-bold border border-[rgba(23,34,29,0.12)] transition"
            >
              View Details
            </button>
          </div>
        </div>

      </div>

      {/* 🌟 4. EXPANDED TWO-PANEL BOTTOM SECTION (50/50 Split for Impact & Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Expanded Card: TODAY'S COMMUNITY IMPACT (6 cols ~ 50%) */}
        <div className="lg:col-span-6 rounded-2xl bg-white border border-[rgba(23,34,29,0.08)] p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-fjalla text-base font-normal uppercase tracking-wider text-[#17221D]">
              Today's Community Impact
            </h3>
            <p className="text-xs text-[#5E6963] mt-1">
              Real impact of clean energy sharing & local balancing today
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center py-2">
            <div className="flex flex-col items-center p-2 rounded-xl bg-[#F6F7F4]">
              <div className="w-9 h-9 rounded-xl bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-sm mb-1.5">
                <FaIcon name="leaf" />
              </div>
              <div className="font-fjalla text-lg sm:text-xl font-normal text-[#17221D]">84%</div>
              <div className="text-[11px] text-[#5E6963] font-medium leading-tight mt-0.5">Renewable Self-Consumption</div>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-[#F6F7F4]">
              <div className="w-9 h-9 rounded-xl bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-sm mb-1.5">
                <FaIcon name="users" />
              </div>
              <div className="font-fjalla text-lg sm:text-xl font-normal text-[#1E9B68]">2.0 kWh</div>
              <div className="text-[11px] text-[#5E6963] font-medium leading-tight mt-0.5">Shared Locally</div>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-[#F6F7F4]">
              <div className="w-9 h-9 rounded-xl bg-[#FFF7E4] text-[#E5A72D] flex items-center justify-center text-sm mb-1.5">
                <FaIcon name="rupee" />
              </div>
              <div className="font-fjalla text-lg sm:text-xl font-normal text-[#17221D]">₹4.48</div>
              <div className="text-[11px] text-[#5E6963] font-medium leading-tight mt-0.5">Estimated Savings</div>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-[#F6F7F4]">
              <div className="w-9 h-9 rounded-xl bg-[#EDF3FD] text-[#3C78CC] flex items-center justify-center text-sm mb-1.5">
                <FaIcon name="shield" />
              </div>
              <div className="font-fjalla text-lg sm:text-xl font-normal text-[#17221D]">32%</div>
              <div className="text-[11px] text-[#5E6963] font-medium leading-tight mt-0.5">Peak Grid Strain Reduction</div>
            </div>
          </div>
        </div>

        {/* Right Expanded Card: RECENT COMMUNITY ACTIVITY (6 cols ~ 50%) */}
        <div className="lg:col-span-6 rounded-2xl bg-white border border-[rgba(23,34,29,0.08)] p-6 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-fjalla text-base font-normal uppercase tracking-wider text-[#17221D]">
                Recent Community Activity
              </h3>
              <p className="text-xs text-[#5E6963] mt-1">
                Live updates from your community ledger
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/transactions')}
              className="text-xs font-bold text-[#1E9B68] hover:underline"
            >
              View all activity →
            </button>
          </div>

          <div className="space-y-2">
            {transactions.slice(0, 4).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#F6F7F4] text-xs hover:bg-[#EEF2ED] transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-xs">
                    <FaIcon name={tx.icon || 'marketplace'} />
                  </div>
                  <div>
                    <div className="font-fjalla text-xs sm:text-sm font-normal text-[#17221D] leading-tight">
                      {tx.sellerName} {tx.buyerName ? `→ ${tx.buyerName}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 text-right">
                  <div className="font-fjalla text-xs sm:text-sm font-normal text-[#17221D]">
                    {tx.energyKwh.toFixed(1)} kWh
                  </div>
                  {tx.pricePerKwh > 0 && (
                    <div className="text-[11px] font-mono text-[#5E6963]">
                      ₹{tx.pricePerKwh.toFixed(2)}/kWh
                    </div>
                  )}
                  <div className="text-[10px] text-[#89938D]">
                    {tx.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <TradeConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          purchase={activePurchase}
          onConfirm={() => setIsConfirmModalOpen(false)}
        />
      )}

    </div>
  );
}
