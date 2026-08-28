import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import FaIcon from './icons/FaIcon';
import Badge, { StatusIndicator } from './ui/Badge';
import Button from './ui/Button';
import SystemHealthModal from './ui/SystemHealthModal';

export default function TopNavbar({
  onOpenDemoModal,
}) {
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHousehold, setActiveHousehold] = useState('House A (Prosumer)');

  const moreRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const primaryNavItems = [
    { name: 'Overview', path: '/', iconName: 'overview' },
    { name: 'Network', path: '/network', iconName: 'network' },
    { name: 'Hornet AI', path: '/ai', iconName: 'ai', highlight: true },
    { name: 'Marketplace', path: '/marketplace', iconName: 'marketplace' },
    { name: 'Battery', path: '/battery', iconName: 'battery' },
    { name: 'My Home', path: '/my-home', iconName: 'home' },
  ];

  const moreNavItems = [
    { name: 'Devices', path: '/devices', iconName: 'devices', desc: 'IoT circuits & simulated edge relays' },
    { name: 'Transactions', path: '/transactions', iconName: 'transactions', desc: 'Bilateral energy trade ledger' },
  ];

  const notifications = [
    { id: 1, title: 'AI Match Executed', desc: 'House A sold 2.8 kWh to House B @ ₹4.50/kWh', time: '2m ago', icon: 'trade', variant: 'surplus' },
    { id: 2, title: 'Battery Buffer Active', desc: '1.2 kWh stored to preserve 10% reserve floor', time: '14m ago', icon: 'battery', variant: 'battery' },
    { id: 3, title: 'Solar Noon Forecast', desc: 'High generation expected (peak 7.2 kW)', time: '45m ago', icon: 'solar', variant: 'solar' },
  ];

  const households = [
    { id: 'house_a', name: 'House A (Prosumer)', type: 'Solar Generator', balance: '+4.7 kW' },
    { id: 'house_b', name: 'House B (Consumer)', type: 'Heavy EV Load', balance: '-2.8 kW' },
    { id: 'house_c', name: 'House C (Balanced)', type: 'Prosumer', balance: '+1.0 kW' },
    { id: 'all', name: 'Community Manager View', type: 'Microgrid Admin', balance: '+2.9 kW Net' },
  ];

  // Close menus on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsMoreOpen(false);
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
        setMobileMenuOpen(false);
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

  const isMoreActive = moreNavItems.some((item) => isCurrentActive(item.path));

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#DDE5E0] bg-white/95 backdrop-blur-md shadow-subtle select-none">
        <div className="mx-auto flex h-16 max-w-[1680px] items-center justify-between px-4 sm:px-6">
          
          {/* LEFT: GRIDSHARE Logo */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <NavLink to="/" className="flex items-center group">
              <span className="font-changa text-2xl font-normal tracking-tight text-[#102019] hover:text-[#168A5A] transition-colors">
                GridShare
              </span>
            </NavLink>
          </div>

          {/* CENTER: Primary Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 sm:space-x-1.5">
            {primaryNavItems.map((item) => {
              const isActive = isCurrentActive(item.path);
              const isAi = item.path === '/ai';

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? isAi
                        ? 'bg-[#F0EBFF] text-[#7657D8] border border-[#E2D9F8] shadow-subtle'
                        : 'bg-[#E7F5EE] text-[#168A5A] border border-[#DDE5E0] shadow-subtle'
                      : isAi
                      ? 'text-[#7657D8] hover:text-[#5234A8] hover:bg-[#F0EBFF]/60 border border-transparent'
                      : 'text-[#5D6B64] hover:text-[#102019] hover:bg-[#F5F7F6] border border-transparent'
                  }`}
                >
                  <FaIcon
                    name={item.iconName}
                    className={`text-sm ${
                      isActive
                        ? isAi
                          ? 'text-[#7657D8]'
                          : 'text-[#168A5A]'
                        : isAi
                        ? 'text-[#7657D8]'
                        : 'text-[#83908A]'
                    }`}
                  />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

            {/* More Dropdown Menu */}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`flex items-center space-x-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all border ${
                  isMoreOpen || isMoreActive
                    ? 'bg-[#F5F7F6] text-[#102019] border-[#DDE5E0]'
                    : 'text-[#5D6B64] hover:text-[#102019] hover:bg-[#F5F7F6] border-transparent'
                }`}
              >
                <span>More</span>
                <FaIcon name={isMoreOpen ? 'chevronUp' : 'chevronDown'} className="text-[10px] text-[#83908A]" />
              </button>

              {isMoreOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl border border-[#DDE5E0] bg-white p-2 shadow-modal backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#83908A]">
                    Subsystems & Utilities
                  </div>
                  
                  {moreNavItems.map((item) => {
                    const isActive = isCurrentActive(item.path);
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMoreOpen(false)}
                        className={`flex items-start space-x-3 p-2.5 rounded-xl transition ${
                          isActive
                            ? 'bg-[#E7F5EE] text-[#168A5A]'
                            : 'hover:bg-[#F5F7F6] text-[#102019]'
                        }`}
                      >
                        <div className="mt-0.5 w-7 h-7 rounded-lg bg-[#F5F7F6] flex items-center justify-center text-xs flex-shrink-0 text-[#5D6B64]">
                          <FaIcon name={item.iconName} />
                        </div>
                        <div>
                          <div className="text-sm font-bold">{item.name}</div>
                          <div className="text-xs text-[#83908A]">{item.desc}</div>
                        </div>
                      </NavLink>
                    );
                  })}

                  <div className="my-1.5 border-t border-[#DDE5E0]" />

                  {/* Scenarios item */}
                  {onOpenDemoModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreOpen(false);
                        onOpenDemoModal();
                      }}
                      className="w-full flex items-start space-x-3 p-2.5 rounded-xl text-left hover:bg-[#F5F7F6] text-[#102019] transition"
                    >
                      <div className="mt-0.5 w-7 h-7 rounded-lg bg-[#FFF4D8] text-[#E8A72B] flex items-center justify-center text-xs flex-shrink-0">
                        <FaIcon name="scenarios" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">Guided Scenarios</div>
                        <div className="text-xs text-[#83908A]">Simulated microgrid stress tests</div>
                      </div>
                    </button>
                  )}

                  {/* System Health item */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreOpen(false);
                      setIsHealthOpen(true);
                    }}
                    className="w-full flex items-start space-x-3 p-2.5 rounded-xl text-left hover:bg-[#F5F7F6] text-[#102019] transition"
                  >
                    <div className="mt-0.5 w-7 h-7 rounded-lg bg-[#E7F5EE] text-[#168A5A] flex items-center justify-center text-xs flex-shrink-0">
                      <FaIcon name="health" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">System Health</div>
                      <div className="text-xs text-[#83908A]">Database, backend, and telemetry pipes</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* RIGHT: Live Status, Community 101, Notifications, Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* LIVE Community Status */}
            <div className="flex items-center px-2.5 py-1 rounded-full bg-[#E7F5EE] text-[#168A5A] text-xs font-bold border border-[#DDE5E0]">
              <StatusIndicator status="online" pulse />
              <span className="ml-1 tracking-wider uppercase text-[11px]">LIVE</span>
            </div>

            {/* Community 101 / Pitch Guide */}
            {onOpenDemoModal && (
              <button
                type="button"
                onClick={onOpenDemoModal}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#163A2B] bg-[#F5F7F6] hover:bg-[#EBF0ED] border border-[#DDE5E0] transition"
                title="Guided walkthrough of GridShare architecture"
              >
                <FaIcon name="sparkles" className="text-[#168A5A] text-xs" />
                <span>Community 101</span>
              </button>
            )}

            {/* Notifications Popover */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative w-9 h-9 rounded-xl border border-[#DDE5E0] bg-white text-[#5D6B64] hover:text-[#102019] hover:bg-[#F5F7F6] flex items-center justify-center text-sm shadow-subtle transition"
                aria-label="View notifications"
              >
                <FaIcon name="alert" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#168A5A]" />
              </button>

              {isNotificationsOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 rounded-2xl border border-[#DDE5E0] bg-white p-3 shadow-modal backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-[#DDE5E0] px-1">
                    <span className="text-xs font-bold text-[#102019]">Live Activity Feed</span>
                    <span className="text-[11px] text-[#168A5A] font-semibold">3 New</span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-2 rounded-xl bg-[#FBFCFB] border border-[#DDE5E0] text-xs">
                        <div className="flex items-center justify-between font-bold text-[#102019]">
                          <span className="flex items-center gap-1.5">
                            <FaIcon name={n.icon} className="text-[#168A5A] text-xs" />
                            {n.title}
                          </span>
                          <span className="text-[10px] text-[#83908A] font-normal">{n.time}</span>
                        </div>
                        <p className="text-[11.5px] text-[#5D6B64] mt-0.5">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile / Active Household Selector */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border border-[#DDE5E0] bg-white hover:bg-[#F5F7F6] text-[#102019] shadow-subtle transition"
                aria-label="Household Profile Switcher"
              >
                <div className="w-6 h-6 rounded-lg bg-[#163A2B] text-white flex items-center justify-center text-xs">
                  <FaIcon name="user" />
                </div>
                <span className="text-xs font-bold hidden xl:inline truncate max-w-[110px]">
                  {activeHousehold.split(' ')[0]} {activeHousehold.split(' ')[1]}
                </span>
                <FaIcon name="chevronDown" className="text-[9px] text-[#83908A]" />
              </button>

              {isProfileOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl border border-[#DDE5E0] bg-white p-2 shadow-modal backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50">
                  <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#83908A]">
                    Select Active Perspective
                  </div>
                  {households.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => {
                        setActiveHousehold(h.name);
                        setIsProfileOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between text-xs ${
                        activeHousehold === h.name
                          ? 'bg-[#E7F5EE] text-[#168A5A] font-bold'
                          : 'hover:bg-[#F5F7F6] text-[#102019]'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{h.name}</div>
                        <div className="text-[10px] text-[#83908A]">{h.type}</div>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-[#168A5A]">{h.balance}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-xl border border-[#DDE5E0] bg-white text-[#5D6B64] hover:bg-[#F5F7F6] flex items-center justify-center"
              aria-label="Toggle Mobile Navigation"
            >
              <FaIcon name={mobileMenuOpen ? 'close' : 'bars'} className="text-sm" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#DDE5E0] bg-white px-4 py-3 shadow-modal animate-in slide-in-from-top duration-150">
            <div className="grid grid-cols-2 gap-2">
              {[...primaryNavItems, ...moreNavItems].map((item) => {
                const isActive = isCurrentActive(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                      isActive
                        ? 'bg-[#163A2B] text-white shadow-sm'
                        : 'text-[#5D6B64] bg-[#F5F7F6] hover:bg-[#EBF0ED]'
                    }`}
                  >
                    <FaIcon name={item.iconName} className={isActive ? 'text-[#34B978]' : 'text-[#83908A]'} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
            
            <div className="mt-3 pt-2 border-t border-[#DDE5E0] flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsHealthOpen(true);
                }}
                className="text-xs font-bold text-[#168A5A] flex items-center gap-1.5 p-1"
              >
                <FaIcon name="health" />
                <span>System Health</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* System Health Modal */}
      <SystemHealthModal isOpen={isHealthOpen} onClose={() => setIsHealthOpen(false)} />
    </>
  );
}
