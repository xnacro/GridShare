import React, { useState, useMemo } from 'react';
import {
  INITIAL_DEMO_STATE,
  computeHouseholdStates,
} from '../services/marketEngine';
import TradeConfirmationModal from '../components/marketplace/TradeConfirmationModal';
import PageHero from '../components/ui/PageHero';
import HeroMetric from '../components/ui/HeroMetric';
import GlassSurface from '../components/ui/GlassSurface';
import SectionHeader from '../components/ui/SectionHeader';
import FaIcon from '../components/icons/FaIcon';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function MarketplaceView() {
  // Master P2P Trading State
  const [households] = useState(INITIAL_DEMO_STATE.households);

  const [aiMatches, setAiMatches] = useState([
    {
      id: 'MATCH-001',
      sellerId: 'house_a',
      sellerName: 'House A (Solar Champion)',
      surplusKwh: 2.8,
      buyerId: 'house_b',
      buyerName: 'House B (EV Charger)',
      demandKwh: 2.8,
      pricePerKwh: 4.5,
      gridPrice: 6.1,
      circuit: 'Feeder Sub-branch A',
      matchQuality: 98,
      expectedSaving: 4.48,
      status: 'READY_TO_SETTLE',
    },
    {
      id: 'MATCH-002',
      sellerId: 'house_c',
      sellerName: 'House C (Prosumer)',
      surplusKwh: 1.5,
      buyerId: 'house_d',
      buyerName: 'House D (Smart Apartment)',
      demandKwh: 1.5,
      pricePerKwh: 4.8,
      gridPrice: 6.1,
      circuit: 'Feeder Sub-branch B',
      matchQuality: 94,
      expectedSaving: 1.95,
      status: 'READY_TO_SETTLE',
    },
  ]);

  const [transactions, setTransactions] = useState([
    { id: 'TXN-001', time: '10:00', sellerId: 'HOUSE_A', buyerId: 'HOUSE_B', energyKwh: 2.0, pricePerKwh: 4.5, totalValue: 9.0, paymentStatus: 'SETTLED', energyFlowStatus: 'TRANSFERRED', status: 'COMPLETED' },
    { id: 'TXN-002', time: '10:30', sellerId: 'HOUSE_C', buyerId: 'HOUSE_D', energyKwh: 1.2, pricePerKwh: 4.8, totalValue: 5.76, paymentStatus: 'SETTLED', energyFlowStatus: 'TRANSFERRED', status: 'COMPLETED' },
  ]);

  const [activePurchase, setActivePurchase] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const totalEnergyTraded = transactions.reduce((sum, t) => sum + (t.energyKwh || 0), 0);
  const totalTradeValue = transactions.reduce((sum, t) => sum + (t.totalValue || 0), 0);
  const totalHeadroom = aiMatches.reduce((sum, m) => sum + m.surplusKwh, 0);

  const handleSettleAiMatch = (match) => {
    setActivePurchase({
      buyerId: match.buyerId,
      sellOrder: {
        id: match.id,
        household_id: match.sellerId,
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
      sellerId: activePurchase.sellOrder.household_id.toUpperCase(),
      buyerId: activePurchase.buyerId.toUpperCase(),
      energyKwh: activePurchase.quantityKwh,
      pricePerKwh: activePurchase.sellOrder.min_price_per_kwh,
      totalValue: activePurchase.quantityKwh * activePurchase.sellOrder.min_price_per_kwh,
      paymentStatus: 'SETTLED',
      energyFlowStatus: 'TRANSFERRED',
      status: 'COMPLETED',
    };

    setTransactions((prev) => [newTxn, ...prev]);
    setAiMatches((prev) => prev.filter((m) => m.id !== activePurchase.sellOrder.id));
    setIsConfirmModalOpen(false);
    setStatusMessage(`Successfully cleared bilateral trade: ${activePurchase.quantityKwh} kWh @ ₹${activePurchase.sellOrder.min_price_per_kwh}/kWh.`);
    setTimeout(() => setStatusMessage(''), 4500);
  };

  return (
    <div className="space-y-8 max-w-[1520px] mx-auto pb-12 select-none animate-fadeIn">
      
      {/* 🌟 1. MARKETPLACE HERO */}
      <PageHero
        category="COMMUNITY ENERGY MARKET"
        statusBadge="ACTIVE AUCTION"
        statusVariant="surplus"
        title="Share local renewable energy"
        highlightText="with the neighbors who need it."
        subtitle="Peer-to-peer continuous double auction matching rooftop solar surplus with local consumers at fair tariffs."
        supportingFacts={[
          { label: 'Available Locally', value: `${totalHeadroom.toFixed(1)} kWh`, icon: 'solar' },
          { label: 'Recommended Matches', value: `${aiMatches.length} Pairs`, icon: 'sparkles' },
          { label: 'Average P2P Price', value: '₹4.50 / kWh', icon: 'rupee' },
        ]}
        primaryAction={{
          label: 'Settle Top Match',
          icon: 'marketplace',
          onClick: () => aiMatches.length > 0 && handleSettleAiMatch(aiMatches[0]),
        }}
        secondaryAction={{
          label: 'Create Custom Offer',
          icon: 'plus',
          onClick: () => {
            setStatusMessage('Select a household node from My Home to post custom offer parameters.');
            setTimeout(() => setStatusMessage(''), 4000);
          },
        }}
      />

      {/* Dynamic Status Notification */}
      {statusMessage && (
        <div className="flex items-center justify-between rounded-2xl border border-[#DCE4DE] bg-[#E6F5EC] px-4 py-3 text-xs sm:text-sm text-[#12382A] font-bold shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <FaIcon name="check" className="text-[#1E9B67]" />
            <span>{statusMessage}</span>
          </div>
          <button type="button" onClick={() => setStatusMessage('')} className="text-[#1E9B67] text-xs p-1 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* 🌟 2. METRIC STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <HeroMetric
          label="Local Energy Available"
          value={totalHeadroom.toFixed(1)}
          unit="kWh"
          subtitle="Prosumer rooftop headroom"
          iconName="solar"
          variant="solar"
        />

        <HeroMetric
          label="Average P2P Tariff"
          value="₹4.50"
          unit="/ kWh"
          subtitle="vs ₹6.10 utility grid rate"
          iconName="rupee"
          variant="emerald"
        />

        <HeroMetric
          label="Total Cleared Trades"
          value={totalEnergyTraded.toFixed(1)}
          unit="kWh"
          subtitle={`₹${totalTradeValue.toFixed(2)} total transaction volume`}
          iconName="transactions"
          variant="default"
        />

        <HeroMetric
          label="Community Savings"
          value="₹8.32"
          unit="INR"
          subtitle="Saved vs standard DISCOM grid tariffs"
          iconName="leaf"
          variant="emerald"
        />
      </div>

      {/* 🌟 3. AI-MATCHED PROSUMER-CONSUMER PAIRS */}
      <div className="space-y-4">
        <SectionHeader
          title="Optimal Peer-to-Peer Energy Matches"
          subtitle="Algorithmic double-auction matching ranked by proximity, surplus volume, and tariff headroom"
          rightAction={
            <Badge variant="ai" size="sm">
              Continuous Matching
            </Badge>
          }
        />

        {aiMatches.length === 0 ? (
          <div className="rounded-3xl bg-white border border-[rgba(23,56,43,0.08)] p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E6F5EC] text-[#1E9B67] flex items-center justify-center mx-auto text-xl">
              <FaIcon name="check" />
            </div>
            <h3 className="text-base font-extrabold text-[#15221B]">All Available Matches Cleared</h3>
            <p className="text-xs text-[#5E6B63]">The local microgrid is currently fully balanced with zero open seller surplus.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {aiMatches.map((match) => (
              <div
                key={match.id}
                className="rounded-3xl bg-white border border-[rgba(23,56,43,0.08)] p-6 sm:p-7 shadow-card hover:border-[rgba(23,56,43,0.15)] transition flex flex-col justify-between space-y-5"
              >
                {/* Match Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[rgba(23,56,43,0.06)]">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F1ECFF] text-[#7358C8] text-[11px] font-extrabold tracking-wider">
                      {match.matchQuality}% MATCH QUALITY
                    </span>
                    <span className="text-xs text-[#5E6B63] font-medium hidden sm:inline">
                      {match.circuit}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#1E9B67]">
                    Save ₹{match.expectedSaving.toFixed(2)}
                  </span>
                </div>

                {/* Seller ➔ Buyer Visual Route */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-center sm:text-left">
                  {/* Seller */}
                  <div className="p-3.5 rounded-2xl bg-[#FFF7E4]/60 border border-[#E5A72D]/20 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-[#E5A72D]">Seller (Surplus)</div>
                    <div className="text-xs font-extrabold text-[#15221B]">{match.sellerName}</div>
                    <div className="text-sm font-mono font-extrabold text-[#E5A72D]">+{match.surplusKwh} kWh</div>
                  </div>

                  {/* Arrow & Tariff */}
                  <div className="text-center space-y-1">
                    <div className="w-8 h-8 rounded-full bg-[#12382A] text-white flex items-center justify-center mx-auto text-xs shadow-xs">
                      <FaIcon name="chevronRight" />
                    </div>
                    <div className="text-xs font-extrabold text-[#1E9B67]">₹{match.pricePerKwh.toFixed(2)}/kWh</div>
                  </div>

                  {/* Buyer */}
                  <div className="p-3.5 rounded-2xl bg-[#EDF3FD]/60 border border-[#3979D0]/20 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-[#3979D0]">Buyer (Demand)</div>
                    <div className="text-xs font-extrabold text-[#15221B]">{match.buyerName}</div>
                    <div className="text-sm font-mono font-extrabold text-[#3979D0]">-{match.demandKwh} kWh</div>
                  </div>
                </div>

                {/* Settle Action */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-[#5E6B63]">
                    Grid comparison: <del className="text-[#D65D5D]">₹{match.gridPrice.toFixed(2)}/kWh</del>
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSettleAiMatch(match)}
                    icon={<FaIcon name="check" />}
                  >
                    Review & Settle Match
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🌟 4. BILATERAL SETTLEMENT HISTORY (Progressive Disclosure) */}
      <div className="rounded-3xl bg-white border border-[rgba(23,56,43,0.08)] p-6 sm:p-8 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(23,56,43,0.06)]">
          <div>
            <h3 className="text-base font-extrabold text-[#15221B]">
              Bilateral Energy Settlement Ledger
            </h3>
            <p className="text-xs text-[#5E6B63]">
              Executed P2P smart trades between community prosumers and consumers
            </p>
          </div>
          <Badge variant="surplus" size="xs">
            {transactions.length} CLEARED
          </Badge>
        </div>

        <div className="space-y-2.5">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F5F7F3]/60 border border-[rgba(23,56,43,0.06)] hover:bg-white text-xs transition"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#E6F5EC] text-[#1E9B67] flex items-center justify-center text-xs">
                  <FaIcon name="marketplace" />
                </div>
                <div>
                  <div className="font-bold text-[#15221B]">
                    {tx.sellerId.replace('_', ' ')} ➔ {tx.buyerId.replace('_', ' ')}
                  </div>
                  <div className="text-[11px] text-[#5E6A63]">{tx.time} • P2P Continuous Double Auction</div>
                </div>
              </div>

              <div className="text-right space-y-0.5">
                <div className="font-mono font-bold text-[#1E9B67]">
                  {tx.energyKwh.toFixed(1)} kWh • ₹{tx.totalValue.toFixed(2)}
                </div>
                <Badge variant="surplus" size="xs">TRANSFERRED</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <TradeConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          purchase={activePurchase}
          onConfirm={handleConfirmTrade}
        />
      )}

    </div>
  );
}
