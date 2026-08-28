import React, { useState } from 'react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Overview', path: '/', iconName: 'overview' },
    { name: 'Energy Network', path: '/network', iconName: 'network' },
    { name: 'AI Copilot', path: '/ai', iconName: 'ai', highlight: true },
    { name: 'Marketplace', path: '/marketplace', iconName: 'marketplace' },
    { name: 'Battery ESS', path: '/battery', iconName: 'battery' },
    { name: 'My Home', path: '/my-home', iconName: 'home' },
    { name: 'Devices', path: '/devices', iconName: 'devices' },
    { name: 'Transactions', path: '/transactions', iconName: 'transactions' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs select-none">
      <div className="mx-auto flex h-13 max-w-[1680px] items-center justify-between px-3 sm:px-4">
        {/* Brand Logo & Connection Status */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <NavLink to="/" className="flex items-center space-x-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-emerald-400 shadow-md group-hover:bg-slate-800 transition">
              <FaIcon name="energy" className="text-sm" />
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-extrabold tracking-tight text-slate-900">
                GRID<span className="text-emerald-600">SHARE</span>
              </span>
              <span className="hidden sm:inline-block rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 border border-emerald-200">
                AI OS
              </span>
            </div>
          </NavLink>

          <div className="hidden xl:flex items-center space-x-1.5 border-l border-slate-200 pl-3 text-xs">
            <StatusIndicator
              status={isOnline ? 'online' : 'offline'}
              pulse={isOnline}
              label={isOnline ? 'Supabase Live' : 'Offline'}
            />
          </div>
        </div>

        {/* Primary Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1 xl:space-x-1.5">
          {navItems.map((item) => {
            const isMatch =
              location.pathname === item.path ||
              (item.path === '/' && (location.pathname === '/' || location.pathname === '/dashboard')) ||
              (item.path === '/network' && (location.pathname === '/network' || location.pathname === '/simulation' || location.pathname === '/energy-map'));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                  isMatch
                    ? 'bg-slate-900 text-emerald-400 shadow-sm border border-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                } ${item.highlight && !isMatch ? 'text-purple-700 font-bold' : ''}`}
              >
                <FaIcon
                  name={item.iconName}
                  className={`text-xs ${isMatch ? 'text-emerald-400' : 'text-slate-400'}`}
                />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Utility Badges & Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Battery Status Gauge */}
          <div className="hidden md:flex items-center space-x-1.5 rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-1 text-xs font-semibold text-amber-900">
            <FaIcon name="battery" className="text-amber-600" />
            <span>{batterySoc.toFixed(0)}%</span>
            <span className="text-[10px] font-normal text-amber-700 hidden xl:inline">ESS</span>
          </div>

          {/* Grid Tariff Tag */}
          <div className="hidden xl:flex items-center space-x-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
            <FaIcon name="grid" className="text-blue-600 text-[11px]" />
            <span className="text-slate-500 font-normal text-[11px]">Grid:</span>
            <span>₹{gridPrice.toFixed(2)}</span>
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
              className="text-xs font-bold"
            >
              <span className="hidden sm:inline">Scenarios</span>
            </Button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex lg:hidden items-center justify-center h-8 w-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            aria-label="Toggle Navigation Menu"
          >
            <FaIcon name={mobileMenuOpen ? 'close' : 'sliders'} className="text-sm" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-xl animate-in slide-in-from-top duration-150">
          <div className="grid grid-cols-2 gap-2 py-1">
            {navItems.map((item) => {
              const isMatch =
                location.pathname === item.path ||
                (item.path === '/' && (location.pathname === '/' || location.pathname === '/dashboard')) ||
                (item.path === '/network' && (location.pathname === '/network' || location.pathname === '/simulation'));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                    isMatch
                      ? 'bg-slate-900 text-emerald-400'
                      : 'text-slate-700 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <FaIcon name={item.iconName} className={isMatch ? 'text-emerald-400' : 'text-slate-500'} />
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
