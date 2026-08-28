import React from 'react';
import Card from './Card';
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
    default: 'text-slate-600 bg-slate-100',
    surplus: 'text-emerald-600 bg-emerald-100/80',
    deficit: 'text-rose-600 bg-rose-100/80',
    battery: 'text-amber-600 bg-amber-100/80',
    grid: 'text-blue-600 bg-blue-100/80',
    ai: 'text-purple-600 bg-purple-100/80',
  }[variant] || 'text-slate-600 bg-slate-100';

  return (
    <Card
      variant={variant}
      className={`relative overflow-hidden transition-all duration-200 ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {(icon || iconName) && (
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${iconColorClasses}`}
            >
              {icon || <FaIcon name={iconName} />}
            </div>
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
            {title}
          </span>
        </div>
        {badge && (
          <div className="flex-shrink-0">
            {typeof badge === 'string' ? <Badge size="xs">{badge}</Badge> : badge}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-slate-900">
          {value !== undefined && value !== null ? value : '-'}
        </span>
        {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
      </div>

      {(delta !== undefined || subtitle) && (
        <div className="mt-2 flex items-center justify-between text-xs">
          {delta !== undefined && (
            <span
              className={`inline-flex items-center gap-1 font-medium ${
                deltaType === 'positive'
                  ? 'text-emerald-700'
                  : deltaType === 'negative'
                  ? 'text-rose-700'
                  : 'text-slate-500'
              }`}
            >
              <FaIcon
                name={deltaType === 'positive' ? 'arrowUp' : deltaType === 'negative' ? 'arrowDown' : 'info'}
                className="text-[10px]"
              />
              {delta}
            </span>
          )}
          {subtitle && <span className="text-slate-500 font-normal truncate">{subtitle}</span>}
        </div>
      )}
    </Card>
  );
}
