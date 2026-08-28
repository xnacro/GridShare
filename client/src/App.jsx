import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TopNavbar from './components/TopNavbar';
import DemoModal from './components/DemoModal';
import DashboardView from './pages/DashboardView';
import InteractiveMicrogridView from './pages/InteractiveMicrogridView';
import EnergyMapView from './pages/EnergyMapView';
import AiForecastView from './pages/AiForecastView';
import MarketplaceView from './pages/MarketplaceView';
import BatteryView from './pages/BatteryView';
import MyHomeView from './pages/MyHomeView';
import DevicesView from './pages/DevicesView';
import TransactionsView from './pages/TransactionsView';
import Optimization from './pages/Optimization';
import { api } from './services/api';

function MainLayout() {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(true);
  const [batterySoc, setBatterySoc] = useState(40);
  const [gridPrice, setGridPrice] = useState(6.10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchGlobalState = async () => {
    try {
      const res = await api.getHealth();
      setIsOnline(res.data?.status === 'healthy');
      const sumRes = await api.getEnergySummary();
      if (sumRes.data?.status === 'SUCCESS') {
        setGridPrice(sumRes.data.summary.base_grid_price || 6.10);
      }
      const batRes = await api.getBattery();
      if (batRes.data?.status === 'SUCCESS') {
        setBatterySoc(batRes.data.battery.current_soc || 40);
      }
    } catch (e) {
      setIsOnline(false);
    }
  };

  useEffect(() => {
    fetchGlobalState();
    const interval = setInterval(fetchGlobalState, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchGlobalState();
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const handleTriggerOptimization = async () => {
    try {
      setIsOptimizing(true);
      await api.runOptimization();
      await fetchGlobalState();
      setRefreshKey((prev) => prev + 1);
    } catch (e) {
      console.error('Optimization error:', e);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleScenarioExecuted = async () => {
    await fetchGlobalState();
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex min-h-screen w-screen flex-col bg-slate-100/70 text-slate-900 overflow-x-hidden antialiased font-sans">
      {/* ⚡ Top Navigation Bar */}
      <TopNavbar
        isOnline={isOnline}
        batterySoc={batterySoc}
        gridPrice={gridPrice}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        onOpenDemoModal={() => setIsDemoModalOpen(true)}
        onTriggerOptimization={handleTriggerOptimization}
        isOptimizing={isOptimizing}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full px-3 py-3 sm:px-5 sm:py-4 max-w-[1680px] mx-auto" key={refreshKey}>
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/network" element={<InteractiveMicrogridView />} />
          <Route path="/simulation" element={<InteractiveMicrogridView />} />
          <Route path="/energy-map" element={<EnergyMapView />} />
          <Route path="/ai" element={<AiForecastView />} />
          <Route path="/copilot" element={<AiForecastView />} />
          <Route path="/marketplace" element={<MarketplaceView />} />
          <Route path="/battery" element={<BatteryView />} />
          <Route path="/community" element={<BatteryView />} />
          <Route path="/my-home" element={<MyHomeView />} />
          <Route path="/devices" element={<DevicesView />} />
          <Route path="/transactions" element={<TransactionsView />} />
          <Route path="/optimize" element={<Optimization />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Hackathon Demo Scenario Modal */}
      <DemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onScenarioExecuted={handleScenarioExecuted}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}
