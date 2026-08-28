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
    surplus: 'bg-[#E6F5EC] text-[#1E9B67] border-[#1E9B67]/20',
    deficit: 'bg-[#FCECEC] text-[#D65D5D] border-[#D65D5D]/20',
    ai: 'bg-[#F1ECFF] text-[#7358C8] border-[#7358C8]/20',
    solar: 'bg-[#FFF7E4] text-[#E5A72D] border-[#E5A72D]/20',
    default: 'bg-white/80 text-[#5E6B63] border-[rgba(23,56,43,0.10)]',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl gs-glass-hero p-6 sm:p-8 lg:p-10 border border-white shadow-sm mb-6 sm:mb-8 ${className}`}
    >
      {/* Subtle Atmosphere Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#E6F5EC]/60 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#F1ECFF]/40 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
        
        {/* Left / Main Content */}
        <div className="space-y-3.5 max-w-3xl">
          
          {/* Category & Status Chip */}
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
            {category && (
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#5E6B63]">
                {category}
              </span>
            )}
            {statusBadge && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-wide border flex items-center gap-1.5 ${
                  variantStyles[statusVariant] || variantStyles.default
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {statusBadge}
              </span>
            )}
          </div>

          {/* Large Hero Title */}
          <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-extrabold text-[#15221B] tracking-tight leading-[1.15]">
            {title}
            {highlightText && (
              <span className="block text-[#1E9B67] mt-1 font-black">
                {highlightText}
              </span>
            )}
          </h1>

          {/* Subtitle / Natural Language Sentence */}
          {subtitle && (
            <p className="text-sm sm:text-base text-[#5E6B63] font-medium leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}

          {/* Supporting Facts Row */}
          {supportingFacts && supportingFacts.length > 0 && (
            <div className="flex items-center gap-4 sm:gap-6 pt-2 text-xs sm:text-sm font-semibold text-[#15221B] flex-wrap">
              {supportingFacts.map((fact, index) => (
                <div key={index} className="flex items-center space-x-1.5">
                  {fact.icon && <FaIcon name={fact.icon} className="text-[#1E9B67] text-xs" />}
                  <span className="text-[#5E6B63] font-normal">{fact.label}:</span>
                  <span className="font-bold text-[#15221B]">{fact.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action CTAs */}
          {(primaryAction || secondaryAction || tertiaryAction) && (
            <div className="flex items-center gap-3 pt-3 flex-wrap">
              {primaryAction && (
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  className="px-5 py-2.5 rounded-2xl bg-[#12382A] text-white hover:bg-[#164A35] text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-150 flex items-center gap-2"
                >
                  {primaryAction.icon && <FaIcon name={primaryAction.icon} className="text-xs text-[#43CB8C]" />}
                  {primaryAction.label}
                </button>
              )}

              {secondaryAction && (
                <button
                  type="button"
                  onClick={secondaryAction.onClick}
                  className="px-4 py-2.5 rounded-2xl bg-white/90 hover:bg-white text-[#15221B] border border-[rgba(23,56,43,0.12)] text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition-all duration-150 flex items-center gap-2"
                >
                  {secondaryAction.icon && <FaIcon name={secondaryAction.icon} className="text-xs text-[#5E6B63]" />}
                  {secondaryAction.label}
                </button>
              )}

              {tertiaryAction && (
                <button
                  type="button"
                  onClick={tertiaryAction.onClick}
                  className="text-xs font-bold text-[#1E9B67] hover:text-[#164A35] underline underline-offset-4 px-2 py-1 transition"
                >
                  {tertiaryAction.label}
                </button>
              )}
            </div>
          )}

        </div>

        {/* Right Graphic / Slot */}
        {rightGraphic && (
          <div className="flex-shrink-0 lg:max-w-md w-full lg:w-auto">
            {rightGraphic}
          </div>
        )}

      </div>
    </div>
  );
}
