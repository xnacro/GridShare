import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import PageHero from '../components/ui/PageHero';
import HeroMetric from '../components/ui/HeroMetric';
import GlassSurface from '../components/ui/GlassSurface';
import SectionHeader from '../components/ui/SectionHeader';
import TradeConfirmationModal from '../components/marketplace/TradeConfirmationModal';
import LiveEnergyChart from '../components/LiveEnergyChart';
import FaIcon from '../components/icons/FaIcon';
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

  // Live Hornet AI Insights State
  const [copilotData, setCopilotData] = useState(null);
  const [copilotLoading, setCopilotLoading] = useState(true);

  // Simulation Clock & Node Selection
  const [currentHour] = useState(12);
  const [selectedNode, setSelectedNode] = useState('house_a');
  const [isAiExecuting, setIsAiExecuting] = useState(false);
  const [aiExecutionMessage, setAiExecutionMessage] = useState('');

  // Confirmation Modal
  const [activePurchase] = useState(null);
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
          energyKwh: 1.0,
          pricePerKwh: 4.5,
          totalValue: 4.5,
          paymentStatus: 'SETTLED',
          energyFlowStatus: 'TRANSFERRED',
          status: 'COMPLETED',
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
    predicted_solar_kw: 5.84,
    predicted_demand_kw: 4.21,
    predicted_net_balance_kw: 1.63,
  };
  const aiInterval = copilotData?.prediction_interval || {
    solar_lower_kw: 5.31,
    solar_upper_kw: 6.28,
  };
  const aiRec = copilotData?.recommendation || {
    action: 'LOCAL_TRADE',
    headline: 'Trade 1.0 kWh locally (House A → House B)',
    summary: 'Local prosumer surplus is available at House A while House B has active EV demand.',
  };

  return (
    <div className="space-y-8 max-w-[1520px] mx-auto pb-12 select-none animate-fadeIn">
      
      {/* 🌟 1. OVERVIEW HERO */}
      <PageHero
        category="COMMUNITY OVERVIEW"
        statusBadge={isSurplus ? 'NET SURPLUS' : 'NET DEFICIT'}
        statusVariant={isSurplus ? 'surplus' : 'deficit'}
        title="Your community has"
        highlightText={
          isSurplus
            ? `${netCommunity.toFixed(1)} kW of clean energy available to share.`
            : `${Math.abs(netCommunity).toFixed(1)} kW drawn from community storage.`
        }
        subtitle="GridShare is balancing rooftop generation, community demand, and battery storage in real time."
        supportingFacts={[
          { label: 'Generation', value: `${totalGen.toFixed(1)} kW`, icon: 'solar' },
          { label: 'Demand', value: `${totalCon.toFixed(1)} kW`, icon: 'home' },
          { label: 'Storage', value: `${battery.soc.toFixed(0)}% (${battery.current_energy_kwh || 20} kWh)`, icon: 'battery' },
        ]}
        primaryAction={{
          label: 'Ask Hornet AI',
          icon: 'sparkles',
          onClick: () => navigate('/ai'),
        }}
        secondaryAction={{
          label: 'Open Energy Network',
          icon: 'network',
          onClick: () => navigate('/network'),
        }}
        tertiaryAction={{
          label: 'View Marketplace →',
          onClick: () => navigate('/marketplace'),
        }}
      />

      {/* 🌟 2. FOUR KEY METRIC SURFACES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <HeroMetric
          label="Generation"
          value={totalGen.toFixed(1)}
          unit="kW"
          subtitle="4 Rooftop solar arrays active"
          iconName="solar"
          variant="solar"
        />

        <HeroMetric
          label="Community Load"
          value={totalCon.toFixed(1)}
          unit="kW"
          subtitle="5 Active residential circuits"
          iconName="home"
          variant="default"
        />

        <HeroMetric
          label="Net Balance"
          value={`${isSurplus ? '+' : ''}${netCommunity.toFixed(1)}`}
          unit="kW"
          subtitle="Clean surplus ready for P2P trading"
          iconName="network"
          variant={isSurplus ? 'emerald' : 'deficit'}
        />

        <HeroMetric
          label="Battery Storage"
          value={`${battery.soc.toFixed(0)}%`}
          unit="SOC"
          subtitle="8.0 / 20 kWh usable (20% reserve)"
          iconName="battery"
          variant="solar"
        />
      </div>

      {/* Dynamic Action Notification */}
      {aiExecutionMessage && (
        <div className="flex items-center justify-between rounded-2xl border border-[#DCE4DE] bg-[#E6F5EC] px-4 py-3 text-xs sm:text-sm text-[#12382A] font-bold shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <FaIcon name="check" className="text-[#1E9B67]" />
            <span>{aiExecutionMessage}</span>
          </div>
          <button type="button" onClick={() => setAiExecutionMessage('')} className="text-[#1E9B67] text-xs p-1 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* 🌟 3. PRIMARY CONTENT: 3D DIGITAL TWIN + HORNET AI PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT: 3D DIGITAL TWIN SPATIAL VIEWPORT (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-white border border-[rgba(23,56,43,0.08)] p-6 shadow-card flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(23,56,43,0.06)]">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#E6F5EC] text-[#1E9B67] flex items-center justify-center text-xs">
                <FaIcon name="network" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#15221B]">
                  Live Microgrid Spatial Twin
                </h3>
                <p className="text-xs text-[#5E6B63]">
                  Real-time power routing between prosumers, consumers, and 50 kWh ESS
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/network')}
              className="text-xs font-bold text-[#1E9B67] hover:underline flex items-center gap-1"
            >
              <span>Explore Network</span>
              <FaIcon name="chevronRight" className="text-[9px]" />
            </button>
          </div>

          {/* 3D Canvas with sleek glass overlay controls */}
          <div className="h-[380px] w-full relative rounded-2xl overflow-hidden bg-[#EEF2ED]/60 border border-[rgba(23,56,43,0.05)]">
            <MarketplaceScene3D
              ref={sceneRef}
              households={computedHouseholds}
              battery={battery}
              grid={grid}
              activeFlows={activeFlows}
              selectedNode={selectedNode}
              onSelectNode={(node) => setSelectedNode(node.id)}
            />

            {/* Floating Glass Control Overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 p-1 rounded-2xl gs-glass shadow-sm">
              <button
                type="button"
                onClick={() => sceneRef.current?.resetCamera?.()}
                className="px-2.5 py-1 text-[11px] font-bold text-[#15221B] hover:bg-white/80 rounded-xl transition"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => sceneRef.current?.setTopDownView?.()}
                className="px-2.5 py-1 text-[11px] font-bold text-[#15221B] hover:bg-white/80 rounded-xl transition"
              >
                Top-Down
              </button>
              <span className="w-px h-3 bg-[rgba(23,56,43,0.15)] mx-0.5" />
              <div className="flex items-center gap-1 text-[10px] font-mono text-[#1E9B67] font-bold px-1">
                <span>{activeFlows.length} ACTIVE FLOWS</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: HORNET AI NEXT 15 MINUTES PANEL (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl bg-white border border-[rgba(23,56,43,0.08)] p-6 shadow-card flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(23,56,43,0.06)]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F1ECFF] text-[#7358C8] flex items-center justify-center text-xs">
                <FaIcon name="sparkles" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#15221B]">
                  Hornet AI
                </h3>
                <p className="text-xs text-[#5E6B63]">
                  Next 15-minute dispatch forecast & optimizer
                </p>
              </div>
            </div>

            <Badge variant="ai" size="xs">
              NEXT 15 MIN
            </Badge>
          </div>

          {/* Simple 3-Value Forecast Grid */}
          <div className="grid grid-cols-3 gap-2.5 text-center p-3 rounded-2xl bg-[#F5F7F3] border border-[rgba(23,56,43,0.06)]">
            <div className="p-2 space-y-0.5">
              <div className="text-[10px] font-bold uppercase text-[#5E6B63]">Solar</div>
              <div className="text-base font-extrabold text-[#E5A72D]">
                {aiForecast.predicted_solar_kw.toFixed(2)} kW
              </div>
            </div>

            <div className="p-2 space-y-0.5 border-x border-[rgba(23,56,43,0.08)]">
              <div className="text-[10px] font-bold uppercase text-[#5E6B63]">Demand</div>
              <div className="text-base font-extrabold text-[#15221B]">
                {aiForecast.predicted_demand_kw.toFixed(2)} kW
              </div>
            </div>

            <div className="p-2 space-y-0.5">
              <div className="text-[10px] font-bold uppercase text-[#5E6B63]">Balance</div>
              <div className="text-base font-extrabold text-[#1E9B67]">
                +{aiForecast.predicted_net_balance_kw.toFixed(2)} kW
              </div>
            </div>
          </div>

          {/* Forecast Range Strip */}
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#F1ECFF]/40 border border-[#7358C8]/20 text-xs">
            <span className="text-[#5E6B63] font-medium">Solar Forecast Range:</span>
            <span className="font-mono font-bold text-[#7358C8]">
              {aiInterval.solar_lower_kw.toFixed(2)} – {aiInterval.solar_upper_kw.toFixed(2)} kW
            </span>
          </div>

          {/* Recommended Action Card */}
          <div className="p-4 rounded-2xl bg-[#E6F5EC]/60 border border-[#1E9B67]/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1E9B67]">
                RECOMMENDED ACTION
              </span>
              <span className="text-[11px] font-mono text-[#1E9B67] font-bold">₹4.50/kWh</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-[#12382A]">
              {aiRec.headline}
            </div>
            <p className="text-xs text-[#5E6B63] leading-snug">
              {aiRec.summary}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              className="flex-1 justify-center py-2 text-xs font-bold"
              onClick={handleExecuteRecommendation}
              isLoading={isAiExecuting}
            >
              Execute Match
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="py-2 text-xs font-bold"
              onClick={() => navigate('/ai')}
            >
              Review Decision
            </Button>
          </div>

        </div>

      </div>

      {/* 🌟 4. COMMUNITY IMPACT & TIME-SERIES PROFILE */}
      <div className="rounded-3xl bg-white border border-[rgba(23,56,43,0.08)] p-6 sm:p-8 shadow-card space-y-6">
        <SectionHeader
          title="Community Renewable Impact & 24h Profile"
          subtitle="Real-time diurnals, battery balancing, and grid reliance metrics for Guwahati cluster"
          rightAction={
            <div className="flex items-center gap-2">
              {onOpenDemoModal && (
                <Button variant="ghost" size="xs" onClick={onOpenDemoModal} icon={<FaIcon name="scenarios" className="text-[#E5A72D]" />}>
                  Run Scenarios
                </Button>
              )}
            </div>
          }
        />

        {/* 3 Impact Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#E6F5EC]/50 border border-[#1E9B67]/20 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#1E9B67] flex items-center justify-center text-sm shadow-xs flex-shrink-0">
              <FaIcon name="leaf" />
            </div>
            <div>
              <div className="text-xl font-black text-[#12382A]">84.2%</div>
              <div className="text-xs text-[#5E6B63] font-medium">Renewable Self-Consumption</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FFF7E4]/50 border border-[#E5A72D]/20 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#E5A72D] flex items-center justify-center text-sm shadow-xs flex-shrink-0">
              <FaIcon name="rupee" />
            </div>
            <div>
              <div className="text-xl font-black text-[#12382A]">₹4.48 / kWh</div>
              <div className="text-xs text-[#5E6B63] font-medium">Average P2P Peer Tariff</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#EDF3FD]/50 border border-[#3979D0]/20 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#3979D0] flex items-center justify-center text-sm shadow-xs flex-shrink-0">
              <FaIcon name="shield" />
            </div>
            <div>
              <div className="text-xl font-black text-[#12382A]">-32.0%</div>
              <div className="text-xs text-[#5E6B63] font-medium">Peak Grid Strain Reduction</div>
            </div>
          </div>
        </div>

        {/* Clean 24h Profile Chart */}
        <div className="h-64 sm:h-72 w-full pt-2">
          <LiveEnergyChart history={chartHistory} />
        </div>
      </div>

      {/* 🌟 5. RECENT BILATERAL ACTIVITY (Progressive Disclosure) */}
      <div className="rounded-3xl bg-white border border-[rgba(23,56,43,0.08)] p-6 sm:p-8 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(23,56,43,0.06)]">
          <div>
            <h3 className="text-base font-extrabold text-[#15221B]">
              Recent P2P Bilateral Settlements
            </h3>
            <p className="text-xs text-[#5E6A63]">
              Executed local trades between community households
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/transactions')}
            className="text-xs font-bold text-[#1E9B67] hover:underline"
          >
            View Full Ledger →
          </button>
        </div>

        <div className="space-y-2.5">
          {transactions.slice(0, 3).map((tx) => (
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
                  <div className="text-[11px] text-[#5E6A63]">{tx.time} • Local Double-Auction Settlement</div>
                </div>
              </div>

              <div className="text-right space-y-0.5">
                <div className="font-mono font-bold text-[#1E9B67]">
                  {tx.energyKwh.toFixed(1)} kWh @ ₹{tx.pricePerKwh.toFixed(2)}/kWh
                </div>
                <Badge variant="surplus" size="xs">SETTLED</Badge>
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
          onConfirm={() => setIsConfirmModalOpen(false)}
        />
      )}

    </div>
  );
}
