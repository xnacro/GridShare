import React from 'react';
import { Html } from '@react-three/drei';
import FaIcon from '../icons/FaIcon';

export default function Readable3DLabel({
  position = [0, 0, 0],
  title,
  subtitle,
  value,
  unit = '',
  badge,
  iconName,
  badgeType = 'neutral',
  distanceFactor = 10,
  className = '',
}) {
  const badgeColors = {
    positive: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    negative: 'bg-rose-50 text-rose-800 border-rose-300',
    warning: 'bg-amber-50 text-amber-800 border-amber-300',
    info: 'bg-blue-50 text-blue-800 border-blue-300',
    neutral: 'bg-slate-100 text-slate-700 border-slate-300',
  }[badgeType] || 'bg-slate-100 text-slate-700 border-slate-300';

  return (
    <Html
      position={position}
      center
      distanceFactor={distanceFactor}
      className={`pointer-events-none select-none transition-all duration-150 ${className}`}
    >
      <div className="flex flex-col items-center rounded-xl border border-white/90 bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur-md">
        {title && (
          <span className="font-bold text-[10px] text-slate-900 tracking-tight whitespace-nowrap">
            {title}
          </span>
        )}
        <div className="flex items-center space-x-1 mt-0.5">
          {(badge || iconName) && (
            <span className={`rounded-md border px-1.5 py-0.5 text-[8.5px] font-bold font-mono flex items-center gap-1 ${badgeColors}`}>
              {iconName && <FaIcon name={iconName} className="text-[9px]" />}
              {badge && <span>{badge}</span>}
            </span>
          )}
          {value !== undefined && (
            <span className="font-mono font-bold text-[10px] text-slate-900">
              {value} {unit}
            </span>
          )}
        </div>
        {subtitle && (
          <span className="text-[8.5px] font-medium text-slate-500 mt-0.5 whitespace-nowrap">
            {subtitle}
          </span>
        )}
      </div>
    </Html>
  );
}
