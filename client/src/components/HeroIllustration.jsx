// Hand-drawn line-art illustration for the Dashboard hero: a solar-panelled
// house, a community battery, a grid pylon, and a few network nodes
// representing neighboring households, in the same spirit as the pitch
// deck's title-slide iconography. Pure stroke/fill in currentColor and the
// theme tokens, so it matches light and dark mode automatically.

export default function HeroIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 480 400" className={className} role="img" aria-label="Illustration of a solar-powered home connected to a community battery, neighboring households, and the grid">
      {/* ground */}
      <path d="M10 344 Q240 366 470 344" className="text-border" stroke="currentColor" strokeWidth="2" fill="none" />

      {/*
        Network links, nodes, and the battery all stay clear of the
        bottom-left corner (roughly x<180, y>300): the Dashboard overlaps a
        floating stat card there, on top of the illustration.
      */}
      <g className="text-foreground/25" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" fill="none">
        <path d="M270 245 L70 190" />
        <path d="M300 250 L430 195" />
        <path d="M280 300 L230 360" />
        <path d="M240 265 L330 300" />
        <path d="M310 235 L455 230" />
      </g>

      {/* flow dots along the active surplus paths */}
      <g className="text-accent-vivid" fill="currentColor">
        <circle cx="210" cy="228" r="3.5" />
        <circle cx="150" cy="212" r="3.5" />
        <circle cx="365" cy="232" r="3.5" />
        <circle cx="405" cy="231" r="3.5" />
      </g>

      {/* neighboring household nodes */}
      <g className="text-foreground/40" stroke="currentColor" strokeWidth="1.5" fill="none">
        <circle cx="70" cy="190" r="7" />
        <circle cx="430" cy="195" r="7" />
        <circle cx="330" cy="300" r="7" />
        <circle cx="230" cy="360" r="7" />
      </g>

      {/* grid pylon */}
      <g className="text-foreground/40" stroke="currentColor" strokeWidth="1.5" fill="none">
        <path d="M455 150 L455 250" />
        <path d="M438 175 L472 175" />
        <path d="M442 205 L468 205" />
        <path d="M455 250 L435 290 M455 250 L475 290" />
      </g>

      {/* community battery */}
      <g>
        <rect x="34" y="104" width="72" height="42" rx="7" className="text-foreground/40" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="106" y="117" width="9" height="16" rx="2" className="text-foreground/40" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="42" y="114" width="18" height="22" rx="2" className="text-accent-vivid" fill="currentColor" />
        <rect x="64" y="114" width="18" height="22" rx="2" className="text-accent-vivid/40" fill="currentColor" />
      </g>

      {/* house */}
      <g className="text-foreground/50" stroke="currentColor" strokeWidth="1.75" fill="none">
        <rect x="188" y="232" width="164" height="112" rx="4" />
        <path d="M178 232 L270 174 L362 232" />
        <rect x="252" y="288" width="32" height="56" />
        <rect x="206" y="252" width="24" height="24" />
      </g>

      {/* roof solar panels */}
      <g className="text-accent-vivid" fill="currentColor">
        <path d="M188 228 L214 212 L222 224 L196 240 Z" />
        <path d="M211 210 L237 194 L245 206 L219 222 Z" />
        <path d="M234 192 L260 176 L268 188 L242 204 Z" />
      </g>

      {/* sun */}
      <g className="text-accent-vivid" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
        <circle cx="404" cy="72" r="24" />
        <path d="M404 26v14M404 104v14M358 72h14M436 72h14M370 38l10 10M428 96l10 10M438 38l-10 10M380 96l-10 10" />
      </g>
    </svg>
  )
}
