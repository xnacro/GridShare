import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import TradeConfirmationModal from '../components/marketplace/TradeConfirmationModal';
import CreateOfferModal from '../components/marketplace/CreateOfferModal';
import FaIcon from '../components/icons/FaIcon';

export default function MarketplaceView() {
  const navigate = useNavigate();
  const { user, profile, household } = useAuth();

  // User Greeting & Household Identity
  const userName = profile?.display_name || user?.email?.split('@')[0] || 'Rahul';
  const householdName = household?.name || 'Rahul\'s Home';

  // Scope: 'COMMUNITY' or 'MY_ENERGY'
  const [viewScope, setViewScope] = useState('COMMUNITY');

  // Master Matches State with Humanized Identities
  const [aiMatches, setAiMatches] = useState([
    {
      id: 'MATCH-001',
      sellerId: 'house_a',
      sellerName: `${householdName} (Solar)`,
      surplusKwh: 2.8,
      buyerId: 'house_b',
      buyerName: 'Green Valley Block 2 (EV Load)',
      demandKwh: 2.8,
      pricePerKwh: 4.5,
      gridPrice: 6.1,
      distanceMeters: 45,
      expectedSaving: 4.48,
      reasons: [
        'Nearby household on same sub-feeder (45 m)',
        'Active evening EV charging demand matches solar peak',
        'Local P2P price (₹4.50) is 26% below grid tariff',
        'Zero transmission surcharge on local branch',
      ],
      status: 'READY_TO_SETTLE',
    },
    {
      id: 'MATCH-002',
      sellerId: 'house_c',
      sellerName: 'Eco Villa 14 (Rooftop Prosumer)',
      surplusKwh: 1.5,
      buyerId: 'house_d',
      buyerName: 'Palm Grove Apartments (Heat Pump)',
      demandKwh: 1.5,
      pricePerKwh: 4.8,
      gridPrice: 6.1,
      distanceMeters: 110,
      expectedSaving: 1.95,
      reasons: [
        'Nearby household on community microgrid loop (110 m)',
        'Continuous smart HVAC demand',
        'Local price below utility baseline (₹6.10)',
        'Reduces community transformer congestion',
      ],
      status: 'READY_TO_SETTLE',
    },
  ]);

  // Bilateral Settlement Ledger
  const [transactions, setTransactions] = useState([
    { id: 'TXN-001', time: '12:14 PM', sellerName: `${householdName}`, buyerName: 'Green Valley Block 2', energyKwh: 2.0, pricePerKwh: 4.5, totalValue: 9.0, status: 'SETTLED', icon: 'home' },
    { id: 'TXN-002', time: '11:45 AM', sellerName: 'Eco Villa 14', buyerName: 'Palm Grove Apartments', energyKwh: 1.2, pricePerKwh: 4.8, totalValue: 5.76, status: 'SETTLED', icon: 'marketplace' },
    { id: 'TXN-003', time: '11:10 AM', sellerName: 'Solar Ridge 7', buyerName: 'Community ESS Battery', energyKwh: 2.5, pricePerKwh: 4.2, totalValue: 10.50, status: 'STORED', icon: 'battery' },
  ]);

  // Modal States
  const [activePurchase, setActivePurchase] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Household Energy Headroom
  const [myEnergy, setMyEnergy] = useState({
    generation: 4.7,
    consumption: 1.9,
    surplus: 2.8,
    isProsumer: true,
  });

  // Fetch real authenticated household energy if available
  useEffect(() => {
    let isMounted = true;
    const fetchMyEnergy = async () => {
      try {
        const res = await api.getMyEnergy();
        if (isMounted && res?.data?.status === 'SUCCESS') {
          const d = res.data.data;
          setMyEnergy({
            generation: d.generation_kw || 4.7,
            consumption: d.consumption_kw || 1.9,
            surplus: Math.max(0, (d.generation_kw || 4.7) - (d.consumption_kw || 1.9)),
            isProsumer: (d.generation_kw || 4.7) > (d.consumption_kw || 1.9),
          });
        }
      } catch (err) {
        console.warn('Using local fallback energy state:', err);
      }
    };
    fetchMyEnergy();
    return () => { isMounted = false; };
  }, []);

  // Aggregated Metrics
  const totalAvailableKwh = aiMatches.reduce((sum, m) => sum + m.surplusKwh, 0);
  const totalEnergyTraded = transactions.reduce((sum, t) => sum + (t.energyKwh || 0), 0);
  const totalTradeValue = transactions.reduce((sum, t) => sum + (t.totalValue || 0), 0);
  const avgP2pPrice = 4.50;
  const gridBenchmarkRate = 6.10;

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

  // Submit New Custom Offer
  const handleCreateOfferSubmit = (offerData) => {
    const newMatch = {
      id: `MATCH-00${aiMatches.length + 3}`,
      sellerId: 'my_home',
      sellerName: `${householdName} (New Listing)`,
      surplusKwh: offerData.energyKwh,
      buyerId: 'house_nearby',
      buyerName: 'Nearby Green Valley Neighbor',
      demandKwh: offerData.energyKwh,
      pricePerKwh: offerData.pricePerKwh,
      gridPrice: 6.1,
      distanceMeters: 60,
      expectedSaving: Math.round((6.1 - offerData.pricePerKwh) * offerData.energyKwh * 100) / 100,
      reasons: [
        'Direct bilateral offer from your solar installation',
        'Nearby local demand ready for immediate dispatch',
        `P2P tariff ₹${offerData.pricePerKwh.toFixed(2)}/kWh provides extra return vs feed-in`,
      ],
      status: 'READY_TO_SETTLE',
    };

    setAiMatches((prev) => [newMatch, ...prev]);
    setStatusMessage(`Energy offer for ${offerData.energyKwh} kWh @ ₹${offerData.pricePerKwh}/kWh published to community!`);
    setTimeout(() => setStatusMessage(''), 4500);
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12 select-none animate-fadeIn">
      
      {/* 🌟 1. MINIMAL SPACIOUS HERO & ACTION BAR */}
      <div className="space-y-5 pt-2 select-none">
        
        {/* Top Centered Clean Heading (No cluttered badges or multi-row buttons) */}
        <div className="text-center max-w-4xl mx-auto space-y-2">
          <h1 className="font-changa text-3xl sm:text-4xl lg:text-[44px] font-normal text-[#17221D] leading-tight tracking-wide">
            Share clean energy with the{' '}
            <span className="text-[#1E9B68] whitespace-nowrap">neighbors who need it.</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#5E6963] max-w-xl mx-auto">
            Trade surplus rooftop solar with nearby homes at fair tariffs instead of sending it back to the grid.
          </p>
        </div>

        {/* Horizontal Control & Flow Bar (Utilizing full margin width) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          
          {/* Left: Scope Control Pill */}
          <div className="inline-flex items-center p-1 rounded-xl bg-white border border-[rgba(23,34,29,0.08)] shadow-xs text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewScope('COMMUNITY')}
              className={`px-4 py-1.5 rounded-lg transition ${
                viewScope === 'COMMUNITY'
                  ? 'bg-[#12392B] text-white shadow-xs font-bold'
                  : 'text-[#5E6963] hover:text-[#17221D]'
              }`}
            >
              Community Market
            </button>
            <button
              type="button"
              onClick={() => setViewScope('MY_ENERGY')}
              className={`px-4 py-1.5 rounded-lg transition ${
                viewScope === 'MY_ENERGY'
                  ? 'bg-[#12392B] text-white shadow-xs font-bold'
                  : 'text-[#5E6963] hover:text-[#17221D]'
              }`}
            >
              My Energy ({myEnergy.surplus > 0 ? `+${myEnergy.surplus.toFixed(1)} kW` : 'Demand'})
            </button>
          </div>

          {/* Center: Clean Energy Route Indicator */}
          <div className="hidden md:flex items-center space-x-2 text-xs text-[#5E6963]">
            <span className="font-medium flex items-center gap-1 text-[#DDA12A] bg-[#FFF7E4] px-2.5 py-1 rounded-lg">
              <FaIcon name="solar" /> Solar Surplus
            </span>
            <span className="text-[#1E9B68] font-bold text-xs">────( Local P2P @ ₹4.50/kWh )────→</span>
            <span className="font-medium flex items-center gap-1 text-[#3C78CC] bg-[#EDF3FD] px-2.5 py-1 rounded-lg">
              <FaIcon name="home" /> Nearby Demand
            </span>
          </div>

          {/* Right: Single Primary CTA */}
          <button
            type="button"
            onClick={() => setIsCreateOfferOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#1E9B68] hover:bg-[#168557] text-white text-xs sm:text-sm font-bold shadow-xs transition active:scale-98 flex items-center space-x-2"
          >
            <FaIcon name="plus" />
            <span>Create Energy Offer</span>
          </button>

        </div>

      </div>

      {/* Dynamic Status Notification */}
      {statusMessage && (
        <div className="flex items-center justify-between rounded-xl border border-[#1E9B68]/20 bg-[#E8F6EE] px-4 py-3 text-xs sm:text-sm text-[#12392B] font-bold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <FaIcon name="check" className="text-[#1E9B68]" />
            <span>{statusMessage}</span>
          </div>
          <button type="button" onClick={() => setStatusMessage('')} className="text-[#1E9B68] text-xs p-1 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* 🌟 2. QUICK MARKET SUMMARY STRIP */}
      <div className="glass-card rounded-xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
        
        {/* Metric 1: Available Energy */}
        <div>
          <div className="text-xs font-bold text-[#5E6963]">
            Available Energy
          </div>
          <div className="font-changa text-2xl sm:text-3xl font-normal text-[#1E9B68] mt-0.5">
            {totalAvailableKwh.toFixed(1)} kWh
          </div>
          <div className="text-xs text-[#5E6963] font-medium mt-0.5">
            Community rooftop surplus
          </div>
        </div>

        {/* Metric 2: Active Matches */}
        <div>
          <div className="text-xs font-bold text-[#5E6963]">
            Active Matches
          </div>
          <div className="font-changa text-2xl sm:text-3xl font-normal text-[#17221D] mt-0.5">
            {aiMatches.length} Pairs
          </div>
          <div className="text-xs text-[#1E9B68] font-bold flex items-center gap-1 mt-0.5">
            <span>● Ready to settle</span>
          </div>
        </div>

        {/* Metric 3: Average P2P Price */}
        <div>
          <div className="text-xs font-bold text-[#5E6963]">
            Average P2P Price
          </div>
          <div className="font-changa text-2xl sm:text-3xl font-normal text-[#17221D] mt-0.5">
            ₹{avgP2pPrice.toFixed(2)} / kWh
          </div>
          <div className="text-xs text-[#5E6963] font-medium mt-0.5">
            Fair algorithmically balanced tariff
          </div>
        </div>

        {/* Metric 4: Grid Benchmark */}
        <div>
          <div className="text-xs font-bold text-[#5E6963]">
            Grid Benchmark
          </div>
          <div className="font-changa text-2xl sm:text-3xl font-normal text-[#D45C5C] mt-0.5">
            ₹{gridBenchmarkRate.toFixed(2)} / kWh
          </div>
          <div className="text-xs text-[#1E9B68] font-bold mt-0.5">
            Buyer saves ₹{(gridBenchmarkRate - avgP2pPrice).toFixed(2)} / kWh
          </div>
        </div>

      </div>

      {/* 🌟 3. "HOW GRIDSHARE MARKETPLACE WORKS" */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="font-changa text-xl sm:text-2xl font-normal text-[#17221D]">
            How GridShare Marketplace Works
          </h2>
          <p className="text-xs sm:text-sm text-[#5E6963]">
            Your surplus energy finds a nearby home that needs it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1 */}
          <div className="glass-card rounded-xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-changa text-2xl font-normal text-[#1E9B68]">01</span>
              <div className="w-8 h-8 rounded-lg bg-[#FFF7E4] text-[#E5A72D] flex items-center justify-center text-xs">
                <FaIcon name="solar" />
              </div>
            </div>
            <h3 className="text-base font-bold text-[#17221D]">
              Generate
            </h3>
            <p className="text-xs text-[#5E6963] leading-relaxed">
              A household produces more clean rooftop solar energy than it currently consumes.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass-card rounded-xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-changa text-2xl font-normal text-[#7358C7]">02</span>
              <div className="w-8 h-8 rounded-lg bg-[#F1EDFF] text-[#7358C7] flex items-center justify-center text-xs">
                <FaIcon name="network" />
              </div>
            </div>
            <h3 className="text-base font-bold text-[#17221D]">
              Match
            </h3>
            <p className="text-xs text-[#5E6963] leading-relaxed">
              GridShare finds nearby electrical demand and computes a fair local P2P price below utility rates.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-card rounded-xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-changa text-2xl font-normal text-[#1E9B68]">03</span>
              <div className="w-8 h-8 rounded-lg bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-xs">
                <FaIcon name="check" />
              </div>
            </div>
            <h3 className="text-base font-bold text-[#17221D]">
              Settle
            </h3>
            <p className="text-xs text-[#5E6963] leading-relaxed">
              Energy is routed locally and the transaction is recorded in the verifiable community ledger.
            </p>
          </div>
        </div>
      </div>

      {/* 🌟 4. LIVE ENERGY MATCHES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-changa text-xl sm:text-2xl font-normal text-[#17221D]">
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
            <h3 className="font-changa text-lg font-normal text-[#17221D]">No Active Matches</h3>
            <p className="text-xs text-[#5E6963] leading-relaxed">
              Your community currently has zero open seller surplus. All local energy has been settled or balanced with storage.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateOfferOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#1E9B68] text-white text-xs font-bold shadow-xs hover:bg-[#168557] transition"
            >
              Post an Energy Offer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {aiMatches.map((match) => (
              <div
                key={match.id}
                className="glass-card rounded-xl p-6 sm:p-7 flex flex-col justify-between space-y-5 transition-shadow hover:shadow-md"
              >
                {/* Top Match Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[rgba(23,34,29,0.06)]">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#E8F6EE] text-[#1E9B68] text-[11px] font-bold">
                      {match.distanceMeters} m away
                    </span>
                    <span className="text-xs text-[#5E6963] font-medium">
                      Bilateral Pair
                    </span>
                  </div>

                  <span className="font-changa text-xs font-normal text-[#1E9B68]">
                    Saves ₹{match.expectedSaving.toFixed(2)} vs Grid
                  </span>
                </div>

                {/* Seller ➔ P2P Rate ➔ Buyer Visual Exchange */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-center sm:text-left">
                  {/* Seller */}
                  <div className="p-3.5 rounded-lg bg-[#FFF7E4]/70 border border-[#DDA12A]/20 space-y-1">
                    <div className="text-[10px] font-bold text-[#DDA12A]">Seller (Surplus)</div>
                    <div className="text-xs font-bold text-[#17221D] truncate">{match.sellerName}</div>
                    <div className="font-changa text-sm font-normal text-[#DDA12A]">+{match.surplusKwh} kWh</div>
                  </div>

                  {/* Arrow & Tariff */}
                  <div className="text-center space-y-1">
                    <div className="w-8 h-8 rounded-full bg-[#12392B] text-white flex items-center justify-center mx-auto text-xs shadow-xs">
                      →
                    </div>
                    <div className="font-changa text-xs font-normal text-[#1E9B68]">
                      ₹{match.pricePerKwh.toFixed(2)} / kWh
                    </div>
                  </div>

                  {/* Buyer */}
                  <div className="p-3.5 rounded-lg bg-[#EDF3FD]/70 border border-[#3C78CC]/20 space-y-1">
                    <div className="text-[10px] font-bold text-[#3C78CC]">Buyer (Demand)</div>
                    <div className="text-xs font-bold text-[#17221D] truncate">{match.buyerName}</div>
                    <div className="font-changa text-sm font-normal text-[#3C78CC]">-{match.demandKwh} kWh</div>
                  </div>
                </div>

                {/* Transparent "Why This Match?" Checklist */}
                <div className="p-3 rounded-lg bg-[#F8F9F6] border border-[rgba(23,34,29,0.06)] space-y-1.5 text-xs">
                  <div className="text-[10px] font-bold text-[#5E6963]">
                    Why this match was selected:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-[#17221D]">
                    {match.reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-start space-x-1.5">
                        <span className="text-[#1E9B68] font-bold">✓</span>
                        <span className="text-[#5E6963]">{reason}</span>
                      </div>
                    ))}
                  </div>
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
      <div className="glass-card rounded-xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-changa text-lg font-normal text-[#17221D]">
              Local P2P Price Transparency
            </h3>
            <p className="text-xs text-[#5E6963] mt-0.5">
              How GridShare double-auction prices compare to standard utility tariffs
            </p>
          </div>
          <span className="text-xs font-bold text-[#1E9B68] bg-[#E8F6EE] px-3 py-1 rounded-lg">
            26% Average Community Savings
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-[#F8F9F6] border border-[rgba(23,34,29,0.06)] space-y-1">
            <div className="text-xs font-bold text-[#5E6963]">Local P2P Rate</div>
            <div className="font-changa text-xl font-normal text-[#1E9B68]">₹4.50 / kWh</div>
            <div className="text-[10px] text-[#5E6963]">Agreed clearing tariff</div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F9F6] border border-[rgba(23,34,29,0.06)] space-y-1">
            <div className="text-xs font-bold text-[#5E6963]">Grid Utility Rate</div>
            <div className="font-changa text-xl font-normal text-[#D45C5C]">₹6.10 / kWh</div>
            <div className="text-[10px] text-[#5E6963]">Retail DISCOM tariff</div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F9F6] border border-[rgba(23,34,29,0.06)] space-y-1">
            <div className="text-xs font-bold text-[#5E6963]">Buyer Savings</div>
            <div className="font-changa text-xl font-normal text-[#1E9B68]">₹1.60 / kWh</div>
            <div className="text-[10px] text-[#5E6963]">Direct utility bill reduction</div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F9F6] border border-[rgba(23,34,29,0.06)] space-y-1">
            <div className="text-xs font-bold text-[#5E6963]">Seller Extra Gain</div>
            <div className="font-changa text-xl font-normal text-[#1E9B68]">+₹1.00 / kWh</div>
            <div className="text-[10px] text-[#5E6963]">vs ₹3.50 grid feed-in rate</div>
          </div>
        </div>
      </div>

      {/* 🌟 6. EXPANDED TWO-PANEL BOTTOM SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Card: Community Marketplace Impact */}
        <div className="lg:col-span-6 glass-card rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-changa text-base font-normal text-[#17221D]">
              Community Marketplace Impact
            </h3>
            <p className="text-xs text-[#5E6963] mt-1">
              Measurable ecological and economic gains from P2P energy trades
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center py-2">
            <div className="flex flex-col items-center p-2 rounded-xl bg-[#F8F9F6]">
              <div className="w-9 h-9 rounded-xl bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-sm mb-1.5">
                <FaIcon name="leaf" />
              </div>
              <div className="font-changa text-lg sm:text-xl font-normal text-[#1E9B68]">
                {totalEnergyTraded.toFixed(1)} kWh
              </div>
              <div className="text-[11px] text-[#5E6963] font-medium leading-tight mt-0.5">Local Energy Used</div>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-[#F8F9F6]">
              <div className="w-9 h-9 rounded-xl bg-[#EDF3FD] text-[#3C78CC] flex items-center justify-center text-sm mb-1.5">
                <FaIcon name="grid" />
              </div>
              <div className="font-changa text-lg sm:text-xl font-normal text-[#17221D]">
                {(totalEnergyTraded * 1.15).toFixed(1)} kWh
              </div>
              <div className="text-[11px] text-[#5E6963] font-medium leading-tight mt-0.5">Grid Energy Avoided</div>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-[#F8F9F6]">
              <div className="w-9 h-9 rounded-xl bg-[#FFF7E4] text-[#E5A72D] flex items-center justify-center text-sm mb-1.5">
                <FaIcon name="rupee" />
              </div>
              <div className="font-changa text-lg sm:text-xl font-normal text-[#17221D]">
                ₹{(totalEnergyTraded * 1.60).toFixed(2)}
              </div>
              <div className="text-[11px] text-[#5E6963] font-medium leading-tight mt-0.5">Community Savings</div>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-[#F8F9F6]">
              <div className="w-9 h-9 rounded-xl bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-sm mb-1.5">
                <FaIcon name="shield" />
              </div>
              <div className="font-changa text-lg sm:text-xl font-normal text-[#17221D]">
                {(totalEnergyTraded * 0.82).toFixed(1)} kg
              </div>
              <div className="text-[11px] text-[#5E6963] font-medium leading-tight mt-0.5">CO₂ Emissions Avoided</div>
            </div>
          </div>
        </div>

        {/* Right Card: Recent Local Trades */}
        <div className="lg:col-span-6 glass-card rounded-xl p-6 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-changa text-base font-normal text-[#17221D]">
                Recent Local Trades
              </h3>
              <p className="text-xs text-[#5E6963] mt-1">
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
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-xs">
                    <FaIcon name={tx.icon || 'marketplace'} />
                  </div>
                  <div>
                    <div className="font-bold text-[#17221D] leading-tight">
                      {tx.sellerName} → {tx.buyerName}
                    </div>
                    <div className="text-[10px] text-[#89938D]">{tx.time} • P2P Cleared</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 text-right">
                  <div className="font-changa text-xs sm:text-sm font-normal text-[#17221D]">
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

      {/* 🌟 7. MODALS */}
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
          userSurplusKwh={myEnergy.surplus}
          householdName={householdName}
        />
      )}

    </div>
  );
}
