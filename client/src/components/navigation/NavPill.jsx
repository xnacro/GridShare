import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import FaIcon from '../icons/FaIcon';

export default function NavPill({
  onOpenDemoModal,
  onOpenHealthModal,
}) {
  const location = useLocation();

  const isCurrentActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard' || location.pathname === '/battery' || location.pathname === '/community';
    }
    if (path === '/my-home') {
      return location.pathname === '/my-home' || location.pathname === '/devices';
    }
    if (path === '/network') {
      return location.pathname === '/network' || location.pathname === '/simulation' || location.pathname === '/energy-map';
    }
    if (path === '/marketplace') {
      return location.pathname === '/marketplace' || location.pathname === '/transactions';
    }
    if (path === '/ai') {
      return location.pathname === '/ai' || location.pathname === '/copilot' || location.pathname === '/forecast';
    }
    return location.pathname === path;
  };

  // 5 Core Public Tabs
  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'My Home', path: '/my-home' },
    { name: 'Live Map', path: '/network' },
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'AI Forecast', path: '/ai' },
  ];

  return (
    <nav
      aria-label="Main Navigation"
      className="relative inline-flex items-center rounded-full bg-white/80 backdrop-blur-2xl border border-white/90 p-1.5 shadow-[0_8px_30px_rgba(15,34,51,0.04),inset_0_1px_1px_rgba(255,255,255,1)] select-none"
    >
      <div className="flex items-center space-x-1 sm:space-x-1.5">
        {navItems.map((item) => {
          const active = isCurrentActive(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                active
                  ? 'bg-gradient-to-r from-[#0D9488] to-[#0F766E] text-white shadow-[0_4px_12px_rgba(13,148,136,0.35)] font-bold'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/70 hover:backdrop-blur-md'
              }`}
            >
              {item.name}
            </NavLink>
          );
        })}

        {/* Quick Guided Scenarios Runner for Demos */}
        {onOpenDemoModal && (
          <button
            type="button"
            onClick={onOpenDemoModal}
            title="Launch guided storm, outage & high-solar demo scenarios"
            className="px-3 sm:px-3.5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap text-[#0F172A] bg-white/90 hover:bg-white border border-[#D97706]/30 flex items-center gap-1.5 shadow-2xs hover:shadow-xs"
          >
            <FaIcon name="bolt" className="text-[#D97706] text-xs" />
            <span className="hidden xl:inline">Scenarios</span>
          </button>
        )}
      </div>
    </nav>
  );
}
