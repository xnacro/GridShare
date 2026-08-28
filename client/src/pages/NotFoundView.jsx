import React from 'react';
import { useNavigate } from 'react-router-dom';
import FaIcon from '../components/icons/FaIcon';

export default function NotFoundView() {
  const navigate = useNavigate();

  const quickLinks = [
    { title: 'Community Dashboard', path: '/', icon: 'overview', desc: 'Real-time net generation & ESS buffer' },
    { title: 'My Home Cockpit', path: '/my-home', icon: 'home', desc: 'Household circuits & solar inverter' },
    { title: 'Live Microgrid Map', path: '/network', icon: 'network', desc: '2D radial topology & 3D digital twin' },
    { title: 'P2P Marketplace', path: '/marketplace', icon: 'marketplace', desc: 'Local energy double-auction trade' },
    { title: 'AI Forecast Hub', path: '/ai', icon: 'ai', desc: 'Random forest solar & demand models' },
  ];

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4 animate-fadeIn select-none">
      <div className="max-w-2xl w-full text-center space-y-8">
        
        {/* Visual 404 Node Badge */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-[#E2F0CC] border border-[#BED69E] flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
            <span className="font-display text-4xl sm:text-5xl font-extrabold text-[#012F13] tracking-tighter">
              404
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#4A5B4F] mt-1">
              OFF-GRID
            </span>
            
            {/* Animated Disconnect Spark */}
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#D45C5C] animate-ping" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2 max-w-lg mx-auto">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#041D0D]">
            Energy Route Not Found
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5B4F] leading-relaxed">
            The node or energy route you requested is currently disconnected or does not exist on this microgrid network.
          </p>
        </div>

        {/* Primary Return Button */}
        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#012F13] hover:bg-[#0B3E1D] text-white text-xs sm:text-sm font-bold shadow-md transition active:scale-95"
          >
            <span>Return to Community Dashboard</span>
            <span className="text-base leading-none">→</span>
          </button>
        </div>

        {/* Quick Route Directory */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 text-left border border-[#E2EED7] space-y-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-[#4A5B4F] flex items-center justify-between pb-2 border-b border-[#E2EED7]">
            <span>Active Microgrid Surfaces</span>
            <span className="text-[10px] text-[#8BC53D] font-mono">● All Systems Online</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {quickLinks.map((link) => (
              <button
                key={link.path}
                type="button"
                onClick={() => navigate(link.path)}
                className="p-3 rounded-xl bg-white/70 hover:bg-[#F4F9EB] border border-[#E2EED7] text-left transition flex items-center space-x-3 group shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-[#E2F0CC] text-[#012F13] flex items-center justify-center text-xs group-hover:scale-105 transition-transform flex-shrink-0">
                  <FaIcon name={link.icon} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-xs font-bold text-[#041D0D] group-hover:text-[#012F13] truncate">
                    {link.title}
                  </div>
                  <div className="text-[10px] text-[#4A5B4F] truncate">
                    {link.desc}
                  </div>
                </div>
                <span className="text-xs text-[#8BC53D] opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
