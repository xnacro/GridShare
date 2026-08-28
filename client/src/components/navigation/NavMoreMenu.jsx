import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import FaIcon from '../icons/FaIcon';

export default function NavMoreMenu({
  isCollapsed = false,
  onOpenDemoModal,
  onOpenHealthModal,
}) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const moreItems = [
    {
      category: 'Energy',
      items: [
        { name: 'Devices', path: '/devices', iconName: 'devices', desc: 'Simulated smart meters & edge nodes' },
        { name: 'Transactions', path: '/transactions', iconName: 'transactions', desc: 'Bilateral energy trade ledger' },
      ],
    },
    {
      category: 'Insights',
      items: [
        { name: 'Analytics', path: '/analytics', iconName: 'analytics', desc: 'Community performance benchmarks', isAnalytics: true },
        { name: 'Scenarios', action: 'demo', iconName: 'scenarios', desc: 'Guided microgrid stress tests' },
      ],
    },
    {
      category: 'System',
      items: [
        { name: 'System Health', action: 'health', iconName: 'health', desc: 'Database & backend telemetry status' },
      ],
    },
  ];

  const isMoreActive = location.pathname === '/devices' || location.pathname === '/transactions' || location.pathname === '/optimize' || location.pathname === '/analytics';

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative inline-flex items-center" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={isCollapsed ? 'More sub-systems' : undefined}
        aria-expanded={isOpen}
        aria-label="More navigation options"
        className={`group relative inline-flex items-center justify-center rounded-full transition-all duration-200 ease-out select-none ${
          isCollapsed ? 'h-9 w-9 p-0' : 'px-3 py-1.5 space-x-1.5'
        } ${
          isOpen || isMoreActive
            ? 'bg-[#E7F5EE] text-[#12372A] shadow-subtle'
            : 'text-[#5C6962] hover:text-[#142019] hover:bg-[#F5F6F2]'
        }`}
      >
        <FaIcon
          name="ellipsis"
          className={`text-sm flex-shrink-0 transition-colors ${
            isOpen || isMoreActive ? 'text-[#1C9A67]' : 'text-[#7C8781] group-hover:text-[#142019]'
          }`}
        />

        {!isCollapsed && (
          <span className="text-xs sm:text-[13px] font-semibold tracking-tight">
            More
          </span>
        )}

        {!isCollapsed && (
          <FaIcon
            name={isOpen ? 'chevronUp' : 'chevronDown'}
            className="text-[9px] text-[#7C8781] transition-transform"
          />
        )}

        {/* Floating tooltip in collapsed mode */}
        {isCollapsed && (
          <div className="absolute top-full mt-2.5 px-2.5 py-1 bg-[#12251D] text-white text-[11px] font-semibold rounded-lg shadow-modal opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 -translate-y-1 group-hover:translate-y-0 z-50 whitespace-nowrap">
            More
          </div>
        )}
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute top-full right-0 sm:left-1/2 sm:-translate-x-1/2 mt-3 w-72 sm:w-80 rounded-2xl border border-[#DDE4DF] bg-white p-3 shadow-modal backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50">
          <div className="space-y-3">
            {moreItems.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#7C8781]">
                  {group.category}
                </div>

                {group.items.map((item, iIdx) => {
                  if (item.action === 'demo') {
                    return (
                      <button
                        key={iIdx}
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          if (onOpenDemoModal) onOpenDemoModal();
                        }}
                        className="w-full flex items-start space-x-3 p-2 rounded-xl text-left hover:bg-[#F5F6F2] transition text-[#142019] group"
                      >
                        <div className="mt-0.5 w-7 h-7 rounded-lg bg-[#FFF3D7] text-[#E7A82D] flex items-center justify-center text-xs flex-shrink-0">
                          <FaIcon name={item.iconName} />
                        </div>
                        <div>
                          <div className="text-xs font-bold">{item.name}</div>
                          <div className="text-[11px] text-[#7C8781] leading-snug">{item.desc}</div>
                        </div>
                      </button>
                    );
                  }

                  if (item.action === 'health') {
                    return (
                      <button
                        key={iIdx}
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          if (onOpenHealthModal) onOpenHealthModal();
                        }}
                        className="w-full flex items-start space-x-3 p-2 rounded-xl text-left hover:bg-[#F5F6F2] transition text-[#142019] group"
                      >
                        <div className="mt-0.5 w-7 h-7 rounded-lg bg-[#E7F5EE] text-[#1C9A67] flex items-center justify-center text-xs flex-shrink-0">
                          <FaIcon name={item.iconName} />
                        </div>
                        <div>
                          <div className="text-xs font-bold">{item.name}</div>
                          <div className="text-[11px] text-[#7C8781] leading-snug">{item.desc}</div>
                        </div>
                      </button>
                    );
                  }

                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={iIdx}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-start space-x-3 p-2 rounded-xl transition ${
                        isActive
                          ? 'bg-[#E7F5EE] text-[#12372A]'
                          : 'hover:bg-[#F5F6F2] text-[#142019]'
                      }`}
                    >
                      <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${
                        isActive ? 'bg-white text-[#1C9A67]' : 'bg-[#F5F6F2] text-[#7C8781]'
                      }`}>
                        <FaIcon name={item.iconName} />
                      </div>
                      <div>
                        <div className="text-xs font-bold">{item.name}</div>
                        <div className="text-[11px] text-[#7C8781] leading-snug">{item.desc}</div>
                      </div>
                    </NavLink>
                  );
                })}

                {gIdx < moreItems.length - 1 && (
                  <div className="border-t border-[#DDE4DF] my-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
