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
    emerald: 'text-[#156B5C]',
    solar: 'text-[#D99A1F]',
    ai: 'text-[#156B5C]',
    grid: 'text-[#0F2233]',
    deficit: 'text-[#C2571F]',
    default: 'text-[#0F2233]',
  }[variant] || 'text-[#0F2233]';

  const variantBg = {
    emerald: 'bg-[#E8F3F1]',
    solar: 'bg-[#FAF4E8]',
    ai: 'bg-[#E8F3F1]',
    grid: 'bg-[#FAF8F2]',
    deficit: 'bg-[#F9ECE6]',
    default: 'bg-[#FAF8F2]',
  }[variant] || 'bg-[#FAF8F2]';

  return (
    <div
      className={`relative rounded-2xl bg-white border border-[#D6D1BE] p-5 sm:p-6 shadow-sm hover:border-[#0F2233]/30 transition duration-200 space-y-2.5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#747A6C]">
          {label}
        </span>
        {iconName && (
          <div className={`w-7 h-7 rounded-xl ${variantBg} ${variantColor} flex items-center justify-center text-xs flex-shrink-0 border border-[#D6D1BE]/40`}>
            <FaIcon name={iconName} />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-1.5">
        <span className={`font-display text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight ${variantColor}`}>
          {value}
        </span>
        {unit && (
          <span className="text-sm font-bold text-[#747A6C]">{unit}</span>
        )}
      </div>

      {subtitle && (
        <p className="text-[12px] sm:text-[13px] text-[#747A6C] font-medium leading-snug">
          {subtitle}
        </p>
      )}

      {delta && (
        <div className={`pt-1 flex items-center gap-1.5 text-[11px] font-bold ${deltaType === 'negative' ? 'text-[#C2571F]' : 'text-[#156B5C]'}`}>
          <span>{delta}</span>
        </div>
      )}
    </div>
  );
}
