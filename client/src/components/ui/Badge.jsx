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
    default: 'bg-[#F5F7F6] text-[#5D6B64] border-[#DDE5E0]',
    surplus: 'bg-[#E7F5EE] text-[#168A5A] border-[#DDE5E0]',
    success: 'bg-[#E7F5EE] text-[#168A5A] border-[#DDE5E0]',
    deficit: 'bg-[#FDECEC] text-[#D95C5C] border-[#F8CFCF]',
    danger: 'bg-[#FDECEC] text-[#D95C5C] border-[#F8CFCF]',
    warning: 'bg-[#FFF4D8] text-[#E8A72B] border-[#F7E7BE]',
    battery: 'bg-[#FFF4D8] text-[#D99A26] border-[#F7E7BE]',
    solar: 'bg-[#FFF4D8] text-[#E8A72B] border-[#F7E7BE]',
    info: 'bg-[#EAF2FF] text-[#3678D4] border-[#D0E2FA]',
    grid: 'bg-[#EAF2FF] text-[#3678D4] border-[#D0E2FA]',
    ai: 'bg-[#F0EBFF] text-[#7657D8] border-[#E2D9F8]',
    purple: 'bg-[#F0EBFF] text-[#7657D8] border-[#E2D9F8]',
    forest: 'bg-[#163A2B] text-white border-[#163A2B]',
    neutral: 'bg-[#F5F7F6] text-[#5D6B64] border-[#DDE5E0]',
  }[variant] || 'bg-[#F5F7F6] text-[#5D6B64] border-[#DDE5E0]';

  const sizeClasses = {
    xs: 'text-[10.5px] px-1.5 py-0.5 rounded-md gap-1 font-semibold',
    sm: 'text-xs px-2 py-0.5 rounded-md gap-1.5 font-semibold',
    md: 'text-xs px-2.5 py-1 rounded-lg gap-1.5 font-semibold',
    lg: 'text-sm px-3 py-1.5 rounded-xl gap-2 font-semibold',
  }[size] || 'text-xs px-2.5 py-1 rounded-lg gap-1.5 font-semibold';

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
    online: 'bg-[#168A5A]',
    connected: 'bg-[#168A5A]',
    surplus: 'bg-[#168A5A]',
    healthy: 'bg-[#168A5A]',
    active: 'bg-[#168A5A]',
    live: 'bg-[#168A5A]',
    warning: 'bg-[#E8A72B]',
    battery: 'bg-[#D99A26]',
    solar: 'bg-[#E8A72B]',
    pending: 'bg-[#E8A72B]',
    deficit: 'bg-[#D95C5C]',
    offline: 'bg-[#D95C5C]',
    error: 'bg-[#D95C5C]',
    info: 'bg-[#3678D4]',
    grid: 'bg-[#3678D4]',
    ai: 'bg-[#7657D8]',
  }[(status || '').toLowerCase()] || 'bg-[#83908A]';

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold text-[#102019] ${className}`}>
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
