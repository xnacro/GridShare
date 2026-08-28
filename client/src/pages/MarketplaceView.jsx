import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  INITIAL_DEMO_STATE,
  computeHouseholdStates,
  validateSellOrder,
  validatePurchaseOrder,
} from '../services/marketEngine';
import MarketplaceScene3D, { MARKET_3D_POSITIONS } from '../components/energy-map-3d/MarketplaceScene3D';
import TradeConfirmationModal from '../components/marketplace/TradeConfirmationModal';
import MetricCard from '../components/ui/MetricCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import FaIcon from '../components/icons/FaIcon';

export default function MarketplaceView() {
  // Master P2P Trading State
  const [households, setHouseholds] = useState(INITIAL_DEMO_STATE.households);
  const [battery, setBattery] = useState(INITIAL_DEMO_STATE.battery);
  const [grid, setGrid] = useState(INITIAL_DEMO_STATE.grid);

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
      distanceMeters: 45,
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
      distanceMeters: 80,
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
  const [activeFlows, setActiveFlows] = useState([]);

  const sceneRef = useRef();

  const computedHouseholds = useMemo(() => {
    return computeHouseholdStates(households, [], [], transactions);
  }, [households, transactions]);

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
    setStatusMessage(`AI Match settled: ${newTxn.energyKwh} kWh transferred from ${newTxn.sellerId} to ${newTxn.buyerId} @ ₹${newTxn.pricePerKwh}/kWh.`);
    setTimeout(() => setStatusMessage(''), 5000);
  };

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto pb-8 select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102019] tracking-tight">
              AI-Matched P2P Energy Exchange
            </h1>
            <Badge variant="ai" size="sm">
              Autonomous Clearing
            </Badge>
          </div>
          <p className="text-sm text-[#5D6B64] font-medium mt-1">
            Proximity-weighted bilateral peer matching with transparent midpoint pricing and settlement.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (aiMatches.length > 0) handleSettleAiMatch(aiMatches[0]);
            }}
            icon={<FaIcon name="sparkles" />}
          >
            Clear Top AI Match
          </Button>
        </div>
      </div>

      {/* Dynamic Status Notification */}
      {statusMessage && (
        <div className="flex items-center justify-between rounded-xl border border-[#DDE5E0] bg-[#E7F5EE] px-4 py-3 text-sm text-[#163A2B] font-bold shadow-subtle animate-in fade-in">
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage('')} className="text-[#168A5A] text-xs font-bold p-1">
            ✕
          </button>
        </div>
      )}

      {/* 🌟 1. PRIMARY MARKETPLACE METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Traded Volume"
          value={`${totalEnergyTraded.toFixed(1)} kWh`}
          subtitle="Total peer energy settled"
          iconName="energy"
          variant="surplus"
          delta="100% clean solar"
          deltaType="positive"
        />

        <MetricCard
          title="Average P2P Tariff"
          value="₹4.65"
          unit="/ kWh"
          subtitle="vs ₹6.10 grid peak import"
          iconName="trade"
          variant="ai"
          delta="Save ₹1.45/kWh"
          deltaType="positive"
        />

        <MetricCard
          title="Total Community Value"
          value={`₹${totalTradeValue.toFixed(2)}`}
          subtitle="Bilateral settled earnings"
          iconName="rupee"
          variant="default"
          delta="Instant clearing"
          deltaType="positive"
        />

        <MetricCard
          title="Available Headroom"
          value={`${totalHeadroom.toFixed(1)} kWh`}
          subtitle="Active prosumer listings"
          iconName="solar"
          variant="solar"
          badge="READY"
        />
      </div>

      {/* 🌟 2. PRIMARY CONCEPT: AI MATCH CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#102019]">
              Algorithmic Proximity Matches
            </h2>
            <p className="text-xs sm:text-[13px] text-[#5D6B64]">
              AI pairs local prosumer generation with neighboring demand on the same distribution feeder
            </p>
          </div>
          <Badge variant="ai" size="xs">
            {aiMatches.length} Recommended Matches
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {aiMatches.map((match) => (
            <div
              key={match.id}
              className="rounded-2xl border border-[#DDE5E0] bg-white p-5 shadow-card hover:shadow-elevated transition duration-200 space-y-4"
            >
              {/* Header Match Quality */}
              <div className="flex items-center justify-between pb-3 border-b border-[#DDE5E0]">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-[#F0EBFF] text-[#7657D8] flex items-center justify-center text-sm font-bold">
                    <FaIcon name="sparkles" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#102019]">
                      {match.matchQuality}% Proximity AI Match
                    </span>
                    <div className="text-[11px] text-[#83908A]">{match.circuit} • {match.distanceMeters}m distance</div>
                  </div>
                </div>
                <Badge variant="surplus" size="xs">
                  Save ₹{match.expectedSaving.toFixed(2)}
                </Badge>
              </div>

              {/* Bilateral Peer Transfer Diagram */}
              <div className="grid grid-cols-3 items-center gap-2 text-center p-3.5 rounded-xl border border-[#DDE5E0] bg-[#FBFCFB]">
                {/* Seller Node */}
                <div className="space-y-1">
                  <div className="w-8 h-8 mx-auto rounded-xl bg-[#FFF4D8] text-[#E8A72B] flex items-center justify-center text-sm">
                    <FaIcon name="solar" />
                  </div>
                  <div className="text-xs font-bold text-[#102019] truncate">{match.sellerName.split(' ')[0]}</div>
                  <div className="text-[11px] font-mono font-bold text-[#168A5A]">+{match.surplusKwh} kWh</div>
                </div>

                {/* Flow Arrow & Tariff */}
                <div className="space-y-1">
                  <div className="text-xs font-extrabold text-[#7657D8]">₹{match.pricePerKwh.toFixed(2)}</div>
                  <div className="flex items-center justify-center space-x-1 text-[#168A5A]">
                    <div className="h-0.5 w-6 bg-[#168A5A]" />
                    <FaIcon name="arrowRight" className="text-xs" />
                  </div>
                  <div className="text-[10px] text-[#83908A]">vs ₹{match.gridPrice} Grid</div>
                </div>

                {/* Buyer Node */}
                <div className="space-y-1">
                  <div className="w-8 h-8 mx-auto rounded-xl bg-[#EAF2FF] text-[#3678D4] flex items-center justify-center text-sm">
                    <FaIcon name="home" />
                  </div>
                  <div className="text-xs font-bold text-[#102019] truncate">{match.buyerName.split(' ')[0]}</div>
                  <div className="text-[11px] font-mono font-bold text-[#D95C5C]">-{match.demandKwh} kWh</div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[#5D6B64]">
                  Total Value: <strong className="text-[#102019] font-mono">₹{(match.surplusKwh * match.pricePerKwh).toFixed(2)}</strong>
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSettleAiMatch(match)}
                  icon={<FaIcon name="trade" />}
                >
                  Settle Match
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🌟 3. RECENT SETTLED P2P TRANSACTIONS LEDGER */}
      <div className="rounded-2xl border border-[#DDE5E0] bg-white p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE5E0]">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#102019]">
              Settlement Ledger & Transaction Audit
            </h3>
            <p className="text-xs text-[#5D6B64]">
              Immutable bilateral trade confirmations verified on the community microgrid bus
            </p>
          </div>
          <Badge variant="surplus" size="xs">
            {transactions.length} Transactions Settled
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DDE5E0] bg-[#F5F7F6] text-[11px] font-bold uppercase tracking-wider text-[#5D6B64]">
                <th className="px-3.5 py-2.5">TX ID</th>
                <th className="px-3.5 py-2.5">Time</th>
                <th className="px-3.5 py-2.5">Seller (Prosumer)</th>
                <th className="px-3.5 py-2.5">Buyer (Consumer)</th>
                <th className="px-3.5 py-2.5 text-right">Energy (kWh)</th>
                <th className="px-3.5 py-2.5 text-right">Tariff (₹/kWh)</th>
                <th className="px-3.5 py-2.5 text-right">Total Settlement</th>
                <th className="px-3.5 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F7F6] font-mono text-[12px]">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#FBFCFB] transition">
                  <td className="px-3.5 py-3 font-bold text-[#102019]">{tx.id}</td>
                  <td className="px-3.5 py-3 text-[#5D6B64] font-sans">{tx.time}</td>
                  <td className="px-3.5 py-3 font-sans font-semibold text-[#168A5A]">{tx.sellerId}</td>
                  <td className="px-3.5 py-3 font-sans font-semibold text-[#3678D4]">{tx.buyerId}</td>
                  <td className="px-3.5 py-3 text-right font-bold text-[#102019]">{tx.energyKwh.toFixed(1)}</td>
                  <td className="px-3.5 py-3 text-right font-bold text-[#7657D8]">₹{tx.pricePerKwh.toFixed(2)}</td>
                  <td className="px-3.5 py-3 text-right font-extrabold text-[#168A5A]">₹{tx.totalValue.toFixed(2)}</td>
                  <td className="px-3.5 py-3 text-right font-sans">
                    <Badge variant="surplus" size="xs">
                      SETTLED ✓
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <TradeConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          purchaseDetails={activePurchase}
          onConfirmTrade={handleConfirmTrade}
        />
      )}
    </div>
  );
}
