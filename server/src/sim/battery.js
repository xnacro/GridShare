// A charge/discharge-rate-limited, capacity- and reserve-bounded battery.
// Used for both the community battery and any household's own battery
// (CLAUDE.MD §9: "battery should track capacity, state of charge,
// charge/discharge power, reserve percentage").
export class Battery {
  constructor({ capacityKwh, initialSocKwh, reservePct, maxChargeRateKw, maxDischargeRateKw }) {
    this.capacityKwh = capacityKwh
    this.socKwh = clamp(initialSocKwh, 0, capacityKwh)
    this.reservePct = reservePct
    this.maxChargeRateKw = maxChargeRateKw
    this.maxDischargeRateKw = maxDischargeRateKw
  }

  get reserveKwh() {
    return (this.reservePct / 100) * this.capacityKwh
  }

  get headroomKwh() {
    return Math.max(this.capacityKwh - this.socKwh, 0)
  }

  get availableKwh() {
    return Math.max(this.socKwh - this.reserveKwh, 0)
  }

  get socPct() {
    return this.capacityKwh > 0 ? (this.socKwh / this.capacityKwh) * 100 : 0
  }

  // Charges by up to requestedKwh, bounded by rate*dtHours and headroom.
  // Returns the amount actually stored.
  charge(requestedKwh, dtHours = 1) {
    const bounded = Math.min(
      Math.max(requestedKwh, 0),
      this.maxChargeRateKw * dtHours,
      this.headroomKwh,
    )
    this.socKwh = clamp(this.socKwh + bounded, 0, this.capacityKwh)
    return bounded
  }

  // Discharges by up to requestedKwh, bounded by rate*dtHours and the
  // energy available above the reserve floor. Returns the amount actually
  // drawn.
  discharge(requestedKwh, dtHours = 1) {
    const bounded = Math.min(
      Math.max(requestedKwh, 0),
      this.maxDischargeRateKw * dtHours,
      this.availableKwh,
    )
    this.socKwh = clamp(this.socKwh - bounded, 0, this.capacityKwh)
    return bounded
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}
