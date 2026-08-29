import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import TradeConfirmationModal from '../components/marketplace/TradeConfirmationModal';
import CreateOfferModal from '../components/marketplace/CreateOfferModal';
import FaIcon from '../components/icons/FaIcon';
import TransactionsView from './TransactionsView';

export default function MarketplaceView() {
  const navigate = useNavigate();
  const { user, profile, household } = useAuth();

  // Active Sub-Tab: 'exchange' | 'ledger'
  const [activeMarketTab, setActiveMarketTab] = useState('exchange');

  // User Greeting & Household Identity
  const userName = profile?.display_name || user?.email?.split('@')[0] || 'Rahul';
  const householdName = household?.name || 'Rahul\'s Home';

  // Live Copilot ML Insights State (solar_v1 + demand_v1 inference)
  const [copilotData, setCopilotData] = useState(null);
  const [copilotLoading, setCopilotLoading] = useState(true);

  // Master Matches State with Authentic Community Identities & Compact Tag Metadata
  const [aiMatches, setAiMatches] = useState([
    {
      id: 'MATCH-001',
      sellerId: 'house_anjali',
      sellerName: "Anjali's Home (Solar Surplus)",
      surplusKwh: 1.5,
      buyerId: 'house_prince',
      buyerName: "Prince's Home (High Load)",
      demandKwh: 1.5,
      pricePerKwh: 4.5,
      gridPrice: 6.1,
      distanceMeters: 45,
      expectedSaving: 2.40,
      tags: ['45 m distance', 'Low branch loss', '26% cheaper than grid', 'Battery safe'],
      status: 'READY_TO_SETTLE',
    },
    {
      id: 'MATCH-002',
      sellerId: 'house_ayush',
      sellerName: "Ayush's Home (Solar Prosumer)",
      surplusKwh: 0.8,
      buyerId: 'house_rahul',
      buyerName: "Rahul's Home (EV Load Spike)",
      demandKwh: 0.8,
      pricePerKwh: 4.6,
      gridPrice: 6.1,
      distanceMeters: 80,
      expectedSaving: 1.20,
      tags: ['80 m distance', 'EV demand window', 'Zero transmission surcharge'],
      status: 'READY_TO_SETTLE',
    },
  ]);

  // Bilateral Settlement Ledger
  const [transactions, setTransactions] = useState([
    { id: 'TXN-001', time: '12:14 PM', sellerName: "Anjali's Home", buyerName: "Prince's Home", energyKwh: 2.0, pricePerKwh: 4.5, totalValue: 9.0, status: 'SETTLED', icon: 'home' },
    { id: 'TXN-002', time: '11:45 AM', sellerName: "Ayush's Home", buyerName: "Rahul's Home", energyKwh: 1.2, pricePerKwh: 4.8, totalValue: 5.76, status: 'SETTLED', icon: 'marketplace' },
    { id: 'TXN-003', time: '11:10 AM', sellerName: "Anjali's Home", buyerName: 'Community ESS Battery', energyKwh: 2.5, pricePerKwh: 4.2, totalValue: 10.50, status: 'STORED', icon: 'battery' },
  ]);

  // Modal States
  const [activePurchase, setActivePurchase] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false);
  const [prefilledOfferKwh, setPrefilledOfferKwh] = useState(2.0);
  const [statusMessage, setStatusMessage] = useState('');

  // Fetch live ML copilot insights (solar_v1 & demand_v1)
  useEffect(() => {
    let isMounted = true;
    const fetchCopilot = async () => {
      try {
        const res = await api.getCopilotInsights({ horizon_minutes: 15 });
        if (isMounted && res?.data?.status === 'SUCCESS') {
          setCopilotData(res.data.data);
        }
      } catch (err) {
        console.warn('Using local fallback ML metrics:', err);
      } finally {
        if (isMounted) setCopilotLoading(false);
      }
    };
    fetchCopilot();
    return () => { isMounted = false; };
  }, []);

  // Extract ML Forecast & Conservative Tradeable Calculations
  const forecast = copilotData?.forecast || {
    solar_kw: 5.84,
    demand_kw: 4.21,
    balance_kw: 1.63,
    lower_solar_kw: 5.31,
    upper_solar_kw: 6.28,
  };
  const riskCheck = copilotData?.risk_check || {
    conservative_surplus_kw: 1.10,
    forecast_range_solar_kw: [5.31, 6.28],
    battery_reserve_protected: true,
    cloud_volatility_risk: 'LOW',
  };
  const decision = copilotData?.decision || {
    action: 'LOCAL_TRADE',
    action_label: 'Trade 1.0 kWh locally (My Home → Eco House)',
    amount_kwh: 1.0,
  };
  const batteryState = copilotData?.summary || {
    community_battery_soc: 40.0,
    current_grid_price: 6.10,
    p2p_market_price: 4.50,
  };

  // Conservative safe tradeable energy (15-min interval = kW * 0.25h)
  const conservativeKw = riskCheck.conservative_surplus_kw ?? Math.max(0, (forecast.lower_solar_kw || 5.31) - (forecast.demand_kw || 4.21));
  const safeTradeableKwh = Math.round(conservativeKw * 0.25 * 100) / 100; // e.g. 1.10 * 0.25 = 0.28 kWh

  // Aggregated Metrics
  const totalAvailableKwh = aiMatches.reduce((sum, m) => sum + m.surplusKwh, 0);
  const totalEnergyTraded = transactions.reduce((sum, t) => sum + (t.energyKwh || 0), 0);
  const totalTradeValue = transactions.reduce((sum, t) => sum + (t.totalValue || 0), 0);
  const avgP2pPrice = batteryState.p2p_market_price || 4.50;
  const gridBenchmarkRate = batteryState.current_grid_price || 6.10;

  // Settle Match Trigger
  const handleOpenSettleMatch = (match) => {
    setActivePurchase({
      buyerId: match.buyerId,
      buyerName: match.buyerName,
      sellerId: match.sellerId,
      sellerName: match.sellerName,
      sellOrder: {
        id: match.id,
        min_price_per_kwh: match.pricePerKwh,
        remaining_kwh: match.surplusKwh,
      },
      quantityKwh: match.surplusKwh,
    });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmTrade = () => {
    if (!activePurchase) return;
    const newTxn = {
      id: `TXN-00${transactions.length + 1}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sellerName: activePurchase.sellerName,
      buyerName: activePurchase.buyerName,
      energyKwh: activePurchase.quantityKwh,
      pricePerKwh: activePurchase.sellOrder.min_price_per_kwh,
      totalValue: activePurchase.quantityKwh * activePurchase.sellOrder.min_price_per_kwh,
      status: 'SETTLED',
      icon: 'home',
    };

    setTransactions((prev) => [newTxn, ...prev]);
    setAiMatches((prev) => prev.filter((m) => m.id !== activePurchase.sellOrder.id));
    setIsConfirmModalOpen(false);
    setStatusMessage(`Successfully executed P2P trade: ${activePurchase.quantityKwh} kWh shared @ ₹${activePurchase.sellOrder.min_price_per_kwh}/kWh.`);
    setTimeout(() => setStatusMessage(''), 4500);
  };

  // Launch AI-prefilled offer modal
  const handleOpenAiOffer = () => {
    setPrefilledOfferKwh(safeTradeableKwh > 0 ? safeTradeableKwh : 1.0);
    setIsCreateOfferOpen(true);
  };

  // Submit New Custom Offer
  const handleCreateOfferSubmit = (offerData) => {
    const newMatch = {
      id: `MATCH-00${aiMatches.length + 3}`,
      sellerId: 'my_home',
      sellerName: `${householdName} (Solar)`,
      surplusKwh: offerData.energyKwh,
      buyerId: 'house_nearby',
      buyerName: 'Nearby Green Valley Neighbor',
      demandKwh: offerData.energyKwh,
      pricePerKwh: offerData.pricePerKwh,
      gridPrice: 6.1,
      distanceMeters: 60,
      expectedSaving: Math.round((6.1 - offerData.pricePerKwh) * offerData.energyKwh * 100) / 100,
      tags: ['60 m distance', 'Direct rooftop solar', 'Battery safe'],
      status: 'READY_TO_SETTLE',
    };

    setAiMatches((prev) => [newMatch, ...prev]);
    setStatusMessage(`Energy listing for ${offerData.energyKwh} kWh @ ₹${offerData.pricePerKwh}/kWh published to community!`);
    setTimeout(() => setStatusMessage(''), 4500);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 select-none animate-fadeIn">

      {/* 🌟 1. COMPACT PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[rgba(23,34,29,0.06)]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#041D0D]">
              P2P Energy Marketplace
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E2F0CC] text-[#012F13] border border-[#BED69E]">
              Avg P2P ₹{avgP2pPrice.toFixed(2)}/kWh
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4A5B4F] mt-0.5">
            Direct peer-to-peer trading connecting solar surplus prosumers with nearby community demand
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Segmented Sub-Tab Switcher */}
          <div className="inline-flex rounded-xl bg-white border border-[#BED69E] p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveMarketTab('exchange')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center ${activeMarketTab === 'exchange'
                ? 'bg-[#012F13] text-white shadow-xs'
                : 'text-[#4A5B4F] hover:text-[#012F13] hover:bg-[#F4F9EB]'
                }`}
            >
              <FaIcon name="marketplace" className="text-xs mr-1.5 text-[#8BC53D]" />
              <span>MarketPlace</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMarketTab('ledger')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center ${activeMarketTab === 'ledger'
                ? 'bg-[#012F13] text-white shadow-xs'
                : 'text-[#4A5B4F] hover:text-[#012F13] hover:bg-[#F4F9EB]'
                }`}
            >
              <FaIcon name="history" className="text-xs mr-1.5" />
              <span>Trade History & Ledger</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setPrefilledOfferKwh(2.0);
              setIsCreateOfferOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#012F13] hover:bg-[#0B3E1D] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <FaIcon name="plus" className="text-[#8BC53D]" />
            <span>Post Energy Listing</span>
          </button>
        </div>
      </div>

      {/* Conditional Sub-Tab Render */}
      {activeMarketTab === 'ledger' ? (
        <div className="pt-2">
          <TransactionsView />
        </div>
      ) : (
        <>
          {/* Dynamic Status Notification */}
          {statusMessage && (
            <div className="flex items-center justify-between rounded-xl border border-[#BED69E] bg-[#E2F0CC] px-4 py-3 text-xs sm:text-sm text-[#012F13] font-bold shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <FaIcon name="check" className="text-[#8BC53D]" />
                <span>{statusMessage}</span>
              </div>
              <button type="button" onClick={() => setStatusMessage('')} className="text-[#012F13] text-xs p-1 font-bold">
                ✕
              </button>
            </div>
          )}

          {/* 🌟 2. QUICK MARKET SUMMARY STRIP */}
          <div className="glass-card rounded-xl p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-center">

            {/* Metric 1: Available Energy */}
            <div>
              <div className="text-[11px] sm:text-xs font-bold text-[#4A5B4F]">
                Available Energy
              </div>
              <div className="font-display text-xl sm:text-3xl font-bold text-[#8BC53D] mt-0.5">
                {totalAvailableKwh.toFixed(1)} kWh
              </div>
              <div className="text-[10px] sm:text-xs text-[#4A5B4F] font-medium mt-0.5 truncate">
                Community surplus
              </div>
            </div>

            {/* Metric 2: Active Matches */}
            <div>
              <div className="text-[11px] sm:text-xs font-bold text-[#4A5B4F]">
                Active Matches
              </div>
              <div className="font-display text-xl sm:text-3xl font-bold text-[#041D0D] mt-0.5">
                {aiMatches.length} Pairs
              </div>
              <div className="text-[10px] sm:text-xs text-[#8BC53D] font-bold flex items-center gap-1 mt-0.5">
                <span>● Ready to settle</span>
              </div>
            </div>

            {/* Metric 3: Average P2P Price */}
            <div>
              <div className="text-[11px] sm:text-xs font-bold text-[#4A5B4F]">
                Average P2P Price
              </div>
              <div className="font-display text-xl sm:text-3xl font-bold text-[#041D0D] mt-0.5">
                ₹{avgP2pPrice.toFixed(2)} / kWh
              </div>
              <div className="text-[10px] sm:text-xs text-[#4A5B4F] font-medium mt-0.5 truncate">
                Balanced tariff
              </div>
            </div>

            {/* Metric 4: Grid Benchmark */}
            <div>
              <div className="text-[11px] sm:text-xs font-bold text-[#4A5B4F]">
                Grid Benchmark
              </div>
              <div className="font-display text-xl sm:text-3xl font-bold text-[#D45C5C] mt-0.5">
                ₹{gridBenchmarkRate.toFixed(2)} / kWh
              </div>
              <div className="text-[10px] sm:text-xs text-[#8BC53D] font-bold mt-0.5 truncate">
                Saves ₹{(gridBenchmarkRate - avgP2pPrice).toFixed(2)} / kWh
              </div>
            </div>

          </div>

          {/* 🌟 3. AI ENERGY OUTLOOK (Compact, 15-Minute ML Intelligence from solar_v1 & demand_v1) */}
          <div className="glass-card rounded-xl p-5 border border-[#BED69E] bg-[#F4F9EB]/60 space-y-4">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2F0CC]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E2F0CC] text-[#012F13] flex items-center justify-center text-sm shadow-xs">
                  <FaIcon name="sparkles" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-display text-base font-bold text-[#011207]">
                      AI Energy Outlook
                    </h3>
                    <span className="text-[10px] font-bold text-[#012F13] bg-[#E2F0CC] px-2 py-0.5 rounded-md border border-[#BED69E]">
                      Next 15 min
                    </span>
                  </div>
                  <p className="text-xs text-[#4A5B4F]">
                    Predictive Random Forest solar & demand models with risk-aware battery constraints
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-[#4A5B4F]">Battery reserve:</span>
                <span className="font-bold text-[#012F13] bg-[#E2F0CC] px-2.5 py-0.5 rounded-md border border-[#BED69E]">
                  {batteryState.community_battery_soc?.toFixed(0) || 40}% (Floor &gt; 20%)
                </span>
              </div>
            </div>

            {/* 4 Compact Forecast Grid Pillars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-lg bg-[#F4F9EB] border border-[#E2F0CC] space-y-0.5">
                <div className="text-[10px] font-bold text-[#4A5B4F] flex items-center justify-center gap-1">
                  <FaIcon name="solar" className="text-[#8BC53D]" />
                  <span>Solar Forecast</span>
                </div>
                <div className="font-display text-lg font-bold text-[#011207]">
                  {forecast.solar_kw?.toFixed(2) || '5.84'} kW
                </div>
                <div className="text-[10px] text-[#4A5B4F]">
                  Range: {riskCheck.forecast_range_solar_kw?.[0]?.toFixed(2) || '5.31'}–{riskCheck.forecast_range_solar_kw?.[1]?.toFixed(2) || '6.28'} kW
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#F4F9EB] border border-[#E2F0CC] space-y-0.5">
                <div className="text-[10px] font-bold text-[#4A5B4F] flex items-center justify-center gap-1">
                  <FaIcon name="home" className="text-[#011207]" />
                  <span>Expected Demand</span>
                </div>
                <div className="font-display text-lg font-bold text-[#011207]">
                  {forecast.demand_kw?.toFixed(2) || '4.21'} kW
                </div>
                <div className="text-[10px] text-[#4A5B4F]">
                  Household load trend
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#F4F9EB] border border-[#E2F0CC] space-y-0.5">
                <div className="text-[10px] font-bold text-[#4A5B4F] flex items-center justify-center gap-1">
                  <FaIcon name="network" className="text-[#8BC53D]" />
                  <span>Expected Surplus</span>
                </div>
                <div className="font-display text-lg font-bold text-[#8BC53D]">
                  +{forecast.balance_kw?.toFixed(2) || '1.63'} kW
                </div>
                <div className="text-[10px] text-[#4A5B4F]">
                  Conservative: +{conservativeKw.toFixed(2)} kW
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white border border-[#BED69E] space-y-0.5 shadow-xs">
                <div className="text-[10px] font-bold text-[#012F13] flex items-center justify-center gap-1">
                  <FaIcon name="sparkles" className="text-[#8BC53D]" />
                  <span>Safe 15-min Headroom</span>
                </div>
                <div className="font-display text-lg font-bold text-[#012F13]">
                  {safeTradeableKwh.toFixed(2)} kWh
                </div>
                <div className="text-[10px] text-[#8BC53D] font-semibold">
                  Zero deficit risk
                </div>
              </div>
            </div>

            {/* Action Suggestion Bar */}
            <div className="p-3 rounded-lg bg-white border border-[#BED69E] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-[#011207]">
                <span>
                  <strong>AI Recommendation:</strong> Your solar surplus permits a safe trade of <strong>{safeTradeableKwh.toFixed(2)} kWh</strong> with nearby homes @ ₹{avgP2pPrice.toFixed(2)}/kWh without impacting storage.
                </span>
              </div>

              <button
                type="button"
                onClick={handleOpenAiOffer}
                className="px-4 py-1.5 rounded-lg bg-[#7358C7] hover:bg-[#5E44B2] text-white text-xs font-bold shadow-xs transition whitespace-nowrap active:scale-98"
              >
                Review AI Listing →
              </button>
            </div>

          </div>

          {/* 🌟 4. LIVE ENERGY MATCHES / MARKET LISTINGS (De-Densified Clean Cards) */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#17221D]">
                  Live Energy Matches
                </h2>
                <p className="text-xs text-[#5E6963] mt-0.5">
                  Nearby surplus and demand matched by GridShare algorithms
                </p>
              </div>

              <span className="text-xs font-bold text-[#1E9B68] bg-[#E8F6EE] px-3 py-1 rounded-lg border border-[#1E9B68]/20">
                {aiMatches.length} Matches Available
              </span>
            </div>

            {aiMatches.length === 0 ? (
              /* Empty State */
              <div className="glass-card rounded-xl p-10 text-center space-y-3 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-xl bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center mx-auto text-lg shadow-xs">
                  <FaIcon name="check" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#17221D]">No Active Matches</h3>
                <p className="text-xs text-[#5E6963] leading-relaxed">
                  Your community currently has zero open seller surplus. All local energy has been settled or balanced with storage.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateOfferOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#12392B] text-white text-xs font-bold shadow-xs hover:bg-[#174A37] transition flex items-center space-x-1.5 mx-auto"
                >
                  <FaIcon name="plus" className="text-[#43CB8C]" />
                  <span>Post an Energy Listing</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {aiMatches.map((match) => (
                  <div
                    key={match.id}
                    className="glass-card rounded-xl p-5 sm:p-6 flex flex-col justify-between space-y-4 transition-shadow hover:shadow-md"
                  >
                    {/* Top Match Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-[rgba(23,34,29,0.06)]">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#E8F6EE] text-[#1E9B68] text-[11px] font-bold flex items-center gap-1">
                          <FaIcon name="network" className="text-[10px]" />
                          <span>{match.distanceMeters} m away</span>
                        </span>
                        <span className="text-xs text-[#5E6963] font-medium">
                          Bilateral Pair
                        </span>
                      </div>

                      <span className="font-display text-xs font-bold text-[#1E9B68]">
                        Saves ₹{match.expectedSaving.toFixed(2)} vs Grid
                      </span>
                    </div>

                    {/* Seller ➔ P2P Rate ➔ Buyer Visual Exchange */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-center sm:text-left">
                      {/* Seller */}
                      <div className="p-3 rounded-lg bg-[#FFF7E4]/70 border border-[#DDA12A]/20 space-y-0.5">
                        <div className="text-[10px] font-bold text-[#DDA12A]">Seller (Surplus)</div>
                        <div className="text-xs font-bold text-[#17221D] truncate">{match.sellerName}</div>
                        <div className="font-display text-sm font-bold text-[#DDA12A]">+{match.surplusKwh} kWh</div>
                      </div>

                      {/* Arrow & Tariff */}
                      <div className="text-center space-y-0.5">
                        <div className="w-7 h-7 rounded-full bg-[#12392B] text-white flex items-center justify-center mx-auto text-xs shadow-xs">
                          →
                        </div>
                        <div className="font-display text-xs font-bold text-[#1E9B68]">
                          ₹{match.pricePerKwh.toFixed(2)} / kWh
                        </div>
                      </div>

                      {/* Buyer */}
                      <div className="p-3 rounded-lg bg-[#EDF3FD]/70 border border-[#3C78CC]/20 space-y-0.5">
                        <div className="text-[10px] font-bold text-[#3C78CC]">Buyer (Demand)</div>
                        <div className="text-xs font-bold text-[#17221D] truncate">{match.buyerName}</div>
                        <div className="font-display text-sm font-bold text-[#3C78CC]">-{match.demandKwh} kWh</div>
                      </div>
                    </div>

                    {/* Clean, Compact Metadata Tags (No text walls!) */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-[#5E6963]">
                      {match.tags.map((tag, idx) => (
                        <span key={idx} className="px-2.5 py-0.5 rounded-md bg-[#F8F9F6] border border-[rgba(23,34,29,0.06)] font-medium">
                          ✓ {tag}
                        </span>
                      ))}
                    </div>

                    {/* Bottom Action Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-[rgba(23,34,29,0.06)]">
                      <span className="text-xs text-[#5E6963]">
                        Grid comparison: <del className="text-[#D45C5C] font-mono">₹{match.gridPrice.toFixed(2)}/kWh</del>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenSettleMatch(match)}
                        className="px-4 py-2 rounded-xl bg-[#1E9B68] hover:bg-[#168557] text-white text-xs font-bold shadow-xs transition active:scale-98 flex items-center space-x-1.5"
                      >
                        <span>Review & Settle Match →</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 🌟 5. PRICE EXPLANATION & COMPARISON CARD */}
          <div className="glass-card rounded-xl p-5 sm:p-6 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-[#17221D]">
                  Local P2P Price Transparency
                </h3>
                <p className="text-xs text-[#5E6963] mt-0.5">
                  Continuous double-auction clearing rate compared with standard utility baseline
                </p>
              </div>
              <span className="text-xs font-bold text-[#1E9B68] bg-[#E8F6EE] px-3 py-1 rounded-lg">
                26% Average Community Savings
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 text-center">
              <div className="p-3.5 rounded-xl bg-[#F8F9F6] border border-[rgba(23,34,29,0.06)] space-y-0.5">
                <div className="text-xs font-bold text-[#5E6963]">Local P2P Rate</div>
                <div className="font-display text-xl font-bold text-[#1E9B68]">₹{avgP2pPrice.toFixed(2)} / kWh</div>
                <div className="text-[10px] text-[#5E6963]">Agreed clearing tariff</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F9F6] border border-[rgba(23,34,29,0.06)] space-y-0.5">
                <div className="text-xs font-bold text-[#5E6963]">Grid Utility Rate</div>
                <div className="font-display text-xl font-bold text-[#D45C5C]">₹{gridBenchmarkRate.toFixed(2)} / kWh</div>
                <div className="text-[10px] text-[#5E6963]">Retail DISCOM tariff</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F9F6] border border-[rgba(23,34,29,0.06)] space-y-0.5">
                <div className="text-xs font-bold text-[#5E6963]">Buyer Savings</div>
                <div className="font-display text-xl font-bold text-[#1E9B68]">₹{(gridBenchmarkRate - avgP2pPrice).toFixed(2)} / kWh</div>
                <div className="text-[10px] text-[#5E6963]">Direct utility bill reduction</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F9F6] border border-[rgba(23,34,29,0.06)] space-y-0.5">
                <div className="text-xs font-bold text-[#5E6963]">Seller Extra Gain</div>
                <div className="font-display text-xl font-bold text-[#1E9B68]">+₹{(avgP2pPrice - 3.50).toFixed(2)} / kWh</div>
                <div className="text-[10px] text-[#5E6963]">vs ₹3.50 grid feed-in rate</div>
              </div>
            </div>
          </div>

          {/* 🌟 6. EXPANDED TWO-PANEL SECTION: COMMUNITY IMPACT & RECENT TRADES */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

            {/* Left Card: Community Marketplace Impact */}
            <div className="lg:col-span-6 glass-card rounded-xl p-5 sm:p-6 flex flex-col justify-between space-y-3.5">
              <div>
                <h3 className="font-display text-base font-bold text-[#17221D]">
                  Community Marketplace Impact
                </h3>
                <p className="text-xs text-[#5E6963] mt-0.5">
                  Measurable ecological and economic gains from P2P energy trades
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center py-1">
                <div className="flex flex-col items-center p-2 rounded-xl bg-[#F8F9F6]">
                  <div className="w-8 h-8 rounded-lg bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-xs mb-1">
                    <FaIcon name="leaf" />
                  </div>
                  <div className="font-display text-lg font-bold text-[#1E9B68]">
                    {totalEnergyTraded.toFixed(1)} kWh
                  </div>
                  <div className="text-[10px] text-[#5E6963] font-medium leading-tight">Local Energy Used</div>
                </div>

                <div className="flex flex-col items-center p-2 rounded-xl bg-[#F8F9F6]">
                  <div className="w-8 h-8 rounded-lg bg-[#EDF3FD] text-[#3C78CC] flex items-center justify-center text-xs mb-1">
                    <FaIcon name="grid" />
                  </div>
                  <div className="font-display text-lg font-bold text-[#17221D]">
                    {(totalEnergyTraded * 1.15).toFixed(1)} kWh
                  </div>
                  <div className="text-[10px] text-[#5E6963] font-medium leading-tight">Grid Avoided</div>
                </div>

                <div className="flex flex-col items-center p-2 rounded-xl bg-[#F8F9F6]">
                  <div className="w-8 h-8 rounded-lg bg-[#FFF7E4] text-[#E5A72D] flex items-center justify-center text-xs mb-1">
                    <FaIcon name="rupee" />
                  </div>
                  <div className="font-display text-lg font-bold text-[#17221D]">
                    ₹{(totalEnergyTraded * 1.60).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-[#5E6963] font-medium leading-tight">Total Savings</div>
                </div>

                <div className="flex flex-col items-center p-2 rounded-xl bg-[#F8F9F6]">
                  <div className="w-8 h-8 rounded-lg bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-xs mb-1">
                    <FaIcon name="shield" />
                  </div>
                  <div className="font-display text-lg font-bold text-[#17221D]">
                    {(totalEnergyTraded * 0.82).toFixed(1)} kg
                  </div>
                  <div className="text-[10px] text-[#5E6963] font-medium leading-tight">CO₂ Avoided</div>
                </div>
              </div>
            </div>

            {/* Right Card: Recent Local Trades */}
            <div className="lg:col-span-6 glass-card rounded-xl p-5 sm:p-6 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-[#17221D]">
                    Recent Local Trades
                  </h3>
                  <p className="text-xs text-[#5E6963] mt-0.5">
                    Executed bilateral energy exchange receipts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/transactions')}
                  className="text-xs font-bold text-[#1E9B68] hover:underline"
                >
                  View full ledger →
                </button>
              </div>

              <div className="space-y-2">
                {transactions.slice(0, 4).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F9F6] text-xs hover:bg-[#EEF2ED] transition"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-xs">
                        {/* <FaIcon name={tx.icon || 'marketplace'} /> */}
                      </div>
                      <div>
                        <div className="font-bold text-[#17221D] leading-tight">
                          {tx.sellerName} → {tx.buyerName}
                        </div>
                        <div className="text-[10px] text-[#89938D]">{tx.time} • P2P Cleared</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-right">
                      <div className="font-display text-xs sm:text-sm font-bold text-[#17221D]">
                        {tx.energyKwh.toFixed(1)} kWh
                      </div>
                      <div className="text-[11px] font-mono text-[#5E6963]">
                        ₹{tx.pricePerKwh.toFixed(2)}/kWh
                      </div>
                      <span className="text-[10px] font-bold text-[#1E9B68] bg-[#E8F6EE] px-2 py-0.5 rounded-md">
                        ₹{tx.totalValue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 🌟 7. "HOW GRIDSHARE MARKETPLACE WORKS" (Bottom/Last as Requested) */}
          <div className="space-y-3.5 pt-2 border-t border-[rgba(23,34,29,0.06)]">
            <div className="text-center space-y-0.5">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#17221D]">
                How GridShare Marketplace Works
              </h2>
              <p className="text-xs text-[#5E6963]">
                Your surplus energy finds a nearby home that needs it.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div className="glass-card rounded-xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl font-bold text-[#1E9B68]">01</span>
                  <div className="w-7 h-7 rounded-lg bg-[#FFF7E4] text-[#E5A72D] flex items-center justify-center text-xs">
                    <FaIcon name="solar" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-[#17221D]">
                  Generate
                </h3>
                <p className="text-xs text-[#5E6963] leading-relaxed">
                  A household produces more clean rooftop solar energy than it currently consumes.
                </p>
              </div>

              {/* Step 2 */}
              <div className="glass-card rounded-xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl font-bold text-[#7358C7]">02</span>
                  <div className="w-7 h-7 rounded-lg bg-[#F1EDFF] text-[#7358C7] flex items-center justify-center text-xs">
                    <FaIcon name="network" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-[#17221D]">
                  Match
                </h3>
                <p className="text-xs text-[#5E6963] leading-relaxed">
                  GridShare finds nearby electrical demand and computes a fair local P2P price below utility rates.
                </p>
              </div>

              {/* Step 3 */}
              <div className="glass-card rounded-xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl font-bold text-[#1E9B68]">03</span>
                  <div className="w-7 h-7 rounded-lg bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-xs">
                    <FaIcon name="check" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-[#17221D]">
                  Settle
                </h3>
                <p className="text-xs text-[#5E6963] leading-relaxed">
                  Energy is routed locally and the transaction is recorded in the verifiable community ledger.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 🌟 8. MODALS */}
      {isConfirmModalOpen && (
        <TradeConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onCancel={() => setIsConfirmModalOpen(false)}
          purchase={activePurchase}
          onConfirm={handleConfirmTrade}
        />
      )}

      {isCreateOfferOpen && (
        <CreateOfferModal
          isOpen={isCreateOfferOpen}
          onClose={() => setIsCreateOfferOpen(false)}
          onSubmitOffer={handleCreateOfferSubmit}
          userSurplusKwh={prefilledOfferKwh}
          initialPrice={avgP2pPrice}
          householdName={householdName}
          isAiRecommended={prefilledOfferKwh === safeTradeableKwh}
        />
      )}

    </div>
  );
}
