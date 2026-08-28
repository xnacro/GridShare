import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import NavMoreMenu from './NavMoreMenu';

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
      className="relative inline-flex items-center rounded-full bg-white/95 backdrop-blur-xl border border-[#BED69E] p-1.5 shadow-sm select-none"
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
                  ? 'bg-[#012F13] text-white shadow-xs font-bold'
                  : 'text-[#4A5B4F] hover:text-[#011207] hover:bg-[#E2F0CC]/40'
              }`}
            >
              {item.name}
            </NavLink>
          );
        })}

        {/* ⚡ Quick Guided Scenarios Runner for Demos */}
        {onOpenDemoModal && (
          <button
            type="button"
            onClick={onOpenDemoModal}
            title="Launch guided storm, outage & high-solar demo scenarios"
            className="px-3 sm:px-3.5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap text-[#012F13] bg-[#E2F0CC] hover:bg-[#D5E6BE] flex items-center gap-1.5 shadow-2xs"
          >
            <span>⚡</span>
            <span className="hidden xl:inline">Scenarios</span>
          </button>
        )}
      </div>
    </nav>
  );
}
