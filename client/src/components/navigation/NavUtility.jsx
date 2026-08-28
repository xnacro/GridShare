import React, { useState, useRef, useEffect } from 'react';
import FaIcon from '../icons/FaIcon';
import { StatusIndicator } from '../ui/Badge';

export default function NavUtility() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeHousehold, setActiveHousehold] = useState('House A (Prosumer)');

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const notifications = [
    { id: 1, title: 'AI Match Executed', desc: 'House A sold 2.8 kWh to House B @ ₹4.50/kWh', time: '2m ago', icon: 'trade' },
    { id: 2, title: 'Battery Buffer Active', desc: '1.2 kWh stored to preserve 10% reserve floor', time: '14m ago', icon: 'battery' },
    { id: 3, title: 'Solar Noon Forecast', desc: 'High generation expected (peak 7.2 kW)', time: '45m ago', icon: 'solar' },
  ];

  const households = [
    { id: 'house_a', name: 'House A (Prosumer)', type: 'Solar Generator', balance: '+4.7 kW' },
    { id: 'house_b', name: 'House B (Consumer)', type: 'Heavy EV Load', balance: '-2.8 kW' },
    { id: 'house_c', name: 'House C (Balanced)', type: 'Prosumer', balance: '+1.0 kW' },
    { id: 'all', name: 'Community Manager View', type: 'Microgrid Admin', balance: '+2.9 kW Net' },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
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
    <div className="flex items-center space-x-2.5 sm:space-x-3 select-none flex-shrink-0">
      
      {/* LIVE Indicator Badge */}
      <div className="flex items-center px-2.5 py-1 rounded-full bg-[#E7F5EE] text-[#1C9A67] text-xs font-bold border border-[#DDE4DF]">
        <StatusIndicator status="online" pulse />
        <span className="ml-1 tracking-wider uppercase text-[10px]">LIVE</span>
      </div>

      {/* Notifications Popover */}
      <div className="relative" ref={notifRef}>
        <button
          type="button"
          onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          className="relative w-9 h-9 rounded-full border border-[#DDE4DF] bg-white text-[#5C6962] hover:text-[#142019] hover:bg-[#F5F6F2] flex items-center justify-center text-sm shadow-subtle transition-all duration-150"
          aria-label="View notifications"
        >
          <FaIcon name="alert" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#1C9A67]" />
        </button>

        {isNotificationsOpen && (
          <div className="absolute top-full right-0 mt-3 w-80 rounded-2xl border border-[#DDE4DF] bg-white p-3 shadow-modal backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50">
            <div className="flex items-center justify-between pb-2 border-b border-[#DDE4DF] px-1">
              <span className="text-xs font-bold text-[#142019]">Live Activity Feed</span>
              <span className="text-[11px] text-[#1C9A67] font-semibold">3 New</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {notifications.map((n) => (
                <div key={n.id} className="p-2.5 rounded-xl bg-[#F5F6F2]/60 border border-[#DDE4DF] text-xs">
                  <div className="flex items-center justify-between font-bold text-[#142019]">
                    <span className="flex items-center gap-1.5">
                      <FaIcon name={n.icon} className="text-[#1C9A67] text-xs" />
                      {n.title}
                    </span>
                    <span className="text-[10px] text-[#7C8781] font-normal">{n.time}</span>
                  </div>
                  <p className="text-[11.5px] text-[#5C6962] mt-0.5">{n.desc}</p>
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
          className="flex items-center space-x-2 px-2.5 py-1 rounded-full border border-[#DDE4DF] bg-white hover:bg-[#F5F6F2] text-[#142019] shadow-subtle transition-all duration-150"
          aria-label="Household Profile Switcher"
        >
          <div className="w-6 h-6 rounded-full bg-[#12251D] text-white flex items-center justify-center text-xs">
            <FaIcon name="user" />
          </div>
          <span className="text-xs font-bold hidden xl:inline truncate max-w-[120px]">
            {activeHousehold.split(' ')[0]} {activeHousehold.split(' ')[1]}
          </span>
          <FaIcon name="chevronDown" className="text-[9px] text-[#7C8781]" />
        </button>

        {isProfileOpen && (
          <div className="absolute top-full right-0 mt-3 w-64 rounded-2xl border border-[#DDE4DF] bg-white p-2 shadow-modal backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50">
            <div className="px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#7C8781]">
              Active Household Perspective
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
                    ? 'bg-[#E7F5EE] text-[#1C9A67] font-bold'
                    : 'hover:bg-[#F5F6F2] text-[#142019]'
                }`}
              >
                <div>
                  <div className="font-bold">{h.name}</div>
                  <div className="text-[10px] text-[#7C8781]">{h.type}</div>
                </div>
                <span className="font-mono text-[10px] font-bold text-[#1C9A67]">{h.balance}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
