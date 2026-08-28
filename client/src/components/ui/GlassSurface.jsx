import React from 'react';

export default function GlassSurface({
  children,
  className = '',
  padding = 'p-6 sm:p-8',
  variant = 'default', // 'default' | 'hero' | 'overlay'
}) {
  const variantClass = {
    default: 'gs-glass',
    hero: 'gs-glass-hero',
    overlay: 'gs-glass-overlay',
  }[variant] || 'gs-glass';

  return (
    <div className={`rounded-3xl ${variantClass} ${padding} ${className}`}>
      {children}
    </div>
  );
}
