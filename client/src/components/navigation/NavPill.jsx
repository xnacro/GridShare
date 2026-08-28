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
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    if (path === '/network') {
      return location.pathname === '/network' || location.pathname === '/simulation' || location.pathname === '/energy-map';
    }
    if (path === '/ai') {
      return location.pathname === '/ai' || location.pathname === '/copilot';
    }
    if (path === '/battery') {
      return location.pathname === '/battery' || location.pathname === '/community';
    }
    return location.pathname === path;
  };

  // Static navigation routes
  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Live Map', path: '/network' },
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'Intelligence', path: '/ai' },
    { name: 'Battery', path: '/battery' },
    { name: 'My Home', path: '/my-home' },
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
              className={`px-3.5 sm:px-4.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                active
                  ? 'bg-[#012F13] text-white shadow-xs font-bold'
                  : 'text-[#4A5B4F] hover:text-[#011207] hover:bg-[#E2F0CC]/40'
              }`}
            >
              {item.name}
            </NavLink>
          );
        })}

        {/* More Menu dropdown button */}
        <div className="flex items-center">
          <NavMoreMenu
            onOpenDemoModal={onOpenDemoModal}
            onOpenHealthModal={onOpenHealthModal}
          />
        </div>
      </div>
    </nav>
  );
}
