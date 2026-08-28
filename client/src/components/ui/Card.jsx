import React from 'react';

export default function Card({
  children,
  className = '',
  title,
  subtitle,
  icon,
  action,
  variant = 'default',
  onClick,
  ...props
}) {
  const variantStyles = {
    default: 'bg-white border-slate-200/80 shadow-sm hover:border-slate-300',
    elevated: 'bg-white border-slate-200 shadow-md',
    subtle: 'bg-slate-50/70 border-slate-200/60 shadow-none',
    surplus: 'bg-emerald-50/50 border-emerald-200/80 shadow-sm',
    deficit: 'bg-rose-50/50 border-rose-200/80 shadow-sm',
    ai: 'bg-purple-50/40 border-purple-200/80 shadow-sm',
    battery: 'bg-amber-50/50 border-amber-200/80 shadow-sm',
    grid: 'bg-blue-50/50 border-blue-200/80 shadow-sm',
  }[variant] || 'bg-white border-slate-200/80 shadow-sm';

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${variantStyles} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
      {...props}
    >
      {(title || subtitle || icon || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100/90">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && <div className="text-slate-600 flex-shrink-0">{icon}</div>}
            <div className="truncate">
              {title && (
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 truncate font-normal">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="flex-shrink-0 ml-2">{action}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
