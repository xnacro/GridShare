import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

  // Simulation Clock & Node Selection
  const [currentHour] = useState(12);
  const [selectedNode, setSelectedNode] = useState('house_a');
  const [isAiExecuting, setIsAiExecuting] = useState(false);
  const [aiExecutionMessage, setAiExecutionMessage] = useState('');

  // Confirmation Modal
  const [activePurchase] = useState(null);
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
    setAiExecutionMessage('Connecting House A with House B for local peer exchange...');
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
      setAiExecutionMessage('Great match! 2.0 kWh shared locally @ ₹4.50/kWh.');
      setTimeout(() => setAiExecutionMessage(''), 4000);
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto pb-8 select-none">
      
      {/* 🌟 1. FRIENDLY, WARM, MODERN HERO GREETING */}
      <div className="rounded-3xl border border-[#DDE4DF] bg-white p-6 sm:p-8 shadow-card relative overflow-hidden">
        {/* Modern subtle ambient glow */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#E7F5EE]/80 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-12 h-48 w-48 rounded-full bg-[#F0ECFF]/60 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#E7F5EE] text-[#1C9A67] text-[11px] font-bold uppercase tracking-wider">
                COMMUNITY OVERVIEW
              </span>
              <Badge variant="surplus" size="xs">
                {isSurplus ? 'NET SURPLUS' : 'NET DEFICIT'}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#142019] tracking-tight leading-tight">
              {isSurplus
                ? `Your community has ${netCommunity.toFixed(1)} kW clean surplus to share today!`
                : `Your community is drawing ${Math.abs(netCommunity).toFixed(1)} kW from backup storage.`}
            </h1>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm font-semibold text-[#5C6962]">
              <span className="flex items-center gap-1.5 text-[#142019]">
                <FaIcon name="solar" className="text-[#E7A82D] text-xs" />
                {totalGen.toFixed(1)} kW generated
              </span>
              <span className="text-[#C9D2CC]">•</span>
              <span className="flex items-center gap-1.5 text-[#142019]">
                <FaIcon name="home" className="text-[#3A78D1] text-xs" />
                {totalCon.toFixed(1)} kW consumed
              </span>
              <span className="text-[#C9D2CC]">•</span>
              <span className="flex items-center gap-1.5 text-[#142019]">
                <FaIcon name="battery" className="text-[#D89A25] text-xs" />
                {battery.soc.toFixed(0)}% battery storage
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#7C8781] font-medium pt-1">
              GridShare automatically coordinates your community solar, central storage, and peer trading in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <Button
              variant="ai"
              size="md"
              onClick={() => navigate('/ai')}
              icon={<FaIcon name="ai" />}
            >
              Ask Hornet AI
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/marketplace')}
              icon={<FaIcon name="trade" />}
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

      {/* Dynamic Action Notification */}
      {aiExecutionMessage && (
        <div className="flex items-center justify-between rounded-2xl border border-[#DDE4DF] bg-[#E7F5EE] px-4 py-3 text-sm text-[#12372A] font-bold shadow-subtle animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2.5">
            <FaIcon name="sparkles" className="text-[#1C9A67] text-sm" />
            <span>{aiExecutionMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setAiExecutionMessage('')}
            className="text-[#1C9A67] hover:text-[#142019] text-xs font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 🌟 2. PRIMARY PROMINENT METRIC CARDS */}
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
          subtitle="Active residential demand"
          iconName="home"
          variant="default"
          delta="Normal household draw"
          deltaType="neutral"
        />

        <MetricCard
          title="Net Balance"
          value={`${isSurplus ? '+' : ''}${netCommunity.toFixed(1)} kW`}
          subtitle={isSurplus ? "Community energy surplus" : "Community energy deficit"}
          iconName="energy"
          variant={isSurplus ? "surplus" : "deficit"}
          badge={isSurplus ? "SURPLUS" : "DEFICIT"}
          delta={isSurplus ? "Local self-sufficiency active" : "Buffered by ESS reserve"}
          deltaType={isSurplus ? "positive" : "negative"}
        />

        <MetricCard
          title="Battery SOC"
          value={`${battery.soc.toFixed(0)}%`}
          subtitle="Central ESS storage reserve"
          iconName="battery"
          variant="battery"
          badge="SAFE BUFFER"
          delta="10% reserve floor preserved"
          deltaType="positive"
        />
      </div>

      {/* 🌟 3. 3D DIGITAL TWIN + EMBEDDED AI COPILOT PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* CENTERPIECE 3D SPATIAL DIGITAL TWIN (65% width) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <div className="flex flex-col h-full rounded-3xl border border-[#DDE4DF] bg-white p-5 sm:p-6 shadow-card">
            
            {/* 3D Viewport Header Bar with Clean Icon */}
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE4DF]">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#E7F5EE] text-[#1C9A67] flex items-center justify-center text-sm flex-shrink-0">
                  <FaIcon name="network" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#142019] tracking-tight">
                    Spatial Microgrid Digital Twin
                  </h3>
                  <p className="text-xs text-[#5C6962]">
                    Real-time multi-household power vectors & bilateral transfers
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => sceneRef.current?.resetCamera()}
                  className="px-2.5 py-1 rounded-lg border border-[#DDE4DF] bg-[#F5F6F2] text-xs font-semibold text-[#142019] hover:bg-white transition"
                  title="Reset Camera Angle"
                >
                  <FaIcon name="camera" className="mr-1 text-[11px] text-[#5C6962]" />
                  Reset View
                </button>
                <button
                  type="button"
                  onClick={() => sceneRef.current?.topView()}
                  className="hidden sm:inline-flex px-2.5 py-1 rounded-lg border border-[#DDE4DF] bg-[#F5F6F2] text-xs font-semibold text-[#142019] hover:bg-white transition"
                  title="Overhead View"
                >
                  Top-Down
                </button>
              </div>
            </div>

            {/* 3D Scene Viewport */}
            <div className="mt-4 h-[380px] sm:h-[420px] w-full relative rounded-2xl overflow-hidden bg-[#F5F6F2]">
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
                <div className="flex items-center space-x-2 rounded-full border border-[#DDE4DF] bg-white/95 px-3 py-1 shadow-card backdrop-blur-md">
                  <FaIcon name="bolt" className="text-[#1C9A67] text-xs" />
                  <span className="text-xs font-bold text-[#142019]">
                    {activeFlows.length > 0 ? `${activeFlows.length} Active Flow Conduits` : 'Baseline Ready'}
                  </span>
                </div>
              </div>
            </div>

            {/* Node Quick Selector Footer */}
            <div className="mt-3.5 pt-3 border-t border-[#DDE4DF] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-[#5C6962] font-medium">Select Household Node:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {computedHouseholds.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setSelectedNode(h.id)}
                    className={`px-3 py-1 rounded-xl font-bold transition text-xs ${
                      selectedNode === h.id
                        ? 'bg-[#12372A] text-white shadow-xs'
                        : 'bg-[#F5F6F2] text-[#5C6962] hover:text-[#142019] border border-[#DDE4DF]'
                    }`}
                  >
                    {h.name.split(' ')[0]} {h.name.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PREMIUM HORNET AI OVERVIEW PANEL (35% width) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <div className="flex flex-col h-full rounded-3xl border border-[#E2D9F8] bg-[#FDFCFE] p-5 sm:p-6 shadow-card space-y-4">
            
            {/* Hornet AI Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#E2D9F8]">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F0ECFF] text-[#7357C8] flex items-center justify-center text-base flex-shrink-0">
                  <FaIcon name="brain" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#142019]">
                    GridShare Hornet AI
                  </h3>
                  <div className="text-xs text-[#7357C8] font-semibold">
                    Forecast Horizon: 15–60 Minutes
                  </div>
                </div>
              </div>
              <Badge variant="ai" size="xs">
                RULE-BASED
              </Badge>
            </div>

            {/* Predicted Balance & Confidence */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl border border-[#DDE4DF] bg-white">
              <div>
                <span className="text-xs text-[#5C6962] font-medium block">Predicted Balance</span>
                <span className="text-xl sm:text-2xl font-extrabold text-[#1C9A67]">
                  +1.7 kW
                </span>
              </div>
              <div>
                <span className="text-xs text-[#5C6962] font-medium block">Confidence</span>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-[#7357C8]">91%</span>
                  <span className="text-[11px] text-[#5C6962] font-normal">High</span>
                </div>
              </div>
            </div>

            {/* Recommended Action Card */}
            <div className="rounded-2xl border border-[#DDE4DF] bg-white p-4 space-y-2">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#7357C8]">
                Recommended Action
              </span>
              <div className="text-sm font-bold text-[#142019]">
                TRADE 2.0 kWh LOCALLY (House A ➔ House B)
              </div>
              <p className="text-xs text-[#5C6962] leading-relaxed">
                Solar surplus is expected to persist for the next hour. Peer exchange clears at ₹4.50/kWh, yielding ₹9.00 community earnings and saving House B ₹3.20 vs grid tariff.
              </p>
            </div>

            {/* Why This Action? Reasoning Box */}
            <div className="rounded-2xl bg-[#F0ECFF]/40 border border-[#E2D9F8] p-4 space-y-2 text-xs">
              <span className="font-bold text-[#7357C8] uppercase tracking-wide text-[10.5px] block">
                Why This Action?
              </span>
              <ul className="space-y-1.5 text-[#142019] text-[12px]">
                <li className="flex items-start gap-2">
                  <FaIcon name="check" className="text-[#1C9A67] text-xs mt-0.5 flex-shrink-0" />
                  <span>Local demand detected at House B (4.0 kW active load)</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaIcon name="check" className="text-[#1C9A67] text-xs mt-0.5 flex-shrink-0" />
                  <span>Surplus expected to continue through afternoon peak</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaIcon name="check" className="text-[#1C9A67] text-xs mt-0.5 flex-shrink-0" />
                  <span>Battery reserve is healthy (40% SOC exceeds 10% floor)</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaIcon name="check" className="text-[#1C9A67] text-xs mt-0.5 flex-shrink-0" />
                  <span>Local trade currently preferable to utility grid export</span>
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
                Review Decision
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 4. OBSERVE -> PREDICT -> OPTIMIZE -> TRADE DECISION TIMELINE */}
      <DecisionTimeline
        title="AI Decision Sequence & Dispatch Logic"
        subtitle="End-to-end trace of how GridShare observes surplus, predicts horizon load, and settles bilateral trades"
      />

      {/* 🌟 5. COMMUNITY PERFORMANCE + RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* 24-HOUR ENERGY PROFILE (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-[#DDE4DF] bg-white p-5 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDE4DF] mb-3">
            <div>
              <h3 className="text-base font-bold text-[#142019]">
                24-Hour Diurnal Energy Profile
              </h3>
              <p className="text-xs text-[#5C6962]">
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
        <div className="lg:col-span-5 rounded-3xl border border-[#DDE4DF] bg-white p-5 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDE4DF] mb-3">
            <div>
              <h3 className="text-base font-bold text-[#142019]">
                Settled P2P Transactions
              </h3>
              <p className="text-xs text-[#5C6962]">
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
                className="flex items-center justify-between p-3 rounded-2xl border border-[#DDE4DF] bg-[#F5F6F2]/40 hover:bg-white text-xs transition"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#E7F5EE] text-[#1C9A67] flex items-center justify-center">
                    <FaIcon name="trade" />
                  </div>
                  <div>
                    <div className="font-bold text-[#142019]">{tx.sellerId} ➔ {tx.buyerId}</div>
                    <div className="text-[11px] text-[#7C8781]">{tx.time} • {tx.energyKwh} kWh @ ₹{tx.pricePerKwh}/kWh</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#1C9A67]">₹{tx.totalValue.toFixed(2)}</div>
                  <span className="text-[10px] text-[#7C8781] font-semibold">SETTLED</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🌟 6. SECONDARY METRICS: COMMUNITY IMPACT */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
        <div className="rounded-3xl border border-[#DDE4DF] bg-white p-5 shadow-card">
          <span className="text-xs font-semibold text-[#7C8781] block">P2P Energy Traded</span>
          <span className="text-xl sm:text-2xl font-extrabold text-[#142019] mt-1 block">28.4 kWh</span>
          <span className="text-[11px] text-[#1C9A67] font-semibold">100% clean solar</span>
        </div>

        <div className="rounded-3xl border border-[#DDE4DF] bg-white p-5 shadow-card">
          <span className="text-xs font-semibold text-[#7C8781] block">Grid Peak Shaved</span>
          <span className="text-xl sm:text-2xl font-extrabold text-[#3A78D1] mt-1 block">14.2 kW</span>
          <span className="text-[11px] text-[#5C6962]">Substation relief</span>
        </div>

        <div className="rounded-3xl border border-[#DDE4DF] bg-white p-5 shadow-card">
          <span className="text-xs font-semibold text-[#7C8781] block">Estimated CO2 Avoided</span>
          <span className="text-xl sm:text-2xl font-extrabold text-[#1C9A67] mt-1 block">23.3 kg</span>
          <span className="text-[11px] text-[#7C8781]">vs coal baseline</span>
        </div>

        <div className="rounded-3xl border border-[#DDE4DF] bg-white p-5 shadow-card">
          <span className="text-xs font-semibold text-[#7C8781] block">Community Savings</span>
          <span className="text-xl sm:text-2xl font-extrabold text-[#12372A] mt-1 block">₹142.50</span>
          <span className="text-[11px] text-[#1C9A67] font-semibold">vs utility peak tariff</span>
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
