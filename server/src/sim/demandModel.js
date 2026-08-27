import { noise } from './rng.js'

// Two-hump residential load shape (morning + evening peaks, a midday dip,
// an overnight floor), same idea CLAUDE.MD §9 asks for ("consumption should
// vary by household type, time of day, configurable demand profile").
// Not normalized to 1 anywhere in particular; household.js calibrates each
// household's baseLoadKw against this curve's actual value at the demo hour.
function gaussianBump(hourOfDay, center, widthHours, amplitude) {
  const d = hourOfDay - center
  return amplitude * Math.exp(-(d * d) / (2 * widthHours * widthHours))
}

const NIGHT_FLOOR = 0.28

export function residentialCurve(hourOfDay) {
  return (
    NIGHT_FLOOR +
    gaussianBump(hourOfDay, 8, 2.2, 0.85) +
    gaussianBump(hourOfDay, 19, 2.5, 1.0)
  )
}

// EV households add a distinct overnight charging bump on top of the
// ordinary residential shape, per the "EV Household" archetype.
export function evCurve(hourOfDay) {
  return residentialCurve(hourOfDay) + gaussianBump(hourOfDay, 22, 1.8, 1.4)
}

export function demandCurve(hourOfDay, profile) {
  return profile === 'ev' ? evCurve(hourOfDay) : residentialCurve(hourOfDay)
}

// baseLoadKw: household's calibrated scale factor (see household.js).
export function consumptionKw({ baseLoadKw, hourOfDay, profile, rng }) {
  const base = baseLoadKw * demandCurve(hourOfDay, profile)
  const withNoise = base * (1 + noise(rng, 0.05))
  return Math.max(withNoise, 0.05)
}
