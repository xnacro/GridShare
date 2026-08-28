import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import GridShareNav from './components/navigation/GridShareNav';
import DemoModal from './components/DemoModal';
import SystemHealthModal from './components/ui/SystemHealthModal';
import LoginModal from './components/auth/LoginModal';
import PageLoadingSkeleton from './components/ui/PageLoadingSkeleton';
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
import NotFoundView from './pages/NotFoundView';

function AppContent() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const location = useLocation();
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Trigger 1.2s skeleton delay on every route transition for testing & visual feedback
  React.useEffect(() => {
    setIsLoadingRoute(true);
    const timer = setTimeout(() => {
      setIsLoadingRoute(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleScenarioExecuted = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const getSkeletonVariant = (pathname) => {
    if (pathname === '/' || pathname === '/dashboard' || pathname === '/battery' || pathname === '/community') return 'dashboard';
    if (pathname === '/network' || pathname === '/simulation' || pathname === '/energy-map') return 'map';
    if (pathname === '/marketplace' || pathname === '/transactions') return 'marketplace';
    return 'generic';
  };

  return (
    <div className="flex min-h-screen w-screen flex-col bg-[var(--canvas)] text-[var(--text-primary)] overflow-x-hidden antialiased font-sans">
      
      {/* 🧭 Centered Floating Pill Navigation Header */}
      <GridShareNav
        onOpenDemoModal={() => setIsDemoModalOpen(true)}
        onOpenHealthModal={() => setIsHealthModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* 📄 Main Content Viewport with Shimmer Skeleton Transition */}
      <main className="flex-1 w-full px-4 py-3 sm:px-8 sm:py-5 max-w-[1680px] mx-auto" key={refreshKey}>
        {isLoadingRoute ? (
          <PageLoadingSkeleton variant={getSkeletonVariant(location.pathname)} />
        ) : (
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
            <Route path="*" element={<NotFoundView />} />
          </Routes>
        )}
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
