import React from 'react';
import { NavLink } from 'react-router-dom';
import FaIcon from '../icons/FaIcon';

const ITEM_COLORS = {
  '/': {
    iconColor: 'text-[#1E9B68]',
    activeBg: 'bg-[#E8F6EE]',
    activeText: 'text-[#12392B]',
    activeBorder: 'border-[#1E9B68]/30',
    hoverBg: 'hover:bg-[#E8F6EE]/60',
    hoverText: 'hover:text-[#1E9B68]',
  },
  '/network': {
    iconColor: 'text-[#3C78CC]',
    activeBg: 'bg-[#EDF3FD]',
    activeText: 'text-[#1B365D]',
    activeBorder: 'border-[#3C78CC]/30',
    hoverBg: 'hover:bg-[#EDF3FD]/60',
    hoverText: 'hover:text-[#3C78CC]',
  },
  '/ai': {
    iconColor: 'text-[#7358C7]',
    activeBg: 'bg-[#F1EDFF]',
    activeText: 'text-[#4A2D8B]',
    activeBorder: 'border-[#7358C7]/30',
    hoverBg: 'hover:bg-[#F1EDFF]/60',
    hoverText: 'hover:text-[#7358C7]',
  },
  '/marketplace': {
    iconColor: 'text-[#10B981]',
    activeBg: 'bg-[#E6F8F0]',
    activeText: 'text-[#064E3B]',
    activeBorder: 'border-[#10B981]/30',
    hoverBg: 'hover:bg-[#E6F8F0]/60',
    hoverText: 'hover:text-[#10B981]',
  },
  '/battery': {
    iconColor: 'text-[#DDA12A]',
    activeBg: 'bg-[#FFF7E4]',
    activeText: 'text-[#78350F]',
    activeBorder: 'border-[#DDA12A]/30',
    hoverBg: 'hover:bg-[#FFF7E4]/60',
    hoverText: 'hover:text-[#DDA12A]',
  },
  '/my-home': {
    iconColor: 'text-[#0EA5E9]',
    activeBg: 'bg-[#E0F2FE]',
    activeText: 'text-[#075985]',
    activeBorder: 'border-[#0EA5E9]/30',
    hoverBg: 'hover:bg-[#E0F2FE]/60',
    hoverText: 'hover:text-[#0EA5E9]',
  },
};

export default function NavItem({
  name,
  path,
  iconName,
  isCollapsed = false,
  isActive = false,
  onClick,
  tooltip,
}) {
  const theme = ITEM_COLORS[path] || {
    iconColor: 'text-[#1E9B68]',
    activeBg: 'bg-[#E8F6EE]',
    activeText: 'text-[#12392B]',
    activeBorder: 'border-[#1E9B68]/30',
    hoverBg: 'hover:bg-[#F6F7F4]',
    hoverText: 'hover:text-[#17221D]',
  };

  return (
    <NavLink
      to={path}
      onClick={onClick}
      title={isCollapsed ? (tooltip || name) : undefined}
      className={`group relative inline-flex items-center justify-center rounded-xl transition-all duration-200 ease-out select-none font-medium border ${
        isCollapsed
          ? 'h-9 w-9 p-0'
          : 'px-3.5 py-1.5 space-x-2'
      } ${
        isActive
          ? `${theme.activeBg} ${theme.activeText} ${theme.activeBorder} shadow-xs font-bold`
          : `text-[#45504A] border-transparent ${theme.hoverBg} ${theme.hoverText}`
      }`}
    >
      {/* Icon with Vibrant Feature Color */}
      <FaIcon
        name={iconName}
        className={`text-sm flex-shrink-0 transition-transform group-hover:scale-110 ${
          isActive ? theme.iconColor : theme.iconColor
        }`}
      />

      {/* Label */}
      {!isCollapsed && (
        <span className="text-xs sm:text-[13px] whitespace-nowrap tracking-tight">
          {name}
        </span>
      )}

      {/* Tooltip */}
      {isCollapsed && (
        <div className="absolute top-full mt-2.5 px-2.5 py-1 bg-[#12392B] text-white text-[11px] font-semibold rounded-lg shadow-modal opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 -translate-y-1 group-hover:translate-y-0 z-50 whitespace-nowrap">
          {name}
        </div>
      )}
    </NavLink>
  );
}
