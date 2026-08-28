import React from 'react';
import FaIcon from '../icons/FaIcon';

export default function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  tooltip,
  ...props
}) {
  const variantClasses = {
    primary:
      'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 border-emerald-600 shadow-sm focus:ring-emerald-500/40',
    secondary:
      'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 border-slate-200/80 shadow-none focus:ring-slate-400/40',
    outline:
      'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 border-slate-300 focus:ring-slate-400/30',
    ai:
      'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 border-purple-600 shadow-sm focus:ring-purple-500/40',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border-rose-600 shadow-sm focus:ring-rose-500/40',
    warning:
      'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 border-amber-500 shadow-sm focus:ring-amber-500/40',
    ghost:
      'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 border-transparent shadow-none',
  }[variant] || 'bg-emerald-600 text-white hover:bg-emerald-700';

  const sizeClasses = {
    xs: 'text-xs px-2.5 py-1 rounded-md gap-1.5',
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-2',
    md: 'text-sm px-4 py-2 rounded-lg gap-2',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5',
  }[size] || 'text-sm px-4 py-2 rounded-lg gap-2';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      title={tooltip}
      className={`inline-flex items-center justify-center font-medium border transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed select-none ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <FaIcon name="refresh" spin className="text-current text-xs" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
      {!isLoading && iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  );
}

export function IconButton({
  icon,
  name,
  onClick,
  title,
  ariaLabel,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  const sizeClasses = {
    xs: 'w-7 h-7 text-xs rounded-md',
    sm: 'w-8 h-8 text-xs rounded-lg',
    md: 'w-9 h-9 text-sm rounded-lg',
    lg: 'w-10 h-10 text-base rounded-xl',
  }[size] || 'w-9 h-9 text-sm rounded-lg';

  const variantClasses = {
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 border-slate-200/80',
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 border-emerald-600',
    outline: 'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 border-slate-300',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 border-transparent',
    ai: 'bg-purple-100 text-purple-700 hover:bg-purple-200 active:bg-purple-300 border-purple-200',
  }[variant] || 'bg-slate-100 text-slate-700';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title || ariaLabel}
      aria-label={ariaLabel || title}
      className={`inline-flex items-center justify-center border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-400/40 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {icon || <FaIcon name={name} />}
    </button>
  );
}
