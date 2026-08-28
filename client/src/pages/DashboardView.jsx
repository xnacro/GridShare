import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import DashboardControlPanel from '../components/dashboard/DashboardControlPanel';
import DashboardLiveStatus from '../components/dashboard/DashboardLiveStatus';
import DashboardAnalyticsSection from '../components/dashboard/DashboardAnalyticsSection';
import TransactionLedger from '../components/marketplace/TransactionLedger';
import TradeConfirmationModal from '../components/marketplace/TradeConfirmationModal';
import { api } from '../services/api';
import FaIcon from '../components/icons/FaIcon';
import MetricCard from '../components/ui/MetricCard';
import Badge, { StatusIndicator } from '../components/ui/Badge';
import Button, { IconButton } from '../components/ui/Button';

export default function DashboardView() {
  // Master Microgrid Control State
  const [households, setHouseholds] = useState(INITIAL_DEMO_STATE.households);
  const [battery, setBattery] = useState(INITIAL_DEMO_STATE.battery);
  const [grid, setGrid] = useState(INITIAL_DEMO_STATE.grid);
  const [orders, setOrders] = useState({
    sellOrders: [
      { id: 'GS-SELL-001', household_id: 'house_a', energy_kwh: 2.0, min_price_per_kwh: 7.0, remaining_kwh: 2.0, status: 'OPEN' }
    ],
    buyOrders: [],
  });
  const [transactions, setTransactions] = useState([
    { id: 'TX-GS-001', time: '10:42', sellerId: 'HOUSE_A', buyerId: 'HOUSE_B', energyKwh: 2.0, pricePerKwh: 7.0, totalValue: 14.0, paymentStatus: 'SETTLED', energyFlowStatus: 'TRANSFERRED', status: 'COMPLETED' }
  ]);

  // Simulation Clock & Playback
  const [currentHour, setCurrentHour] = useState(12);
  const [activeScenario, setActiveScenario] = useState('NORMAL_DAY');
  const [isLiveSimulating, setIsLiveSimulating] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1); // 1x, 2x, 4x
  const [selectedNode, setSelectedNode] = useState('house_a');
  const [statusMessage, setStatusMessage] = useState('');

  // Confirmation Modal
  const [activePurchase, setActivePurchase] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSettling, setIsSettling] = useState(false);

  const sceneRef = useRef();
  const simTimerRef = useRef(null);

  // Compute live household accounting
  const computedHouseholds = useMemo(() => {
    return computeHouseholdStates(households, orders.sellOrders, orders.buyOrders, transactions);
  }, [households, orders, transactions]);

  // Dynamic 3D Flows
  const activeFlows = useMemo(() => {
    if (!isLiveSimulating && simSpeed === 0) return [];
    return calculateMicrogridFlows(households, battery, grid, MARKET_3D_POSITIONS);
  }, [households, battery, grid, isLiveSimulating, simSpeed]);

  // Dynamic 24h Time-Series Profile
  const chartHistory = useMemo(() => {
    return generate24HourProfile(households, currentHour, battery.soc);
  }, [households, currentHour, battery.soc]);

  // Total Community KPIs
  const totalGen = computedHouseholds.reduce((sum, h) => sum + h.generation, 0);
  const totalCon = computedHouseholds.reduce((sum, h) => sum + h.consumption, 0);
  const netCommunity = Math.round((totalGen - totalCon) * 100) / 100;
  const isSurplus = netCommunity >= 0;

  // Live simulation tick interval
  useEffect(() => {
    if (isLiveSimulating) {
      const intervalMs = Math.max(800, 3000 / simSpeed);
      simTimerRef.current = setInterval(() => {
        setCurrentHour((prev) => {
          const nextHour = prev >= 22 ? 6 : prev + 1;
          applyHourSolarLoad(nextHour);
          return nextHour;
        });
      }, intervalMs);
    } else {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    }
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isLiveSimulating, simSpeed]);

  // Adjust solar and load for a specific hour
  const applyHourSolarLoad = (hour) => {
    const sMult = DIURNAL_PROFILES.solarMultiplier[hour] || 0;
    const lMult = DIURNAL_PROFILES.loadMultiplier[hour] || 1;

    setHouseholds((prev) =>
      prev.map((h) => {
        let baseGen = h.hasSolar ? (h.id === 'house_a' ? 6.8 : 3.5) : 0;
        let baseCon = h.id === 'house_a' ? 2.1 : h.id === 'house_b' ? 4.0 : 2.5;

        const newGen = Math.round(baseGen * sMult * 10) / 10;
        const newCon = Math.round(baseCon * (lMult / 1.1) * 10) / 10;

        return {
          ...h,
          generation: newGen,
          consumption: newCon,
        };
      })
    );
  };

  // 1. Change Simulated Time
  const handleChangeHour = (hour) => {
    setCurrentHour(hour);
    applyHourSolarLoad(hour);
    setStatusMessage(`Simulated time set to ${String(hour).padStart(2, '0')}:00.`);
  };

  // 2. Apply Scenario Preset
  const handleApplyScenario = (scenarioKey) => {
    const sc = PRESET_SCENARIOS[scenarioKey];
    if (!sc) return;
    setActiveScenario(scenarioKey);
    setCurrentHour(sc.hour || 12);
    setHouseholds((prev) =>
      prev.map((h) => {
        const scHouse = sc.households.find((sh) => sh.id === h.id);
        return scHouse
          ? { ...h, generation: scHouse.generation, consumption: scHouse.consumption }
          : h;
      })
    );
    setBattery((prev) => ({
      ...prev,
      soc: sc.battery?.soc || 40,
      storedKwh: sc.battery?.storedKwh || 8.0,
    }));
    setStatusMessage(`Scenario active: ${sc.name} (${sc.description}).`);
  };

  // 3. Update Household Telemetry
  const handleUpdateHousehold = (id, field, value) => {
    const num = Math.max(0, Number(value) || 0);
    setHouseholds((prev) =>
      prev.map((h) => (h.id === id ? { ...h, [field]: num } : h))
    );
    setStatusMessage(`Updated ${id.toUpperCase()} ${field} to ${num} kW.`);
  };

  // 4. Update Battery
  const handleUpdateBattery = (field, value) => {
    const num = Math.max(1, Number(value) || 0);
    setBattery((prev) => ({ ...prev, [field]: num }));
  };

  // 5. Update Grid Price
  const handleUpdateGrid = (field, value) => {
    const num = Math.max(0.1, Number(value) || 0);
    setGrid((prev) => ({ ...prev, [field]: num }));
  };

  // 6. Manual Battery Charge
  const handleChargeBattery = (amountKwh = 1.5) => {
    if (battery.soc >= 100) return;
    const newStored = Math.min(battery.capacity, Math.round((battery.storedKwh + amountKwh) * 10) / 10);
    const newSoc = Math.min(100, Math.round((newStored / battery.capacity) * 100));

    setBattery((prev) => ({ ...prev, storedKwh: newStored, soc: newSoc }));
    setStatusMessage(`Manual Charge: Stored +${amountKwh} kWh in Central Battery (SOC: ${newSoc}%).`);
  };

  // 7. Manual Battery Discharge
  const handleDischargeBattery = (amountKwh = 1.5) => {
    if (battery.soc <= 20) return;
    const newStored = Math.max(0, Math.round((battery.storedKwh - amountKwh) * 10) / 10);
    const newSoc = Math.max(0, Math.round((newStored / battery.capacity) * 100));

    setBattery((prev) => ({ ...prev, storedKwh: newStored, soc: newSoc }));
    setStatusMessage(`Manual Discharge: Dispatched ${amountKwh} kWh to community (SOC: ${newSoc}%).`);
  };

  // 8. Grid Export Surplus
  const handleExportSurplus = (householdId) => {
    const house = computedHouseholds.find((h) => h.id === householdId);
    if (!house || house.availableSurplus <= 0.05) return;

    const exportKwh = Math.round(house.availableSurplus * 10) / 10;
    const revenue = Math.round(exportKwh * grid.exportPrice * 100) / 100;

    setHouseholds((prev) =>
      prev.map((h) =>
        h.id === householdId
          ? {
              ...h,
              exportedKwh: Math.round((h.exportedKwh + exportKwh) * 10) / 10,
              wallet: Math.round((h.wallet + revenue) * 100) / 100,
              moneyEarned: Math.round((h.moneyEarned + revenue) * 100) / 100,
            }
          : h
      )
    );
    setStatusMessage(`${house.name} exported ${exportKwh} kWh to Grid (Revenue: +₹${revenue.toFixed(2)}).`);
  };

  // 9. Grid Import Power
  const handleGridImport = () => {
    setStatusMessage(`Grid Interconnect: Community imported standby reserve power from Utility Substation.`);
  };

  // 10. Store Surplus in Battery
  const handleStoreSurplus = (householdId) => {
    const house = computedHouseholds.find((h) => h.id === householdId);
    if (!house || house.availableSurplus <= 0.05) return;

    const storeKwh = Math.min(house.availableSurplus, 1.5);
    handleChargeBattery(storeKwh);

    setHouseholds((prev) =>
      prev.map((h) =>
        h.id === householdId
          ? { ...h, storedKwh: Math.round((h.storedKwh + storeKwh) * 10) / 10 }
          : h
      )
    );
  };

  // 11. Quick Sell Order Listing
  const handleOpenSellModal = (householdId) => {
    const house = computedHouseholds.find((h) => h.id === householdId);
    if (!house || house.availableSurplus <= 0.05) return;

    const listKwh = Math.min(2.0, house.availableSurplus);
    const newOrder = {
      id: `GS-SELL-${String(orders.sellOrders.length + 1).padStart(3, '0')}`,
      household_id: householdId,
      energy_kwh: listKwh,
      min_price_per_kwh: 7.0,
      remaining_kwh: listKwh,
      status: 'OPEN',
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setOrders((prev) => ({ ...prev, sellOrders: [newOrder, ...prev.sellOrders] }));
    setStatusMessage(`Listed Order ${newOrder.id}: ${house.name} listed ${listKwh} kWh @ ₹7.00/kWh in Marketplace.`);
  };

  // 12. Quick Initiate Purchase
  const handleInitiatePurchase = ({ buyerId, sellOrder, quantityKwh }) => {
    const errors = validatePurchaseOrder({ buyerId, sellOrder, quantityKwh }, computedHouseholds);
    if (errors) {
      setStatusMessage(`⚠️ Cannot purchase: ${Object.values(errors).join(', ')}`);
      return;
    }

    setActivePurchase({
      buyerId,
      sellOrder,
      quantityKwh: Number(quantityKwh) || sellOrder.remaining_kwh,
    });
    setIsConfirmModalOpen(true);
  };

  // 13. Confirm Purchase Execution
  const handleConfirmPurchase = async () => {
    if (!activePurchase) return;
    setIsSettling(true);

    const { buyerId, sellOrder, quantityKwh } = activePurchase;
    const sellerId = sellOrder.household_id;
    const unitPrice = sellOrder.min_price_per_kwh;
    const qty = Number(quantityKwh) || sellOrder.remaining_kwh;
    const totalAmount = Math.round(qty * unitPrice * 100) / 100;

    // Update wallets
    setHouseholds((prev) =>
      prev.map((h) => {
        if (h.id === sellerId) {
          return {
            ...h,
            wallet: Math.round((h.wallet + totalAmount) * 100) / 100,
            moneyEarned: Math.round((h.moneyEarned + totalAmount) * 100) / 100,
            soldKwh: Math.round((h.soldKwh + qty) * 100) / 100,
          };
        }
        if (h.id === buyerId) {
          return {
            ...h,
            wallet: Math.round((h.wallet - totalAmount) * 100) / 100,
            moneySpent: Math.round((h.moneySpent + totalAmount) * 100) / 100,
            boughtKwh: Math.round((h.boughtKwh + qty) * 100) / 100,
          };
        }
        return h;
      })
    );

    // Update orders
    setOrders((prev) => {
      const updatedSells = prev.sellOrders.map((o) => {
        if (o.id === sellOrder.id) {
          const rem = Math.max(0, Math.round((o.remaining_kwh - qty) * 100) / 100);
          return { ...o, remaining_kwh: rem, status: rem <= 0.001 ? 'FILLED' : 'PARTIALLY_FILLED' };
        }
        return o;
      });
      return { ...prev, sellOrders: updatedSells };
    });

    // Record Transaction
    const newTx = {
      id: `TX-GS-${String(transactions.length + 1).padStart(3, '0')}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sellerId: sellerId.toUpperCase(),
      buyerId: buyerId.toUpperCase(),
      energyKwh: qty,
      pricePerKwh: unitPrice,
      totalValue: totalAmount,
      paymentStatus: 'SETTLED',
      energyFlowStatus: 'TRANSFERRED',
      status: 'COMPLETED',
    };
    setTransactions((prev) => [newTx, ...prev]);
    setStatusMessage(`🎉 Trade ${newTx.id} SETTLED! ${buyerId.toUpperCase()} bought ${qty} kWh from ${sellerId.toUpperCase()} for ₹${totalAmount.toFixed(2)}.`);

    setIsSettling(false);
    setIsConfirmModalOpen(false);
    setActivePurchase(null);
  };

  // 14. Reset Demo Baseline
  const handleReset = () => {
    setIsLiveSimulating(false);
    setCurrentHour(12);
    setActiveScenario('NORMAL_DAY');
    setHouseholds(INITIAL_DEMO_STATE.households);
    setBattery(INITIAL_DEMO_STATE.battery);
    setGrid(INITIAL_DEMO_STATE.grid);
    setStatusMessage('Microgrid Dashboard reset to clean demo baseline.');
    if (sceneRef.current) sceneRef.current.resetCamera();
  };

  const selectedHousehold = computedHouseholds.find((h) => h.id === selectedNode) || computedHouseholds[0];
  const activeBuyer = computedHouseholds.find((h) => h.id === activePurchase?.buyerId) || computedHouseholds[1];
  const activeSeller = computedHouseholds.find((h) => h.id === activePurchase?.sellOrder?.household_id) || computedHouseholds[0];

  return (
    <div className="space-y-2.5 max-w-[1680px] mx-auto pb-6">
      {/* 🌟 1. EXECUTIVE KPI SUMMARY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <MetricCard
          title="Generation"
          value={totalGen.toFixed(1)}
          unit="kW"
          iconName="solar"
          variant="surplus"
          subtitle="Solar PV"
        />
        <MetricCard
          title="Total Load"
          value={totalCon.toFixed(1)}
          unit="kW"
          iconName="powerOff"
          variant="default"
          subtitle="Community"
        />
        <MetricCard
          title="Net Balance"
          value={(isSurplus ? '+' : '') + netCommunity.toFixed(1)}
          unit="kW"
          iconName="energy"
          variant={isSurplus ? 'surplus' : 'deficit'}
          subtitle={isSurplus ? 'Surplus' : 'Deficit'}
        />
        <MetricCard
          title="Battery SOC"
          value={battery.soc?.toFixed(0)}
          unit="%"
          iconName="battery"
          variant="battery"
          subtitle={`${((battery.soc / 100) * (battery.capacity || 50)).toFixed(1)} kWh`}
        />
        <MetricCard
          title="P2P Trades"
          value={transactions.length}
          unit="Orders"
          iconName="trade"
          variant="ai"
          subtitle="Cleared"
        />
        <MetricCard
          title="Grid Export"
          value={isSurplus && netCommunity > 1.5 ? (netCommunity - 1.5).toFixed(1) : '0.0'}
          unit="kW"
          iconName="grid"
          variant="grid"
          subtitle={isSurplus ? 'Active' : 'Standby'}
        />
      </div>

      {/* Dynamic Status / Narrative Banner */}
      {statusMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/95 px-3.5 py-2 text-xs text-emerald-950 shadow-xs">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-semibold">{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage('')}
            className="text-emerald-700 hover:text-emerald-950 font-bold text-xs p-1"
            aria-label="Dismiss status message"
          >
            ✕
          </button>
        </div>
      )}

      {/* 🌟 2. MAIN AREA (3 COLUMNS: LEFT CONTROLS, CENTER 3D MAP, RIGHT ACTIONS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* LEFT COLUMN: Simulation & Community Controls */}
        <div className="lg:col-span-3">
          <DashboardControlPanel
            households={computedHouseholds}
            battery={battery}
            grid={grid}
            currentHour={currentHour}
            activeScenario={activeScenario}
            onUpdateHousehold={handleUpdateHousehold}
            onUpdateBattery={handleUpdateBattery}
            onUpdateGrid={handleUpdateGrid}
            onApplyScenario={handleApplyScenario}
            onChangeHour={handleChangeHour}
            onRunSimulation={() => {
              setIsLiveSimulating(true);
              setStatusMessage('Live Microgrid Simulation Started.');
            }}
            onReset={handleReset}
            onLoadDemo={handleReset}
          />
        </div>

        {/* CENTER COLUMN: Large 3D Virtual Microgrid Digital Twin */}
        <div className="lg:col-span-6 xl:col-span-6">
          <div className="flex flex-col h-full rounded-2xl border border-slate-200 bg-white p-3 shadow-card space-y-2.5">
            {/* 3D Scene Controls Bar */}
            <div className="flex items-center justify-between px-1 text-xs">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsLiveSimulating(!isLiveSimulating);
                    setStatusMessage(isLiveSimulating ? 'Simulation Paused.' : 'Simulation Active.');
                  }}
                  className={`flex items-center space-x-1.5 rounded-lg px-3 py-1 text-xs font-bold shadow-xs transition active:scale-95 ${
                    isLiveSimulating
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <FaIcon name={isLiveSimulating ? 'pause' : 'play'} className="text-xs" />
                  <span>{isLiveSimulating ? 'PAUSE' : 'START LIVE'}</span>
                </button>

                {/* Speed selector */}
                <div className="flex items-center space-x-0.5 rounded-lg bg-slate-100 p-0.5 text-[10px] font-bold">
                  {[1, 2, 4].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setSimSpeed(spd)}
                      className={`px-2 py-0.5 rounded-md transition ${
                        simSpeed === spd ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => sceneRef.current?.resetCamera()}
                  className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                  title="Reset 3D Camera View"
                >
                  <FaIcon name="rotate" className="text-slate-500 text-xs" />
                  <span className="hidden sm:inline">Reset View</span>
                </button>
              </div>
            </div>

            {/* 3D Canvas */}
            <div className="h-[460px] xl:h-[500px] w-full relative rounded-xl overflow-hidden">
              <MarketplaceScene3D
                ref={sceneRef}
                households={computedHouseholds}
                battery={battery}
                grid={grid}
                orders={orders}
                activeFlows={activeFlows}
                isMatching={false}
                selectedNode={selectedNode}
                onSelectNode={setSelectedNode}
                isModalOpen={isConfirmModalOpen}
              />

              {/* Floating micro status badge */}
              <div className="absolute top-2.5 left-2.5 pointer-events-none">
                <div className="flex items-center space-x-1.5 rounded-full border border-slate-200 bg-white/95 px-2.5 py-0.5 shadow-2xs backdrop-blur-md">
                  <span className={`h-1.5 w-1.5 rounded-full ${isLiveSimulating ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                  <span className="text-[10px] font-bold text-slate-800">
                    {isLiveSimulating ? `Live Microgrid • ${String(currentHour).padStart(2, '0')}:00` : '3D Digital Twin • Interactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Energy Status & Manual Actions (~20%) */}
        <div className="lg:col-span-3 xl:col-span-3">
          <DashboardLiveStatus
            selectedHousehold={selectedHousehold}
            battery={battery}
            grid={grid}
            orders={orders}
            transactions={transactions}
            onOpenSellModal={handleOpenSellModal}
            onStoreSurplus={handleStoreSurplus}
            onExportSurplus={handleExportSurplus}
            onChargeBattery={handleChargeBattery}
            onDischargeBattery={handleDischargeBattery}
            onGridImport={handleGridImport}
            onInitiatePurchase={handleInitiatePurchase}
          />
        </div>
      </div>

      {/* 🌟 3. BOTTOM ROW: INTERACTIVE ANALYTICS & SETTLEMENT LEDGER */}
      <DashboardAnalyticsSection
        chartHistory={chartHistory}
        currentFlows={activeFlows}
        battery={battery}
      />

      <TransactionLedger
        transactions={transactions}
        computedHouseholds={computedHouseholds}
        battery={battery}
      />

      {/* Purchase Confirmation Modal */}
      <TradeConfirmationModal
        purchase={activePurchase}
        isOpen={isConfirmModalOpen}
        onConfirm={handleConfirmPurchase}
        onCancel={() => {
          setIsConfirmModalOpen(false);
          setActivePurchase(null);
        }}
        isSettling={isSettling}
        buyerHousehold={activeBuyer}
        sellerHousehold={activeSeller}
      />
    </div>
  );
}
