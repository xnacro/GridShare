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
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 select-none animate-fadeIn">

      {/* 🌟 1. VELUNO-STYLE UNIFIED HERO (Soft Sage Mint #E2F0CC) */}
      <div
        className="rounded-2xl relative overflow-hidden border border-[#BED69E] shadow-sm bg-gradient-to-br from-[#E2F0CC] via-[#E8F4D6] to-[#DCEDC4]"
        style={{ minHeight: 'calc(100vh - 100px)' }}
      >
        <div className="relative z-10 flex flex-col lg:flex-row items-stretch" style={{ minHeight: 'calc(100vh - 100px)' }}>

          {/* ─── LEFT SIDE: Content & CTAs ─── */}
          <div className="flex-1 lg:max-w-[50%] p-5 sm:p-8 lg:p-14 lg:pl-16 flex flex-col justify-center pt-8 sm:pt-14 lg:pt-16 space-y-5 sm:space-y-6">

            {/* Dynamic Headline — Outfit Typography */}
            <h1 className="font-display text-2xl sm:text-4xl lg:text-[46px] font-bold text-[#041D0D] leading-[1.18] tracking-tight">
              {netCommunity >= 0 ? (
                <>
                  Your community has{' '}
                  <span className="text-[#8BC53D] whitespace-nowrap">
                    +{netCommunity.toFixed(1)} kW
                  </span>{' '}
                  right now.
                </>
              ) : (
                <>
                  Your community needs{' '}
                  <span className="text-[#012F13] whitespace-nowrap">
                    {Math.abs(netCommunity).toFixed(1)} kW
                  </span>{' '}
                  right now.
                </>
              )}
            </h1>

            {/* Supporting Description */}
            <p className="text-xs sm:text-base text-[#4A5B4F] leading-relaxed max-w-md">
              GridShare tracks generation and demand across {computedHouseholds.length} households, then decides in real time whether to store the surplus, trade it locally, or export it to the grid.
            </p>

            {/* CTA Row — Veluno Style */}
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/network')}
                className="px-5 sm:px-6 py-2.5 rounded-full bg-[#012F13] hover:bg-[#0B3E1D] text-white text-xs sm:text-sm font-bold shadow-xs transition flex items-center space-x-2 active:scale-[0.98]"
              >
                <span>View live map</span>
                <span className="text-base leading-none">↗</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/ai')}
                className="text-xs sm:text-sm font-bold text-[#011207] hover:text-[#8BC53D] transition px-2 py-2"
              >
                See recommendations
              </button>
            </div>
          </div>

          {/* ─── RIGHT SIDE: Hand-Drawn Illustration & Lower Rotating Badge ─── */}
          <div className="flex-1 lg:max-w-[50%] relative flex items-center justify-center p-2 sm:p-4 lg:p-0 pt-4 sm:pt-12 lg:pt-14">

            {/* The SVG Illustration */}
            <MicrogridSketchIllustration className="w-full h-auto max-h-[400px] lg:max-h-[440px] object-contain" />

            {/* Spinning Circular Badge */}
            <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-8 lg:bottom-16 lg:left-2 w-[90px] h-[90px] sm:w-[100px] sm:h-[100px] z-20">
              <svg viewBox="0 0 100 100" className="w-full h-full animate-[spin_12s_linear_infinite]">
                <defs>
                  <path id="circlePath" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
                </defs>
                <text fontSize="8.5" fontWeight="700" fill="#011207" letterSpacing="3">
                  <textPath href="#circlePath">
                    SIMULATED DEMO • LIVE BATTERY •
                  </textPath>
                </text>
              </svg>
              {/* Center Arrow Button */}
              <button
                type="button"
                onClick={() => navigate('/marketplace')}
                className="absolute inset-0 m-auto w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#012F13] hover:bg-[#0B3E1D] text-white flex items-center justify-center shadow-md transition active:scale-95"
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
          <div className="text-xs font-bold text-[#4A5B4F]">
            Net Community Balance
          </div>
          <div className={`font-changa text-2xl sm:text-3xl font-normal mt-0.5 ${netCommunity >= 0 ? 'text-[#8BC53D]' : 'text-[#012F13]'}`}>
            {netCommunity >= 0 ? `+${netCommunity.toFixed(1)}` : `${netCommunity.toFixed(1)}`} kW
          </div>
          <div className="text-xs text-[#4A5B4F] font-medium mt-0.5">
            {netCommunity >= 0 ? 'Clean surplus' : 'Net community load'}
          </div>
        </div>

        {/* Col 2: Total Generation */}
        <div>
          <div className="text-xs font-bold text-[#4A5B4F]">
            Total Generation
          </div>
          <div className="font-changa text-2xl sm:text-3xl font-normal text-[#011207] mt-0.5">
            {totalGen.toFixed(1)} kW
          </div>
          <div className="text-xs text-[#8BC53D] font-bold flex items-center gap-1 mt-0.5">
            <span>↑ 12%</span>
            <span className="text-[#4A5B4F] font-normal">vs yesterday</span>
          </div>
        </div>

        {/* Col 3: Total Demand */}
        <div>
          <div className="text-xs font-bold text-[#4A5B4F]">
            Total Demand
          </div>
          <div className="font-changa text-2xl sm:text-3xl font-normal text-[#011207] mt-0.5">
            {totalCon.toFixed(1)} kW
          </div>
          <div className="text-xs text-[#8BC53D] font-bold flex items-center gap-1 mt-0.5">
            <span>↑ 8%</span>
            <span className="text-[#4A5B4F] font-normal">vs yesterday</span>
          </div>
        </div>

        {/* Col 4: Battery State */}
        <div>
          <div className="text-xs font-bold text-[#4A5B4F]">
            Battery State
          </div>
          <div className="font-changa text-2xl sm:text-3xl font-normal text-[#8BC53D] mt-0.5">
            {battery?.soc ? battery.soc.toFixed(0) : '40'}%
          </div>
          <div className="text-xs text-[#4A5B4F] font-medium mt-0.5">
            8.0 / 20 kWh usable
          </div>
        </div>

        {/* Col 5: Mini Sparkline & View Link */}
        <div className="flex flex-col justify-between items-end space-y-2">
          <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 24" fill="none">
            <path
              d="M0 16 Q 15 8, 30 14 T 60 8 T 85 15 T 100 6"
              stroke="#8BC53D"
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
                <stop offset="0%" stopColor="#8BC53D" />
                <stop offset="100%" stopColor="#8BC53D" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          <button
            type="button"
            onClick={() => navigate('/network')}
            className="text-xs font-bold text-[#012F13] hover:text-[#8BC53D] hover:underline flex items-center gap-1"
          >
            <span>View Energy Flow</span>
            <span>→</span>
          </button>
        </div>

      </div>

      {/* Dynamic Action Notification Banner */}
      {aiExecutionMessage && (
        <div className="flex items-center justify-between rounded-xl border border-[#BED69E] bg-[#E2F0CC] px-4 py-3 text-xs sm:text-sm text-[#012F13] font-bold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <FaIcon name="check" className="text-[#8BC53D]" />
            <span>{aiExecutionMessage}</span>
          </div>
          <button type="button" onClick={() => setAiExecutionMessage('')} className="text-[#012F13] text-xs p-1 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* 🌟 3. BALANCED 50/50 CORE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* Left Panel (6 cols): Community Microgrid Overview & Live Power Flow */}
        <div className="lg:col-span-6 glass-card rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-changa text-base font-normal text-[#011207]">
                Community Microgrid Overview
              </h3>
              <button
                type="button"
                onClick={() => navigate('/network')}
                className="text-xs font-bold text-[#012F13] hover:text-[#8BC53D] hover:underline flex items-center gap-1"
              >
                <span>Explore Live Map</span>
                <span>↗</span>
              </button>
            </div>
            <p className="text-xs text-[#4A5B4F] mt-1">
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
                  className="p-3.5 rounded-xl bg-[#F4F9EB]/90 border border-[#E2F0CC] hover:bg-[#E2F0CC]/50 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-white border border-[#BED69E] flex items-center justify-center text-[10px] font-bold text-[#012F13]">
                        {h.name.charAt(0)}
                      </div>
                      <span className="font-changa text-xs sm:text-sm font-normal text-[#011207]">
                        {h.name}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        hasSurplus
                          ? 'bg-[#E2F0CC] text-[#012F13] border border-[#BED69E]'
                          : 'bg-[#F4F9EB] text-[#4A5B4F] border border-[#D5E6BE]'
                      }`}
                    >
                      {hasSurplus ? `+${netKw.toFixed(1)} kW Surplus` : `${netKw.toFixed(1)} kW Deficit`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[rgba(23,34,29,0.04)]">
                    <div>
                      <div className="text-[10px] text-[#4A5B4F]">Solar Gen</div>
                      <div className="font-changa text-xs font-normal text-[#8BC53D]">
                        {h.generation.toFixed(1)} kW
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#4A5B4F]">Demand</div>
                      <div className="font-changa text-xs font-normal text-[#011207]">
                        {h.consumption.toFixed(1)} kW
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Bilateral Sharing Conduit Banner */}
          <div className="p-3 rounded-xl bg-[#E2F0CC]/80 border border-[#BED69E] flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <FaIcon name="network" className="text-[#8BC53D]" />
              <span className="text-[#011207] font-medium">
                P2P Trade Conduit: <strong>Anjali → Prince</strong> active @ ₹4.50/kWh
              </span>
            </div>
            <span className="font-changa font-normal text-[#012F13] bg-white px-2 py-0.5 rounded-lg border border-[#BED69E] text-[11px]">
              -26% vs Grid Tariff
            </span>
          </div>
        </div>

        {/* Right Panel (6 cols): Hornet AI — Next 15 Minutes */}
        <div className="lg:col-span-6 glass-card rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-changa text-base font-normal text-[#011207]">
                Hornet AI — Next 15 Minutes
              </h3>

              <span className="font-changa text-xs font-normal text-[#012F13] bg-[#E2F0CC] px-2.5 py-0.5 rounded-xl border border-[#BED69E]">
                Next 15 min
              </span>
            </div>
            <p className="text-xs text-[#4A5B4F] mt-1">
              Predictive ML forecast, uncertainty corridor & optimal dispatch action
            </p>
          </div>

          {/* 3 Mini Forecast Boxes (12px radius) */}
          <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-[#F4F9EB]/80 border border-[#E2F0CC]">
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-[#4A5B4F]">
                <FaIcon name="solar" className="text-[#8BC53D]" />
                <span>Solar</span>
              </div>
              <div className="font-changa text-sm sm:text-base font-normal text-[#011207]">
                {aiForecast.solar_kw?.toFixed(2) || '5.84'} kW
              </div>
            </div>

            <div className="space-y-0.5 border-x border-[#BED69E]">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-[#4A5B4F]">
                <FaIcon name="home" className="text-[#011207]" />
                <span>Demand</span>
              </div>
              <div className="font-changa text-sm sm:text-base font-normal text-[#011207]">
                {aiForecast.demand_kw?.toFixed(2) || '4.21'} kW
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-[#4A5B4F]">
                <FaIcon name="network" className="text-[#8BC53D]" />
                <span>Balance</span>
              </div>
              <div className="font-changa text-sm sm:text-base font-normal text-[#8BC53D]">
                +{aiForecast.balance_kw?.toFixed(2) || '1.63'} kW
              </div>
            </div>
          </div>

          {/* Forecast Range (Uncertainty) & Interactive Dragger */}
          <div className="space-y-1.5 px-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#4A5B4F] font-medium flex items-center gap-1.5">
                <span>Forecast Variation</span>
                <span className="text-[10px] text-[#012F13] bg-[#E2F0CC] px-1.5 py-0.5 rounded-md font-bold">
                  {aiVariation > 0 ? `+${aiVariation}%` : `${aiVariation}%`}
                </span>
              </span>
              <span className="font-changa font-normal text-[#012F13]">
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
              className="w-full accent-[#012F13] cursor-pointer h-2 bg-[#E2F0CC] rounded-lg"
              title="Drag to adjust solar variation and test AI response"
            />

            <div className="flex items-center justify-between text-[10px] text-[#7A8C7F]">
              <span>-50% (Clouds)</span>
              <button
                type="button"
                onClick={() => setAiVariation(0)}
                className="hover:text-[#012F13] font-semibold transition"
                title="Reset to 0% baseline"
              >
                Baseline (0%)
              </button>
              <span>+50% (Clear)</span>
            </div>
          </div>

          {/* Recommended Action Box (12px radius) */}
          <div className="p-3.5 rounded-xl bg-[#E2F0CC]/70 border border-[#BED69E] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#012F13]">
                Recommended Action
              </span>
              <span className="font-changa text-xs font-normal text-[#012F13] bg-white px-2 py-0.5 rounded-lg border border-[#BED69E]">
                {aiDecision.tariff_badge || '₹4.50 / kWh'}
              </span>
            </div>
            <div className="font-changa text-xs sm:text-sm font-normal text-[#011207]">
              {aiDecision.action_label}
            </div>
            <p className="text-[11px] text-[#4A5B4F] leading-snug">
              {aiDecision.reason}
            </p>
          </div>

          {/* CTAs (12px radius) */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleExecuteRecommendation}
              disabled={isAiExecuting}
              className="flex-1 justify-center py-2.5 rounded-xl bg-[#012F13] hover:bg-[#0B3E1D] text-white text-xs font-bold shadow-xs transition active:scale-98 disabled:opacity-50"
            >
              {isAiExecuting ? 'Executing...' : 'Review Decision →'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/ai')}
              className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-[#F4F9EB] text-[#011207] text-xs font-bold border border-[#BED69E] transition"
            >
              View Details
            </button>
          </div>
        </div>

      </div>

      {/* 🌟 4. EXPANDED TWO-PANEL BOTTOM SECTION: ESS BATTERY HUB & COMMUNITY IMPACT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* Left Card: Community ESS Battery Storage & Buffer Control */}
        <div className="lg:col-span-6 glass-card rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-display text-base font-bold text-[#041D0D]">
                  Central ESS Battery Buffer
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E2F0CC] text-[#012F13] border border-[#BED69E]">
                  20.0 kWh Capacity
                </span>
              </div>
              <p className="text-xs text-[#4A5B4F] mt-0.5">
                Community energy storage balancing diurnal solar surplus and evening peak loads
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-xl font-bold text-[#8BC53D]">
                {battery?.soc || 40}%
              </div>
              <div className="text-[10px] text-[#4A5B4F] font-medium">
                {(((battery?.capacity || 20.0) * (battery?.soc || 40)) / 100).toFixed(1)} / 20.0 kWh
              </div>
            </div>
          </div>

          {/* SOC Progress Bar with 20% Emergency Reserve Floor Indicator */}
          <div className="space-y-1.5">
            <div className="relative w-full h-3.5 bg-[#F4F9EB] rounded-full border border-[#BED69E] overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#8BC53D] to-[#75AA2F]"
                style={{ width: `${battery?.soc || 40}%` }}
              />
              {/* 20% Emergency Reserve Marker */}
              <div
                className="absolute top-0 bottom-0 left-[20%] w-0.5 bg-[#D45C5C]/80 z-10"
                title="20% Emergency Reserve Floor"
              />
            </div>
            <div className="flex items-center justify-between text-[10.5px] text-[#4A5B4F]">
              <span className="text-[#D45C5C] font-semibold flex items-center gap-1">
                <span>▲</span> 20% Emergency Floor (4.0 kWh reserve)
              </span>
              <span className="font-semibold text-[#012F13]">
                {Math.max(0, (((battery?.capacity || 20.0) * ((battery?.soc || 40) - 20)) / 100)).toFixed(1)} kWh usable
              </span>
            </div>
          </div>

          {/* Interactive Quick Buffer Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => handleBufferCharge(2.0)}
              className="py-2.5 px-3 rounded-xl bg-[#012F13] hover:bg-[#0B3E1D] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs active:scale-98"
            >
              <FaIcon name="solar" className="text-[#8BC53D]" />
              <span>Buffer Solar (+2.0 kWh)</span>
            </button>
            <button
              type="button"
              onClick={() => handleBufferDischarge(1.5)}
              className="py-2.5 px-3 rounded-xl bg-white hover:bg-[#F4F9EB] text-[#011207] border border-[#BED69E] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs active:scale-98"
            >
              <FaIcon name="battery" className="text-[#012F13]" />
              <span>Discharge Backup (-1.5 kWh)</span>
            </button>
          </div>

          {/* Live ESS Telemetry Strip */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#E2F0CC] text-center">
            <div>
              <div className="text-[10px] text-[#7A8C7F] font-bold uppercase">Cell Health</div>
              <div className="font-mono text-xs font-bold text-[#012F13]">98% SOH</div>
            </div>
            <div>
              <div className="text-[10px] text-[#7A8C7F] font-bold uppercase">Operating Temp</div>
              <div className="font-mono text-xs font-bold text-[#012F13]">27.5°C</div>
            </div>
            <div>
              <div className="text-[10px] text-[#7A8C7F] font-bold uppercase">DC Bus Voltage</div>
              <div className="font-mono text-xs font-bold text-[#012F13]">400.0 V</div>
            </div>
          </div>
        </div>

        {/* Right Expanded Card: Today's Community Impact */}
        <div className="lg:col-span-6 glass-card rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-[#041D0D]">
                Today's Community Impact
              </h3>
              <p className="text-xs text-[#4A5B4F] mt-0.5">
                Real collective impact of clean energy sharing & storage buffering today
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/marketplace')}
              className="text-xs font-bold text-[#012F13] hover:text-[#8BC53D] hover:underline"
            >
              Market Ledger →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center py-2">
            <div className="flex flex-col items-center p-2 rounded-xl bg-[#F4F9EB]/90 border border-[#E2F0CC]">
              <div className="w-9 h-9 rounded-xl bg-[#E2F0CC] text-[#012F13] flex items-center justify-center text-sm mb-1.5">
                <FaIcon name="leaf" />
              </div>
              <div className="font-mono text-lg sm:text-xl font-bold text-[#011207]">84%</div>
              <div className="text-[11px] text-[#4A5B4F] font-medium leading-tight mt-0.5">Renewable Self-Consumption</div>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-[#F4F9EB]/90 border border-[#E2F0CC]">
              <div className="w-9 h-9 rounded-xl bg-[#E2F0CC] text-[#012F13] flex items-center justify-center text-sm mb-1.5">
                <FaIcon name="users" />
              </div>
              <div className="font-mono text-lg sm:text-xl font-bold text-[#8BC53D]">2.0 kWh</div>
              <div className="text-[11px] text-[#4A5B4F] font-medium leading-tight mt-0.5">Shared Locally</div>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-[#F4F9EB]/90 border border-[#E2F0CC]">
              <div className="w-9 h-9 rounded-xl bg-[#E2F0CC] text-[#012F13] flex items-center justify-center text-sm mb-1.5">
                <FaIcon name="rupee" />
              </div>
              <div className="font-mono text-lg sm:text-xl font-bold text-[#011207]">₹4.48</div>
              <div className="text-[11px] text-[#4A5B4F] font-medium leading-tight mt-0.5">Estimated Savings</div>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-[#F4F9EB]/90 border border-[#E2F0CC]">
              <div className="w-9 h-9 rounded-xl bg-[#E2F0CC] text-[#012F13] flex items-center justify-center text-sm mb-1.5">
                <FaIcon name="shield" />
              </div>
              <div className="font-mono text-lg sm:text-xl font-bold text-[#011207]">32%</div>
              <div className="text-[11px] text-[#4A5B4F] font-medium leading-tight mt-0.5">Peak Grid Strain Reduction</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F4F9EB] border border-[#E2F0CC] flex items-center justify-between text-xs text-[#012F13]">
            <span className="font-medium">Recent bilateral trade settled at ₹4.50/kWh between Anjali & Prince.</span>
            <button
              type="button"
              onClick={() => navigate('/marketplace')}
              className="font-bold text-[#8BC53D] hover:underline whitespace-nowrap ml-2"
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
