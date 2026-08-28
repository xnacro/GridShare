import React from 'react';

/**
 * MicrogridSketchIllustration
 * 
 * A hand-drawn style SVG illustration of a community microgrid,
 * matching the GridShare visual language (Image 2 reference).
 * Houses with solar panels, sun, battery, power lines, decorative circles.
 */
export default function MicrogridSketchIllustration({ className = '' }) {
  return (
    <svg
      viewBox="0 0 600 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Hand-drawn microgrid community illustration"
    >
      {/* Background subtle gradient wash */}
      <defs>
        <linearGradient id="bgWash" x1="0" y1="0" x2="600" y2="480" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EBF5E6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#D4EDDA" stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id="solarGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E5A72D" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#E5A72D" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ─── SUN (top right) ─── */}
      <g transform="translate(480, 80)">
        {/* Sun glow */}
        <circle cx="0" cy="0" r="38" fill="#E5A72D" opacity="0.08" />
        <circle cx="0" cy="0" r="26" fill="#E5A72D" opacity="0.12" />
        {/* Sun circle */}
        <circle cx="0" cy="0" r="18" stroke="#6B8F4E" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Sun rays */}
        <line x1="0" y1="-26" x2="0" y2="-34" stroke="#6B8F4E" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="18.4" y1="-18.4" x2="24" y2="-24" stroke="#6B8F4E" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="26" y1="0" x2="34" y2="0" stroke="#6B8F4E" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="18.4" y1="18.4" x2="24" y2="24" stroke="#6B8F4E" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="0" y1="26" x2="0" y2="34" stroke="#6B8F4E" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="-18.4" y1="18.4" x2="-24" y2="24" stroke="#6B8F4E" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="-26" y1="0" x2="-34" y2="0" stroke="#6B8F4E" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="-18.4" y1="-18.4" x2="-24" y2="-24" stroke="#6B8F4E" strokeWidth="1.8" strokeLinecap="round" />
      </g>

      {/* ─── BATTERY STORAGE (top left area) ─── */}
      <g transform="translate(140, 140)">
        {/* Battery body */}
        <rect x="0" y="0" width="52" height="32" rx="4" stroke="#4A7A3C" strokeWidth="2" fill="#A8D38D" fillOpacity="0.25" />
        <rect x="52" y="8" width="6" height="16" rx="2" stroke="#4A7A3C" strokeWidth="1.5" fill="none" />
        {/* Battery charge level bars */}
        <rect x="6" y="6" width="12" height="20" rx="2" fill="#4A7A3C" fillOpacity="0.6" />
        <rect x="22" y="6" width="12" height="20" rx="2" fill="#4A7A3C" fillOpacity="0.6" />
        <rect x="38" y="6" width="8" height="20" rx="2" fill="#4A7A3C" fillOpacity="0.2" />
      </g>

      {/* ─── MAIN HOUSE (center-right) with solar panels ─── */}
      <g transform="translate(320, 280)">
        {/* House base */}
        <rect x="0" y="30" width="100" height="70" stroke="#4A7A3C" strokeWidth="2" fill="none" strokeLinejoin="round" />
        {/* Roof */}
        <path d="M-10 30 L50 -10 L110 30" stroke="#4A7A3C" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Door */}
        <rect x="38" y="60" width="24" height="40" stroke="#4A7A3C" strokeWidth="1.5" fill="none" rx="1" />
        {/* Window left */}
        <rect x="10" y="48" width="18" height="16" stroke="#4A7A3C" strokeWidth="1.5" fill="none" rx="1" />
        <line x1="19" y1="48" x2="19" y2="64" stroke="#4A7A3C" strokeWidth="1" />
        <line x1="10" y1="56" x2="28" y2="56" stroke="#4A7A3C" strokeWidth="1" />
        {/* Window right */}
        <rect x="72" y="48" width="18" height="16" stroke="#4A7A3C" strokeWidth="1.5" fill="none" rx="1" />
        <line x1="81" y1="48" x2="81" y2="64" stroke="#4A7A3C" strokeWidth="1" />
        <line x1="72" y1="56" x2="90" y2="56" stroke="#4A7A3C" strokeWidth="1" />
        
        {/* Solar panels on roof */}
        <g transform="translate(20, -2) rotate(-22)">
          <rect x="0" y="0" width="24" height="14" rx="1" stroke="#4A7A3C" strokeWidth="1.5" fill="#A8D38D" fillOpacity="0.3" />
          <line x1="8" y1="0" x2="8" y2="14" stroke="#4A7A3C" strokeWidth="0.8" />
          <line x1="16" y1="0" x2="16" y2="14" stroke="#4A7A3C" strokeWidth="0.8" />
          <line x1="0" y1="7" x2="24" y2="7" stroke="#4A7A3C" strokeWidth="0.8" />
        </g>
        <g transform="translate(52, -2) rotate(-22)">
          <rect x="0" y="0" width="24" height="14" rx="1" stroke="#4A7A3C" strokeWidth="1.5" fill="#A8D38D" fillOpacity="0.3" />
          <line x1="8" y1="0" x2="8" y2="14" stroke="#4A7A3C" strokeWidth="0.8" />
          <line x1="16" y1="0" x2="16" y2="14" stroke="#4A7A3C" strokeWidth="0.8" />
          <line x1="0" y1="7" x2="24" y2="7" stroke="#4A7A3C" strokeWidth="0.8" />
        </g>
      </g>

      {/* ─── SMALLER HOUSE (far right) ─── */}
      <g transform="translate(470, 320)">
        {/* House base */}
        <rect x="0" y="22" width="70" height="55" stroke="#4A7A3C" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
        {/* Roof */}
        <path d="M-6 22 L35 -4 L76 22" stroke="#4A7A3C" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Door */}
        <rect x="26" y="47" width="18" height="30" stroke="#4A7A3C" strokeWidth="1.3" fill="none" rx="1" />
        {/* Window */}
        <rect x="8" y="34" width="14" height="12" stroke="#4A7A3C" strokeWidth="1.3" fill="none" rx="1" />
        <line x1="15" y1="34" x2="15" y2="46" stroke="#4A7A3C" strokeWidth="0.8" />
        {/* Solar panel on roof */}
        <g transform="translate(22, 2) rotate(-18)">
          <rect x="0" y="0" width="20" height="10" rx="1" stroke="#4A7A3C" strokeWidth="1.3" fill="#A8D38D" fillOpacity="0.25" />
          <line x1="10" y1="0" x2="10" y2="10" stroke="#4A7A3C" strokeWidth="0.7" />
          <line x1="0" y1="5" x2="20" y2="5" stroke="#4A7A3C" strokeWidth="0.7" />
        </g>
        {/* Wind turbine on right */}
        <g transform="translate(72, -10)">
          <line x1="0" y1="0" x2="0" y2="35" stroke="#4A7A3C" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="0" x2="-12" y2="10" stroke="#4A7A3C" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="0" y1="0" x2="12" y2="10" stroke="#4A7A3C" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="0" y1="0" x2="0" y2="-14" stroke="#4A7A3C" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      </g>

      {/* ─── POWER LINES connecting houses ─── */}
      {/* Main house to battery */}
      <path
        d="M320 320 Q 260 280, 200 165"
        stroke="#6B8F4E"
        strokeWidth="1.5"
        strokeDasharray="6 4"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Main house to smaller house */}
      <path
        d="M420 340 Q 445 340, 470 350"
        stroke="#6B8F4E"
        strokeWidth="1.5"
        strokeDasharray="6 4"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Battery to sun (energy flow) */}
      <path
        d="M192 148 Q 320 100, 455 90"
        stroke="#E5A72D"
        strokeWidth="1.2"
        strokeDasharray="4 6"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* ─── UTILITY POLE (left side) ─── */}
      <g transform="translate(80, 240)">
        <line x1="0" y1="0" x2="0" y2="70" stroke="#4A7A3C" strokeWidth="2" strokeLinecap="round" />
        <line x1="-14" y1="6" x2="14" y2="6" stroke="#4A7A3C" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="-10" y1="16" x2="10" y2="16" stroke="#4A7A3C" strokeWidth="1.5" strokeLinecap="round" />
        {/* Wires from pole */}
        <path d="M14 6 Q 50 30, 130 145" stroke="#6B8F4E" strokeWidth="1" strokeDasharray="4 5" fill="none" opacity="0.4" />
      </g>

      {/* ─── DECORATIVE CIRCLES (scattered) ─── */}
      <circle cx="130" cy="240" r="5" stroke="#6B8F4E" strokeWidth="1" fill="none" opacity="0.3" />
      <circle cx="260" cy="200" r="4" stroke="#6B8F4E" strokeWidth="1" fill="none" opacity="0.25" />
      <circle cx="400" cy="160" r="6" stroke="#6B8F4E" strokeWidth="1" fill="none" opacity="0.2" />
      <circle cx="300" cy="420" r="5" stroke="#6B8F4E" strokeWidth="1" fill="none" opacity="0.25" />
      <circle cx="530" cy="430" r="4" stroke="#6B8F4E" strokeWidth="1" fill="none" opacity="0.2" />
      <circle cx="180" cy="380" r="3.5" stroke="#6B8F4E" strokeWidth="1" fill="none" opacity="0.2" />
      <circle cx="460" cy="250" r="3" stroke="#6B8F4E" strokeWidth="1" fill="none" opacity="0.25" />

      {/* ─── SMALL FILLED DOT ACCENTS ─── */}
      <circle cx="240" cy="300" r="2" fill="#6B8F4E" opacity="0.2" />
      <circle cx="500" cy="200" r="2.5" fill="#6B8F4E" opacity="0.15" />
      <circle cx="350" cy="140" r="2" fill="#6B8F4E" opacity="0.2" />
      <circle cx="100" cy="180" r="2" fill="#6B8F4E" opacity="0.15" />
      <circle cx="550" cy="380" r="2" fill="#6B8F4E" opacity="0.2" />

      {/* ─── TREE/BUSH accents ─── */}
      <g transform="translate(250, 370)" opacity="0.5">
        <line x1="0" y1="0" x2="0" y2="16" stroke="#4A7A3C" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="0" cy="-4" r="8" stroke="#4A7A3C" strokeWidth="1.3" fill="#A8D38D" fillOpacity="0.2" />
      </g>
      <g transform="translate(460, 390)" opacity="0.45">
        <line x1="0" y1="0" x2="0" y2="12" stroke="#4A7A3C" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="0" cy="-4" r="6" stroke="#4A7A3C" strokeWidth="1.2" fill="#A8D38D" fillOpacity="0.2" />
      </g>

      {/* ─── GROUND LINE ─── */}
      <path
        d="M60 410 Q 150 400, 250 412 Q 350 420, 450 408 Q 520 400, 580 415"
        stroke="#6B8F4E"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        opacity="0.25"
      />

    </svg>
  );
}
