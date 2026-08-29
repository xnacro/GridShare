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
    emerald: 'text-[#0D9488]',
    solar: 'text-[#D97706]',
    ai: 'text-[#0D9488]',
    grid: 'text-[#0F172A]',
    deficit: 'text-[#E11D48]',
    cyan: 'text-[#0284C7]',
    default: 'text-[#0F172A]',
  }[variant] || 'text-[#0F172A]';

  const variantBg = {
    emerald: 'bg-teal-50/80 text-[#0D9488] border border-teal-100',
    solar: 'bg-amber-50/80 text-[#D97706] border border-amber-100',
    ai: 'bg-purple-50/80 text-purple-600 border border-purple-100',
    grid: 'bg-slate-50/80 text-[#0F172A] border border-slate-100',
    deficit: 'bg-rose-50/80 text-[#E11D48] border border-rose-100',
    cyan: 'bg-sky-50/80 text-[#0284C7] border border-sky-100',
    default: 'bg-slate-50/80 text-[#64748B] border border-slate-100',
  }[variant] || 'bg-slate-50/80 text-[#64748B] border border-slate-100';

  return (
    <div
      className={`relative rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 p-5 sm:p-6 shadow-[0_10px_30px_rgba(15,23,42,0.03)] hover:shadow-[0_15px_35px_rgba(15,23,42,0.06)] hover:border-white transition duration-200 space-y-2.5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
          {label}
        </span>
        {iconName && (
          <div className={`w-8 h-8 rounded-xl ${variantBg} flex items-center justify-center text-xs flex-shrink-0 shadow-2xs`}>
            <FaIcon name={iconName} />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-1.5">
        <span className={`font-display text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight ${variantColor}`}>
          {value}
        </span>
        {unit && (
          <span className="text-sm font-bold text-[#64748B]">{unit}</span>
        )}
      </div>

      {subtitle && (
        <p className="text-[12px] sm:text-[13px] text-[#64748B] font-medium leading-snug">
          {subtitle}
        </p>
      )}

      {delta && (
        <div className={`pt-1 flex items-center gap-1.5 text-[11px] font-bold ${deltaType === 'negative' ? 'text-[#E11D48]' : 'text-[#0D9488]'}`}>
          <span>{delta}</span>
        </div>
      )}
    </div>
  );
}
