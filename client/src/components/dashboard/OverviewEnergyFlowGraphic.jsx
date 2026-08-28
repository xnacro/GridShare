import React from 'react';
import FaIcon from '../icons/FaIcon';

export default function OverviewEnergyFlowGraphic({
  generation = 11.5,
  demand = 8.6,
  surplus = 2.9,
  batterySoc = 40,
}) {
  return (
    <div className="relative w-full h-[280px] sm:h-[320px] rounded-2xl bg-gradient-to-br from-[#F5F8F6] via-[#FFFFFF] to-[#F1F6F3] p-4 border border-[rgba(23,56,43,0.08)] flex flex-col justify-between overflow-hidden shadow-xs select-none">
      {/* Background Soft Lighting Gradients */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#E6F5EC]/70 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-[#FFF7E4]/50 blur-2xl pointer-events-none" />

      {/* Top Bar: Visual Indicator */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-[#1E9B67] animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#12382A]">
            Microgrid Energy Flow
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-[#1E9B67] bg-[#E6F5EC] px-2 py-0.5 rounded-full border border-[#1E9B67]/20">
          LIVE BALANCE
        </span>
      </div>

      {/* Center 4-Node Flow Diagram */}
      <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-3 items-center my-auto py-2">
        {/* Node 1: Rooftop Solar */}
        <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-white/90 border border-[rgba(23,56,43,0.08)] shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-[#FFF7E4] text-[#E5A72D] flex items-center justify-center text-xs mb-1">
            <FaIcon name="solar" />
          </div>
          <span className="text-[10px] font-bold text-[#5E6B63] uppercase">Solar PV</span>
          <span className="text-xs font-black font-mono text-[#15221B]">{generation.toFixed(1)} kW</span>
        </div>

        {/* Central Dispatch Hub / Flow Indicator */}
        <div className="flex flex-col items-center justify-center text-center relative py-1">
          {/* Animated Connecting Flow Lines */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-0.5 bg-gradient-to-r from-[#E5A72D]/40 via-[#1E9B67] to-[#3979D0]/40" />
          </div>

          <div className="relative z-10 w-11 h-11 rounded-2xl bg-[#12382A] text-white flex flex-col items-center justify-center shadow-sm">
            <FaIcon name="network" className="text-xs text-[#43CB8C]" />
            <span className="text-[8px] font-bold font-mono text-white/90 mt-0.5">P2P</span>
          </div>

          <span className="text-[9px] font-bold font-mono text-[#1E9B67] mt-1 bg-white px-1.5 py-0.5 rounded border border-[#1E9B67]/20">
            +{surplus.toFixed(1)} kW Net
          </span>
        </div>

        {/* Node 2: Community Homes / Load */}
        <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-white/90 border border-[rgba(23,56,43,0.08)] shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-[#F5F7F3] text-[#15221B] flex items-center justify-center text-xs mb-1">
            <FaIcon name="home" />
          </div>
          <span className="text-[10px] font-bold text-[#5E6B63] uppercase">Homes</span>
          <span className="text-xs font-black font-mono text-[#15221B]">{demand.toFixed(1)} kW</span>
        </div>
      </div>

      {/* Bottom Sub-Row: Battery Storage & Utility Grid Backing */}
      <div className="relative z-10 grid grid-cols-2 gap-2 pt-2 border-t border-[rgba(23,56,43,0.06)] text-[11px]">
        <div className="flex items-center space-x-2 bg-white/80 p-2 rounded-xl border border-[rgba(23,56,43,0.06)]">
          <div className="w-6 h-6 rounded-lg bg-[#E6F5EC] text-[#1E9B67] flex items-center justify-center text-[10px] flex-shrink-0">
            <FaIcon name="battery" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] text-[#5E6B63] font-bold uppercase truncate">50 kWh Storage</div>
            <div className="text-[11px] font-bold font-mono text-[#1E9B67]">{batterySoc.toFixed(0)}% SOC</div>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-white/80 p-2 rounded-xl border border-[rgba(23,56,43,0.06)]">
          <div className="w-6 h-6 rounded-lg bg-[#EDF3FD] text-[#3979D0] flex items-center justify-center text-[10px] flex-shrink-0">
            <FaIcon name="grid" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] text-[#5E6B63] font-bold uppercase truncate">Main Grid</div>
            <div className="text-[11px] font-bold font-mono text-[#3979D0]">₹6.10/kWh</div>
          </div>
        </div>
      </div>
    </div>
  );
}
