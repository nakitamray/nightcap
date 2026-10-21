// mulberry32 -- small, fast, and good enough for scattering stars and bricks.
// Everything in the scene is seeded so the street looks the same on every load.
export type Rng = () => number

export function createRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function range(rng: Rng, min: number, max: number) {
  return min + rng() * (max - min)
}

export function int(rng: Rng, min: number, max: number) {
  return Math.floor(range(rng, min, max + 1))
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  const item = items[Math.floor(rng() * items.length)]
  if (item === undefined) throw new Error('pick() from an empty list')
  return item
}

export function chance(rng: Rng, p: number) {
  return rng() < p
}

// string -> 32 bit seed, so a resident's id always gets the same room
export function hashString(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
