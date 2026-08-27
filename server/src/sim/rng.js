// Seeded PRNG (mulberry32) so the simulation is deterministic and
// reproducible across restarts, per CLAUDE.MD §9 ("so demos do not
// randomly break"). Not cryptographic, doesn't need to be.

export function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// One independent, deterministic stream per (seed, key) pair, so e.g. each
// household's noise sequence is reproducible and doesn't perturb another
// household's sequence just because a new household was added.
export function createRngFactory(seed) {
  const streams = new Map()
  return function forKey(key) {
    if (!streams.has(key)) {
      // Cheap string hash to derive a distinct sub-seed per key.
      let h = seed
      for (let i = 0; i < key.length; i++) {
        h = (Math.imul(h, 31) + key.charCodeAt(i)) | 0
      }
      streams.set(key, mulberry32(h))
    }
    return streams.get(key)
  }
}

// Symmetric noise in [-amplitude, +amplitude].
export function noise(rng, amplitude) {
  return (rng() * 2 - 1) * amplitude
}
