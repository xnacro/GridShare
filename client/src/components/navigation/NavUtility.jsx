import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FaIcon from '../icons/FaIcon';

export default function NavUtility({ onOpenLoginModal }) {
  const navigate = useNavigate();
  const { user, profile, household, signOut, signInAsDemo } = useAuth();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const notifications = [
    { id: 1, title: 'AI Match Executed', desc: 'My Home sold 2.0 kWh to Eco House @ ₹4.50/kWh', time: '2m ago', icon: 'marketplace' },
    { id: 2, title: 'Battery Buffer Active', desc: '1.2 kWh stored to preserve 20% reserve floor', time: '14m ago', icon: 'battery' },
    { id: 3, title: 'Solar Noon Forecast', desc: 'High generation expected (peak 11.5 kW)', time: '45m ago', icon: 'solar' },
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

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Rahul Sharma';
  const householdName = household?.name || (household?.id === 'house_b' ? 'Heavy Load Home' : 'Green Valley Residence');

  return (
    <div className="flex items-center space-x-2.5 sm:space-x-3 select-none flex-shrink-0">
      {/* Notifications Popover */}
      <div className="relative" ref={notifRef}>
        <button
          type="button"
          onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          className="relative w-9 h-9 rounded-full border border-white/90 bg-white/80 backdrop-blur-xl text-[#526B66] hover:text-[#0F2233] hover:bg-white flex items-center justify-center text-sm shadow-[0_2px_8px_rgba(15,34,51,0.04),inset_0_1px_1px_rgba(255,255,255,1)] transition hover:shadow-md"
          aria-label="View notifications"
        >
          <FaIcon name="alert" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#C2571F] text-white text-[9px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
            1
          </span>
        </button>

        {isNotificationsOpen && (
          <div className="absolute top-full right-0 mt-2.5 w-80 rounded-2xl border border-white/90 bg-white/90 p-3.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 z-50">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(15,34,51,0.06)] px-1">
              <span className="text-xs font-bold text-[#0F2233]">Live Activity Feed</span>
              <span className="text-[11px] text-[#156B5C] font-bold">1 Unread</span>
            </div>
            <div className="mt-2.5 space-y-2">
              {notifications.map((n) => (
                <div key={n.id} className="p-2.5 rounded-xl bg-white/80 border border-white text-xs shadow-xs">
                  <div className="flex items-center justify-between font-bold text-[#0F2233]">
                    <span className="flex items-center gap-1.5">
                      <FaIcon name={n.icon} className="text-[#156B5C] text-xs" />
                      {n.title}
                    </span>
                    <span className="text-[10px] text-[#526B66] font-normal">{n.time}</span>
                  </div>
                  <p className="text-[11px] text-[#526B66] mt-0.5">{n.desc}</p>
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
          className="flex items-center space-x-2.5 rounded-full border border-white/90 bg-white/80 backdrop-blur-xl p-1 pr-3 shadow-[0_2px_8px_rgba(15,34,51,0.04),inset_0_1px_1px_rgba(255,255,255,1)] hover:bg-white transition hover:shadow-md focus:outline-none"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#156B5C] to-[#2DD4BF] text-white flex items-center justify-center text-xs font-bold shadow-xs">
            {displayName.charAt(0)}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-[#0F2233] leading-tight line-clamp-1">
              {displayName}
            </span>
            <span className="text-[10px] text-[#526B66] leading-none line-clamp-1">
              {householdName}
            </span>
          </div>
        </button>

        {isProfileOpen && (
          <div className="absolute top-full right-0 mt-2.5 w-72 rounded-2xl border border-white/90 bg-white/90 p-3.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 z-50 space-y-3">
            {/* Profile Info Header */}
            <div className="pb-2 border-b border-[rgba(15,34,51,0.06)] px-1 space-y-0.5">
              <div className="text-xs font-extrabold text-[#0F2233] truncate">{displayName}</div>
              <div className="text-[11px] text-[#526B66] truncate">{user?.email || 'Authenticated User'}</div>
              <div className="text-[10px] font-bold text-[#156B5C] flex items-center gap-1 pt-0.5">
                <FaIcon name="home" className="text-xs" />
                <span>{householdName}</span>
              </div>
            </div>

            {/* Switch Demo Identity for 4 Authentic Microgrid Users */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#526B66] px-1">
                Community Member Switcher
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {/* Anjali */}
                <button
                  type="button"
                  onClick={() => handleSwitchDemo('anjali')}
                  className={`p-2 rounded-xl border text-left text-xs transition ${household?.id === 'house_anjali'
                    ? 'bg-[#E8F3F1] border-[#156B5C] text-[#0F2233] font-bold'
                    : 'bg-[#FAF8F2] border-[#D6D1BE] text-[#747A6C] hover:text-[#0F2233]'
                    }`}
                >
                  <div className="text-[11px] font-bold truncate">Anjali</div>
                  <div className="text-[9px] font-mono text-[#D99A1F] font-bold">+4.2 kW Solar</div>
                </button>

                {/* Prince */}
                <button
                  type="button"
                  onClick={() => handleSwitchDemo('prince')}
                  className={`p-2 rounded-xl border text-left text-xs transition ${household?.id === 'house_prince'
                    ? 'bg-[#F9ECE6] border-[#C2571F] text-[#0F2233] font-bold'
                    : 'bg-[#FAF8F2] border-[#D6D1BE] text-[#747A6C] hover:text-[#0F2233]'
                    }`}
                >
                  <div className="text-[11px] font-bold truncate">Prince</div>
                  <div className="text-[9px] font-mono text-[#C2571F] font-bold">-4.0 kW Load</div>
                </button>

                {/* Ayush */}
                <button
                  type="button"
                  onClick={() => handleSwitchDemo('ayush')}
                  className={`p-2 rounded-xl border text-left text-xs transition ${household?.id === 'house_ayush'
                    ? 'bg-[#E8F3F1] border-[#156B5C] text-[#0F2233] font-bold'
                    : 'bg-[#FAF8F2] border-[#D6D1BE] text-[#747A6C] hover:text-[#0F2233]'
                    }`}
                >
                  <div className="text-[11px] font-bold truncate">Ayush</div>
                  <div className="text-[9px] font-mono text-[#156B5C] font-bold">+0.1 kW Balance</div>
                </button>

                {/* Rahul */}
                <button
                  type="button"
                  onClick={() => handleSwitchDemo('rahul')}
                  className={`p-2 rounded-xl border text-left text-xs transition ${household?.id === 'house_rahul'
                    ? 'bg-[#F9ECE6] border-[#C2571F] text-[#0F2233] font-bold'
                    : 'bg-[#FAF8F2] border-[#D6D1BE] text-[#747A6C] hover:text-[#0F2233]'
                    }`}
                >
                  <div className="text-[11px] font-bold truncate">Rahul</div>
                  <div className="text-[9px] font-mono text-[#0F2233] font-bold">-3.4 kW EV</div>
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="pt-1 border-t border-[#D6D1BE]/40 space-y-1">
              <button
                type="button"
                onClick={() => { setIsProfileOpen(false); navigate('/my-home'); }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#FAF8F2] text-xs font-semibold text-[#0F2233] transition"
              >
                <span className="flex items-center gap-2">
                  <FaIcon name="home" className="text-[#156B5C]" />
                  My Household Cockpit
                </span>
                <FaIcon name="chevronRight" className="text-[9px] text-[#747A6C]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  if (onOpenLoginModal) onOpenLoginModal();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#FAF8F2] text-xs font-semibold text-[#0F2233] transition"
              >
                <span className="flex items-center gap-2">
                  <FaIcon name="user" className="text-[#0F2233]" />
                  Manage Account & Sign In
                </span>
                <FaIcon name="chevronRight" className="text-[9px] text-[#747A6C]" />
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#F9ECE6] text-xs font-semibold text-[#C2571F] transition"
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
