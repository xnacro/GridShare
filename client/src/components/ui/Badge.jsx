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
    default: 'bg-[#FAF8F2] text-[#747A6C] border-[#D6D1BE]',
    surplus: 'bg-[#E8F3F1] text-[#156B5C] border-[#156B5C]/30',
    success: 'bg-[#E8F3F1] text-[#156B5C] border-[#156B5C]/30',
    deficit: 'bg-[#F9ECE6] text-[#C2571F] border-[#C2571F]/30',
    danger: 'bg-[#F9ECE6] text-[#C2571F] border-[#C2571F]/30',
    warning: 'bg-[#FAF4E8] text-[#D99A1F] border-[#D99A1F]/30',
    battery: 'bg-[#E8F3F1] text-[#156B5C] border-[#156B5C]/30',
    solar: 'bg-[#FAF4E8] text-[#D99A1F] border-[#D99A1F]/30',
    info: 'bg-[#FAF8F2] text-[#0F2233] border-[#D6D1BE]',
    grid: 'bg-[#FAF8F2] text-[#0F2233] border-[#D6D1BE]',
    ai: 'bg-[#E8F3F1] text-[#156B5C] border-[#156B5C]/30',
    purple: 'bg-[#FAF8F2] text-[#0F2233] border-[#D6D1BE]',
    forest: 'bg-[#0F2233] text-white border-[#0F2233]',
    neutral: 'bg-[#FAF8F2] text-[#747A6C] border-[#D6D1BE]',
  }[variant] || 'bg-[#FAF8F2] text-[#747A6C] border-[#D6D1BE]';

  const sizeClasses = {
    xs: 'text-[10.5px] px-1.5 py-0.5 rounded-md gap-1 font-bold',
    sm: 'text-xs px-2 py-0.5 rounded-md gap-1.5 font-semibold',
    md: 'text-xs px-2.5 py-1 rounded-lg gap-1.5 font-semibold',
    lg: 'text-sm px-3 py-1.5 rounded-xl gap-2 font-semibold',
  }[size] || 'text-xs px-2.5 py-1 rounded-lg gap-1.5 font-semibold';

  return (
    <span
      className={`inline-flex items-center border tracking-tight select-none ${variantClasses} ${sizeClasses} ${className}`}
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
    online: 'bg-[#156B5C]',
    connected: 'bg-[#156B5C]',
    surplus: 'bg-[#156B5C]',
    healthy: 'bg-[#156B5C]',
    active: 'bg-[#156B5C]',
    live: 'bg-[#156B5C]',
    warning: 'bg-[#D99A1F]',
    battery: 'bg-[#156B5C]',
    solar: 'bg-[#D99A1F]',
    pending: 'bg-[#D99A1F]',
    deficit: 'bg-[#C2571F]',
    offline: 'bg-[#C2571F]',
    error: 'bg-[#C2571F]',
    info: 'bg-[#0F2233]',
    grid: 'bg-[#0F2233]',
    ai: 'bg-[#156B5C]',
  }[(status || '').toLowerCase()] || 'bg-[#747A6C]';

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F2233] ${className}`}>
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
