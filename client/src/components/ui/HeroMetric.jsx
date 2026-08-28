import React from 'react';
import FaIcon from '../icons/FaIcon';

export default function HeroMetric({
  value,
  unit,
  label,
  subtitle,
  iconName,
  variant = 'default', // 'emerald' | 'solar' | 'ai' | 'grid' | 'deficit' | 'default'
  delta,
  deltaType = 'positive',
  className = '',
}) {
  const variantColor = {
    emerald: 'text-[#1E9B67]',
    solar: 'text-[#E5A72D]',
    ai: 'text-[#7358C8]',
    grid: 'text-[#3979D0]',
    deficit: 'text-[#D65D5D]',
    default: 'text-[#15221B]',
  }[variant] || 'text-[#15221B]';

  const variantBg = {
    emerald: 'bg-[#E6F5EC]',
    solar: 'bg-[#FFF7E4]',
    ai: 'bg-[#F1ECFF]',
    grid: 'bg-[#EDF3FD]',
    deficit: 'bg-[#FCECEC]',
    default: 'bg-[#F5F7F3]',
  }[variant] || 'bg-[#F5F7F3]';

  return (
    <div
      className={`relative rounded-3xl bg-white border border-[rgba(23,56,43,0.08)] p-5 sm:p-6 shadow-card hover:border-[rgba(23,56,43,0.15)] transition duration-200 space-y-2.5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#5E6B63]">
          {label}
        </span>
        {iconName && (
          <div className={`w-7 h-7 rounded-xl ${variantBg} ${variantColor} flex items-center justify-center text-xs flex-shrink-0`}>
            <FaIcon name={iconName} />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-1.5">
        <span className={`text-2xl sm:text-3xl lg:text-[34px] font-extrabold tracking-tight ${variantColor}`}>
          {value}
        </span>
        {unit && (
          <span className="text-sm font-bold text-[#5E6B63]">{unit}</span>
        )}
      </div>

      {subtitle && (
        <p className="text-[12px] sm:text-[13px] text-[#5E6B63] font-medium leading-snug">
          {subtitle}
        </p>
      )}

      {delta && (
        <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-[#1E9B67]">
          <span>{delta}</span>
        </div>
      )}
    </div>
  );
}
