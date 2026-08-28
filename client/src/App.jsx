import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import GridShareNav from './components/navigation/GridShareNav';
import DemoModal from './components/DemoModal';
import SystemHealthModal from './components/ui/SystemHealthModal';
import LoginModal from './components/auth/LoginModal';
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

function AppContent() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleScenarioExecuted = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex min-h-screen w-screen flex-col bg-[var(--canvas)] text-[var(--text-primary)] overflow-x-hidden antialiased font-sans">
      
      {/* 🧭 Centered Floating Pill Navigation Header */}
      <GridShareNav
        onOpenDemoModal={() => setIsDemoModalOpen(true)}
        onOpenHealthModal={() => setIsHealthModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* 📄 Main Content Viewport */}
      <main className="flex-1 w-full px-4 py-3 sm:px-8 sm:py-5 max-w-[1680px] mx-auto" key={refreshKey}>
        <Routes>
          <Route path="/" element={<DashboardView onOpenDemoModal={() => setIsDemoModalOpen(true)} />} />
          <Route path="/dashboard" element={<DashboardView onOpenDemoModal={() => setIsDemoModalOpen(true)} />} />
          <Route path="/battery" element={<DashboardView onOpenDemoModal={() => setIsDemoModalOpen(true)} />} />
          <Route path="/community" element={<DashboardView onOpenDemoModal={() => setIsDemoModalOpen(true)} />} />
          <Route path="/my-home" element={<MyHomeView />} />
          <Route path="/devices" element={<MyHomeView />} />
          <Route path="/network" element={<InteractiveMicrogridView />} />
          <Route path="/simulation" element={<InteractiveMicrogridView />} />
          <Route path="/energy-map" element={<InteractiveMicrogridView />} />
          <Route path="/marketplace" element={<MarketplaceView />} />
          <Route path="/transactions" element={<MarketplaceView />} />
          <Route path="/ai" element={<AiForecastView />} />
          <Route path="/forecast" element={<AiForecastView />} />
          <Route path="/copilot" element={<AiForecastView />} />
          <Route path="/optimize" element={<Optimization />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* 🩺 [DISABLED FOR CLEAN PUBLIC UI] System Infrastructure Health Modal
      <SystemHealthModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
      /> */}

      {/* 🚀 Global Guided Scenarios Engine Modal */}
      <DemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onScenarioExecuted={handleScenarioExecuted}
      />

      {/* 👤 Account & Authentication Popup Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
