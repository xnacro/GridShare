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
    default: 'text-[#5D6B64] bg-[#EBF0ED]',
    surplus: 'text-[#168A5A] bg-[#E7F5EE]',
    solar: 'text-[#E8A72B] bg-[#FFF4D8]',
    battery: 'text-[#D99A26] bg-[#FFF4D8]',
    deficit: 'text-[#D95C5C] bg-[#FDECEC]',
    grid: 'text-[#3678D4] bg-[#EAF2FF]',
    ai: 'text-[#7657D8] bg-[#F0EBFF]',
  }[variant] || 'text-[#5D6B64] bg-[#EBF0ED]';

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-[#DDE5E0] bg-white p-4 sm:p-5 shadow-card transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-elevated hover:border-[#CBD5CF]' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {(icon || iconName) && (
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${iconColorClasses}`}
            >
              {icon || <FaIcon name={iconName} />}
            </div>
          )}
          <span className="text-[13px] sm:text-sm font-semibold text-[#5D6B64] truncate">
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
        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#102019]">
          {value !== undefined && value !== null ? value : '-'}
        </span>
        {unit && <span className="text-sm font-semibold text-[#5D6B64]">{unit}</span>}
      </div>

      {(delta !== undefined || subtitle) && (
        <div className="mt-2.5 flex items-center justify-between text-xs sm:text-[13px]">
          {delta !== undefined && (
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                deltaType === 'positive'
                  ? 'text-[#168A5A]'
                  : deltaType === 'negative'
                  ? 'text-[#D95C5C]'
                  : 'text-[#5D6B64]'
              }`}
            >
              <FaIcon
                name={deltaType === 'positive' ? 'arrowUp' : deltaType === 'negative' ? 'arrowDown' : 'info'}
                className="text-[10px]"
              />
              {delta}
            </span>
          )}
          {subtitle && <span className="text-[#83908A] font-medium truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
