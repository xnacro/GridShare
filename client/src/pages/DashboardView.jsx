import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  INITIAL_DEMO_STATE,
  computeHouseholdStates,
  validateSellOrder,
  validatePurchaseOrder,
} from '../services/marketEngine';
import {
  PRESET_SCENARIOS,
  generate24HourProfile,
  calculateMicrogridFlows,
  DIURNAL_PROFILES,
} from '../services/dashboardSimulationEngine';
import MarketplaceScene3D, { MARKET_3D_POSITIONS } from '../components/energy-map-3d/MarketplaceScene3D';
import LiveEnergyChart from '../components/LiveEnergyChart';
import TransactionLedger from '../components/marketplace/TransactionLedger';
import TradeConfirmationModal from '../components/marketplace/TradeConfirmationModal';
import DecisionTimeline from '../components/ui/DecisionTimeline';
import FaIcon from '../components/icons/FaIcon';
import MetricCard from '../components/ui/MetricCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function DashboardView() {
  const navigate = useNavigate();

  // Master Microgrid State
  const [households, setHouseholds] = useState(INITIAL_DEMO_STATE.households);
  const [battery, setBattery] = useState(INITIAL_DEMO_STATE.battery);
  const [grid, setGrid] = useState(INITIAL_DEMO_STATE.grid);
  const [orders, setOrders] = useState({
    sellOrders: [
      { id: 'GS-SELL-001', household_id: 'house_a', energy_kwh: 2.0, min_price_per_kwh: 4.5, remaining_kwh: 2.0, status: 'OPEN' }
    ],
    buyOrders: [],
  });
  const [transactions, setTransactions] = useState([
    { id: 'TX-GS-001', time: '12:30', sellerId: 'HOUSE_A', buyerId: 'HOUSE_B', energyKwh: 2.0, pricePerKwh: 4.5, totalValue: 9.0, paymentStatus: 'SETTLED', energyFlowStatus: 'TRANSFERRED', status: 'COMPLETED' }
  ]);

  // Simulation Clock & Node Selection
  const [currentHour, setCurrentHour] = useState(12);
  const [selectedNode, setSelectedNode] = useState('house_a');
  const [isAiExecuting, setIsAiExecuting] = useState(false);
  const [aiExecutionMessage, setAiExecutionMessage] = useState('');

  // Confirmation Modal
  const [activePurchase, setActivePurchase] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const sceneRef = useRef();

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
    setAiExecutionMessage('Executing automated P2P bilateral match between House A and House B...');
    setTimeout(() => {
      setTransactions((prev) => [
        {
          id: `TX-GS-00${prev.length + 1}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sellerId: 'HOUSE_A',
          buyerId: 'HOUSE_B',
          energyKwh: 2.0,
          pricePerKwh: 4.5,
          totalValue: 9.0,
          paymentStatus: 'SETTLED',
          energyFlowStatus: 'TRANSFERRED',
          status: 'COMPLETED',
        },
        ...prev,
      ]);
      setIsAiExecuting(false);
      setAiExecutionMessage('Optimal trade executed: 2.0 kWh settled @ ₹4.50/kWh.');
      setTimeout(() => setAiExecutionMessage(''), 4000);
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto pb-8 select-none">

      {/* Page Title & Status Subheading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102019] tracking-tight">
              Community Energy Command Center
            </h1>
            <Badge variant="surplus" size="sm">
              Live Operating Layer
            </Badge>
          </div>
          <p className="text-sm text-[#5D6B64] font-medium mt-1">
            Real-time physical telemetry, short-term forecasting, and deterministic peer dispatch.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ai"
            size="sm"
            onClick={() => navigate('/ai')}
            icon={<FaIcon name="ai" />}
          >
            Open AI Copilot
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/network')}
            icon={<FaIcon name="network" />}
          >
            View 3D Network
          </Button>
        </div>
      </div>

      {/* Dynamic Action Notification */}
      {aiExecutionMessage && (
        <div className="flex items-center justify-between rounded-xl border border-[#DDE5E0] bg-[#E7F5EE] px-4 py-3 text-sm text-[#163A2B] font-bold shadow-subtle animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2.5">
            <span className="h-2 w-2 rounded-full bg-[#168A5A] animate-pulse" />
            <span>{aiExecutionMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setAiExecutionMessage('')}
            className="text-[#168A5A] hover:text-[#102019] text-xs font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 🌟 ROW 1: PRIMARY METRICS HIERARCHY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Generation"
          value={`${totalGen.toFixed(1)} kW`}
          subtitle="Solar generation active"
          iconName="solar"
          variant="solar"
          delta="+1.2 kW vs baseline"
          deltaType="positive"
        />

        <MetricCard
          title="Community Load"
          value={`${totalCon.toFixed(1)} kW`}
          subtitle="Active community demand"
          iconName="home"
          variant="default"
          delta="Normal residential draw"
          deltaType="neutral"
        />

        <MetricCard
          title="Net Balance"
          value={`${isSurplus ? '+' : ''}${netCommunity.toFixed(1)} kW`}
          subtitle={isSurplus ? "Community energy surplus" : "Community energy deficit"}
          iconName="energy"
          variant={isSurplus ? "surplus" : "deficit"}
          badge={isSurplus ? "SURPLUS" : "DEFICIT"}
          delta={isSurplus ? "Local self-sufficiency active" : "Grid import supplemental"}
          deltaType={isSurplus ? "positive" : "negative"}
        />

        <MetricCard
          title="Battery SOC"
          value={`${battery.soc.toFixed(0)}%`}
          subtitle="Available ESS storage reserve"
          iconName="battery"
          variant="battery"
          badge="SAFE BUFFER"
          delta="10% reserve floor preserved"
          deltaType="positive"
        />
      </div>

      {/* 🌟 ROW 2: 3D DIGITAL TWIN + EMBEDDED AI COPILOT PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* CENTERPIECE 3D SPATIAL DIGITAL TWIN (65% width) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <div className="flex flex-col h-full rounded-2xl border border-[#DDE5E0] bg-white p-4 sm:p-5 shadow-card">

            {/* 3D Viewport Header Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE5E0]">
              <div className="flex items-center space-x-2.5">
                <span className="flex h-2.5 w-2.5 rounded-full bg-[#168A5A] ring-4 ring-[#E7F5EE]" />
                <div>
                  <h3 className="text-base font-bold text-[#102019] tracking-tight">
                    Spatial Microgrid Digital Twin
                  </h3>
                  <p className="text-xs text-[#5D6B64]">
                    Real-time multi-household power vectors & bilateral transfers
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => sceneRef.current?.resetCamera()}
                  className="px-2.5 py-1 rounded-lg border border-[#DDE5E0] bg-[#F5F7F6] text-xs font-semibold text-[#102019] hover:bg-white transition"
                  title="Reset Camera Angle"
                >
                  <FaIcon name="camera" className="mr-1 text-[11px] text-[#5D6B64]" />
                  Reset View
                </button>
                <button
                  type="button"
                  onClick={() => sceneRef.current?.topView()}
                  className="hidden sm:inline-flex px-2.5 py-1 rounded-lg border border-[#DDE5E0] bg-[#F5F7F6] text-xs font-semibold text-[#102019] hover:bg-white transition"
                  title="Overhead View"
                >
                  Top-Down
                </button>
              </div>
            </div>

            {/* 3D Scene Viewport */}
            <div className="mt-4 h-[380px] sm:h-[420px] w-full relative rounded-xl overflow-hidden bg-[#F5F7F6]">
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
                <div className="flex items-center space-x-2 rounded-full border border-[#DDE5E0] bg-white/95 px-3 py-1 shadow-card backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-[#168A5A] animate-pulse" />
                  <span className="text-xs font-bold text-[#102019]">
                    {activeFlows.length > 0 ? `${activeFlows.length} Active Flow Conduits` : 'Baseline Ready'}
                  </span>
                </div>
              </div>
            </div>

            {/* Node Quick Selector Footer */}
            <div className="mt-3.5 pt-3 border-t border-[#DDE5E0] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-[#5D6B64] font-medium">Select Household Node:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {computedHouseholds.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setSelectedNode(h.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition text-xs ${selectedNode === h.id
                        ? 'bg-[#163A2B] text-white shadow-xs'
                        : 'bg-[#F5F7F6] text-[#5D6B64] hover:text-[#102019] border border-[#DDE5E0]'
                      }`}
                  >
                    {h.name.split(' ')[0]} {h.name.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PREMIUM AI COPILOT OVERVIEW PANEL (35% width) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <div className="flex flex-col h-full rounded-2xl border border-[#E2D9F8] bg-[#FBFCFB] p-5 sm:p-6 shadow-card space-y-4">

            {/* AI Copilot Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#E2D9F8]">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#F0EBFF] text-[#7657D8] flex items-center justify-center text-lg flex-shrink-0">
                  <FaIcon name="brain" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102019]">
                    GridShare AI Copilot
                  </h3>
                  <div className="text-xs text-[#7657D8] font-semibold">
                    Forecast Horizon: 60 Minutes
                  </div>
                </div>
              </div>
              <Badge variant="ai" size="xs">
                RULE-BASED
              </Badge>
            </div>

            {/* Predicted Balance & Confidence */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-[#DDE5E0] bg-white">
              <div>
                <span className="text-xs text-[#5D6B64] font-medium block">Predicted Balance</span>
                <span className="text-xl sm:text-2xl font-extrabold text-[#168A5A]">
                  +1.7 kW
                </span>
              </div>
              <div>
                <span className="text-xs text-[#5D6B64] font-medium block">Confidence</span>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-[#7657D8]">91%</span>
                  <span className="text-[11px] text-[#5D6B64] font-normal">High</span>
                </div>
              </div>
            </div>

            {/* Recommended Action Card */}
            <div className="rounded-xl border border-[#DDE5E0] bg-white p-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7657D8]">
                Recommended Action
              </span>
              <div className="text-sm font-bold text-[#102019]">
                Trade 2.0 kWh locally (House A ➔ House B)
              </div>
              <p className="text-xs text-[#5D6B64] leading-relaxed">
                Solar surplus is expected to persist for the next hour. Peer exchange clears at ₹4.50/kWh, yielding ₹9.00 community earnings and saving House B ₹3.20 vs grid tariff.
              </p>
            </div>

            {/* Why This Action? Reasoning Box */}
            <div className="rounded-xl bg-[#F0EBFF]/50 border border-[#E2D9F8] p-4 space-y-2 text-xs">
              <span className="font-bold text-[#7657D8] uppercase tracking-wide text-[11px] block">
                Why This Action?
              </span>
              <ul className="space-y-1.5 text-[#102019] text-[12.5px]">
                <li className="flex items-start gap-2">
                  <FaIcon name="check" className="text-[#168A5A] text-xs mt-0.5 flex-shrink-0" />
                  <span>Local deficit detected at House B (4.0 kW active load)</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaIcon name="check" className="text-[#168A5A] text-xs mt-0.5 flex-shrink-0" />
                  <span>Surplus expected to continue through afternoon peak</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaIcon name="check" className="text-[#168A5A] text-xs mt-0.5 flex-shrink-0" />
                  <span>Battery storage (40% SOC) safely exceeds 10% reserve floor</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaIcon name="check" className="text-[#168A5A] text-xs mt-0.5 flex-shrink-0" />
                  <span>P2P trade (₹4.50) strongly preferable to utility export (₹3.20)</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteRecommendation}
                isLoading={isAiExecuting}
                className="w-full justify-center"
                icon={<FaIcon name="sparkles" />}
              >
                Execute Trade Action
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/ai')}
                className="w-full sm:w-auto justify-center"
              >
                Review Details
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 ROW 3: AI DECISION TIMELINE & DISPATCH LOGIC */}
      <DecisionTimeline
        title="AI Decision Sequence & Dispatch Logic"
        subtitle="End-to-end trace of how GridShare observes surplus, predicts horizon load, and settles bilateral trades"
      />

      {/* 🌟 ROW 4: COMMUNITY PERFORMANCE + RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* 24-HOUR ENERGY PROFILE (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-[#DDE5E0] bg-white p-5 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDE5E0] mb-3">
            <div>
              <h3 className="text-base font-bold text-[#102019]">
                24-Hour Diurnal Energy Profile
              </h3>
              <p className="text-xs text-[#5D6B64]">
                Solar generation curve vs community demand load
              </p>
            </div>
            <Badge variant="solar" size="xs">
              Diurnal Model
            </Badge>
          </div>

          <LiveEnergyChart data={chartHistory} height={260} />
        </div>

        {/* RECENT SETTLED TRADES & ACTIVITY (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-[#DDE5E0] bg-white p-5 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDE5E0] mb-3">
            <div>
              <h3 className="text-base font-bold text-[#102019]">
                Settled P2P Transactions
              </h3>
              <p className="text-xs text-[#5D6B64]">
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
                className="flex items-center justify-between p-3 rounded-xl border border-[#DDE5E0] bg-[#FBFCFB] hover:bg-white text-xs transition"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#E7F5EE] text-[#168A5A] flex items-center justify-center">
                    <FaIcon name="trade" />
                  </div>
                  <div>
                    <div className="font-bold text-[#102019]">{tx.sellerId} ➔ {tx.buyerId}</div>
                    <div className="text-[11px] text-[#83908A]">{tx.time} • {tx.energyKwh} kWh @ ₹{tx.pricePerKwh}/kWh</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#168A5A]">₹{tx.totalValue.toFixed(2)}</div>
                  <span className="text-[10px] text-[#83908A] font-semibold">SETTLED</span>
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
