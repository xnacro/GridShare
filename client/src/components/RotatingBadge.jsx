import { ArrowUpRightIcon } from './icons.jsx'

// A slowly rotating circular text badge, echoing the reference layout's
// rotating "shop now" badge. Doubles as a data-integrity label per
// CLAUDE.md §15 by default: it says the data is simulated, not just decoration.
export default function RotatingBadge({ text = 'SIMULATED DEMO • LIVE PREVIEW • ', pathId = 'hero-badge-path', className = '' }) {
  return (
    <div className={`relative flex h-28 w-28 items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full animate-spin text-foreground/60"
        style={{ animationDuration: '18s' }}
      >
        <path id={pathId} fill="none" d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
        <text fontSize="7" letterSpacing="1.5" fill="currentColor">
          <textPath href={`#${pathId}`} startOffset="0%">
            {text}
          </textPath>
        </text>
      </svg>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <ArrowUpRightIcon className="h-4 w-4" />
      </span>
    </div>
  )
}
