import React from 'react';
import { useLocation } from 'react-router-dom';
import NavItem from './NavItem';
import NavMoreMenu from './NavMoreMenu';
import NavToggle from './NavToggle';

export default function NavPill({
  isCollapsed = false,
  onToggleCollapse,
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

  const navItems = [
    { name: 'Overview', path: '/', iconName: 'overview', tooltip: 'Command center & community state' },
    { name: 'Energy Network', path: '/network', iconName: 'network', tooltip: '3D spatial microgrid digital twin' },
    { name: 'AI Copilot', path: '/ai', iconName: 'ai', isAi: true, tooltip: 'Multi-horizon predictive dispatch' },
    { name: 'Marketplace', path: '/marketplace', iconName: 'marketplace', tooltip: 'AI-matched P2P energy exchange' },
    { name: 'Battery', path: '/battery', iconName: 'battery', tooltip: '50 kWh storage asset & reserve floor' },
    { name: 'My Home', path: '/my-home', iconName: 'home', tooltip: '3D residential energy cockpit' },
  ];

  return (
    <nav
      aria-label="Main Navigation"
      className={`inline-flex items-center rounded-full border border-[#DDE4DF] bg-white p-1.5 shadow-elevated transition-all duration-300 ease-out select-none ${
        isCollapsed ? 'space-x-1' : 'space-x-1 sm:space-x-1.5'
      }`}
    >
      {/* PRIMARY NAVIGATION ITEMS */}
      <div className="flex items-center space-x-1">
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            name={item.name}
            path={item.path}
            iconName={item.iconName}
            isCollapsed={isCollapsed}
            isAi={item.isAi}
            isActive={isCurrentActive(item.path)}
            tooltip={item.tooltip}
          />
        ))}

        {/* MORE MENU DROPDOWN */}
        <NavMoreMenu
          isCollapsed={isCollapsed}
          onOpenDemoModal={onOpenDemoModal}
          onOpenHealthModal={onOpenHealthModal}
        />
      </div>

      {/* SEPARATOR */}
      <div className="h-5 w-[1px] bg-[#DDE4DF] mx-1" />

      {/* COLLAPSE / EXPAND TOGGLE */}
      <NavToggle
        isCollapsed={isCollapsed}
        onToggle={onToggleCollapse}
      />
    </nav>
  );
}
