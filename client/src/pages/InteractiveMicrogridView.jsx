import React, { useState, useRef, useMemo } from 'react';
import {
  INITIAL_DEMO_STATE,
  computeHouseholdStates,
} from '../services/marketEngine';
import MarketplaceScene3D, { MARKET_3D_POSITIONS } from '../components/energy-map-3d/MarketplaceScene3D';
import HeroMetric from '../components/ui/HeroMetric';
import GlassSurface from '../components/ui/GlassSurface';
import FaIcon from '../components/icons/FaIcon';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function InteractiveMicrogridView() {
  // Master Simulation State
  const [households] = useState(INITIAL_DEMO_STATE.households);
  const [battery] = useState(INITIAL_DEMO_STATE.battery);
  const [grid] = useState(INITIAL_DEMO_STATE.grid);
  const [orders] = useState({
    sellOrders: [
      { id: 'GS-SELL-001', household_id: 'house_a', energy_kwh: 2.8, min_price_per_kwh: 4.5, remaining_kwh: 2.8, status: 'OPEN' }
    ],
    buyOrders: [],
  });
  const [transactions] = useState([
    { id: 'TX-GS-001', time: '12:30', sellerId: 'HOUSE_A', buyerId: 'HOUSE_B', energyKwh: 2.8, pricePerKwh: 4.5, totalValue: 12.6, paymentStatus: 'SETTLED', energyFlowStatus: 'TRANSFERRED', status: 'COMPLETED' }
  ]);
  const [selectedNodeId, setSelectedNodeId] = useState('house_a');
  const [statusMessage, setStatusMessage] = useState('');

  const sceneRef = useRef();

  // Compute live household accounting
  const computedHouseholds = useMemo(() => {
    return computeHouseholdStates(households, orders.sellOrders, orders.buyOrders, transactions);
  }, [households, orders, transactions]);

  // Total community metrics
  const totalGen = computedHouseholds.reduce((acc, h) => acc + h.generation, 0);
  const totalCon = computedHouseholds.reduce((acc, h) => acc + h.consumption, 0);
  const netCommunity = Math.round((totalGen - totalCon) * 100) / 100;
  const isSurplus = netCommunity >= 0;

  // Active Flow Conduits
  const activeFlows = useMemo(() => {
    const flows = [];
    flows.push({
      id: 'flow-p2p-1',
      start: MARKET_3D_POSITIONS['house_a'],
      end: MARKET_3D_POSITIONS['house_b'],
      kw: 2.8,
      tariff: '₹4.50/kWh',
      type: 'P2P_TRANSFER',
      color: '#1E9B67',
      isActive: true,
    });
    flows.push({
      id: 'flow-battery-1',
      start: MARKET_3D_POSITIONS['house_a'],
      end: MARKET_3D_POSITIONS['battery'],
      kw: 1.2,
      tariff: 'ESS Buffer',
      type: 'BATTERY_CHARGE',
      color: '#E5A72D',
      isActive: true,
    });
    flows.push({
      id: 'flow-grid-1',
      start: MARKET_3D_POSITIONS['house_a'],
      end: MARKET_3D_POSITIONS['grid'],
      kw: 0.7,
      tariff: '₹6.10/kWh',
      type: 'GRID_EXPORT',
      color: '#3979D0',
      isActive: true,
    });
    return flows;
  }, []);

  const activeNode = computedHouseholds.find((h) => h.id === selectedNodeId) || computedHouseholds[0];
  const nodeNet = (activeNode?.generation || 0) - (activeNode?.consumption || 0);

  return (
    <div className="space-y-6 max-w-[1520px] mx-auto pb-12 select-none animate-fadeIn">

      {/* 🌟 1. COMPACT PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[rgba(23,34,29,0.06)]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#041D0D]">
              Live Microgrid Twin
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E2F0CC] text-[#012F13] border border-[#BED69E]">
              {netCommunity >= 0 ? `+${netCommunity.toFixed(1)} kW Surplus` : `${netCommunity.toFixed(1)} kW Deficit`}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4A5B4F] mt-0.5">
            Real-time power routing across prosumers, smart circuits, 20 kWh central ESS, and utility grid
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => sceneRef.current?.setTopDownView?.()}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#BED69E] text-[#011207] text-xs font-bold hover:bg-[#F4F9EB] transition flex items-center gap-1.5 shadow-xs"
          >
            <FaIcon name="network" />
            <span>Top-Down</span>
          </button>
          <button
            type="button"
            onClick={() => sceneRef.current?.resetCamera?.()}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#BED69E] text-[#011207] text-xs font-bold hover:bg-[#F4F9EB] transition flex items-center gap-1.5 shadow-xs"
          >
            <FaIcon name="refresh" />
            <span>Reset 3D</span>
          </button>
        </div>
      </div>



      {/* 🌟 3. EXPANSIVE 3D DIGITAL TWIN (75-80% Screen Presence) */}
      <div className="relative glass-card rounded-xl p-3 sm:p-5 overflow-hidden">

        <div className="h-[520px] sm:h-[620px] w-full relative rounded-xl overflow-hidden bg-[#F6F7F4] border border-[rgba(23,34,29,0.05)]">
          <MarketplaceScene3D
            ref={sceneRef}
            households={computedHouseholds}
            battery={battery}
            grid={grid}
            activeFlows={activeFlows}
            selectedNode={selectedNodeId}
            onSelectNode={(node) => setSelectedNodeId(node.id)}
          />

          {/* Floating Glass Controls Top-Left */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 p-1.5 rounded-xl gs-glass shadow-xs z-10">
            <button
              type="button"
              onClick={() => sceneRef.current?.resetCamera?.()}
              className="px-3 py-1.5 text-xs font-bold text-[#17221D] hover:bg-white/80 rounded-lg transition flex items-center gap-1.5"
            >
              <FaIcon name="refresh" className="text-[10px] text-[#5E6963]" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={() => sceneRef.current?.setTopDownView?.()}
              className="px-3 py-1.5 text-xs font-bold text-[#17221D] hover:bg-white/80 rounded-lg transition flex items-center gap-1.5"
            >
              <FaIcon name="network" className="text-[10px] text-[#5E6963]" />
              <span>Top-Down</span>
            </button>

            <span className="w-px h-4 bg-[rgba(23,34,29,0.15)] mx-0.5" />

            <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold text-[#1E9B68]">
              <span className="w-2 h-2 rounded-full bg-[#1E9B68] animate-pulse" />
              <span>{activeFlows.length} Active Flow Conduits</span>
            </div>
          </div>

          {/* Floating Glass Node Inspector Card Bottom-Right */}
          {activeNode && (
            <div className="absolute bottom-4 right-4 max-w-sm w-full p-5 rounded-xl gs-glass shadow-lg z-10 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(23,34,29,0.08)]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-xs">
                    <FaIcon name="home" />
                  </div>
                  <span className="text-xs font-extrabold text-[#17221D]">{activeNode.name}</span>
                </div>
                <Badge variant={nodeNet >= 0 ? 'surplus' : 'deficit'} size="xs">
                  {nodeNet >= 0 ? 'SURPLUS' : 'DEFICIT'}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-white/70 border border-[rgba(23,34,29,0.05)]">
                  <div className="text-[10px] text-[#5E6963] uppercase font-bold">Solar</div>
                  <div className="font-mono font-bold text-[#E5A72D]">{activeNode.generation.toFixed(1)} kW</div>
                </div>
                <div className="p-2 rounded-lg bg-white/70 border border-[rgba(23,34,29,0.05)]">
                  <div className="text-[10px] text-[#5E6963] uppercase font-bold">Demand</div>
                  <div className="font-mono font-bold text-[#17221D]">{activeNode.consumption.toFixed(1)} kW</div>
                </div>
                <div className="p-2 rounded-lg bg-white/70 border border-[rgba(23,34,29,0.05)]">
                  <div className="text-[10px] text-[#5E6963] uppercase font-bold">Net</div>
                  <div className={`font-mono font-bold ${nodeNet >= 0 ? 'text-[#1E9B68]' : 'text-[#D45C5C]'}`}>
                    {nodeNet >= 0 ? `+${nodeNet.toFixed(1)}` : nodeNet.toFixed(1)} kW
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Node Selector Pills Bottom-Left */}
          <div className="absolute bottom-4 left-4 hidden sm:flex items-center gap-1.5 p-1.5 rounded-2xl gs-glass shadow-sm z-10">
            {computedHouseholds.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setSelectedNodeId(h.id)}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition ${selectedNodeId === h.id
                  ? 'bg-[#12382A] text-white shadow-xs'
                  : 'text-[#5E6B63] hover:text-[#15221B] hover:bg-white/60'
                  }`}
              >
                {h.id.toUpperCase().replace('_', ' ')}
              </button>
            ))}
          </div>

        </div>

      </div>
      {/* 🌟 2. METRIC STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <HeroMetric
          label="Total Generation"
          value={totalGen.toFixed(1)}
          unit="kW"
          subtitle="Rooftop solar irradiance"
          iconName="solar"
          variant="solar"
        />

        <HeroMetric
          label="Total Demand"
          value={totalCon.toFixed(1)}
          unit="kW"
          subtitle="Residential loads & EV draws"
          iconName="home"
          variant="default"
        />

        <HeroMetric
          label="Net Microgrid Balance"
          value={netCommunity >= 0 ? `+${netCommunity.toFixed(1)}` : `${netCommunity.toFixed(1)}`}
          unit="kW"
          subtitle={isSurplus ? "Zero external grid import required" : "Drawing from community ESS buffer"}
          iconName="network"
          variant={isSurplus ? "emerald" : "default"}
        />

        <HeroMetric
          label="Community Battery"
          value={`${battery.soc.toFixed(0)}%`}
          unit="SOC"
          subtitle="50 kWh central storage unit"
          iconName="battery"
          variant="solar"
        />
      </div>

    </div>
  );
}
