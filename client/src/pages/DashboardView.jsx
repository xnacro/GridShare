import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  INITIAL_DEMO_STATE,
  computeHouseholdStates,
} from '../services/marketEngine';
import {
  calculateMicrogridFlows,
} from '../services/dashboardSimulationEngine';
import MarketplaceScene3D, { MARKET_3D_POSITIONS } from '../components/energy-map-3d/MarketplaceScene3D';
import OverviewHero3D from '../components/dashboard/OverviewHero3D';
import MicrogridSketchIllustration from '../components/dashboard/MicrogridSketchIllustration';
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

      {/* 🌟 1. VELUNO-STYLE UNIFIED HERO (Seamless Soft Sage-Green Palette) */}
      <div
        className="rounded-2xl relative overflow-hidden border border-[#D5E8D3] shadow-sm bg-gradient-to-br from-[#EBF5E6] via-[#E8F4E5] to-[#E3EFE1]"
        style={{ minHeight: 'calc(100vh - 100px)' }}
      >
        <div className="relative z-10 flex flex-col lg:flex-row items-stretch" style={{ minHeight: 'calc(100vh - 100px)' }}>

          {/* ─── LEFT SIDE: Content & CTAs ─── */}
          <div className="flex-1 lg:max-w-[50%] p-8 sm:p-10 lg:p-14 lg:pl-16 flex flex-col justify-center pt-10 sm:pt-14 lg:pt-16 space-y-6">

            {/* Simulated Data Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-xl bg-[#E8F6EE] border border-[#1E9B68]/20 text-[#1E9B68] text-xs font-bold w-fit shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#1E9B68] animate-pulse" />
              <span>Simulated data</span>
            </div>

            {/* Dynamic Headline — Changa One Typography */}
            <h1 className="font-changa text-3xl sm:text-4xl lg:text-[44px] font-normal text-[#17221D] leading-[1.15] tracking-wide">
              {netCommunity >= 0 ? (
                <>
                  Your community has{' '}
                  <span className="text-[#1E9B68] whitespace-nowrap">
                    +{netCommunity.toFixed(1)} kW
                  </span>{' '}
                  right now.
                </>
              ) : (
                <>
                  Your community needs{' '}
                  <span className="text-[#3C78CC] whitespace-nowrap">
                    {Math.abs(netCommunity).toFixed(1)} kW
                  </span>{' '}
                  right now.
                </>
              )}
            </h1>

            {/* Supporting Description */}
            <p className="text-sm sm:text-base text-[#5E6963] leading-relaxed max-w-md">
              GridShare tracks generation and demand across {computedHouseholds.length} households, then decides in real time whether to store the surplus, trade it locally, or export it to the grid.
            </p>

            {/* CTA Row — Veluno Style */}
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/network')}
                className="px-6 py-2.5 rounded-full bg-[#12392B] hover:bg-[#174A37] text-white text-sm font-bold shadow-xs transition flex items-center space-x-2 active:scale-[0.98]"
              >
                <span>View live map</span>
                <span className="text-base leading-none">↗</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/ai')}
                className="text-sm font-bold text-[#17221D] hover:text-[#1E9B68] transition px-2 py-2"
              >
                See recommendations
              </button>
            </div>

            {/* Mini Feature Card (like Veluno's secondary product) */}
            <div className="flex items-center space-x-3 pt-3 mt-auto">
              {/* <div className="w-16 h-12 rounded-lg bg-[#F4F6F4] border border-[rgba(23,34,29,0.08)] flex items-center justify-center">
                <FaIcon name="brain" className="text-[#7358C7] text-sm" />
              </div> */}
              {/* <div>
                <div className="text-xs font-bold text-[#17221D]">Hornet AI Active</div>
                <div className="text-[11px] text-[#5E6963]">Dual ML models predicting solar & demand</div>
              </div> */}
            </div>
          </div>

          {/* ─── RIGHT SIDE: Hand-Drawn Illustration & Lower Rotating Badge ─── */}
          <div className="flex-1 lg:max-w-[50%] relative flex items-center justify-center p-4 lg:p-0 pt-8 sm:pt-12 lg:pt-14">

            {/* The SVG Illustration */}
            <MicrogridSketchIllustration className="w-full h-auto max-h-[400px] lg:max-h-[440px] object-contain" />

            {/* Spinning Circular Badge (Positioned Lower on the left of illustration, matching Veluno) */}
            <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-8 lg:bottom-16 lg:left-2 w-[90px] h-[90px] sm:w-[100px] sm:h-[100px] z-20">
              <svg viewBox="0 0 100 100" className="w-full h-full animate-[spin_12s_linear_infinite]">
                <defs>
                  <path id="circlePath" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
                </defs>
                <text fontSize="8.5" fontWeight="700" fill="#17221D" letterSpacing="3">
                  <textPath href="#circlePath">
                    SIMULATED DEMO • LIVE BATTERY •
                  </textPath>
                </text>
              </svg>
              {/* Center Arrow Button */}
              <button
                type="button"
                onClick={() => navigate('/marketplace')}
                className="absolute inset-0 m-auto w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#12392B] hover:bg-[#174A37] text-white flex items-center justify-center shadow-md transition active:scale-95"
                aria-label="Go to marketplace"
              >
                <span className="text-lg leading-none">↗</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* 🌟 2. METRIC CARDS STRIP (Glassmorphism Card with 12px Radius) */}
      <div className="glass-card rounded-xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-center">

        {/* Col 1: Net Community Balance */}
        <div>
          <div className="text-xs font-bold text-[#5E6963]">
            Net Community Balance
          </div>
          <div className={`font-changa text-2xl sm:text-3xl font-normal mt-0.5 ${netCommunity >= 0 ? 'text-[#1E9B68]' : 'text-[#3C78CC]'}`}>
            {netCommunity >= 0 ? `+${netCommunity.toFixed(1)}` : `${netCommunity.toFixed(1)}`} kW
          </div>
          <div className="text-xs text-[#5E6963] font-medium mt-0.5">
            {netCommunity >= 0 ? 'Clean surplus' : 'Net community load'}
          </div>
        </div>

        {/* Col 2: Total Generation */}
        <div>
          <div className="text-xs font-bold text-[#5E6963]">
            Total Generation
          </div>
          <div className="font-changa text-2xl sm:text-3xl font-normal text-[#17221D] mt-0.5">
            {totalGen.toFixed(1)} kW
          </div>
          <div className="text-xs text-[#1E9B68] font-bold flex items-center gap-1 mt-0.5">
            <span>↑ 12%</span>
            <span className="text-[#5E6963] font-normal">vs yesterday</span>
          </div>
        </div>

        {/* Col 3: Total Demand */}
        <div>
          <div className="text-xs font-bold text-[#5E6963]">
            Total Demand
          </div>
          <div className="font-changa text-2xl sm:text-3xl font-normal text-[#17221D] mt-0.5">
            {totalCon.toFixed(1)} kW
          </div>
          <div className="text-xs text-[#1E9B68] font-bold flex items-center gap-1 mt-0.5">
            <span>↑ 8%</span>
            <span className="text-[#5E6963] font-normal">vs yesterday</span>
          </div>
        </div>

        {/* Col 4: Battery State */}
        <div>
          <div className="text-xs font-bold text-[#5E6963]">
            Battery State
          </div>
          <div className="font-changa text-2xl sm:text-3xl font-normal text-[#1E9B68] mt-0.5">
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

      {/* 🌟 3. EXPANDED TWO-PANEL CORE WORKSPACE (65% 3D Simulation | 35% Hornet AI with 12px Radius) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* Left Expanded Panel: Live Microgrid Flow (8 cols ~ 65% width, 12px Radius) */}
        <div className="lg:col-span-8 glass-card rounded-xl relative overflow-hidden h-[460px] sm:h-[500px] lg:h-[530px] flex flex-col justify-between select-none">

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

          {/* Top Floating Frosted Glass Header Bar (12px radius) */}
          <div className="relative z-10 m-3 sm:m-4 p-3 sm:p-4 rounded-xl bg-white/90 backdrop-blur-md border border-white/80 shadow-sm flex items-center justify-between pointer-events-auto">
            <div>
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1E9B68] animate-pulse" />
                <h3 className="font-changa text-sm sm:text-base font-normal text-[#17221D]">
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

          {/* Bottom Floating Frosted Glass Legend Bar (12px radius) */}
          <div className="relative z-10 m-3 sm:m-4 self-start p-2 sm:p-2.5 px-4 rounded-xl bg-white/90 backdrop-blur-md border border-white/80 shadow-sm flex items-center space-x-4 text-xs text-[#5E6963] pointer-events-auto">
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

        {/* Right Panel: Hornet AI — Next 15 Minutes (4 cols ~ 35% width, 12px Radius) */}
        <div className="lg:col-span-4 glass-card rounded-xl p-6 flex flex-col justify-between space-y-4 h-[460px] sm:h-[500px] lg:h-[530px]">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-[#7358C7]" />
                <h3 className="font-changa text-base font-normal text-[#17221D]">
                  Hornet AI — Next 15 Minutes
                </h3>
              </div>

              <span className="font-changa text-xs font-normal text-[#7358C7] bg-[#F1EDFF] px-2.5 py-0.5 rounded-xl border border-[#7358C7]/20">
                Next 15 min
              </span>
            </div>
            <p className="text-xs text-[#5E6963] mt-1">
              Predictive ML forecast, uncertainty corridor & optimal action
            </p>
          </div>

          {/* 3 Mini Forecast Boxes (12px radius) */}
          <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-[#F6F7F4]/80 border border-[rgba(23,34,29,0.06)]">
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-[#5E6963]">
                <FaIcon name="solar" className="text-[#DDA12A]" />
                <span>Solar</span>
              </div>
              <div className="font-changa text-sm sm:text-base font-normal text-[#DDA12A]">
                {aiForecast.solar_kw?.toFixed(2) || '5.84'} kW
              </div>
            </div>

            <div className="space-y-0.5 border-x border-[rgba(23,34,29,0.08)]">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-[#17221D]">
                <FaIcon name="home" className="text-[#17221D]" />
                <span>Demand</span>
              </div>
              <div className="font-changa text-sm sm:text-base font-normal text-[#17221D]">
                {aiForecast.demand_kw?.toFixed(2) || '4.21'} kW
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-[#1E9B68]">
                <FaIcon name="network" className="text-[#1E9B68]" />
                <span>Balance</span>
              </div>
              <div className="font-changa text-sm sm:text-base font-normal text-[#1E9B68]">
                +{aiForecast.balance_kw?.toFixed(2) || '1.63'} kW
              </div>
            </div>
          </div>

          {/* Forecast Range (Uncertainty) Slider Bar */}
          <div className="space-y-1.5 px-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#5E6963] font-medium">Forecast Range (Uncertainty)</span>
              <span className="font-changa font-normal text-[#7358C7]">
                {Array.isArray(aiInterval) ? `${aiInterval[0]?.toFixed(2)} kW — ${aiInterval[1]?.toFixed(2)} kW` : '5.31 kW — 6.28 kW'}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-[#DDA12A]/30 via-[#7358C7] to-[#1E9B68]/40 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#7358C7] shadow-xs" />
            </div>
          </div>

          {/* Recommended Action Box (12px radius) */}
          <div className="p-3.5 rounded-xl bg-[#E8F6EE]/70 border border-[#1E9B68]/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1E9B68]">
                Recommended Action
              </span>
              <span className="font-changa text-xs font-normal text-[#1E9B68] bg-white px-2 py-0.5 rounded-lg border border-[#1E9B68]/20">
                ₹4.50 / kWh
              </span>
            </div>
            <div className="font-changa text-xs sm:text-sm font-normal text-[#12392B]">
              {aiDecision.action_label || 'Trade 1.0 kWh locally (My Home → Eco House)'}
            </div>
            <p className="text-[11px] text-[#5E6963] leading-snug">
              Local surplus is available and nearby demand is active. This trade maximizes self-consumption and reduces grid dependence.
            </p>
          </div>

          {/* CTAs (12px radius) */}
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

      {/* 🌟 4. EXPANDED TWO-PANEL BOTTOM SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* Left Expanded Card: Today's Community Impact */}
        <div className="lg:col-span-6 glass-card rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-changa text-base font-normal text-[#17221D]">
              Today's Community Impact
            </h3>
            <p className="text-xs text-[#5E6963] mt-1">
              Real impact of clean energy sharing & local balancing today
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center py-2">
            <div className="flex flex-col items-center p-2 rounded-xl bg-[#F6F7F4]/80">
              <div className="w-9 h-9 rounded-xl bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-sm mb-1.5">
                <FaIcon name="leaf" />
              </div>
              <div className="font-changa text-lg sm:text-xl font-normal text-[#17221D]">84%</div>
              <div className="text-[11px] text-[#5E6963] font-medium leading-tight mt-0.5">Renewable Self-Consumption</div>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-[#F6F7F4]/80">
              <div className="w-9 h-9 rounded-xl bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-sm mb-1.5">
                <FaIcon name="users" />
              </div>
              <div className="font-changa text-lg sm:text-xl font-normal text-[#1E9B68]">2.0 kWh</div>
              <div className="text-[11px] text-[#5E6963] font-medium leading-tight mt-0.5">Shared Locally</div>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-[#F6F7F4]/80">
              <div className="w-9 h-9 rounded-xl bg-[#FFF7E4] text-[#E5A72D] flex items-center justify-center text-sm mb-1.5">
                <FaIcon name="rupee" />
              </div>
              <div className="font-changa text-lg sm:text-xl font-normal text-[#17221D]">₹4.48</div>
              <div className="text-[11px] text-[#5E6963] font-medium leading-tight mt-0.5">Estimated Savings</div>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-[#F6F7F4]/80">
              <div className="w-9 h-9 rounded-xl bg-[#EDF3FD] text-[#3C78CC] flex items-center justify-center text-sm mb-1.5">
                <FaIcon name="shield" />
              </div>
              <div className="font-changa text-lg sm:text-xl font-normal text-[#17221D]">32%</div>
              <div className="text-[11px] text-[#5E6963] font-medium leading-tight mt-0.5">Peak Grid Strain Reduction</div>
            </div>
          </div>
        </div>

        {/* Right Expanded Card: Recent Community Activity */}
        <div className="lg:col-span-6 glass-card rounded-xl p-6 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-changa text-base font-normal text-[#17221D]">
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
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#F6F7F4]/80 text-xs hover:bg-[#EEF2ED] transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-xs">
                    <FaIcon name={tx.icon || 'marketplace'} />
                  </div>
                  <div>
                    <div className="font-changa text-xs sm:text-sm font-normal text-[#17221D] leading-tight">
                      {tx.sellerName} {tx.buyerName ? `→ ${tx.buyerName}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 text-right">
                  <div className="font-changa text-xs sm:text-sm font-normal text-[#17221D]">
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
