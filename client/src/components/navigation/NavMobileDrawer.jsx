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
      title: 'Core Public Surfaces',
      items: [
        { name: 'Dashboard', path: '/', iconName: 'overview' },
        { name: 'My Home', path: '/my-home', iconName: 'home' },
        { name: 'Live Map', path: '/network', iconName: 'network' },
        { name: 'Marketplace', path: '/marketplace', iconName: 'marketplace' },
        { name: 'AI Forecast', path: '/ai', iconName: 'ai', isAi: true },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#15211B]/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Card */}
      <div className="relative ml-auto flex h-full w-4/5 max-w-sm flex-col bg-white p-6 shadow-modal animate-in slide-in-from-right duration-200 z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DCE4DE]">
          <div className="flex items-center space-x-2.5">
            <span className="font-changa text-xl font-normal tracking-tight text-[#15211B]">
              GridShare
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#87918B] hover:bg-[#F5F7F3] hover:text-[#15211B]"
            aria-label="Close navigation"
          >
            <FaIcon name="close" className="text-sm" />
          </button>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#87918B]">
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
                          ? 'bg-[#F1EDFF] text-[#7359C8]'
                          : 'bg-[#E7F6EE] text-[#12392B]'
                        : 'text-[#5E6A63] hover:bg-[#F5F7F3] hover:text-[#15211B]'
                    }`}
                  >
                    <FaIcon
                      name={item.iconName}
                      className={active ? (item.isAi ? 'text-[#7359C8]' : 'text-[#209B67]') : 'text-[#87918B]'}
                    />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-[#DCE4DE] space-y-2">
          {onOpenDemoModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDemoModal();
              }}
              className="w-full flex items-center space-x-2.5 rounded-2xl px-3.5 py-2 text-xs font-bold text-[#15211B] bg-[#FFF3D7] hover:bg-[#FDE7B4] transition"
            >
              <FaIcon name="scenarios" className="text-[#E7AA31]" />
              <span>Guided Scenarios</span>
            </button>
          )}

          {/* [DISABLED FOR CLEAN PUBLIC UI] System Health action
          {onOpenHealthModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenHealthModal();
              }}
              className="w-full flex items-center space-x-2.5 rounded-2xl px-3.5 py-2 text-xs font-bold text-[#5E6A63] hover:bg-[#F5F7F3] hover:text-[#15211B] transition"
            >
              <FaIcon name="health" className="text-[#209B67]" />
              <span>System Health</span>
            </button>
          )} */}
        </div>
      </div>
    </div>
  );
}
