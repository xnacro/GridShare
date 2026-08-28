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
          className="relative w-8 h-8 rounded-full border border-[rgba(23,34,29,0.08)] bg-white text-[#5E6963] hover:text-[#17221D] hover:bg-[#F6F7F4] flex items-center justify-center text-sm shadow-xs transition"
          aria-label="View notifications"
        >
          <FaIcon name="alert" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D45C5C] text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
            1
          </span>
        </button>

        {isNotificationsOpen && (
          <div className="absolute top-full right-0 mt-2.5 w-80 rounded-2xl border border-[rgba(23,34,29,0.10)] bg-white p-3 shadow-lg backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(23,34,29,0.06)] px-1">
              <span className="text-xs font-bold text-[#17221D]">Live Activity Feed</span>
              <span className="text-[11px] text-[#1E9B68] font-bold">1 Unread</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {notifications.map((n) => (
                <div key={n.id} className="p-2.5 rounded-xl bg-[#F6F7F4] border border-[rgba(23,34,29,0.06)] text-xs">
                  <div className="flex items-center justify-between font-bold text-[#17221D]">
                    <span className="flex items-center gap-1.5">
                      <FaIcon name={n.icon} className="text-[#1E9B68] text-xs" />
                      {n.title}
                    </span>
                    <span className="text-[10px] text-[#89938D] font-normal">{n.time}</span>
                  </div>
                  <p className="text-[11px] text-[#5E6963] mt-0.5">{n.desc}</p>
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
          className="flex items-center space-x-2.5 px-2 py-1 rounded-full hover:bg-white/80 transition"
          aria-label="User Profile Menu"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[rgba(23,34,29,0.12)] bg-[#12392B] text-white flex items-center justify-center text-xs flex-shrink-0 shadow-xs">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-bold text-[#17221D] leading-tight">{displayName}</div>
            <div className="text-[10px] font-medium text-[#5E6963] leading-tight truncate max-w-[140px]">
              {householdName}
            </div>
          </div>
        </button>

        {isProfileOpen && (
          <div className="absolute top-full right-0 mt-2.5 w-72 rounded-2xl border border-[rgba(23,34,29,0.10)] bg-white p-3 shadow-lg backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-50 space-y-2.5">

            {/* Profile Info Header */}
            <div className="pb-2 border-b border-[rgba(23,34,29,0.06)] px-1 space-y-0.5">
              <div className="text-xs font-extrabold text-[#17221D] truncate">{displayName}</div>
              <div className="text-[11px] text-[#5E6963] truncate">{user?.email || 'Authenticated User'}</div>
              <div className="text-[10px] font-bold text-[#1E9B68] flex items-center gap-1 pt-0.5">
                <FaIcon name="home" className="text-xs" />
                <span>{householdName}</span>
              </div>
            </div>

            {/* Switch Demo Identity for 4 Authentic Microgrid Users */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#89938D] px-1">
                Community Member Switcher
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {/* Anjali */}
                <button
                  type="button"
                  onClick={() => handleSwitchDemo('anjali')}
                  className={`p-2 rounded-xl border text-left text-xs transition ${household?.id === 'house_anjali'
                    ? 'bg-[#E8F6EE] border-[#1E9B68] text-[#12392B] font-bold'
                    : 'bg-[#F6F7F4] border-[rgba(23,34,29,0.08)] text-[#5E6963] hover:text-[#17221D]'
                    }`}
                >
                  <div className="text-[11px] font-bold truncate">Anjali</div>
                  <div className="text-[9px] font-mono text-[#1E9B68]">+4.2 kW Solar</div>
                </button>

                {/* Prince */}
                <button
                  type="button"
                  onClick={() => handleSwitchDemo('prince')}
                  className={`p-2 rounded-xl border text-left text-xs transition ${household?.id === 'house_prince'
                    ? 'bg-[#FCECEC] border-[#D45C5C] text-[#17221D] font-bold'
                    : 'bg-[#F6F7F4] border-[rgba(23,34,29,0.08)] text-[#5E6963] hover:text-[#17221D]'
                    }`}
                >
                  <div className="text-[11px] font-bold truncate">Prince</div>
                  <div className="text-[9px] font-mono text-[#D45C5C]">-4.0 kW Load</div>
                </button>

                {/* Ayush */}
                <button
                  type="button"
                  onClick={() => handleSwitchDemo('ayush')}
                  className={`p-2 rounded-xl border text-left text-xs transition ${household?.id === 'house_ayush'
                    ? 'bg-[#E8F6EE] border-[#1E9B68] text-[#12392B] font-bold'
                    : 'bg-[#F6F7F4] border-[rgba(23,34,29,0.08)] text-[#5E6963] hover:text-[#17221D]'
                    }`}
                >
                  <div className="text-[11px] font-bold truncate">Ayush</div>
                  <div className="text-[9px] font-mono text-[#1E9B68]">+0.1 kW Balance</div>
                </button>

                {/* Rahul */}
                <button
                  type="button"
                  onClick={() => handleSwitchDemo('rahul')}
                  className={`p-2 rounded-xl border text-left text-xs transition ${household?.id === 'house_rahul'
                    ? 'bg-[#FCECEC] border-[#D45C5C] text-[#17221D] font-bold'
                    : 'bg-[#F6F7F4] border-[rgba(23,34,29,0.08)] text-[#5E6963] hover:text-[#17221D]'
                    }`}
                >
                  <div className="text-[11px] font-bold truncate">Rahul</div>
                  <div className="text-[9px] font-mono text-[#3C78CC]">-3.4 kW EV</div>
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="pt-1 border-t border-[rgba(23,34,29,0.06)] space-y-1">
              <button
                type="button"
                onClick={() => { setIsProfileOpen(false); navigate('/my-home'); }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#F6F7F4] text-xs font-semibold text-[#17221D] transition"
              >
                <span className="flex items-center gap-2">
                  <FaIcon name="home" className="text-[#1E9B68]" />
                  My Household Cockpit
                </span>
                <FaIcon name="chevronRight" className="text-[9px] text-[#89938D]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  if (onOpenLoginModal) onOpenLoginModal();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#F6F7F4] text-xs font-semibold text-[#17221D] transition"
              >
                <span className="flex items-center gap-2">
                  <FaIcon name="user" className="text-[#3C78CC]" />
                  Manage Account & Sign In
                </span>
                <FaIcon name="chevronRight" className="text-[9px] text-[#89938D]" />
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#FCECEC] text-xs font-semibold text-[#D45C5C] transition"
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
