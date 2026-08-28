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
      'bg-[#163A2B] text-white hover:bg-[#12251D] active:bg-[#0B1611] border-[#163A2B] shadow-sm focus:ring-[#168A5A]/30',
    emerald:
      'bg-[#168A5A] text-white hover:bg-[#126e48] active:bg-[#0e5739] border-[#168A5A] shadow-sm focus:ring-[#168A5A]/30',
    secondary:
      'bg-white text-[#102019] hover:bg-[#F5F7F6] active:bg-[#EBF0ED] border-[#DDE5E0] shadow-card focus:ring-slate-300',
    outline:
      'bg-transparent text-[#102019] hover:bg-white active:bg-[#F5F7F6] border-[#DDE5E0] focus:ring-slate-300',
    ai:
      'bg-[#F0EBFF] text-[#7657D8] hover:bg-[#E2D9F8] active:bg-[#D4C4F4] border-[#E2D9F8] shadow-subtle focus:ring-[#7657D8]/30 font-bold',
    'ai-solid':
      'bg-[#7657D8] text-white hover:bg-[#6344C2] active:bg-[#5234A8] border-[#7657D8] shadow-sm focus:ring-[#7657D8]/30',
    danger:
      'bg-[#FDECEC] text-[#D95C5C] hover:bg-[#F8CFCF] active:bg-[#F3B3B3] border-[#F8CFCF] shadow-subtle focus:ring-[#D95C5C]/30 font-bold',
    warning:
      'bg-[#FFF4D8] text-[#E8A72B] hover:bg-[#F7E7BE] active:bg-[#EFD598] border-[#F7E7BE] shadow-subtle focus:ring-[#E8A72B]/30 font-bold',
    ghost:
      'bg-transparent text-[#5D6B64] hover:bg-white hover:text-[#102019] active:bg-[#F5F7F6] border-transparent shadow-none',
  }[variant] || 'bg-[#163A2B] text-white hover:bg-[#12251D]';

  const sizeClasses = {
    xs: 'text-xs px-2.5 py-1 rounded-lg gap-1.5 font-semibold',
    sm: 'text-xs px-3 py-1.5 rounded-xl gap-2 font-semibold',
    md: 'text-sm px-4 py-2 rounded-xl gap-2 font-semibold',
    lg: 'text-base px-5.5 py-2.5 rounded-2xl gap-2.5 font-bold',
  }[size] || 'text-sm px-4 py-2 rounded-xl gap-2 font-semibold';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      title={tooltip}
      className={`inline-flex items-center justify-center border transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed select-none ${variantClasses} ${sizeClasses} ${className}`}
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
    xs: 'w-7 h-7 text-xs rounded-lg',
    sm: 'w-8 h-8 text-xs rounded-xl',
    md: 'w-9 h-9 text-sm rounded-xl',
    lg: 'w-10 h-10 text-base rounded-2xl',
  }[size] || 'w-9 h-9 text-sm rounded-xl';

  const variantClasses = {
    secondary: 'bg-white text-[#5D6B64] hover:text-[#102019] hover:bg-[#F5F7F6] border-[#DDE5E0] shadow-card',
    primary: 'bg-[#163A2B] text-white hover:bg-[#12251D] border-[#163A2B] shadow-sm',
    emerald: 'bg-[#168A5A] text-white hover:bg-[#126e48] border-[#168A5A] shadow-sm',
    outline: 'bg-transparent text-[#5D6B64] hover:text-[#102019] hover:bg-white border-[#DDE5E0]',
    ghost: 'bg-transparent text-[#5D6B64] hover:text-[#102019] hover:bg-white border-transparent',
    ai: 'bg-[#F0EBFF] text-[#7657D8] hover:bg-[#E2D9F8] border-[#E2D9F8]',
  }[variant] || 'bg-white text-[#5D6B64] border-[#DDE5E0]';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title || ariaLabel}
      aria-label={ariaLabel || title}
      className={`inline-flex items-center justify-center border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#168A5A]/30 disabled:opacity-50 disabled:cursor-not-allowed select-none ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {icon || <FaIcon name={name} />}
    </button>
  );
}
