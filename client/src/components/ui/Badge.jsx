import React from 'react';

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
  ...props
}) {
  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    surplus: 'bg-emerald-100/80 text-emerald-800 border-emerald-300/80',
    success: 'bg-emerald-100/80 text-emerald-800 border-emerald-300/80',
    deficit: 'bg-rose-100/80 text-rose-800 border-rose-300/80',
    danger: 'bg-rose-100/80 text-rose-800 border-rose-300/80',
    warning: 'bg-amber-100/80 text-amber-800 border-amber-300/80',
    battery: 'bg-amber-100/80 text-amber-800 border-amber-300/80',
    info: 'bg-blue-100/80 text-blue-800 border-blue-300/80',
    grid: 'bg-blue-100/80 text-blue-800 border-blue-300/80',
    ai: 'bg-purple-100/80 text-purple-800 border-purple-300/80',
    purple: 'bg-purple-100/80 text-purple-800 border-purple-300/80',
    neutral: 'bg-slate-50 text-slate-600 border-slate-200',
  }[variant] || 'bg-slate-100 text-slate-700 border-slate-200';

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 rounded gap-1 font-medium',
    sm: 'text-xs px-2 py-0.5 rounded-md gap-1.5 font-medium',
    md: 'text-xs px-2.5 py-1 rounded-md gap-1.5 font-semibold',
    lg: 'text-sm px-3 py-1.5 rounded-lg gap-2 font-semibold',
  }[size] || 'text-xs px-2.5 py-1 rounded-md gap-1.5 font-semibold';

  return (
    <span
      className={`inline-flex items-center border tracking-tight ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0 text-current">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

export function StatusIndicator({
  status,
  label,
  pulse = false,
  className = '',
}) {
  const dotColor = {
    online: 'bg-emerald-500',
    connected: 'bg-emerald-500',
    surplus: 'bg-emerald-500',
    healthy: 'bg-emerald-500',
    active: 'bg-emerald-500',
    warning: 'bg-amber-500',
    battery: 'bg-amber-500',
    pending: 'bg-amber-500',
    deficit: 'bg-rose-500',
    offline: 'bg-rose-500',
    error: 'bg-rose-500',
    info: 'bg-blue-500',
    grid: 'bg-blue-500',
    ai: 'bg-purple-500',
  }[(status || '').toLowerCase()] || 'bg-slate-400';

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 ${className}`}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      {label && <span>{label}</span>}
    </span>
  );
}
