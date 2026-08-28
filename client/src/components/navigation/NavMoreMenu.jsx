import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import FaIcon from '../icons/FaIcon';

export default function NavMoreMenu({
  isOpen: controlledIsOpen,
  setIsOpen: controlledSetIsOpen,
  onOpenDemoModal,
  onOpenHealthModal,
}) {
  const location = useLocation();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const menuRef = useRef(null);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const setIsOpen = isControlled ? controlledSetIsOpen : setInternalIsOpen;

  const moreItems = [
    {
      category: 'Energy Infrastructure',
      items: [
        { name: 'Devices & Meters', path: '/devices', iconName: 'devices', desc: 'Simulated smart meters & edge telemetry' },
        { name: 'Transaction Ledger', path: '/transactions', iconName: 'transactions', desc: 'Double-auction bilateral trade ledger' },
      ],
    },
    {
      category: 'Intelligence & Optimization',
      items: [
        { name: 'Dispatch Priorities', path: '/optimize', iconName: 'sliders', desc: 'Interactive rule-based optimizer' },
        { name: 'Demo Scenarios', action: 'demo', iconName: 'scenarios', desc: 'Guided microgrid weather & load tests' },
      ],
    },
    /* 
    // [DISABLED FOR CLEAN PUBLIC UI] System Health diagnostic telemetry
    {
      category: 'System Telemetry',
      items: [
        { name: 'System Health', action: 'health', iconName: 'health', desc: 'PostgreSQL & ML API pipeline status' },
      ],
    },
    */
  ];

  const isMoreActive = location.pathname === '/devices' || location.pathname === '/transactions' || location.pathname === '/optimize';

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
  }, [setIsOpen]);

  return (
    <div className="relative inline-flex items-center" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="More navigation options"
        className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap flex items-center space-x-1.5 ${
          isOpen || isMoreActive
            ? 'bg-[#E2F0CC] text-[#012F13] shadow-xs font-bold'
            : 'text-[#4A5B4F] hover:text-[#011207] hover:bg-[#E2F0CC]/40'
        }`}
      >
        <span>More</span>
        <FaIcon
          name={isOpen ? 'chevronUp' : 'chevronDown'}
          className="text-[9px] text-[#7A8C7F] transition-transform ml-0.5"
        />
      </button>

      {/* DROPDOWN MENU POPOVER */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-72 sm:w-80 rounded-2xl border border-[#BED69E] bg-white p-3.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50">
          <div className="space-y-3">
            {moreItems.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#7A8C7F]">
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
                        className="w-full flex items-start space-x-3 p-2.5 rounded-xl text-left hover:bg-[#F4F9EB] transition text-[#011207] group"
                      >
                        <div className="mt-0.5 w-7 h-7 rounded-lg bg-[#E2F0CC] text-[#012F13] flex items-center justify-center text-xs flex-shrink-0">
                          <FaIcon name={item.iconName} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#011207]">{item.name}</div>
                          <div className="text-[11px] text-[#4A5B4F] leading-snug">{item.desc}</div>
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
                        className="w-full flex items-start space-x-3 p-2.5 rounded-xl text-left hover:bg-[#F4F9EB] transition text-[#011207] group"
                      >
                        <div className="mt-0.5 w-7 h-7 rounded-lg bg-[#E2F0CC] text-[#8BC53D] flex items-center justify-center text-xs flex-shrink-0">
                          <FaIcon name={item.iconName} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#011207]">{item.name}</div>
                          <div className="text-[11px] text-[#4A5B4F] leading-snug">{item.desc}</div>
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
                      className={`flex items-start space-x-3 p-2.5 rounded-xl transition ${
                        isActive
                          ? 'bg-[#E2F0CC] text-[#012F13] font-bold'
                          : 'hover:bg-[#F4F9EB] text-[#011207]'
                      }`}
                    >
                      <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${
                        isActive ? 'bg-white text-[#8BC53D]' : 'bg-[#F4F9EB] text-[#7A8C7F]'
                      }`}>
                        <FaIcon name={item.iconName} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#011207]">{item.name}</div>
                        <div className="text-[11px] text-[#4A5B4F] leading-snug">{item.desc}</div>
                      </div>
                    </NavLink>
                  );
                })}

                {gIdx < moreItems.length - 1 && (
                  <div className="border-t border-[#E2F0CC] my-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
