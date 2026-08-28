import React, { useState, useRef, useMemo } from 'react';
import {
  INITIAL_DEMO_STATE,
  computeHouseholdStates,
} from '../services/marketEngine';
import MarketplaceScene3D, { MARKET_3D_POSITIONS } from '../components/energy-map-3d/MarketplaceScene3D';
import MetricCard from '../components/ui/MetricCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import FaIcon from '../components/icons/FaIcon';

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
  const [selectedNode, setSelectedNode] = useState('house_a');
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
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

  // Compute semantic 3D active conduits
  const activeFlows = useMemo(() => {
    const flows = [];
    
    // P2P Local Trade Flow (Green)
    flows.push({
      id: 'flow-p2p-1',
      start: MARKET_3D_POSITIONS['house_a'],
      end: MARKET_3D_POSITIONS['house_b'],
      kw: 2.8,
      tariff: '₹4.50/kWh',
      type: 'P2P_TRANSFER',
      color: '#209B67',
      isActive: true,
    });

    // Battery Storage Injection (Amber)
    flows.push({
      id: 'flow-battery-1',
      start: MARKET_3D_POSITIONS['house_a'],
      end: MARKET_3D_POSITIONS['battery'],
      kw: 1.2,
      tariff: 'ESS Buffer',
      type: 'BATTERY_CHARGE',
      color: '#E7AA31',
      isActive: true,
    });

    // Utility Grid Export (Blue)
    flows.push({
      id: 'flow-grid-1',
      start: MARKET_3D_POSITIONS['house_a'],
      end: MARKET_3D_POSITIONS['grid'],
      kw: 0.7,
      tariff: '₹6.10/kWh',
      type: 'GRID_EXPORT',
      color: '#397BD2',
      isActive: true,
    });

    return flows;
  }, [computedHouseholds, battery, grid]);

  const selectedHouseholdData = useMemo(() => {
    return computedHouseholds.find((h) => h.id === selectedNode) || computedHouseholds[0];
  }, [computedHouseholds, selectedNode]);

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto pb-8 select-none">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#15211B] tracking-tight">
              3D Spatial Energy Network
            </h1>
            <Badge variant="surplus" size="sm">
              Live Digital Twin
            </Badge>
          </div>
          <p className="text-sm text-[#5E6A63] font-medium mt-1">
            Guwahati microgrid topology with physical power vectors: Solar ➔ Prosumer ➔ Consumer ➔ Battery ➔ Grid.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => sceneRef.current?.resetCamera()}
            icon={<FaIcon name="rotate" />}
          >
            Reset Camera
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            icon={<FaIcon name="sliders" />}
          >
            {isDrawerOpen ? 'Hide Inspector' : 'Inspect Node'}
          </Button>
        </div>
      </div>

      {/* Dynamic Status Message */}
      {statusMessage && (
        <div className="flex items-center justify-between rounded-2xl border border-[#DCE4DE] bg-[#E7F6EE] px-4 py-2.5 text-sm text-[#12392B] font-bold shadow-subtle">
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage('')} className="text-[#209B67] text-xs font-bold p-1">
            ✕
          </button>
        </div>
      )}

      {/* 🌟 1. PRIMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <MetricCard
          title="Total Generation"
          value={`${totalGen.toFixed(1)} kW`}
          subtitle="Community solar yield"
          iconName="solar"
          variant="solar"
          delta="100% clean solar"
          deltaType="positive"
        />

        <MetricCard
          title="Total Demand"
          value={`${totalCon.toFixed(1)} kW`}
          subtitle="Aggregate household loads"
          iconName="home"
          variant="default"
          delta="5 residential nodes"
          deltaType="neutral"
        />

        <MetricCard
          title="Community Net"
          value={`${isSurplus ? '+' : ''}${netCommunity.toFixed(1)} kW`}
          subtitle={isSurplus ? "Renewable surplus ready for P2P" : "Net deficit buffered by ESS"}
          iconName="network"
          variant={isSurplus ? "surplus" : "deficit"}
          badge={isSurplus ? "SURPLUS" : "DEFICIT"}
        />

        <MetricCard
          title="Community ESS"
          value={`${battery.soc.toFixed(0)}%`}
          subtitle="50 kWh centralized storage"
          iconName="battery"
          variant="battery"
          badge="SAFE RESERVE"
        />
      </div>

      {/* 🌟 2. CENTERPIECE 3D SPATIAL DIGITAL TWIN + SLIDE-IN INSPECTOR */}
      <div className="relative rounded-3xl border border-[#DCE4DE] bg-white p-5 sm:p-6 shadow-card overflow-hidden">
        
        {/* 3D Scene Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE4DE]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-[#E7F6EE] text-[#209B67] flex items-center justify-center text-sm flex-shrink-0">
              <FaIcon name="network" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#15211B] tracking-tight">
                Interactive Microgrid Canvas
              </h3>
              <p className="text-xs text-[#5E6A63]">
                Click any household building or battery asset to inspect live physical telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => sceneRef.current?.topView()}
              className="px-2.5 py-1 rounded-lg border border-[#DCE4DE] bg-[#F5F7F3] text-xs font-semibold text-[#15211B] hover:bg-white transition hidden sm:inline-flex"
            >
              Top-Down
            </button>
            <button
              type="button"
              onClick={() => sceneRef.current?.marketView()}
              className="px-2.5 py-1 rounded-lg border border-[#DCE4DE] bg-[#F5F7F3] text-xs font-semibold text-[#15211B] hover:bg-white transition hidden sm:inline-flex"
            >
              Perspective
            </button>
          </div>
        </div>

        {/* 3D Viewport */}
        <div className="mt-4 h-[480px] sm:h-[540px] w-full relative rounded-2xl overflow-hidden bg-[#F5F7F3]">
          <MarketplaceScene3D
            ref={sceneRef}
            households={computedHouseholds}
            battery={battery}
            grid={grid}
            activeFlows={activeFlows}
            selectedNode={selectedNode}
            onSelectNode={(nodeId) => {
              setSelectedNode(nodeId);
              setIsDrawerOpen(true);
            }}
          />

          {/* Floating Semantic Conduits Legend */}
          <div className="absolute top-3 left-3 pointer-events-none">
            <div className="flex flex-col gap-1.5 rounded-2xl border border-[#DCE4DE] bg-white/95 p-3 shadow-card backdrop-blur-md text-[11px] font-semibold text-[#15211B]">
              <span className="text-[10px] uppercase font-bold text-[#87918B]">Active Power Conduits</span>
              <div className="flex items-center gap-2">
                <FaIcon name="bolt" className="text-[#209B67] text-xs" />
                <span>P2P Peer Trade (Green)</span>
              </div>
              <div className="flex items-center gap-2">
                <FaIcon name="battery" className="text-[#E7AA31] text-xs" />
                <span>Battery Buffer (Amber)</span>
              </div>
              <div className="flex items-center gap-2">
                <FaIcon name="grid" className="text-[#397BD2] text-xs" />
                <span>Grid Interconnect (Blue)</span>
              </div>
            </div>
          </div>

          {/* Slide-In Node Detail Inspector */}
          {isDrawerOpen && selectedHouseholdData && (
            <div className="absolute top-3 right-3 w-80 rounded-2xl border border-[#DCE4DE] bg-white/98 p-5 shadow-modal backdrop-blur-xl animate-in fade-in slide-in-from-right duration-200 z-20">
              <div className="flex items-start justify-between pb-2.5 border-b border-[#DCE4DE]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#87918B]">
                    Node Inspector
                  </span>
                  <h4 className="text-base font-bold text-[#15211B]">
                    {selectedHouseholdData.name}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-[#87918B] hover:text-[#15211B] text-xs font-bold p-1 rounded-lg hover:bg-[#F5F7F3]"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[#EEF1EB]">
                  <span className="text-[#5E6A63]">Current State:</span>
                  <Badge variant={selectedHouseholdData.status === 'SURPLUS' ? 'surplus' : 'deficit'} size="xs">
                    {selectedHouseholdData.status}
                  </Badge>
                </div>

                <div className="flex justify-between py-1 border-b border-[#EEF1EB]">
                  <span className="text-[#5E6A63]">Solar Generation:</span>
                  <span className="font-mono font-bold text-[#E7AA31]">
                    {selectedHouseholdData.generation.toFixed(2)} kW
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-[#EEF1EB]">
                  <span className="text-[#5E6A63]">Active Consumption:</span>
                  <span className="font-mono font-bold text-[#397BD2]">
                    {selectedHouseholdData.consumption.toFixed(2)} kW
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-[#EEF1EB]">
                  <span className="text-[#5E6A63]">Net Energy Balance:</span>
                  <span className={`font-mono font-bold ${(selectedHouseholdData.netBalance ?? (selectedHouseholdData.generation - selectedHouseholdData.consumption) ?? 0) >= 0 ? 'text-[#209B67]' : 'text-[#D85D5D]'}`}>
                    {(selectedHouseholdData.netBalance ?? (selectedHouseholdData.generation - selectedHouseholdData.consumption) ?? 0) >= 0
                      ? `+${(selectedHouseholdData.netBalance ?? (selectedHouseholdData.generation - selectedHouseholdData.consumption) ?? 0).toFixed(2)}`
                      : (selectedHouseholdData.netBalance ?? (selectedHouseholdData.generation - selectedHouseholdData.consumption) ?? 0).toFixed(2)} kW
                  </span>
                </div>

                {selectedHouseholdData.battery && (
                  <div className="flex justify-between py-1 border-b border-[#EEF1EB]">
                    <span className="text-[#5E6A63]">Local Home Battery:</span>
                    <span className="font-mono font-bold text-[#D79A27]">
                      {selectedHouseholdData.battery.soc?.toFixed(0) || '0'}% SOC ({selectedHouseholdData.battery.capacity_kwh || '0'} kWh)
                    </span>
                  </div>
                )}

                <div className="pt-2">
                  <span className="text-[10.5px] font-bold text-[#7359C8] block mb-1">
                    Hornet AI Recommendation:
                  </span>
                  <p className="text-[11.5px] text-[#5E6A63] leading-relaxed">
                    {selectedHouseholdData.status === 'SURPLUS'
                      ? `Allocate ${(selectedHouseholdData.netBalance ?? (selectedHouseholdData.generation - selectedHouseholdData.consumption) ?? 0).toFixed(1)} kW surplus to neighboring deficit nodes @ ₹4.50/kWh.`
                      : `Purchase 2.0 kWh from House A to avoid peak grid tariff (save ₹1.60/kWh).`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Node Switcher Strip */}
        <div className="mt-3.5 pt-3 border-t border-[#DCE4DE] flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[#5E6A63] font-medium">Select Household Perspective:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {computedHouseholds.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  setSelectedNode(h.id);
                  setIsDrawerOpen(true);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                  selectedNode === h.id
                    ? 'bg-[#12392B] text-white shadow-xs'
                    : 'bg-[#F5F7F3] text-[#5E6A63] hover:text-[#15211B] border border-[#DCE4DE]'
                }`}
              >
                {h.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 🌟 3. ACTIVE 3D POWER ROUTING CONDUITS DETAIL STRIP */}
      <div className="rounded-3xl border border-[#DCE4DE] bg-white p-5 shadow-card">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE4DE] mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#E7F6EE] text-[#209B67] flex items-center justify-center text-xs">
              <FaIcon name="solar" />
            </div>
            <h3 className="text-base font-bold text-[#15211B]">
              Active 3D Energy Routing Conduits
            </h3>
          </div>
          <Badge variant="surplus" size="xs">
            {activeFlows.length} Active Conduits
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {activeFlows.map((flow) => (
            <div key={flow.id} className="flex items-center justify-between rounded-2xl border border-[#DCE4DE] bg-[#F5F7F3]/50 p-3.5 text-xs">
              <div className="flex items-center space-x-2.5">
                <FaIcon name="bolt" style={{ color: flow.color }} className="text-sm" />
                <span className="font-mono font-bold text-sm text-[#15211B]">{flow.kw.toFixed(2)} kW</span>
                <Badge variant="default" size="xs">
                  {flow.type}
                </Badge>
              </div>
              <span className="font-mono font-bold text-[#209B67] text-xs">{flow.tariff}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
