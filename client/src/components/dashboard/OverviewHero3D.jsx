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
    <div className="relative w-full h-full min-h-[360px] sm:min-h-[400px] lg:min-h-[440px] select-none">
      {/* 3D Isometric Microgrid Image with Smooth Leftward Fade Gradient Mask */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/assets/hero_microgrid_3d.jpg"
          alt="GridShare 3D Smart Microgrid Community"
          className="w-full h-full object-cover object-center scale-105"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.08) 12%, rgba(0,0,0,0.7) 28%, black 48%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.08) 12%, rgba(0,0,0,0.7) 28%, black 48%)',
          }}
        />

        {/* Soft atmospheric overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-white/5 pointer-events-none" />
      </div>

      {/* 🌟 1. Top-Left Floating Badge: Generation */}
      <div className="absolute top-4 left-8 sm:top-6 sm:left-12 flex items-center space-x-2.5 px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-white/90 shadow-sm transition-transform hover:scale-105 z-10">
        <div className="w-6 h-6 rounded-lg bg-[#FFF7E4] text-[#E5A72D] flex items-center justify-center text-xs flex-shrink-0">
          <FaIcon name="solar" />
        </div>
        <div>
          <div className="font-oswald text-sm sm:text-base font-semibold text-[#17221D] leading-tight">
            {generation.toFixed(1)} kW
          </div>
          <div className="font-oswald text-[10px] font-normal text-[#5E6963] uppercase leading-none">
            Generation
          </div>
        </div>
      </div>

      {/* 🌟 2. Top-Right Floating Badge: Grid Exchange */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 flex items-center space-x-2.5 px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-white/90 shadow-sm transition-transform hover:scale-105 z-10">
        <div className="w-6 h-6 rounded-lg bg-[#EDF3FD] text-[#3C78CC] flex items-center justify-center text-xs flex-shrink-0">
          <FaIcon name="grid" />
        </div>
        <div>
          <div className="font-oswald text-sm sm:text-base font-semibold text-[#17221D] leading-tight">
            {gridExchange > 0 ? `+${gridExchange.toFixed(1)}` : `${gridExchange.toFixed(1)}`} kW
          </div>
          <div className="font-oswald text-[10px] font-normal text-[#5E6963] uppercase leading-none">
            Grid Exchange
          </div>
        </div>
      </div>

      {/* 🌟 3. Bottom-Left Floating Badge: My Home */}
      <div className="absolute bottom-4 left-8 sm:bottom-6 sm:left-12 flex items-center space-x-2.5 px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-white/90 shadow-sm transition-transform hover:scale-105 z-10">
        <div className="w-6 h-6 rounded-lg bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-xs flex-shrink-0">
          <FaIcon name="home" />
        </div>
        <div>
          <div className="font-oswald text-sm sm:text-base font-semibold text-[#1E9B68] leading-tight">
            +{myHomeNet.toFixed(1)} kW
          </div>
          <div className="font-oswald text-[10px] font-normal text-[#5E6963] uppercase leading-none">
            My Home
          </div>
        </div>
      </div>

      {/* 🌟 4. Center-Bottom Floating Badge: Battery Storage */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6 flex items-center space-x-2.5 px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-white/90 shadow-sm transition-transform hover:scale-105 z-20 whitespace-nowrap">
        <div className="w-6 h-6 rounded-lg bg-[#E8F6EE] text-[#1E9B68] flex items-center justify-center text-xs flex-shrink-0">
          <FaIcon name="battery" />
        </div>
        <div>
          <div className="font-oswald text-sm sm:text-base font-semibold text-[#17221D] leading-tight">
            {batterySoc.toFixed(0)}%
          </div>
          <div className="font-oswald text-[10px] font-normal text-[#5E6963] uppercase leading-none">
            Battery (20 kWh)
          </div>
        </div>
      </div>

      {/* 🌟 5. Bottom-Right Floating Badge: Heavy Load Home */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 flex items-center space-x-2.5 px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-white/90 shadow-sm transition-transform hover:scale-105 z-10">
        <div className="w-7 h-7 rounded-lg bg-[#FCECEC] text-[#D45C5C] flex items-center justify-center text-xs flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#D45C5C] animate-pulse" />
        </div>
        <div>
          <div className="font-oswald text-sm sm:text-base font-semibold text-[#D45C5C] leading-tight">
            {heavyLoadNet.toFixed(1)} kW
          </div>
          <div className="font-oswald text-[10px] font-normal text-[#5E6963] uppercase leading-none">
            Heavy Load Home
          </div>
        </div>
      </div>
    </div>
  );
}
