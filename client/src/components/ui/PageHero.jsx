import React from 'react';
import FaIcon from '../icons/FaIcon';

export default function PageHero({
  category,
  statusBadge,
  statusVariant = 'surplus', // 'surplus' | 'deficit' | 'ai' | 'solar' | 'default'
  title,
  highlightText,
  subtitle,
  supportingFacts = [],
  primaryAction,
  secondaryAction,
  tertiaryAction,
  rightGraphic,
  className = '',
}) {
  const variantStyles = {
    surplus: 'bg-[#E8F6EE] text-[#1E9B68] border-[#1E9B68]/20',
    deficit: 'bg-[#FCECEC] text-[#D45C5C] border-[#D45C5C]/20',
    ai: 'bg-[#F3EEFC] text-[#7358C7] border-[#7358C7]/20',
    solar: 'bg-[#FFF7E4] text-[#E5A72D] border-[#E5A72D]/20',
    default: 'bg-white text-[#5E6963] border-[rgba(23,34,29,0.10)]',
  };

  return (
    <div className={`text-center max-w-4xl mx-auto space-y-3 pt-2 pb-2 select-none ${className}`}>
      
      {/* 🌟 1. Category & Status Badge Pill */}
      {(category || statusBadge) && (
        <div className="flex items-center justify-center space-x-2">
          {category && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#89938D]">
              {category}
            </span>
          )}
          {category && statusBadge && <span className="text-xs text-[#89938D]">•</span>}
          {statusBadge && (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-xl border text-[11px] font-bold shadow-xs ${
                variantStyles[statusVariant] || variantStyles.default
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              <span>{statusBadge}</span>
            </div>
          )}
        </div>
      )}

      {/* 🌟 2. Centered Main Headline in Crisp Changa One */}
      <div className="space-y-1.5">
        <h1 className="font-changa text-3xl sm:text-4xl lg:text-[44px] font-normal text-[#17221D] leading-tight tracking-wide">
          {title}{' '}
          {highlightText && (
            <span className={statusVariant === 'ai' ? 'text-[#7358C7]' : statusVariant === 'solar' ? 'text-[#E5A72D]' : 'text-[#1E9B68]'}>
              {highlightText}
            </span>
          )}
        </h1>

        {/* 🌟 3. Natural Language Subtitle */}
        {subtitle && (
          <p className="text-sm sm:text-base text-[#5E6963] max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* 🌟 4. Supporting Facts Row (Centered Chips) */}
      {supportingFacts && supportingFacts.length > 0 && (
        <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 pt-1 text-xs font-semibold text-[#17221D] flex-wrap">
          {supportingFacts.map((fact, index) => (
            <div
              key={index}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white border border-[rgba(23,34,29,0.08)] shadow-subtle text-xs"
            >
              {fact.icon && <FaIcon name={fact.icon} className="text-[#1E9B68] text-xs" />}
              <span className="text-[#5E6963] font-medium">{fact.label}:</span>
              <span className="font-bold text-[#17221D]">{fact.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* 🌟 5. Action Buttons (Centered Row with 12px Radius) */}
      {(primaryAction || secondaryAction || tertiaryAction) && (
        <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="px-5 py-2.5 rounded-xl bg-[#12392B] hover:bg-[#174A37] text-white text-xs sm:text-sm font-bold shadow-xs transition flex items-center space-x-2 active:scale-98"
            >
              {primaryAction.icon && <FaIcon name={primaryAction.icon} className="text-xs text-[#43CB8C]" />}
              <span>{primaryAction.label}</span>
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="px-4 py-2.5 rounded-xl bg-white/90 hover:bg-white text-[#17221D] text-xs sm:text-sm font-bold border border-[rgba(23,34,29,0.12)] shadow-xs transition flex items-center space-x-1.5 active:scale-98"
            >
              {secondaryAction.icon && <FaIcon name={secondaryAction.icon} className="text-xs text-[#5E6963]" />}
              <span>{secondaryAction.label}</span>
            </button>
          )}

          {tertiaryAction && (
            <button
              type="button"
              onClick={tertiaryAction.onClick}
              className="px-3 py-2.5 text-xs sm:text-sm font-bold text-[#1E9B68] hover:underline"
            >
              {tertiaryAction.label}
            </button>
          )}
        </div>
      )}

    </div>
  );
}
