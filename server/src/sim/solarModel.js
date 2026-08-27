import { noise } from './rng.js'

// Bell-curve solar output between sunrise and sunset, peaking at solar noon.
// Normalized to exactly 1.0 at DEMO_HOUR_OF_DAY (12:30 PM) so a household's
// installedKwp can be calibrated directly against the reference scenario in
// CLAUDE.MD §8. hourOfDay is fractional (12.5 == 12:30 PM).
const SUNRISE = 6
const SUNSET = 18
const SOLAR_NOON = 12.5

export function solarCurve(hourOfDay) {
  if (hourOfDay <= SUNRISE || hourOfDay >= SUNSET) return 0
  const span = SUNSET - SUNRISE
  const raw = Math.cos(((hourOfDay - SOLAR_NOON) / span) * Math.PI)
  return Math.max(raw, 0) ** 1.2
}

// installedKwp: nameplate capacity, 0 for a household with no solar.
// weatherFactor: 1.0 = clear sky, lower = cloud cover, per CLAUDE.MD §9
// ("solar generation should vary by... weather condition").
export function generationKw({ installedKwp, hourOfDay, rng, weatherFactor = 1 }) {
  if (installedKwp <= 0) return 0
  const base = installedKwp * solarCurve(hourOfDay) * weatherFactor
  const withNoise = base * (1 + noise(rng, 0.04))
  return Math.max(withNoise, 0)
}
