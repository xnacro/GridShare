import React from 'react';

/**
 * MicrogridSketchIllustration
 * 
 * A hand-drawn style SVG illustration of a community microgrid,
 * matching the GridShare v5 visual language.
 * Deep Navy infrastructure, Solar Ochre sunlight & panels, Sustainable Teal battery & energy flows.
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
      <defs>
        <linearGradient id="solarGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D99A1F" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#D99A1F" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ─── SUN (top right) ─── */}
      <g transform="translate(480, 80)">
        {/* Sun glow */}
        <circle cx="0" cy="0" r="38" fill="#D99A1F" opacity="0.12" />
        <circle cx="0" cy="0" r="26" fill="#D99A1F" opacity="0.18" />
        {/* Sun circle */}
        <circle cx="0" cy="0" r="18" stroke="#D99A1F" strokeWidth="2.2" fill="#FAF4E8" fillOpacity="0.8" strokeLinecap="round" />
        {/* Sun rays */}
        <line x1="0" y1="-26" x2="0" y2="-34" stroke="#D99A1F" strokeWidth="2" strokeLinecap="round" />
        <line x1="18.4" y1="-18.4" x2="24" y2="-24" stroke="#D99A1F" strokeWidth="2" strokeLinecap="round" />
        <line x1="26" y1="0" x2="34" y2="0" stroke="#D99A1F" strokeWidth="2" strokeLinecap="round" />
        <line x1="18.4" y1="18.4" x2="24" y2="24" stroke="#D99A1F" strokeWidth="2" strokeLinecap="round" />
        <line x1="0" y1="26" x2="0" y2="34" stroke="#D99A1F" strokeWidth="2" strokeLinecap="round" />
        <line x1="-18.4" y1="18.4" x2="-24" y2="24" stroke="#D99A1F" strokeWidth="2" strokeLinecap="round" />
        <line x1="-26" y1="0" x2="-34" y2="0" stroke="#D99A1F" strokeWidth="2" strokeLinecap="round" />
        <line x1="-18.4" y1="-18.4" x2="-24" y2="-24" stroke="#D99A1F" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* ─── BATTERY STORAGE (top left area) ─── */}
      <g transform="translate(140, 140)">
        {/* Battery body */}
        <rect x="0" y="0" width="52" height="32" rx="6" stroke="#0F2233" strokeWidth="2" fill="#FFFFFF" fillOpacity="0.9" />
        <rect x="52" y="8" width="6" height="16" rx="2" stroke="#0F2233" strokeWidth="1.6" fill="#0F2233" />
        {/* Battery charge level bars in Sustainable Teal */}
        <rect x="6" y="6" width="12" height="20" rx="2" fill="#156B5C" />
        <rect x="22" y="6" width="12" height="20" rx="2" fill="#156B5C" />
        <rect x="38" y="6" width="8" height="20" rx="2" fill="#0F2233" fillOpacity="0.15" />
      </g>

      {/* ─── MAIN HOUSE (center-right) with solar panels ─── */}
      <g transform="translate(320, 280)">
        {/* House base */}
        <rect x="0" y="30" width="100" height="70" stroke="#0F2233" strokeWidth="2" fill="#FFFFFF" fillOpacity="0.85" strokeLinejoin="round" />
        {/* Roof */}
        <path d="M-10 30 L50 -10 L110 30" stroke="#0F2233" strokeWidth="2.2" fill="#FAF8F2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Door */}
        <rect x="38" y="60" width="24" height="40" stroke="#0F2233" strokeWidth="1.6" fill="#FFFFFF" rx="1" />
        {/* Window left */}
        <rect x="10" y="48" width="18" height="16" stroke="#0F2233" strokeWidth="1.6" fill="#E8F3F1" rx="1" />
        <line x1="19" y1="48" x2="19" y2="64" stroke="#0F2233" strokeWidth="1" />
        <line x1="10" y1="56" x2="28" y2="56" stroke="#0F2233" strokeWidth="1" />
        {/* Window right */}
        <rect x="72" y="48" width="18" height="16" stroke="#0F2233" strokeWidth="1.6" fill="#E8F3F1" rx="1" />
        <line x1="81" y1="48" x2="81" y2="64" stroke="#0F2233" strokeWidth="1" />
        <line x1="72" y1="56" x2="90" y2="56" stroke="#0F2233" strokeWidth="1" />

        {/* Solar panels on roof in Solar Ochre */}
        <g transform="translate(20, -2) rotate(-22)">
          <rect x="0" y="0" width="24" height="14" rx="1" stroke="#D99A1F" strokeWidth="1.6" fill="#FAF4E8" />
          <line x1="8" y1="0" x2="8" y2="14" stroke="#D99A1F" strokeWidth="0.8" />
          <line x1="16" y1="0" x2="16" y2="14" stroke="#D99A1F" strokeWidth="0.8" />
          <line x1="0" y1="7" x2="24" y2="7" stroke="#D99A1F" strokeWidth="0.8" />
        </g>
        <g transform="translate(52, -2) rotate(-22)">
          <rect x="0" y="0" width="24" height="14" rx="1" stroke="#D99A1F" strokeWidth="1.6" fill="#FAF4E8" />
          <line x1="8" y1="0" x2="8" y2="14" stroke="#D99A1F" strokeWidth="0.8" />
          <line x1="16" y1="0" x2="16" y2="14" stroke="#D99A1F" strokeWidth="0.8" />
          <line x1="0" y1="7" x2="24" y2="7" stroke="#D99A1F" strokeWidth="0.8" />
        </g>
      </g>

      {/* ─── SMALLER HOUSE (far right) ─── */}
      <g transform="translate(470, 320)">
        {/* House base */}
        <rect x="0" y="22" width="70" height="55" stroke="#0F2233" strokeWidth="1.8" fill="#FFFFFF" fillOpacity="0.85" strokeLinejoin="round" />
        {/* Roof */}
        <path d="M-6 22 L35 -4 L76 22" stroke="#0F2233" strokeWidth="1.8" fill="#FAF8F2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Door */}
        <rect x="26" y="47" width="18" height="30" stroke="#0F2233" strokeWidth="1.4" fill="#FFFFFF" rx="1" />
        {/* Window */}
        <rect x="8" y="34" width="14" height="12" stroke="#0F2233" strokeWidth="1.4" fill="#E8F3F1" rx="1" />
        <line x1="15" y1="34" x2="15" y2="46" stroke="#0F2233" strokeWidth="0.8" />
        {/* Solar panel on roof */}
        <g transform="translate(22, 2) rotate(-18)">
          <rect x="0" y="0" width="20" height="10" rx="1" stroke="#D99A1F" strokeWidth="1.4" fill="#FAF4E8" />
          <line x1="10" y1="0" x2="10" y2="10" stroke="#D99A1F" strokeWidth="0.7" />
          <line x1="0" y1="5" x2="20" y2="5" stroke="#D99A1F" strokeWidth="0.7" />
        </g>
        {/* Wind turbine on right */}
        <g transform="translate(72, -10)">
          <line x1="0" y1="0" x2="0" y2="35" stroke="#0F2233" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="0" x2="-12" y2="10" stroke="#0F2233" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="0" y1="0" x2="12" y2="10" stroke="#0F2233" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="0" y1="0" x2="0" y2="-14" stroke="#0F2233" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      </g>

      {/* ─── POWER LINES connecting houses in Sustainable Teal ─── */}
      {/* Main house to battery */}
      <path
        d="M320 320 Q 260 280, 200 165"
        stroke="#156B5C"
        strokeWidth="1.6"
        strokeDasharray="6 4"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Main house to smaller house */}
      <path
        d="M420 340 Q 445 340, 470 350"
        stroke="#156B5C"
        strokeWidth="1.6"
        strokeDasharray="6 4"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Battery to sun (energy flow) in Solar Ochre */}
      <path
        d="M192 148 Q 320 100, 455 90"
        stroke="#D99A1F"
        strokeWidth="1.4"
        strokeDasharray="4 6"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* ─── UTILITY POLE (left side) ─── */}
      <g transform="translate(80, 240)">
        <line x1="0" y1="0" x2="0" y2="70" stroke="#0F2233" strokeWidth="2" strokeLinecap="round" />
        <line x1="-14" y1="6" x2="14" y2="6" stroke="#0F2233" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="-10" y1="16" x2="10" y2="16" stroke="#0F2233" strokeWidth="1.6" strokeLinecap="round" />
        {/* Wires from pole */}
        <path d="M14 6 Q 50 30, 130 145" stroke="#747A6C" strokeWidth="1" strokeDasharray="4 5" fill="none" opacity="0.4" />
      </g>

      {/* ─── DECORATIVE CIRCLES (scattered) ─── */}
      <circle cx="130" cy="240" r="5" stroke="#D6D1BE" strokeWidth="1" fill="none" opacity="0.6" />
      <circle cx="260" cy="200" r="4" stroke="#D6D1BE" strokeWidth="1" fill="none" opacity="0.6" />
      <circle cx="400" cy="160" r="6" stroke="#D6D1BE" strokeWidth="1" fill="none" opacity="0.6" />
      <circle cx="300" cy="420" r="5" stroke="#D6D1BE" strokeWidth="1" fill="none" opacity="0.6" />
      <circle cx="530" cy="430" r="4" stroke="#D6D1BE" strokeWidth="1" fill="none" opacity="0.6" />
      <circle cx="180" cy="380" r="3.5" stroke="#D6D1BE" strokeWidth="1" fill="none" opacity="0.6" />
      <circle cx="460" cy="250" r="3" stroke="#D6D1BE" strokeWidth="1" fill="none" opacity="0.6" />

      {/* ─── SMALL FILLED DOT ACCENTS ─── */}
      <circle cx="240" cy="300" r="2" fill="#747A6C" opacity="0.3" />
      <circle cx="500" cy="200" r="2.5" fill="#747A6C" opacity="0.3" />
      <circle cx="350" cy="140" r="2" fill="#747A6C" opacity="0.3" />
      <circle cx="100" cy="180" r="2" fill="#747A6C" opacity="0.3" />
      <circle cx="550" cy="380" r="2" fill="#747A6C" opacity="0.3" />

      {/* ─── TREE/BUSH accents ─── */}
      <g transform="translate(250, 370)" opacity="0.6">
        <line x1="0" y1="0" x2="0" y2="16" stroke="#0F2233" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="0" cy="-4" r="8" stroke="#156B5C" strokeWidth="1.3" fill="#E8F3F1" />
      </g>
      <g transform="translate(460, 390)" opacity="0.55">
        <line x1="0" y1="0" x2="0" y2="12" stroke="#0F2233" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="0" cy="-4" r="6" stroke="#156B5C" strokeWidth="1.2" fill="#E8F3F1" />
      </g>

      {/* ─── GROUND LINE ─── */}
      <path
        d="M60 410 Q 150 400, 250 412 Q 350 420, 450 408 Q 520 400, 580 415"
        stroke="#D6D1BE"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />

    </svg>
  );
}
