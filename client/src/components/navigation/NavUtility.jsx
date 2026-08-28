import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FaIcon from '../icons/FaIcon';
import { StatusIndicator } from '../ui/Badge';

export default function NavUtility({ onOpenLoginModal }) {
  const navigate = useNavigate();
  const { user, profile, household, energyNode, signOut, signInAsDemo } = useAuth();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const notifications = [
    { id: 1, title: 'AI Match Executed', desc: 'House A sold 2.8 kWh to House B @ ₹4.50/kWh', time: '2m ago', icon: 'marketplace' },
    { id: 2, title: 'Battery Buffer Active', desc: '1.2 kWh stored to preserve 20% reserve floor', time: '14m ago', icon: 'battery' },
    { id: 3, title: 'Solar Noon Forecast', desc: 'High generation expected (peak 6.8 kW)', time: '45m ago', icon: 'solar' },
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

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    await signOut();
    if (onOpenLoginModal) onOpenLoginModal();
  };

  const handleSwitchDemo = async (role) => {
    setIsProfileOpen(false);
    await signInAsDemo(role);
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'My Account';
  const householdName = household?.name || (household?.id === 'house_b' ? 'House B (Consumer)' : 'House A (Prosumer)');
  const sourceType = energyNode?.source_type || 'SIMULATION';

  return (
    <div className="flex items-center space-x-2.5 sm:space-x-3 select-none flex-shrink-0">
      
      {/* LIVE Indicator Badge */}
      <div className="flex items-center px-2.5 py-1 rounded-full bg-[#E7F6EE] text-[#209B67] text-xs font-bold border border-[#DCE4DE]">
        <StatusIndicator status="online" pulse />
        <span className="ml-1 tracking-wider uppercase text-[10px]">LIVE</span>
      </div>

      {/* Notifications Popover */}
      <div className="relative" ref={notifRef}>
        <button
          type="button"
          onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          className="relative w-9 h-9 rounded-full border border-[#DCE4DE] bg-white text-[#5E6A63] hover:text-[#15211B] hover:bg-[#F5F7F3] flex items-center justify-center text-sm shadow-subtle transition-all duration-150"
          aria-label="View notifications"
        >
          <FaIcon name="alert" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#209B67]" />
        </button>

        {isNotificationsOpen && (
          <div className="absolute top-full right-0 mt-3 w-80 rounded-2xl border border-[#DCE4DE] bg-white p-3 shadow-modal backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE4DE] px-1">
              <span className="text-xs font-bold text-[#15211B]">Live Activity Feed</span>
              <span className="text-[11px] text-[#209B67] font-semibold">3 New</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {notifications.map((n) => (
                <div key={n.id} className="p-2.5 rounded-xl bg-[#F5F7F3]/60 border border-[#DCE4DE] text-xs">
                  <div className="flex items-center justify-between font-bold text-[#15211B]">
                    <span className="flex items-center gap-1.5">
                      <FaIcon name={n.icon} className="text-[#209B67] text-xs" />
                      {n.title}
                    </span>
                    <span className="text-[10px] text-[#87918B] font-normal">{n.time}</span>
                  </div>
                  <p className="text-[11.5px] text-[#5E6A63] mt-0.5">{n.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Identity & Household Profile Popover */}
      <div className="relative" ref={profileRef}>
        <button
          type="button"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center space-x-2 px-2.5 py-1 rounded-full border border-[#DCE4DE] bg-white hover:bg-[#F5F7F3] text-[#15211B] shadow-subtle transition-all duration-150"
          aria-label="User Profile Menu"
        >
          <div className="w-6 h-6 rounded-full bg-[#12392B] text-white flex items-center justify-center text-xs">
            <FaIcon name="user" />
          </div>
          <span className="text-xs font-bold hidden xl:inline truncate max-w-[130px]">
            {displayName.split(' ')[0]}
          </span>
          <span className="px-1.5 py-0.2 rounded bg-[#E7F6EE] text-[#209B67] text-[9px] font-extrabold uppercase hidden sm:inline">
            {sourceType}
          </span>
          <FaIcon name="chevronDown" className="text-[9px] text-[#87918B]" />
        </button>

        {isProfileOpen && (
          <div className="absolute top-full right-0 mt-3 w-72 rounded-2xl border border-[#DCE4DE] bg-white p-3 shadow-modal backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50 space-y-2.5">
            
            {/* Profile Info Header */}
            <div className="pb-2 border-b border-[#DCE4DE] px-1 space-y-0.5">
              <div className="text-xs font-extrabold text-[#15211B] truncate">{displayName}</div>
              <div className="text-[11px] text-[#5E6A63] truncate">{user?.email || 'Authenticated User'}</div>
              <div className="text-[10px] font-bold text-[#209B67] flex items-center gap-1 pt-0.5">
                <FaIcon name="home" className="text-xs" />
                <span>{householdName}</span>
              </div>
            </div>

            {/* Switch Demo Identity for Judges/Testing */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#87918B] px-1">
                Multi-Tenant Switcher
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSwitchDemo('house_a')}
                  className={`p-2 rounded-xl border text-left text-xs transition ${
                    household?.id === 'house_a'
                      ? 'bg-[#E7F6EE] border-[#209B67] text-[#12392B] font-bold'
                      : 'bg-[#F5F7F3] border-[#DCE4DE] text-[#5E6A63] hover:text-[#15211B]'
                  }`}
                >
                  <div className="text-[11px]">House A</div>
                  <div className="text-[9px] font-mono text-[#209B67]">+4.7 kW</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchDemo('house_b')}
                  className={`p-2 rounded-xl border text-left text-xs transition ${
                    household?.id === 'house_b'
                      ? 'bg-[#FDF2F2] border-[#D85D5D] text-[#15211B] font-bold'
                      : 'bg-[#F5F7F3] border-[#DCE4DE] text-[#5E6A63] hover:text-[#15211B]'
                  }`}
                >
                  <div className="text-[11px]">House B</div>
                  <div className="text-[9px] font-mono text-[#D85D5D]">-2.8 kW</div>
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="pt-1 border-t border-[#DCE4DE] space-y-1">
              <button
                type="button"
                onClick={() => { setIsProfileOpen(false); navigate('/my-home'); }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#F5F7F3] text-xs font-semibold text-[#15211B] transition"
              >
                <span className="flex items-center gap-2">
                  <FaIcon name="home" className="text-[#209B67]" />
                  My Household Cockpit
                </span>
                <FaIcon name="chevronRight" className="text-[9px] text-[#87918B]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  if (onOpenLoginModal) onOpenLoginModal();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#F5F7F3] text-xs font-semibold text-[#15211B] transition"
              >
                <span className="flex items-center gap-2">
                  <FaIcon name="user" className="text-[#397BD2]" />
                  Manage Account & Sign In
                </span>
                <FaIcon name="chevronRight" className="text-[9px] text-[#87918B]" />
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#FDF2F2] text-xs font-semibold text-[#D85D5D] transition"
              >
                <span className="flex items-center gap-2">
                  <FaIcon name="error" className="text-xs" />
                  Sign Out
                </span>
              </button>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
