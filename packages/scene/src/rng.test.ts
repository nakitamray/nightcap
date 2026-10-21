import { describe, expect, it } from 'vitest'
import { createRng, hashString, int, pick } from './rng'

describe('rng', () => {
  it('is deterministic for a seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    for (let i = 0; i < 50; i++) expect(a()).toBe(b())
  })

  it('stays in [0, 1)', () => {
    const r = createRng(7)
    for (let i = 0; i < 10_000; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('int() is inclusive on both ends', () => {
    const r = createRng(3)
    const seen = new Set<number>()
    for (let i = 0; i < 2000; i++) seen.add(int(r, 1, 4))
    expect([...seen].sort()).toEqual([1, 2, 3, 4])
  })

  it('pick() throws on an empty list instead of returning undefined', () => {
    expect(() => pick(createRng(1), [])).toThrow()
  })

  it('hashes the same string the same way', () => {
    expect(hashString('dev')).toBe(hashString('dev'))
    expect(hashString('dev')).not.toBe(hashString('ved'))
  })
})
