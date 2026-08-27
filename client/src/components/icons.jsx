// Minimal inline icon set. No icon library dependency: each is a single
// stroke-based SVG path sized to inherit color via currentColor, so the
// same icon works inside any color-soft badge.

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function SunIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

export function BoltIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  )
}

export function ScaleIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v18M8 21h8M6 7l-3 6a3 3 0 0 0 6 0l-3-6ZM18 7l-3 6a3 3 0 0 0 6 0l-3-6ZM3 7h18M12 3l3 4H9l3-4Z" />
    </svg>
  )
}

export function LeafIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M20 4c-8 0-16 4-16 14 10 0 14-8 14-14Z" />
      <path d="M5 19c2-4 6-8 12-11" />
    </svg>
  )
}

export function BatteryIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="2" y="7" width="17" height="10" rx="2" />
      <path d="M22 10v4" />
      <path d="M6 10v4M10 10v4M14 10v4" />
    </svg>
  )
}

export function SwapIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8h13l-3-3M20 16H7l3 3" />
    </svg>
  )
}

export function CloudIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 18a4 4 0 1 1 .8-7.93A5 5 0 0 1 17 12h.5a3.5 3.5 0 0 1 0 7H7Z" />
    </svg>
  )
}

export function TagIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 11V4h7l10 10-7 7L3 11Z" />
      <circle cx="7.5" cy="7.5" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ArrowUpRightIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  )
}

export function MenuIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}
