import React from 'react';
import FaIcon from '../icons/FaIcon';

export default function NavToggle({
  isCollapsed,
  onToggle,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={isCollapsed ? 'Expand navigation (show labels)' : 'Collapse navigation (compact icons)'}
      aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
      className={`group relative inline-flex items-center justify-center h-8 w-8 rounded-full border border-[#DDE4DF] bg-white text-[#7C8781] hover:text-[#142019] hover:bg-[#F5F6F2] hover:border-[#C9D2CC] shadow-subtle transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-[#1C9A67]/30 ${className}`}
    >
      <FaIcon
        name={isCollapsed ? 'chevronRight' : 'chevronLeft'}
        className="text-[11px] transition-transform duration-200 group-hover:scale-110"
      />

      {/* Floating tooltip for toggle */}
      <div className="absolute top-full mt-2.5 px-2.5 py-1 bg-[#12251D] text-white text-[11px] font-semibold rounded-lg shadow-modal opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 -translate-y-1 group-hover:translate-y-0 z-50 whitespace-nowrap">
        {isCollapsed ? 'Expand' : 'Collapse'}
      </div>
    </button>
  );
}
