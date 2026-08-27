import { ArrowUpRightIcon, BatteryIcon, ScaleIcon, SwapIcon } from './icons.jsx'

// Shared taxonomy for what an engine event or recommendation *does*: trade
// locally, charge the battery, or export to the grid. Reused wherever a
// kind needs an icon or a tone (Dashboard's Recommendations and Recent
// activity cards, the Recommendations page) so the same icon and color
// always mean the same thing across the app.
export const TONE_CLASSES = {
  accent: 'bg-accent-soft text-accent-soft-foreground',
  success: 'bg-success-soft text-success-soft-foreground',
  danger: 'bg-danger-soft text-danger-soft-foreground',
  default: 'bg-default-soft text-default-soft-foreground',
}

export const KIND_ICONS = { trade: SwapIcon, battery: BatteryIcon, export: ArrowUpRightIcon, alert: ScaleIcon }
export const KIND_TONES = { trade: 'accent', battery: 'success', export: 'default', alert: 'danger' }
