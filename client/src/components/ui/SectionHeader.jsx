import React from 'react';

export default function SectionHeader({
  title,
  subtitle,
  rightAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(23,56,43,0.08)] mb-5 sm:mb-6 ${className}`}>
      <div>
        <h2 className="font-display text-lg sm:text-xl font-bold text-[#041D0D] tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#4A5B4F] font-medium mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {rightAction && (
        <div className="flex-shrink-0 flex items-center">
          {rightAction}
        </div>
      )}
    </div>
  );
}
