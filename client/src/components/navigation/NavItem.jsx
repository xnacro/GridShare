import React from 'react';
import { NavLink } from 'react-router-dom';
import FaIcon from '../icons/FaIcon';

export default function NavItem({
  name,
  path,
  iconName,
  isCollapsed = false,
  isAi = false,
  isActive = false,
  onClick,
  tooltip,
}) {
  return (
    <NavLink
      to={path}
      onClick={onClick}
      title={isCollapsed ? (tooltip || name) : undefined}
      className={`group relative inline-flex items-center justify-center rounded-full transition-all duration-200 ease-out select-none ${
        isCollapsed
          ? 'h-9 w-9 p-0'
          : 'px-3.5 py-1.5 space-x-2'
      } ${
        isActive
          ? isAi
            ? 'bg-[#F1EDFF] text-[#7359C8] shadow-subtle'
            : 'bg-[#E7F6EE] text-[#12392B] shadow-subtle'
          : isAi
          ? 'text-[#7359C8] hover:text-[#5E44B2] hover:bg-[#F1EDFF]/60'
          : 'text-[#5E6A63] hover:text-[#15211B] hover:bg-[#F5F7F3]'
      }`}
    >
      {/* Icon */}
      <FaIcon
        name={iconName}
        className={`text-sm flex-shrink-0 transition-colors ${
          isActive
            ? isAi
              ? 'text-[#7359C8]'
              : 'text-[#209B67]'
            : isAi
            ? 'text-[#7359C8]'
            : 'text-[#87918B] group-hover:text-[#15211B]'
        }`}
      />

      {/* Label (visible when expanded) */}
      {!isCollapsed && (
        <span className="text-xs sm:text-[13px] font-semibold whitespace-nowrap tracking-tight transition-opacity duration-200">
          {name}
        </span>
      )}

      {/* Floating Tooltip in collapsed mode */}
      {isCollapsed && (
        <div className="absolute top-full mt-2.5 px-2.5 py-1 bg-[#12392B] text-white text-[11px] font-semibold rounded-lg shadow-modal opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 -translate-y-1 group-hover:translate-y-0 z-50 whitespace-nowrap">
          {name}
        </div>
      )}
    </NavLink>
  );
}
