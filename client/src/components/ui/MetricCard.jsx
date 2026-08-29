import React from 'react';
import Badge from './Badge';
import FaIcon from '../icons/FaIcon';

export default function MetricCard({
  title,
  value,
  unit = '',
  icon,
  iconName,
  delta,
  deltaType = 'positive', // 'positive' | 'negative' | 'neutral'
  badge,
  variant = 'default',
  subtitle,
  className = '',
  onClick,
}) {
  const iconColorClasses = {
    default: 'text-[#64748B] bg-slate-100/80 border border-slate-200/60',
    surplus: 'text-[#0D9488] bg-teal-50/80 border border-teal-200/60',
    solar: 'text-[#D97706] bg-amber-50/80 border border-amber-200/60',
    battery: 'text-[#D97706] bg-amber-50/80 border border-amber-200/60',
    deficit: 'text-[#E11D48] bg-rose-50/80 border border-rose-200/60',
    grid: 'text-[#2563EB] bg-blue-50/80 border border-blue-200/60',
    ai: 'text-purple-600 bg-purple-50/80 border border-purple-200/60',
  }[variant] || 'text-[#64748B] bg-slate-100/80 border border-slate-200/60';

  return (
    <div
      onClick={onClick}
      className={`rounded-3xl border border-white/90 bg-white/80 backdrop-blur-2xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(15,23,42,0.03)] hover:shadow-[0_15px_35px_rgba(15,23,42,0.06)] hover:border-white transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {(icon || iconName) && (
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 shadow-2xs ${iconColorClasses}`}
            >
              {icon || <FaIcon name={iconName} />}
            </div>
          )}
          <span className="text-[13px] sm:text-sm font-semibold text-[#64748B] truncate">
            {title}
          </span>
        </div>
        {badge && (
          <div className="flex-shrink-0">
            {typeof badge === 'string' ? <Badge size="xs" variant={variant}>{badge}</Badge> : badge}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
          {value !== undefined && value !== null ? value : '-'}
        </span>
        {unit && <span className="text-sm font-semibold text-[#64748B]">{unit}</span>}
      </div>

      {(delta !== undefined || subtitle) && (
        <div className="mt-2.5 flex items-center justify-between text-xs sm:text-[13px]">
          {delta !== undefined && (
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                deltaType === 'positive'
                  ? 'text-[#0D9488]'
                  : deltaType === 'negative'
                  ? 'text-[#E11D48]'
                  : 'text-[#64748B]'
              }`}
            >
              <FaIcon
                name={deltaType === 'positive' ? 'arrowUp' : deltaType === 'negative' ? 'arrowDown' : 'info'}
                className="text-[10px]"
              />
              {delta}
            </span>
          )}
          {subtitle && <span className="text-slate-400 font-medium truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
