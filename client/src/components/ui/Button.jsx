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
      'bg-[#12392B] text-white hover:bg-[#17513B] active:bg-[#0B241B] border-[#12392B] shadow-sm focus:ring-[#209B67]/30',
    emerald:
      'bg-[#209B67] text-white hover:bg-[#187A50] active:bg-[#125D3D] border-[#209B67] shadow-sm focus:ring-[#209B67]/30',
    secondary:
      'bg-white text-[#15211B] hover:bg-[#F5F7F3] active:bg-[#EEF1EB] border-[#DCE4DE] shadow-card focus:ring-slate-300',
    outline:
      'bg-transparent text-[#15211B] hover:bg-white active:bg-[#F5F7F3] border-[#DCE4DE] focus:ring-slate-300',
    ai:
      'bg-[#F1EDFF] text-[#7359C8] hover:bg-[#E4DAF8] active:bg-[#D7C7F4] border-[#E2D9F8] shadow-subtle focus:ring-[#7359C8]/30 font-bold',
    'ai-solid':
      'bg-[#7359C8] text-white hover:bg-[#6044B8] active:bg-[#4E34A0] border-[#7359C8] shadow-sm focus:ring-[#7359C8]/30',
    danger:
      'bg-[#FDECEC] text-[#D85D5D] hover:bg-[#F8CFCF] active:bg-[#F3B3B3] border-[#F8CFCF] shadow-subtle focus:ring-[#D85D5D]/30 font-bold',
    warning:
      'bg-[#FFF3D7] text-[#E7AA31] hover:bg-[#F7E7BE] active:bg-[#EFD598] border-[#F7E7BE] shadow-subtle focus:ring-[#E7AA31]/30 font-bold',
    ghost:
      'bg-transparent text-[#5E6A63] hover:bg-white hover:text-[#15211B] active:bg-[#F5F7F3] border-transparent shadow-none',
  }[variant] || 'bg-[#12392B] text-white hover:bg-[#17513B]';

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
    secondary: 'bg-white text-[#5E6A63] hover:text-[#15211B] hover:bg-[#F5F7F3] border-[#DCE4DE] shadow-card',
    primary: 'bg-[#12392B] text-white hover:bg-[#17513B] border-[#12392B] shadow-sm',
    emerald: 'bg-[#209B67] text-white hover:bg-[#187A50] border-[#209B67] shadow-sm',
    outline: 'bg-transparent text-[#5E6A63] hover:text-[#15211B] hover:bg-white border-[#DCE4DE]',
    ghost: 'bg-transparent text-[#5E6A63] hover:text-[#15211B] hover:bg-white border-transparent',
    ai: 'bg-[#F1EDFF] text-[#7359C8] hover:bg-[#E4DAF8] border-[#E2D9F8]',
  }[variant] || 'bg-white text-[#5E6A63] border-[#DCE4DE]';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title || ariaLabel}
      aria-label={ariaLabel || title}
      className={`inline-flex items-center justify-center border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#209B67]/30 disabled:opacity-50 disabled:cursor-not-allowed select-none ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {icon || <FaIcon name={name} />}
    </button>
  );
}
