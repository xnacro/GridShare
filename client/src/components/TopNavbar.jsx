import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import FaIcon from './icons/FaIcon';
import Badge, { StatusIndicator } from './ui/Badge';
import Button, { IconButton } from './ui/Button';

export default function TopNavbar({
  isOnline = true,
  batterySoc = 40,
  gridPrice = 6.10,
  onRefresh,
  isRefreshing = false,
  onOpenDemoModal,
  onTriggerOptimization,
  isOptimizing = false,
}) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const menuRef = useRef(null);

  // Grouped Navigation Structure
  const primaryNavItems = [
    { name: 'Overview', path: '/', iconName: 'overview' },
    { name: 'Energy Network', path: '/network', iconName: 'network' },
    { name: 'AI Copilot', path: '/ai', iconName: 'ai', highlight: true },
    { name: 'Marketplace', path: '/marketplace', iconName: 'marketplace' },
    { name: 'Battery ESS', path: '/battery', iconName: 'battery' },
  ];

  const secondaryNavItems = [
    { name: 'My Home', path: '/my-home', iconName: 'home', desc: '3D Residential load twin' },
    { name: 'Devices', path: '/devices', iconName: 'devices', desc: 'IoT relays & ESP32 circuits' },
    { name: 'Transactions', path: '/transactions', iconName: 'transactions', desc: 'Bilateral trade ledger' },
  ];

  const allNavItems = [
    {
      category: 'Core Operations',
      items: [
        { name: 'Overview', path: '/', iconName: 'overview', desc: 'Real-time microgrid metrics & topology' },
        { name: 'Energy Network', path: '/network', iconName: 'network', desc: '3D spatial microgrid & flow simulation' },
        { name: 'AI Copilot', path: '/ai', iconName: 'ai', desc: 'Predictive demand ML & dispatch logs', highlight: true },
      ],
    },
    {
      category: 'Assets & Twins',
      items: [
        { name: 'Battery ESS', path: '/battery', iconName: 'battery', desc: '50kWh community storage & BMS telemetry' },
        { name: 'My Home', path: '/my-home', iconName: 'home', desc: '3D smart house & flexible appliance loads' },
        { name: 'Devices', path: '/devices', iconName: 'devices', desc: 'ESP32 edge nodes & relay controllers' },
      ],
    },
    {
      category: 'Marketplace & Ledger',
      items: [
        { name: 'Marketplace', path: '/marketplace', iconName: 'marketplace', desc: 'Autonomous P2P energy exchange orderbook' },
        { name: 'Transactions', path: '/transactions', iconName: 'transactions', desc: 'Audit-ready transaction settlement history' },
      ],
    },
  ];

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isCurrentActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    if (path === '/network') {
      return location.pathname === '/network' || location.pathname === '/simulation' || location.pathname === '/energy-map';
    }
    return location.pathname === path;
  };

  const isSecondaryActive = secondaryNavItems.some((item) => isCurrentActive(item.path));
  const currentActiveItem = [...primaryNavItems, ...secondaryNavItems].find((item) => isCurrentActive(item.path));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs select-none">
      <div className="mx-auto flex h-14 max-w-[1680px] items-center justify-between px-3 sm:px-5 relative">
        
        {/* LEFT SECTION: Brand & Live Database Indicator */}
        <div className="flex items-center space-x-3 flex-shrink-0 z-10">
          <NavLink to="/" className="flex items-center space-x-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 group-hover:bg-emerald-700 transition-all">
              <FaIcon name="energy" className="text-base" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="text-sm font-extrabold tracking-tight text-slate-900">
                  GRID<span className="text-emerald-600">SHARE</span>
                </span>
                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-800 border border-emerald-200">
                  AI OS
                </span>
              </div>
            </div>
          </NavLink>

          <div className="hidden 2xl:flex items-center space-x-1.5 border-l border-slate-200 pl-3 text-xs">
            <StatusIndicator
              status={isOnline ? 'online' : 'offline'}
              pulse={isOnline}
              label={isOnline ? 'Supabase Live' : 'Offline'}
            />
          </div>
        </div>

        {/* CENTER SECTION: Centered Segmented Navigation & Collapse Toggle */}
        <div className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center rounded-2xl border border-slate-200/90 bg-slate-50/90 p-1 shadow-xs backdrop-blur-md">
            
            {/* Primary Centered Tabs (when not collapsed) */}
            {!isNavCollapsed && (
              <nav className="flex items-center space-x-1">
                {primaryNavItems.map((item) => {
                  const isActive = isCurrentActive(item.path);
                  const isAi = item.path === '/ai';

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-1.5 text-xs transition-all whitespace-nowrap ${
                        isActive
                          ? isAi
                            ? 'bg-purple-600 text-white font-bold shadow-xs shadow-purple-600/25'
                            : 'bg-emerald-600 text-white font-bold shadow-xs shadow-emerald-600/25'
                          : isAi
                          ? 'text-purple-700 hover:text-purple-900 hover:bg-purple-50/80 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 font-semibold'
                      }`}
                    >
                      <FaIcon
                        name={item.iconName}
                        className={`text-xs ${
                          isActive
                            ? 'text-white'
                            : isAi
                            ? 'text-purple-600'
                            : 'text-slate-400'
                        }`}
                      />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>
            )}

            {/* Collapsed Minimalist Active Pill Display */}
            {isNavCollapsed && (
              <div className="flex items-center space-x-2 px-3 py-1 text-xs font-bold text-slate-800">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <FaIcon name={currentActiveItem?.iconName || 'overview'} className="text-emerald-600 text-xs" />
                <span>{currentActiveItem?.name || 'Overview'}</span>
                <span className="text-[10px] text-slate-400 font-normal">| Menu Collapsed</span>
              </div>
            )}

            {/* Toggle Dropdown Button for Secondary / All Views */}
            <div className="relative ml-1 pl-1 border-l border-slate-200/80" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`flex items-center space-x-1.5 rounded-xl px-2.5 py-1.5 text-xs transition-all ${
                  isMenuOpen
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : isSecondaryActive
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold shadow-2xs'
                    : 'text-slate-700 hover:bg-white hover:text-slate-900 font-semibold'
                }`}
                title="Toggle all 8 product views"
              >
                <FaIcon name={isMenuOpen ? 'close' : 'bars'} className={`text-xs ${isSecondaryActive && !isMenuOpen ? 'text-emerald-700' : ''}`} />
                <span className="text-[11px]">{isNavCollapsed ? 'All Views' : 'More'}</span>
                <FaIcon name={isMenuOpen ? 'chevronUp' : 'chevronDown'} className="text-[9px] opacity-75" />
              </button>

              {/* Floating Centered Mega-Menu Dropdown Panel */}
              {isMenuOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-[580px] rounded-2xl border border-slate-200 bg-white/98 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                        <FaIcon name="sparkles" className="text-xs" />
                      </div>
                      <span className="text-xs font-extrabold uppercase tracking-wide text-slate-900">
                        GridShare Product Surfaces
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsNavCollapsed(!isNavCollapsed)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.8 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition"
                      >
                        {isNavCollapsed ? 'Expand Top Bar' : 'Collapse Top Bar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMenuOpen(false)}
                        className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3.5 pt-3">
                    {allNavItems.map((section) => (
                      <div key={section.category} className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {section.category}
                        </span>
                        <div className="space-y-1">
                          {section.items.map((item) => {
                            const isActive = isCurrentActive(item.path);
                            return (
                              <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex flex-col p-2.5 rounded-xl transition text-left group border ${
                                  isActive
                                    ? 'bg-emerald-50/90 text-emerald-950 border-emerald-300 shadow-2xs font-bold'
                                    : 'hover:bg-slate-50 border-transparent text-slate-800'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1.5">
                                    <FaIcon
                                      name={item.iconName}
                                      className={`text-xs ${
                                        isActive
                                          ? 'text-emerald-600'
                                          : item.highlight
                                          ? 'text-purple-600'
                                          : 'text-slate-500 group-hover:text-slate-900'
                                      }`}
                                    />
                                    <span className={`text-xs font-bold ${isActive ? 'text-emerald-950' : 'text-slate-900'}`}>
                                      {item.name}
                                    </span>
                                  </div>
                                  {isActive && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  )}
                                  {item.highlight && !isActive && (
                                    <span className="rounded bg-purple-100 px-1 py-0.2 text-[8px] font-bold text-purple-700">
                                      AI
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`text-[10px] mt-0.5 leading-tight line-clamp-1 ${
                                    isActive ? 'text-emerald-700 font-medium' : 'text-slate-400'
                                  }`}
                                >
                                  {item.desc}
                                </span>
                              </NavLink>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Press <kbd className="font-mono bg-slate-100 border border-slate-300 px-1 rounded text-[10px]">Esc</kbd> to close</span>
                    <span className="font-semibold text-emerald-700">8 Integrated Views</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Telemetry Chips, Live Actions & Compact Mobile Toggle */}
        <div className="flex items-center space-x-2 z-10">
          
          {/* Battery Status Gauge */}
          <div className="hidden sm:flex items-center space-x-1.5 rounded-xl border border-amber-200 bg-amber-50/70 px-2.5 py-1 text-xs font-semibold text-amber-900">
            <FaIcon name="battery" className="text-amber-600 text-xs" />
            <span>{batterySoc.toFixed(0)}%</span>
            <span className="text-[10px] font-normal text-amber-700 hidden md:inline">ESS</span>
          </div>

          {/* Grid Tariff Tag */}
          <div className="hidden md:flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
            <FaIcon name="grid" className="text-blue-600 text-[11px]" />
            <span className="text-slate-500 font-normal text-[11px]">Grid:</span>
            <span className="font-bold">₹{gridPrice.toFixed(2)}</span>
          </div>

          {/* Sync Button */}
          {onRefresh && (
            <IconButton
              name="refresh"
              size="sm"
              variant="outline"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh real-time state"
              className={isRefreshing ? 'animate-spin' : ''}
              ariaLabel="Refresh telemetry"
            />
          )}

          {/* Scenarios / PPT Demo Button */}
          {onOpenDemoModal && (
            <Button
              variant="warning"
              size="sm"
              onClick={onOpenDemoModal}
              icon={<FaIcon name="sparkles" />}
              className="text-xs font-bold shadow-xs"
            >
              <span className="hidden sm:inline">Scenarios</span>
            </Button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex lg:hidden items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            aria-label="Toggle Navigation Menu"
          >
            <FaIcon name={isMenuOpen ? 'close' : 'bars'} className="text-sm" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Visible on small screens when toggled) */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 shadow-2xl animate-in slide-in-from-top duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
            <span>Navigation Menu</span>
            <span className="text-[10px] text-slate-400 font-normal">Tap to switch view</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[...primaryNavItems, ...secondaryNavItems].map((item) => {
              const isActive = isCurrentActive(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-2 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <FaIcon name={item.iconName} className={isActive ? 'text-white' : 'text-slate-500'} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
