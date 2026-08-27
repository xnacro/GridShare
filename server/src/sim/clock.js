import { EventEmitter } from 'node:events'
import { TICK_INTERVAL_MS, DEFAULT_SPEED_MULTIPLIER } from '../config/constants.js'

// Matches the original mock's trend window (batterySocTrend etc. start at
// 8 AM and run to 12:30 PM), so a fresh simulation ramps into the same
// demo scenario rather than starting cold at midnight.
const START_HOUR = 8

// Simulated wall clock: pause/resume/setSpeed/setHour, CLAUDE.MD §9 ("live
// mode, accelerated time, pause/resume, reset, optionally jumping to a
// useful demo period"). Emits 'tick' with the simulated hours elapsed since
// the previous tick (0 while paused).
export class SimClock extends EventEmitter {
  constructor({ tickIntervalMs = TICK_INTERVAL_MS, speedMultiplier = DEFAULT_SPEED_MULTIPLIER } = {}) {
    super()
    this.tickIntervalMs = tickIntervalMs
    this.speedMultiplier = speedMultiplier
    this.simHour = START_HOUR
    this.isPaused = false
    this._timer = null
  }

  get status() {
    return {
      mode: this.isPaused ? 'paused' : 'running',
      simHour: this.simHour,
      speedMultiplier: this.speedMultiplier,
    }
  }

  start() {
    if (this._timer) return
    this._timer = setInterval(() => this._advance(), this.tickIntervalMs)
    this._timer.unref?.()
  }

  stop() {
    clearInterval(this._timer)
    this._timer = null
  }

  pause() {
    this.isPaused = true
  }

  resume() {
    this.isPaused = false
  }

  setSpeed(multiplier) {
    if (typeof multiplier === 'number' && Number.isFinite(multiplier) && multiplier > 0) {
      this.speedMultiplier = multiplier
    }
  }

  setHour(hour) {
    this.simHour = ((hour % 24) + 24) % 24
  }

  // Advances the clock without waiting for the interval, used by reset()
  // and tests that need a deterministic tick rather than a real 2s wait.
  tick() {
    this._advance()
  }

  _advance() {
    if (this.isPaused) {
      this.emit('tick', 0)
      return
    }
    const dtHours = (this.tickIntervalMs / 3_600_000) * this.speedMultiplier
    this.simHour = (this.simHour + dtHours) % 24
    this.emit('tick', dtHours)
  }
}

export { START_HOUR }
