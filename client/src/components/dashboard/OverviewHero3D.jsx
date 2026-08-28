import React from 'react';
import FaIcon from '../icons/FaIcon';

export default function OverviewHero3D({
  generation = 11.5,
  myHomeNet = 4.7,
  batterySoc = 40,
  heavyLoadNet = -2.8,
  gridExchange = -0.8,
}) {
  return (
    <div className="relative w-full h-[320px] sm:h-[360px] lg:h-[380px] rounded-2xl overflow-hidden bg-[#F6F7F4] border border-[rgba(23,34,29,0.06)] shadow-xs select-none">
      {/* High-Resolution 3D Isometric Community Microgrid Render */}
      <img
        src="/assets/hero_microgrid_3d.jpg"
        alt="GridShare 3D Smart Microgrid Community"
        className="w-full h-full object-cover object-center scale-105"
        onError={(e) => {
          // Fallback if image path differs
          e.target.style.display = 'none';
        }}
      />

      {/* Subtle Vignette & Light Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/5 pointer-events-none" />

      {/* 🌟 1. Top-Left Floating Badge: Generation */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center space-x-2.5 px-3.5 py-2 rounded-2xl bg-white/92 backdrop-blur-md border border-white/80 shadow-md transition-transform hover:scale-105">
        <div className="w-7 h-7 rounded-xl bg-[#FFF7E4] text-[#E5A72D] flex items-center justify-center text-xs flex-shrink-0">
          <FaIcon name="solar" />
        </div>
        <div>
          <div className="text-xs sm:text-sm font-black font-mono text-[#17221D]">
            {generation.toFixed(1)} kW
          </div>
          <div className="text-[10px] font-bold text-[#5E6963] uppercase leading-none">
            Generation
          </div>
        </div>
      </div>

      {/* 🌟 2. Top-Right Floating Badge: Grid Exchange */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center space-x-2.5 px-3.5 py-2 rounded-2xl bg-white/92 backdrop-blur-md border border-white/80 shadow-md transition-transform hover:scale-105">
        <div className="w-7 h-7 rounded-xl bg-[#EDF3FD] text-[#3C78CC] flex items-center justify-center text-xs flex-shrink-0">
          <FaIcon name="grid" />
        </div>
        <div>
          <div className="text-xs sm:text-sm font-black font-mono text-[#17221D]">
            {gridExchange > 0 ? `+${gridExchange.toFixed(1)}` : `${gridExchange.toFixed(1)}`} kW
          </div>
          <div className="text-[10px] font-bold text-[#5E6963] uppercase leading-none">
            Grid Exchange
          </div>
        </div>
      </div>

      {/* 🌟 3. Bottom-Left Floating Badge: My Home */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex items-center space-x-2.5 px-3.5 py-2 rounded-2xl bg-white/92 backdrop-blur-md border border-white/80 shadow-md transition-transform hover:scale-105">
        <div className="w-7 h-7 rounded-xl bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-xs flex-shrink-0">
          <FaIcon name="home" />
        </div>
        <div>
          <div className="text-xs sm:text-sm font-black font-mono text-[#1E9B68]">
            +{myHomeNet.toFixed(1)} kW
          </div>
          <div className="text-[10px] font-bold text-[#5E6963] uppercase leading-none">
            My Home
          </div>
        </div>
      </div>

      {/* 🌟 4. Center-Bottom Floating Badge: Battery Storage */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6 flex items-center space-x-2.5 px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-md transition-transform hover:scale-105 z-10">
        <div className="w-7 h-7 rounded-xl bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-xs flex-shrink-0">
          <FaIcon name="battery" />
        </div>
        <div>
          <div className="text-xs sm:text-sm font-black font-mono text-[#17221D]">
            {batterySoc.toFixed(0)}%
          </div>
          <div className="text-[10px] font-bold text-[#5E6963] uppercase leading-none">
            Battery (20 kWh)
          </div>
        </div>
      </div>

      {/* 🌟 5. Bottom-Right Floating Badge: Heavy Load Home */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center space-x-2.5 px-3.5 py-2 rounded-2xl bg-white/92 backdrop-blur-md border border-white/80 shadow-md transition-transform hover:scale-105">
        <div className="w-7 h-7 rounded-xl bg-[#FCECEC] text-[#D45C5C] flex items-center justify-center text-xs flex-shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D45C5C] animate-pulse" />
        </div>
        <div>
          <div className="text-xs sm:text-sm font-black font-mono text-[#D45C5C]">
            {heavyLoadNet.toFixed(1)} kW
          </div>
          <div className="text-[10px] font-bold text-[#5E6963] uppercase leading-none">
            Heavy Load Home
          </div>
        </div>
      </div>
    </div>
  );
}
