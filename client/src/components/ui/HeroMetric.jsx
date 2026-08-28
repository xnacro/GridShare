import React from 'react';
import FaIcon from '../icons/FaIcon';

export default function HeroMetric({
  value,
  unit,
  label,
  subtitle,
  iconName,
  variant = 'default',
  delta,
  deltaType = 'positive',
  className = '',
}) {
  const variantColor = {
    emerald: 'text-[#8BC53D]',
    solar: 'text-[#8BC53D]',
    ai: 'text-[#012F13]',
    grid: 'text-[#012F13]',
    deficit: 'text-[#011207]',
    default: 'text-[#011207]',
  }[variant] || 'text-[#011207]';

  const variantBg = 'bg-[#E2F0CC]';

  return (
    <div
      className={`relative rounded-2xl bg-white border border-[#E2F0CC] p-5 sm:p-6 shadow-sm hover:border-[#BED69E] transition duration-200 space-y-2.5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#4A5B4F]">
          {label}
        </span>
        {iconName && (
          <div className={`w-7 h-7 rounded-xl ${variantBg} ${variantColor} flex items-center justify-center text-xs flex-shrink-0`}>
            <FaIcon name={iconName} />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-1.5">
        <span className={`font-changa text-2xl sm:text-3xl lg:text-[34px] font-normal tracking-tight ${variantColor}`}>
          {value}
        </span>
        {unit && (
          <span className="text-sm font-bold text-[#4A5B4F]">{unit}</span>
        )}
      </div>

      {subtitle && (
        <p className="text-[12px] sm:text-[13px] text-[#4A5B4F] font-medium leading-snug">
          {subtitle}
        </p>
      )}

      {delta && (
        <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-[#8BC53D]">
          <span>{delta}</span>
        </div>
      )}
    </div>
  );
}
