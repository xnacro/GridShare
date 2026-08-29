import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  INITIAL_DEMO_STATE,
  computeHouseholdStates,
} from '../services/marketEngine';
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
  const [battery, setBattery] = useState(INITIAL_DEMO_STATE.battery || { soc: 40, capacity: 20.0, storedKwh: 8.0, minSoc: 20 });
  const [grid] = useState(INITIAL_DEMO_STATE.grid);

  const handleBufferCharge = (kwh = 2.0) => {
    if (battery.soc >= 95) {
      setAiExecutionMessage('Central ESS is at 95% maximum operating threshold.');
      setTimeout(() => setAiExecutionMessage(''), 4000);
      return;
    }
    const nextSoc = Math.min(95, battery.soc + Math.round((kwh / (battery.capacity || 20.0)) * 100));
    const nextStored = Math.round((((battery.capacity || 20.0) * nextSoc) / 100) * 10) / 10;
    setBattery((prev) => ({ ...prev, soc: nextSoc, storedKwh: nextStored }));
    setAiExecutionMessage(`⚡ Buffered +${kwh} kWh solar surplus into Community ESS (SOC now ${nextSoc}%)`);
    setTimeout(() => setAiExecutionMessage(''), 4500);
  };

  const handleBufferDischarge = (kwh = 1.5) => {
    if (battery.soc <= 20) {
      setAiExecutionMessage('Central ESS reached 20% emergency reserve floor.');
      setTimeout(() => setAiExecutionMessage(''), 4000);
      return;
    }
    const nextSoc = Math.max(20, battery.soc - Math.round((kwh / (battery.capacity || 20.0)) * 100));
    const nextStored = Math.round((((battery.capacity || 20.0) * nextSoc) / 100) * 10) / 10;
    setBattery((prev) => ({ ...prev, soc: nextSoc, storedKwh: nextStored }));
    setAiExecutionMessage(`🔋 Discharged ${kwh} kWh clean battery reserve to support local peak load (SOC now ${nextSoc}%)`);
    setTimeout(() => setAiExecutionMessage(''), 4500);
  };

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

  // Simulation State
  const [isAiExecuting, setIsAiExecuting] = useState(false);
  const [aiExecutionMessage, setAiExecutionMessage] = useState('');

  // Confirmation Modal
  const [activePurchase, setActivePurchase] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

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

  // Live interactive variation slider state
  const [aiVariation, setAiVariation] = useState(0);

  // Dynamic AI Forecast with live interactive slider tuning
  const rawSolar = copilotData?.forecast?.solar_kw ?? 5.84;
  const rawDemand = copilotData?.forecast?.demand_kw ?? 4.21;
  const lowerGhi = copilotData?.forecast?.solar_lower_kw ?? (rawSolar * 0.9);
  const upperGhi = copilotData?.forecast?.solar_upper_kw ?? (rawSolar * 1.1);

  const solarKw = Math.max(0, Math.round((rawSolar * (1 + aiVariation / 100)) * 100) / 100);
  const demandKw = Math.round(rawDemand * 100) / 100;
  const balanceKw = Math.round((solarKw - demandKw) * 100) / 100;

  const aiForecast = {
    solar_kw: solarKw,
    demand_kw: demandKw,
    balance_kw: balanceKw,
    solar_lower_kw: lowerGhi,
    solar_upper_kw: upperGhi,
  };

  const aiDecision = useMemo(() => {
    if (balanceKw > 0.3) {
      const tradeAmount = Math.min(Math.round(balanceKw * 0.25 * 100) / 100, 2.0);
      return {
        action: 'LOCAL_TRADE',
        action_label: `TRADE ${tradeAmount.toFixed(2)} kWh LOCALLY`,
        amount_kwh: tradeAmount,
        reason: 'Local surplus is available and nearby demand is active. Trading locally maximizes self-consumption and peer revenue.',
        tariff_badge: '₹4.50 / kWh',
      };
    } else if (balanceKw < -0.3) {
      const dischargeAmount = Math.min(Math.round(Math.abs(balanceKw) * 0.25 * 100) / 100, 3.0);
      return {
        action: 'DISCHARGE_BATTERY',
        action_label: `DISCHARGE ${dischargeAmount.toFixed(2)} kWh FROM BATTERY`,
        amount_kwh: dischargeAmount,
        reason: 'Household load exceeds solar generation. Discharging battery buffer covers deficit and avoids expensive ₹6.10/kWh grid tariff.',
        tariff_badge: 'Avoid Grid ₹6.10',
      };
    } else {
      return {
        action: 'BALANCED_IDLE',
        action_label: 'BALANCED SELF-CONSUMPTION',
        amount_kwh: 0,
        reason: 'Solar generation matches household demand. Power flows are in equilibrium.',
        tariff_badge: 'Balanced 0.00',
      };
    }
  }, [balanceKw]);

  return (
    <div className="space-y-7 max-w-[1600px] mx-auto pb-14 select-none animate-fadeIn relative">

      {/* 🌟 AMBIENT GLASSMORPHISM GLOW ORBS (Underneath glass layer) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[650px] h-[650px] bg-gradient-to-br from-[#60A5FA]/25 via-[#38BDF8]/20 to-transparent rounded-full blur-[100px]" />
        <div className="absolute top-[35%] -left-32 w-[550px] h-[550px] bg-gradient-to-tr from-[#10B981]/15 via-[#6EE7B7]/18 to-transparent rounded-full blur-[95px]" />
        <div className="absolute bottom-10 right-[15%] w-[480px] h-[480px] bg-gradient-to-bl from-[#F59E0B]/12 via-[#FCD34D]/10 to-transparent rounded-full blur-[90px]" />
      </div>

      {/* 🌟 1. EDITORIAL FROSTED GLASS HERO */}
      <div className="rounded-3xl relative overflow-hidden border border-white/95 shadow-[0_20px_50px_rgba(15,23,42,0.04),inset_0_1px_2px_rgba(255,255,255,1)] bg-white/80 backdrop-blur-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-6 sm:p-8 lg:p-10 lg:pl-12 gap-6 lg:gap-8">

          {/* ─── LEFT SIDE: Content & CTAs ─── */}
          <div className="flex-1 lg:max-w-[52%] flex flex-col justify-center space-y-4 sm:space-y-5">

            {/* Large Editorial Headline — Deep Navy */}
            <h1 className="font-display text-2xl sm:text-3xl lg:text-[38px] font-bold text-[#0F2233] leading-[1.2] tracking-tight">
              {netCommunity >= 0 ? (
                <>
                  Your community has{' '}
                  <span className="text-[#156B5C] whitespace-nowrap drop-shadow-xs">
                    +{netCommunity.toFixed(1)} kW
                  </span>{' '}
                  of clean energy ready to share.
                </>
              ) : (
                <>
                  Your community needs{' '}
                  <span className="text-[#C2571F] whitespace-nowrap drop-shadow-xs">
                    {Math.abs(netCommunity).toFixed(1)} kW
                  </span>{' '}
                  from local storage right now.
                </>
              )}
            </h1>

            {/* Concise Supporting Description */}
            <p className="text-xs sm:text-sm text-[#526B66] leading-relaxed max-w-md font-medium">
              GridShare tracks generation and demand across {computedHouseholds.length} households, deciding in real time whether to store surplus in the central ESS, trade peer-to-peer, or optimize self-consumption.
            </p>

            {/* Primary & Secondary CTA Row */}
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/network')}
                className="px-5 py-3 rounded-full bg-[#156B5C] hover:bg-[#0F5347] text-white text-xs sm:text-sm font-bold shadow-[0_4px_14px_rgba(21,107,92,0.3)] transition flex items-center space-x-2 active:scale-[0.98]"
              >
                <span>View live map</span>
                <span className="text-base leading-none">↗</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/ai')}
                className="px-4.5 py-3 rounded-full bg-white/85 hover:bg-white text-[#0F2233] border border-white/90 text-xs sm:text-sm font-bold shadow-xs backdrop-blur-md transition hover:shadow-md"
              >
                See recommendations
              </button>
            </div>
          </div>

          {/* ─── RIGHT SIDE: Hand-Drawn SVG Illustration & Lower Rotating Badge ─── */}
          <div className="flex-1 lg:max-w-[48%] relative flex items-center justify-center p-2 sm:p-4">

            {/* The SVG Illustration */}
            <MicrogridSketchIllustration className="w-full h-auto max-h-[300px] sm:max-h-[340px] lg:max-h-[360px] object-contain drop-shadow-xs" />

            {/* Spinning Circular Badge with Frosted Glass Inset */}
            <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-[84px] h-[84px] sm:w-[92px] sm:h-[92px] z-20">
              <svg viewBox="0 0 100 100" className="w-full h-full animate-[spin_14s_linear_infinite]">
                <defs>
                  <path id="circlePath" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
                </defs>
                <text fontSize="8.5" fontWeight="700" fill="#0F2233" letterSpacing="3">
                  <textPath href="#circlePath">
                    SIMULATED DEMO • LIVE BATTERY •
                  </textPath>
                </text>
              </svg>
              {/* Center Glass Arrow Button */}
              <button
                type="button"
                onClick={() => navigate('/marketplace')}
                className="absolute inset-0 m-auto w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0F2233] hover:bg-[#156B5C] text-white flex items-center justify-center shadow-lg transition active:scale-95 border border-white/40"
                aria-label="Go to marketplace"
              >
                <span className="text-base leading-none">↗</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* 🌟 2. 5 FLOATING GLASS METRIC TILES STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-4.5 items-stretch">

        {/* Tile 1: Net Community Balance */}
        <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/90 p-5 shadow-[0_4px_20px_rgba(15,34,51,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] hover:bg-white/90 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 space-y-1.5">
          <div className="text-[11px] font-bold text-[#526B66] uppercase tracking-wider">
            Net Balance
          </div>
          <div className={`font-display text-2xl sm:text-3xl font-bold ${netCommunity >= 0 ? 'text-[#156B5C]' : 'text-[#C2571F]'}`}>
            {netCommunity >= 0 ? `+${netCommunity.toFixed(1)}` : `${netCommunity.toFixed(1)}`} kW
          </div>
          <div className="text-xs text-[#526B66] font-medium">
            {netCommunity >= 0 ? 'Clean surplus' : 'Net deficit'}
          </div>
        </div>

        {/* Tile 2: Total Generation */}
        <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/90 p-5 shadow-[0_4px_20px_rgba(15,34,51,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] hover:bg-white/90 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 space-y-1.5">
          <div className="text-[11px] font-bold text-[#526B66] uppercase tracking-wider">
            Solar Gen
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-[#D99A1F]">
            {totalGen.toFixed(1)} kW
          </div>
          <div className="text-xs text-[#156B5C] font-bold flex items-center gap-1">
            <span>↑ 12%</span>
            <span className="text-[#526B66] font-normal">vs yesterday</span>
          </div>
        </div>

        {/* Tile 3: Total Demand */}
        <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/90 p-5 shadow-[0_4px_20px_rgba(15,34,51,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] hover:bg-white/90 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 space-y-1.5">
          <div className="text-[11px] font-bold text-[#526B66] uppercase tracking-wider">
            Community Demand
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-[#0F2233]">
            {totalCon.toFixed(1)} kW
          </div>
          <div className="text-xs text-[#526B66] font-bold flex items-center gap-1">
            <span>↑ 8%</span>
            <span className="text-[#526B66] font-normal">vs yesterday</span>
          </div>
        </div>

        {/* Tile 4: Battery Storage */}
        <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/90 p-5 shadow-[0_4px_20px_rgba(15,34,51,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] hover:bg-white/90 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 space-y-1.5">
          <div className="text-[11px] font-bold text-[#526B66] uppercase tracking-wider">
            Battery Reserve
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-[#156B5C]">
            {battery?.soc ? battery.soc.toFixed(0) : '40'}%
          </div>
          <div className="text-xs text-[#526B66] font-medium">
            8.0 / 20 kWh usable
          </div>
        </div>

        {/* Tile 5: Mini Sparkline & Quick Link */}
        <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/90 p-5 shadow-[0_4px_20px_rgba(15,34,51,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] hover:bg-white/90 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between space-y-2">
          <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 24" fill="none">
            <path
              d="M0 16 Q 15 8, 30 14 T 60 8 T 85 15 T 100 6"
              stroke="#156B5C"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M0 16 Q 15 8, 30 14 T 60 8 T 85 15 T 100 6 L 100 24 L 0 24 Z"
              fill="url(#sparklineGrad)"
              opacity="0.14"
            />
            <defs>
              <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#156B5C" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#156B5C" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          <button
            type="button"
            onClick={() => navigate('/network')}
            className="text-xs font-bold text-[#0F2233] hover:text-[#156B5C] hover:underline flex items-center justify-between"
          >
            <span>Energy Flow</span>
            <span>→</span>
          </button>
        </div>

      </div>

      {/* Dynamic Action Notification Banner */}
      {aiExecutionMessage && (
        <div className="flex items-center justify-between rounded-2xl border border-white/90 bg-white/85 backdrop-blur-xl px-4.5 py-3.5 text-xs sm:text-sm text-[#0F2233] font-bold shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-[#E8F3F1] text-[#156B5C] flex items-center justify-center text-xs">
              <FaIcon name="check" />
            </div>
            <span>{aiExecutionMessage}</span>
          </div>
          <button type="button" onClick={() => setAiExecutionMessage('')} className="text-[#526B66] hover:text-[#0F2233] text-xs p-1 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* 🌟 3. BALANCED 50/50 CORE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* Left Panel (6 cols): Community Microgrid Overview */}
        <div className="lg:col-span-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/90 p-6 sm:p-7 shadow-[0_10px_30px_rgba(15,34,51,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base sm:text-lg font-bold text-[#0F2233]">
                Community Microgrid Overview
              </h3>
              <button
                type="button"
                onClick={() => navigate('/network')}
                className="text-xs font-bold text-[#0F2233] hover:text-[#156B5C] hover:underline flex items-center gap-1"
              >
                <span>Explore Live Map</span>
                <span>↗</span>
              </button>
            </div>
            <p className="text-xs text-[#526B66] mt-1">
              Live generation, consumption, and real-time power balance across 4 member households
            </p>
          </div>

          {/* 4 Authentic Household Live Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {computedHouseholds.map((h) => {
              const netKw = Math.round((h.generation - h.consumption) * 100) / 100;
              const hasSurplus = netKw >= 0;
              return (
                <div
                  key={h.id}
                  className="p-4 rounded-2xl bg-white/85 backdrop-blur-md border border-white/90 hover:border-[#156B5C]/40 hover:bg-white transition-all space-y-2.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-xl bg-[#E8F3F1] border border-white flex items-center justify-center text-xs font-bold text-[#156B5C] shadow-2xs">
                        {h.name.charAt(0)}
                      </div>
                      <span className="font-display text-xs sm:text-sm font-bold text-[#0F2233]">
                        {h.name}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${hasSurplus
                          ? 'bg-[#E8F3F1] text-[#156B5C] border-[#156B5C]/20'
                          : 'bg-[#F9ECE6] text-[#C2571F] border-[#C2571F]/20'
                        }`}
                    >
                      {hasSurplus ? `+${netKw.toFixed(1)} kW Surplus` : `${netKw.toFixed(1)} kW Deficit`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1.5 border-t border-[rgba(15,34,51,0.06)]">
                    <div>
                      <div className="text-[10px] text-[#526B66] font-medium">Solar Gen</div>
                      <div className="font-display text-xs font-bold text-[#D99A1F]">
                        {h.generation.toFixed(1)} kW
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#526B66] font-medium">Demand</div>
                      <div className="font-display text-xs font-bold text-[#0F2233]">
                        {h.consumption.toFixed(1)} kW
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Bilateral Sharing Conduit Banner */}
          <div className="p-3.5 rounded-2xl bg-white/90 border border-white flex items-center justify-between text-xs shadow-xs">
            <div className="flex items-center space-x-2">
              <FaIcon name="network" className="text-[#156B5C]" />
              <span className="text-[#0F2233] font-medium">
                P2P Trade Conduit: <strong>Anjali → Prince</strong> active @ ₹4.50/kWh
              </span>
            </div>
            <span className="font-display font-bold text-[#156B5C] bg-[#E8F3F1] px-2.5 py-1 rounded-full border border-[#156B5C]/20 text-[11px]">
              -26% vs Grid Tariff
            </span>
          </div>
        </div>

        {/* Right Panel (6 cols): Hornet AI — Next 15 Minutes */}
        <div className="lg:col-span-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/90 p-6 sm:p-7 shadow-[0_10px_30px_rgba(15,34,51,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base sm:text-lg font-bold text-[#0F2233]">
                Hornet AI — Next 15 Minutes
              </h3>

              <span className="font-display text-xs font-bold text-[#156B5C] bg-[#E8F3F1] px-3 py-1 rounded-full border border-[#156B5C]/20">
                Next 15 min
              </span>
            </div>
            <p className="text-xs text-[#526B66] mt-1">
              Predictive ML forecast, uncertainty corridor & optimal dispatch action
            </p>
          </div>

          {/* 3 Mini Forecast Boxes */}
          <div className="grid grid-cols-3 gap-2.5 text-center p-3.5 rounded-2xl bg-white/85 border border-white shadow-xs">
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-[#526B66]">
                <FaIcon name="solar" className="text-[#D99A1F]" />
                <span>Solar</span>
              </div>
              <div className="font-display text-sm sm:text-base font-bold text-[#D99A1F]">
                {aiForecast.solar_kw?.toFixed(2) || '5.84'} kW
              </div>
            </div>

            <div className="space-y-0.5 border-x border-[rgba(15,34,51,0.08)]">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-[#526B66]">
                <FaIcon name="home" className="text-[#0F2233]" />
                <span>Demand</span>
              </div>
              <div className="font-display text-sm sm:text-base font-bold text-[#0F2233]">
                {aiForecast.demand_kw?.toFixed(2) || '4.21'} kW
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-[#526B66]">
                <FaIcon name="network" className="text-[#156B5C]" />
                <span>Balance</span>
              </div>
              <div className="font-display text-sm sm:text-base font-bold text-[#156B5C]">
                +{aiForecast.balance_kw?.toFixed(2) || '1.63'} kW
              </div>
            </div>
          </div>

          {/* Forecast Range (Uncertainty) & Interactive Dragger */}
          <div className="space-y-2 px-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#526B66] font-medium flex items-center gap-1.5">
                <span>Forecast Variation</span>
                <span className="text-[10px] text-[#0F2233] bg-white/90 px-2 py-0.5 rounded-full font-bold border border-white">
                  {aiVariation > 0 ? `+${aiVariation}%` : `${aiVariation}%`}
                </span>
              </span>
              <span className="font-display font-bold text-[#0F2233]">
                {aiForecast.solar_lower_kw?.toFixed(2)} kW — {aiForecast.solar_upper_kw?.toFixed(2)} kW
              </span>
            </div>

            {/* Functional Range Dragger Slider */}
            <input
              type="range"
              min="-50"
              max="50"
              step="5"
              value={aiVariation}
              onChange={(e) => setAiVariation(Number(e.target.value))}
              className="w-full accent-[#156B5C] cursor-pointer h-2 bg-white/80 rounded-lg shadow-inner"
              title="Drag to adjust solar variation and test AI response"
            />

            <div className="flex items-center justify-between text-[10px] text-[#526B66]">
              <span>-50% (Clouds)</span>
              <button
                type="button"
                onClick={() => setAiVariation(0)}
                className="hover:text-[#0F2233] font-semibold transition underline"
                title="Reset to 0% baseline"
              >
                Baseline (0%)
              </button>
              <span>+50% (Clear)</span>
            </div>
          </div>

          {/* Recommended Action Box */}
          <div className="p-4 rounded-2xl bg-[#E8F3F1]/80 backdrop-blur-md border border-[#156B5C]/20 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#156B5C]">
                Recommended Action
              </span>
              <span className="font-display text-xs font-bold text-[#0F2233] bg-white px-2.5 py-0.5 rounded-full border border-white shadow-2xs">
                {aiDecision.tariff_badge || '₹4.50 / kWh'}
              </span>
            </div>
            <div className="font-display text-xs sm:text-sm font-bold text-[#0F2233]">
              {aiDecision.action_label}
            </div>
            <p className="text-[11px] text-[#526B66] leading-snug font-medium">
              {aiDecision.reason}
            </p>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleExecuteRecommendation}
              disabled={isAiExecuting}
              className="flex-1 justify-center py-3 rounded-full bg-[#156B5C] hover:bg-[#0F5347] text-white text-xs font-bold shadow-[0_4px_14px_rgba(21,107,92,0.3)] transition active:scale-98 disabled:opacity-50"
            >
              {isAiExecuting ? 'Executing...' : 'Review Decision →'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/ai')}
              className="py-3 px-4 rounded-full bg-white/85 hover:bg-white text-[#0F2233] text-xs font-bold border border-white shadow-xs transition"
            >
              View Details
            </button>
          </div>
        </div>

      </div>

      {/* 🌟 4. EXPANDED TWO-PANEL BOTTOM SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* Left Card: Community ESS Battery Storage */}
        <div className="lg:col-span-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/90 p-6 sm:p-7 shadow-[0_10px_30px_rgba(15,34,51,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-display text-base sm:text-lg font-bold text-[#0F2233]">
                  Central ESS Battery Buffer
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F3F1] text-[#156B5C] border border-[#156B5C]/20">
                  20.0 kWh
                </span>
              </div>
              <p className="text-xs text-[#526B66] mt-0.5">
                Community energy storage balancing diurnal solar surplus and evening peak loads
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-xl font-bold text-[#156B5C]">
                {battery?.soc || 40}%
              </div>
              <div className="text-[10px] text-[#526B66] font-medium">
                {(((battery?.capacity || 20.0) * (battery?.soc || 40)) / 100).toFixed(1)} / 20.0 kWh
              </div>
            </div>
          </div>

          {/* SOC Progress Bar with 20% Emergency Reserve Floor Indicator */}
          <div className="space-y-1.5">
            <div className="relative w-full h-3.5 bg-white/90 rounded-full border border-white overflow-hidden p-0.5 shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#156B5C] to-[#2DD4BF]"
                style={{ width: `${battery?.soc || 40}%` }}
              />
              {/* 20% Emergency Reserve Marker */}
              <div
                className="absolute top-0 bottom-0 left-[20%] w-0.5 bg-[#C2571F] z-10"
                title="20% Emergency Reserve Floor"
              />
            </div>
            <div className="flex items-center justify-between text-[10.5px] text-[#526B66]">
              <span className="text-[#C2571F] font-semibold flex items-center gap-1">
                <span>▲</span> 20% Emergency Floor (4.0 kWh reserve)
              </span>
              <span className="font-semibold text-[#0F2233]">
                {Math.max(0, (((battery?.capacity || 20.0) * ((battery?.soc || 40) - 20)) / 100)).toFixed(1)} kWh usable
              </span>
            </div>
          </div>

          {/* Interactive Quick Buffer Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => handleBufferCharge(2.0)}
              className="py-3 px-3 rounded-full bg-[#156B5C] hover:bg-[#0F5347] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(21,107,92,0.3)] active:scale-98"
            >
              <FaIcon name="solar" className="text-[#D99A1F]" />
              <span>Buffer Solar (+2.0 kWh)</span>
            </button>
            <button
              type="button"
              onClick={() => handleBufferDischarge(1.5)}
              className="py-3 px-3 rounded-full bg-white/85 hover:bg-white text-[#0F2233] border border-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs active:scale-98"
            >
              <FaIcon name="battery" className="text-[#156B5C]" />
              <span>Discharge Backup (-1.5 kWh)</span>
            </button>
          </div>

          {/* Live ESS Telemetry Strip */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[rgba(15,34,51,0.06)] text-center">
            <div>
              <div className="text-[10px] text-[#526B66] font-bold uppercase">Cell Health</div>
              <div className="font-mono text-xs font-bold text-[#0F2233]">98% SOH</div>
            </div>
            <div>
              <div className="text-[10px] text-[#526B66] font-bold uppercase">Operating Temp</div>
              <div className="font-mono text-xs font-bold text-[#0F2233]">27.5°C</div>
            </div>
            <div>
              <div className="text-[10px] text-[#526B66] font-bold uppercase">DC Bus Voltage</div>
              <div className="font-mono text-xs font-bold text-[#0F2233]">400.0 V</div>
            </div>
          </div>
        </div>

        {/* Right Expanded Card: Today's Community Impact */}
        <div className="lg:col-span-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/90 p-6 sm:p-7 shadow-[0_10px_30px_rgba(15,34,51,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#0F2233]">
                Today's Community Impact
              </h3>
              <p className="text-xs text-[#526B66] mt-0.5">
                Real collective impact of clean energy sharing & storage buffering today
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/marketplace')}
              className="text-xs font-bold text-[#0F2233] hover:text-[#156B5C] hover:underline"
            >
              Market Ledger →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center py-2">
            <div className="flex flex-col items-center p-3 rounded-2xl bg-white/85 border border-white shadow-2xs">
              <div className="w-9 h-9 rounded-full bg-[#E8F3F1] text-[#156B5C] flex items-center justify-center text-sm mb-1.5 shadow-xs">
                <FaIcon name="leaf" />
              </div>
              <div className="font-mono text-lg sm:text-xl font-bold text-[#0F2233]">84%</div>
              <div className="text-[11px] text-[#526B66] font-medium leading-tight mt-0.5">Self-Consumption</div>
            </div>

            <div className="flex flex-col items-center p-3 rounded-2xl bg-white/85 border border-white shadow-2xs">
              <div className="w-9 h-9 rounded-full bg-[#E8F3F1] text-[#156B5C] flex items-center justify-center text-sm mb-1.5 shadow-xs">
                <FaIcon name="users" />
              </div>
              <div className="font-mono text-lg sm:text-xl font-bold text-[#156B5C]">2.0 kWh</div>
              <div className="text-[11px] text-[#526B66] font-medium leading-tight mt-0.5">Shared Locally</div>
            </div>

            <div className="flex flex-col items-center p-3 rounded-2xl bg-white/85 border border-white shadow-2xs">
              <div className="w-9 h-9 rounded-full bg-[#FAF4E8] text-[#D99A1F] flex items-center justify-center text-sm mb-1.5 shadow-xs">
                <FaIcon name="rupee" />
              </div>
              <div className="font-mono text-lg sm:text-xl font-bold text-[#0F2233]">₹4.48</div>
              <div className="text-[11px] text-[#526B66] font-medium leading-tight mt-0.5">Est. Savings</div>
            </div>

            <div className="flex flex-col items-center p-3 rounded-2xl bg-white/85 border border-white shadow-2xs">
              <div className="w-9 h-9 rounded-full bg-white text-[#0F2233] flex items-center justify-center text-sm mb-1.5 shadow-xs border border-[rgba(15,34,51,0.06)]">
                <FaIcon name="shield" />
              </div>
              <div className="font-mono text-lg sm:text-xl font-bold text-[#0F2233]">32%</div>
              <div className="text-[11px] text-[#526B66] font-medium leading-tight mt-0.5">Grid Strain Cut</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/90 border border-white flex items-center justify-between text-xs text-[#0F2233] shadow-xs">
            <span className="font-medium">Recent bilateral trade settled at ₹4.50/kWh between Anjali & Prince.</span>
            <button
              type="button"
              onClick={() => navigate('/marketplace')}
              className="font-bold text-[#156B5C] hover:underline whitespace-nowrap ml-2"
            >
              View Order Book →
            </button>
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
