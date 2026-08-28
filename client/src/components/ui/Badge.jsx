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
    default: 'bg-[#F5F7F3] text-[#5E6A63] border-[#DCE4DE]',
    surplus: 'bg-[#E7F6EE] text-[#209B67] border-[#DCE4DE]',
    success: 'bg-[#E7F6EE] text-[#209B67] border-[#DCE4DE]',
    deficit: 'bg-[#FDECEC] text-[#D85D5D] border-[#F8CFCF]',
    danger: 'bg-[#FDECEC] text-[#D85D5D] border-[#F8CFCF]',
    warning: 'bg-[#FFF3D7] text-[#E7AA31] border-[#F7E7BE]',
    battery: 'bg-[#FFF3D7] text-[#D79A27] border-[#F7E7BE]',
    solar: 'bg-[#FFF3D7] text-[#E7AA31] border-[#F7E7BE]',
    info: 'bg-[#EAF2FC] text-[#397BD2] border-[#D0E2FA]',
    grid: 'bg-[#EAF2FC] text-[#397BD2] border-[#D0E2FA]',
    ai: 'bg-[#F1EDFF] text-[#7359C8] border-[#E2D9F8]',
    purple: 'bg-[#F1EDFF] text-[#7359C8] border-[#E2D9F8]',
    forest: 'bg-[#12392B] text-white border-[#12392B]',
    neutral: 'bg-[#F5F7F3] text-[#5E6A63] border-[#DCE4DE]',
  }[variant] || 'bg-[#F5F7F3] text-[#5E6A63] border-[#DCE4DE]';

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
    online: 'bg-[#209B67]',
    connected: 'bg-[#209B67]',
    surplus: 'bg-[#209B67]',
    healthy: 'bg-[#209B67]',
    active: 'bg-[#209B67]',
    live: 'bg-[#209B67]',
    warning: 'bg-[#E7AA31]',
    battery: 'bg-[#D79A27]',
    solar: 'bg-[#E7AA31]',
    pending: 'bg-[#E7AA31]',
    deficit: 'bg-[#D85D5D]',
    offline: 'bg-[#D85D5D]',
    error: 'bg-[#D85D5D]',
    info: 'bg-[#397BD2]',
    grid: 'bg-[#397BD2]',
    ai: 'bg-[#7359C8]',
  }[(status || '').toLowerCase()] || 'bg-[#87918B]';

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold text-[#15211B] ${className}`}>
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
