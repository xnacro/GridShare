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
    default: 'text-[#5E6A63] bg-[#EEF1EB]',
    surplus: 'text-[#209B67] bg-[#E7F6EE]',
    solar: 'text-[#E7AA31] bg-[#FFF3D7]',
    battery: 'text-[#D79A27] bg-[#FFF3D7]',
    deficit: 'text-[#D85D5D] bg-[#FDECEC]',
    grid: 'text-[#397BD2] bg-[#EAF2FC]',
    ai: 'text-[#7359C8] bg-[#F1EDFF]',
  }[variant] || 'text-[#5E6A63] bg-[#EEF1EB]';

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-[#DCE4DE] bg-white p-4 sm:p-5 shadow-card transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-elevated hover:border-[#C7D2CB]' : ''
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
          <span className="text-[13px] sm:text-sm font-semibold text-[#5E6A63] truncate">
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
        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#15211B]">
          {value !== undefined && value !== null ? value : '-'}
        </span>
        {unit && <span className="text-sm font-semibold text-[#5E6A63]">{unit}</span>}
      </div>

      {(delta !== undefined || subtitle) && (
        <div className="mt-2.5 flex items-center justify-between text-xs sm:text-[13px]">
          {delta !== undefined && (
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                deltaType === 'positive'
                  ? 'text-[#209B67]'
                  : deltaType === 'negative'
                  ? 'text-[#D85D5D]'
                  : 'text-[#5E6A63]'
              }`}
            >
              <FaIcon
                name={deltaType === 'positive' ? 'arrowUp' : deltaType === 'negative' ? 'arrowDown' : 'info'}
                className="text-[10px]"
              />
              {delta}
            </span>
          )}
          {subtitle && <span className="text-[#87918B] font-medium truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
