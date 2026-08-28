import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import FaIcon from '../icons/FaIcon';

export default function NavMobileDrawer({
  isOpen,
  onClose,
  onOpenDemoModal,
  onOpenHealthModal,
}) {
  const location = useLocation();

  if (!isOpen) return null;

  const isCurrentActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    if (path === '/network') return location.pathname === '/network' || location.pathname === '/simulation' || location.pathname === '/energy-map';
    if (path === '/ai') return location.pathname === '/ai' || location.pathname === '/copilot';
    if (path === '/battery') return location.pathname === '/battery' || location.pathname === '/community';
    return location.pathname === path;
  };

  const navGroups = [
    {
      title: 'Core Surfaces',
      items: [
        { name: 'Overview', path: '/', iconName: 'overview' },
        { name: 'Energy Network', path: '/network', iconName: 'network' },
        { name: 'AI Copilot', path: '/ai', iconName: 'ai', isAi: true },
        { name: 'Marketplace', path: '/marketplace', iconName: 'marketplace' },
        { name: 'Battery Storage', path: '/battery', iconName: 'battery' },
        { name: 'My Home', path: '/my-home', iconName: 'home' },
      ],
    },
    {
      title: 'Subsystems',
      items: [
        { name: 'Devices & Meters', path: '/devices', iconName: 'devices' },
        { name: 'Transaction Ledger', path: '/transactions', iconName: 'transactions' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#142019]/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Card */}
      <div className="relative ml-auto flex h-full w-4/5 max-w-sm flex-col bg-white p-6 shadow-modal animate-in slide-in-from-right duration-200 z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DDE4DF]">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#12251D] text-white shadow-sm">
              <FaIcon name="energy" className="text-sm text-[#39C985]" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-[#142019]">
              GRID<span className="text-[#1C9A67]">SHARE</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#7C8781] hover:bg-[#F5F6F2] hover:text-[#142019]"
            aria-label="Close navigation"
          >
            <FaIcon name="close" className="text-sm" />
          </button>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#7C8781]">
                {group.title}
              </div>
              {group.items.map((item) => {
                const active = isCurrentActive(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center space-x-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition ${
                      active
                        ? item.isAi
                          ? 'bg-[#F0ECFF] text-[#7357C8]'
                          : 'bg-[#E7F5EE] text-[#12372A]'
                        : 'text-[#5C6962] hover:bg-[#F5F6F2] hover:text-[#142019]'
                    }`}
                  >
                    <FaIcon
                      name={item.iconName}
                      className={active ? (item.isAi ? 'text-[#7357C8]' : 'text-[#1C9A67]') : 'text-[#7C8781]'}
                    />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-[#DDE4DF] space-y-2">
          {onOpenDemoModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDemoModal();
              }}
              className="w-full flex items-center space-x-2.5 rounded-2xl px-3.5 py-2 text-xs font-bold text-[#142019] bg-[#FFF3D7] hover:bg-[#FDE7B4] transition"
            >
              <FaIcon name="scenarios" className="text-[#E7A82D]" />
              <span>Guided Scenarios</span>
            </button>
          )}

          {onOpenHealthModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenHealthModal();
              }}
              className="w-full flex items-center space-x-2.5 rounded-2xl px-3.5 py-2 text-xs font-bold text-[#5C6962] hover:bg-[#F5F6F2] hover:text-[#142019] transition"
            >
              <FaIcon name="health" className="text-[#1C9A67]" />
              <span>System Health</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
