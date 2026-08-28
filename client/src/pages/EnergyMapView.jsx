import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import CommunityScene3D, { NODE_3D_POSITIONS } from '../components/energy-map-3d/CommunityScene3D';
import StatusBadge from '../components/StatusBadge';
import { LoadingState, ErrorState } from '../components/StateFeedback';
import FaIcon from '../components/icons/FaIcon';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function EnergyMapView() {
  const [observeData, setObserveData] = useState(null);
  const [trades, setTrades] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState('house_a');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Demo sequence runner states
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoStage, setDemoStage] = useState(0); // 0 = idle, 1 = trade, 2 = store, 3 = export, 4 = full
  const [demoStatusText, setDemoStatusText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const sceneRef = useRef();
  const demoTimersRef = useRef([]);

  const clearAllDemoTimers = () => {
    demoTimersRef.current.forEach(t => clearTimeout(t));
    demoTimersRef.current = [];
  };

  // Fetch live microgrid telemetry and state from backend
  const fetchMapTelemetry = async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true);
      const [sumRes, batRes, tradeRes, decRes, predRes] = await Promise.all([
        api.getEnergySummary(),
        api.getBattery(),
        api.getP2PTrades(),
        api.getDecisions(),
        api.getMLPredictions(),
      ]);

      if (sumRes.data?.status === 'SUCCESS') {
        setObserveData({
          summary: sumRes.data.summary,
          households: sumRes.data.households || [],
          battery: batRes.data?.battery || { current_soc: 40.0, capacity_kwh: 50.0 },
        });
      }

      if (tradeRes.data?.status === 'SUCCESS') {
        setTrades(tradeRes.data.trades || []);
      }

      if (decRes.data?.status === 'SUCCESS') {
        setDecisions(decRes.data.decisions || []);
      }

      if (predRes.data?.status === 'SUCCESS') {
        setPredictions(predRes.data.predictions || []);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to load live map telemetry:', err);
      if (!observeData) setError('Failed to connect to backend microgrid telemetry.');
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchMapTelemetry();
    const interval = setInterval(() => {
      if (!isDemoRunning) fetchMapTelemetry();
    }, 6000);
    return () => {
      clearInterval(interval);
      clearAllDemoTimers();
    };
  }, [isDemoRunning]);

  // Demo sequence execution
  const handleRunDemo = async () => {
    clearAllDemoTimers();
    setIsDemoRunning(true);
    setDemoStage(1);
    setDemoStatusText('Step 1: House A (Surplus) sells 2.80 kW to House B (Deficit) @ ₹4.50/kWh');

    try {
      await api.runDemoScenario();
      await fetchMapTelemetry();

      const t1 = setTimeout(() => {
        setDemoStage(2);
        setDemoStatusText('Step 2: Residual 1.20 kW prosumer surplus routed into Central Battery');
      }, 4000);

      const t2 = setTimeout(() => {
        setDemoStage(3);
        setDemoStatusText('Step 3: 0.70 kW excess exported to Utility Substation Grid @ ₹6.10/kWh');
      }, 8000);

      const t3 = setTimeout(() => {
        setDemoStage(4);
        setDemoStatusText('Multi-node community energy balance complete. All active links energized.');
        setIsDemoRunning(false);
      }, 12000);

      demoTimersRef.current.push(t1, t2, t3);
    } catch (err) {
      console.error(err);
      setIsDemoRunning(false);
    }
  };

  const handleResetDemo = async () => {
    clearAllDemoTimers();
    setIsResetting(true);
    setDemoStatusText('');
    setDemoStage(0);
    try {
      await api.resetDemo();
      await fetchMapTelemetry();
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetView = () => {
    if (sceneRef.current) {
      sceneRef.current.resetCamera();
    }
  };

  if (loading && !observeData) {
    return <LoadingState message="Connecting to 3D Digital Twin & Sensor Mesh..." />;
  }

  if (error && !observeData) {
    return <ErrorState message={error} onRetry={() => fetchMapTelemetry(true)} />;
  }

  // Derive household telemetry
  const households = observeData?.households || [
    { id: 'house_a', name: 'House A (Solar)', generation: 6.8, consumption: 2.1, status: 'SURPLUS' },
    { id: 'house_b', name: 'House B (Consumer)', generation: 1.2, consumption: 4.0, status: 'DEFICIT' },
    { id: 'house_c', name: 'House C (Prosumer)', generation: 3.5, consumption: 2.5, status: 'SURPLUS' },
    { id: 'house_d', name: 'House D (Apartment)', generation: 0.8, consumption: 2.0, status: 'DEFICIT' },
    { id: 'house_e', name: 'House E (Villa)', generation: 4.2, consumption: 3.1, status: 'SURPLUS' },
  ];

  const batterySoc = observeData?.battery?.current_soc ?? 40.0;
  const gridPrice = observeData?.summary?.base_grid_price ?? 6.10;
  const totalGen = observeData?.summary?.total_generation_kw ?? households.reduce((sum, h) => sum + (h.generation || 0), 0);
  const totalCon = observeData?.summary?.total_consumption_kw ?? households.reduce((sum, h) => sum + (h.consumption || 0), 0);
  const netBalance = totalGen - totalCon;

  // Node lookup map for inspector
  const nodeStats = households.reduce((acc, h) => {
    acc[h.id] = {
      ...h,
      net_energy_kw: (h.generation || 0) - (h.consumption || 0),
      generation_kw: h.generation || 0,
      consumption_kw: h.consumption || 0,
    };
    return acc;
  }, {});

  // Compute active 3D flow conduits
  const active3DFlows = [];

  if (isDemoRunning || demoStage > 0) {
    if (demoStage >= 1) {
      active3DFlows.push({
        id: 'demo-p2p',
        start: NODE_3D_POSITIONS['house_a'],
        end: NODE_3D_POSITIONS['house_b'],
        kw: 2.80,
        tariff: '₹4.50/kWh',
        type: 'P2P_TRADE',
        color: '#059669', // Emerald
        isActive: true,
      });
    }
    if (demoStage >= 2) {
      active3DFlows.push({
        id: 'demo-storage',
        start: NODE_3D_POSITIONS['house_a'],
        end: NODE_3D_POSITIONS['COMMUNITY_BATTERY'],
        kw: 1.20,
        tariff: 'Storage Buffer',
        type: 'STORAGE_INJECT',
        color: '#0d9488', // Teal
        isActive: true,
      });
    }
    if (demoStage >= 3) {
      active3DFlows.push({
        id: 'demo-grid',
        start: NODE_3D_POSITIONS['house_a'],
        end: NODE_3D_POSITIONS['MAIN_UTILITY_GRID'],
        kw: 0.70,
        tariff: 'Grid Export',
        type: 'GRID_EXPORT',
        color: '#d97706', // Amber
        isActive: true,
      });
    }
  } else {
    // 1. Bilateral P2P Trade Flows
    trades
      .filter((t) => t.status === 'COMPLETED' || t.status === 'MATCHED')
      .slice(0, 3)
      .forEach((t) => {
        const startPos = NODE_3D_POSITIONS[t.seller_id];
        const endPos = NODE_3D_POSITIONS[t.buyer_id];
        if (startPos && endPos) {
          active3DFlows.push({
            id: `trade-${t.id}`,
            start: startPos,
            end: endPos,
            kw: t.energy_kwh,
            tariff: `₹${t.price_per_kwh?.toFixed(2)}/kWh`,
            type: 'P2P_TRADE',
            color: '#059669', // Emerald
            isActive: true,
          });
        }
      });

    // 2. Battery Storage Injections
    decisions
      .filter((d) => d.action === 'STORE' || d.action === 'BATTERY_CHARGE')
      .slice(0, 2)
      .forEach((d) => {
        const startPos = NODE_3D_POSITIONS[d.source_household];
        const endPos = NODE_3D_POSITIONS['COMMUNITY_BATTERY'];
        if (startPos && endPos) {
          active3DFlows.push({
            id: `store-${d.id}`,
            start: startPos,
            end: endPos,
            kw: d.energy_kwh,
            tariff: 'Storage Buffer',
            type: 'STORAGE_INJECT',
            color: '#0d9488', // Teal
            isActive: true,
          });
        }
      });

    // 3. Grid Export Actions
    decisions
      .filter((d) => d.action === 'GRID_EXPORT')
      .slice(0, 2)
      .forEach((d) => {
        const startPos = NODE_3D_POSITIONS[d.source_household];
        const endPos = NODE_3D_POSITIONS['MAIN_UTILITY_GRID'];
        if (startPos && endPos) {
          active3DFlows.push({
            id: `grid-exp-${d.id}`,
            start: startPos,
            end: endPos,
            kw: d.energy_kwh,
            tariff: 'Grid Export',
            type: 'GRID_EXPORT',
            color: '#d97706', // Amber
            isActive: true,
          });
        }
      });

    // Default active flow if database clean baseline
    if (active3DFlows.length === 0) {
      active3DFlows.push({
        id: 'fallback-p2p',
        start: NODE_3D_POSITIONS['house_a'],
        end: NODE_3D_POSITIONS['house_b'],
        kw: 2.80,
        tariff: '₹4.50/kWh',
        type: 'P2P_TRADE',
        color: '#059669',
        isActive: true,
      });
    }
  }

  // Selected Node Details
  const selectedNodeInfo = selectedNode ? (
    selectedNode === 'COMMUNITY_BATTERY' ? {
      name: 'Central Community Battery',
      household_type: 'BATTERY',
      status: 'STORE',
      generation_kw: 0,
      consumption_kw: 0,
      net_energy_kw: 0,
      battery_soc: batterySoc,
      predicted_demand: 'Buffer Safe',
      recent_action: 'Buffering local excess prosumer solar yield',
    } : selectedNode === 'MAIN_UTILITY_GRID' ? {
      name: 'Utility Substation Interconnection',
      household_type: 'GRID',
      status: 'GRID_EXPORT',
      generation_kw: 0,
      consumption_kw: 0,
      net_energy_kw: 0,
      battery_soc: null,
      predicted_demand: `Grid Tariff: ₹${gridPrice.toFixed(2)}/kWh`,
      recent_action: 'Receiving residual microgrid export & backup supply',
    } : {
      ...(nodeStats[selectedNode] || {}),
      name: selectedNode === 'house_a' ? 'House A (Solar Champion)' :
            selectedNode === 'house_b' ? 'House B (Heavy EV Load)' :
            selectedNode === 'house_c' ? 'House C (Balanced Prosumer)' :
            selectedNode === 'house_d' ? 'House D (Smart Apartment)' :
            'House E (Solar Villa)',
      predicted_demand: predictions.find(p => p.household_id === selectedNode)?.predicted_demand_kw ?
        `${predictions.find(p => p.household_id === selectedNode).predicted_demand_kw.toFixed(2)} kW` :
        selectedNode === 'house_a' ? '3.20 kW' : '4.10 kW',
      recent_action: decisions.find(d => d.source_household === selectedNode || d.target === selectedNode)?.action ||
        (nodeStats[selectedNode]?.status === 'SURPLUS' ? 'Local Trade Seller' : 'Local Trade Buyer'),
    }
  ) : null;

  return (
    <div className="space-y-4">
      {/* 3D Interactive Energy Map Container */}
      <div className="relative h-[640px] w-full rounded-2xl border border-slate-200 bg-white shadow-card overflow-hidden">
        {/* 3D Canvas Scene */}
        <CommunityScene3D
          ref={sceneRef}
          households={households}
          batterySoc={batterySoc}
          gridPrice={gridPrice}
          activeFlows={active3DFlows}
          selectedNode={selectedNode}
          onSelectNode={(nodeId) => setSelectedNode(nodeId)}
        />

        {/* Top-Left Header Overlay */}
        <div className="absolute top-4 left-4 z-10 select-none">
          <div className="rounded-xl border border-slate-200/90 bg-white/95 p-3.5 shadow-md backdrop-blur-md">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
                <FaIcon name="network" />
              </div>
              <h2 className="text-sm font-extrabold tracking-tight text-slate-900">LIVE ENERGY MAP</h2>
              <Badge variant="surplus" size="xs">
                SIMULATED COMMUNITY DATA
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Interactive 3D spatial microgrid energy-flow topology
            </p>
          </div>
        </div>

        {/* Top-Right Controls Overlay */}
        <div className="absolute top-4 right-4 z-10 flex flex-wrap items-center gap-2 select-none">
          <div className="flex items-center rounded-xl border border-slate-200/90 bg-white/95 p-1 shadow-md backdrop-blur-md space-x-1.5">
            <button
              type="button"
              onClick={handleResetView}
              className="flex items-center space-x-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition active:scale-95"
              title="Reset 3D camera to default orientation"
            >
              <FaIcon name="camera" className="text-xs text-slate-500 mr-1" />
              <span>Reset View</span>
            </button>

            <button
              type="button"
              onClick={() => fetchMapTelemetry(true)}
              disabled={isRefreshing}
              className="flex items-center space-x-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition active:scale-95 disabled:opacity-50"
              title="Sync live telemetry"
            >
              <FaIcon name="refresh" className={`text-xs ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>

            <button
              type="button"
              onClick={handleResetDemo}
              disabled={isResetting}
              className="flex items-center space-x-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
            >
              <FaIcon name="refresh" className={`text-xs ${isResetting ? 'animate-spin' : ''}`} />
              <span>Reset Demo</span>
            </button>

            <button
              type="button"
              onClick={handleRunDemo}
              disabled={isDemoRunning}
              className="flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition active:scale-95 disabled:opacity-50"
            >
              <FaIcon name={isDemoRunning ? "refresh" : "play"} className={`text-xs ${isDemoRunning ? "animate-spin" : ""}`} />
              <span>{isDemoRunning ? 'Running Demo...' : 'Run Demo'}</span>
            </button>
          </div>
        </div>

        {/* Demo Stage Live Progress Banner */}
        {demoStatusText && (
          <div className="absolute top-18 left-1/2 -translate-x-1/2 z-10 select-none max-w-xl w-full px-4">
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/95 p-2.5 shadow-lg backdrop-blur-md text-center text-xs font-bold text-emerald-950 animate-in fade-in slide-in-from-top-2">
              <span className="mr-2">⚡</span>
              <span>{demoStatusText}</span>
            </div>
          </div>
        )}

        {/* Bottom-Left Map Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-10 select-none hidden sm:block">
          <div className="rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-md backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Map Legend</span>
            <div className="mt-1.5 grid grid-cols-2 gap-x-3.5 gap-y-1 text-[11px] font-semibold text-slate-700">
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>Surplus (Solar)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span>Deficit (Load)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-600" />
                <span>Battery (Storage)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                <span>Grid Substation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-Right Community Summary Overlay */}
        <div className="absolute bottom-4 right-4 z-10 select-none">
          <div className="rounded-xl border border-slate-200/90 bg-white/95 p-3.5 shadow-md backdrop-blur-md text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Community Summary</span>
              <span className="font-mono text-[10px] font-bold text-emerald-700">5 Smart Nodes</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 text-[10px]">Generation: </span>
                <span className="font-bold text-amber-700">{totalGen.toFixed(1)} kW</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Demand: </span>
                <span className="font-bold text-blue-700">{totalCon.toFixed(1)} kW</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Net Surplus: </span>
                <span className={`font-bold ${netBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {netBalance >= 0 ? `+${netBalance.toFixed(1)}` : netBalance.toFixed(1)} kW
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Battery SOC: </span>
                <span className="font-bold text-teal-700">{batterySoc.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Node 3D Inspector Panel (Slide-in on click) */}
        {selectedNodeInfo && (
          <div className="absolute top-18 right-4 z-20 w-72 select-none animate-in fade-in slide-in-from-right-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl backdrop-blur-md">
              <div className="flex items-start justify-between pb-2.5 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inspecting Node</span>
                  <h4 className="text-xs font-bold text-slate-900">{selectedNodeInfo.name}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition text-xs font-bold"
                >
                  <FaIcon name="close" className="text-xs" />
                </button>
              </div>

              <div className="mt-2.5 space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Status:</span>
                  <StatusBadge status={selectedNodeInfo.status || selectedNodeInfo.household_type} />
                </div>
                {selectedNodeInfo.generation_kw > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Solar Generation:</span>
                    <span className="font-mono font-bold text-amber-600">{selectedNodeInfo.generation_kw.toFixed(2)} kW</span>
                  </div>
                )}
                {selectedNodeInfo.consumption_kw > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Active Demand:</span>
                    <span className="font-mono font-bold text-blue-600">{selectedNodeInfo.consumption_kw.toFixed(2)} kW</span>
                  </div>
                )}
                {selectedNodeInfo.net_energy_kw !== 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Net Balance:</span>
                    <span className={`font-mono font-bold ${selectedNodeInfo.net_energy_kw >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {selectedNodeInfo.net_energy_kw >= 0 ? `+${selectedNodeInfo.net_energy_kw.toFixed(2)}` : selectedNodeInfo.net_energy_kw.toFixed(2)} kW
                    </span>
                  </div>
                )}
                {selectedNodeInfo.predicted_demand && (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Forecast / Capacity:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedNodeInfo.predicted_demand}</span>
                  </div>
                )}
                <div className="py-1">
                  <span className="text-slate-500 text-[11px]">Recent Routing Action:</span>
                  <p className="font-semibold text-slate-800 text-[11px] mt-0.5 leading-snug">
                    {selectedNodeInfo.recent_action}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active 3D Power Routing Links Detail Strip */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-card">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5">
          <div className="flex items-center space-x-2">
            <FaIcon name="solar" className="text-emerald-600 text-sm" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Active 3D Energy Routing Conduits
            </h3>
          </div>
          <Badge variant="surplus" size="xs">
            {active3DFlows.length} Active Conduits
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {active3DFlows.map((flow) => (
            <div key={flow.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: flow.color }} />
                <span className="font-mono font-bold text-slate-900">{flow.kw.toFixed(2)} kW</span>
                <span className="rounded bg-white border border-slate-200 px-1.5 py-0.2 text-[10px] font-bold text-slate-700">
                  {flow.type}
                </span>
              </div>
              <span className="font-mono font-bold text-emerald-800 text-[11px]">{flow.tariff}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
