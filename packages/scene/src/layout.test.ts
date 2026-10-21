import { describe, expect, it } from 'vitest'
import {
  DOOR,
  fitWorld,
  GROUND,
  HOUSE,
  intersects,
  MARQUEE,
  MAX_ROOMS,
  SHOPFRONTS,
  windowSlots,
  WORLD,
} from './layout'

describe('windowSlots', () => {
  const slots = windowSlots()

  it('has a window for every room', () => {
    expect(slots).toHaveLength(MAX_ROOMS)
    expect(slots.map((s) => s.index)).toEqual([...Array(MAX_ROOMS).keys()])
  })

  it('keeps every window on the facade', () => {
    for (const s of slots) {
      expect(s.x).toBeGreaterThan(HOUSE.x)
      expect(s.x + s.width).toBeLessThan(HOUSE.x + HOUSE.width)
      expect(s.y).toBeGreaterThan(HOUSE.y)
      expect(s.y + s.height).toBeLessThan(MARQUEE.y)
    }
  })

  it('never overlaps two windows, or a window and the sign/door', () => {
    for (const a of slots) {
      for (const b of slots) if (a !== b) expect(intersects(a, b)).toBe(false)
      expect(intersects(a, MARQUEE)).toBe(false)
      expect(intersects(a, DOOR)).toBe(false)
    }
  })

  it('gives the middle floor rails and the others a full balcony', () => {
    expect(slots.filter((s) => s.balcony === 'rail').every((s) => s.row === 1)).toBe(true)
    expect(slots.filter((s) => s.balcony === 'continuous')).toHaveLength(8)
  })

  it('keeps the shopfronts clear of the door and the sign', () => {
    for (const shop of SHOPFRONTS) {
      expect(intersects(shop, DOOR)).toBe(false)
      expect(intersects(shop, MARQUEE)).toBe(false)
      expect(shop.y + shop.height).toBeLessThanOrEqual(GROUND)
    }
  })
})

describe('fitWorld', () => {
  it('keeps every window on screen at common sizes', () => {
    for (const [w, h] of [
      [1920, 1080],
      [1440, 900],
      [1280, 720],
      [2560, 1080],
      [800, 1000],
    ] as const) {
      const fit = fitWorld(w, h)
      const left = fit.x + HOUSE.x * fit.scale
      const right = fit.x + (HOUSE.x + HOUSE.width) * fit.scale
      expect(left).toBeGreaterThanOrEqual(0)
      expect(right).toBeLessThanOrEqual(w)
      for (const s of windowSlots()) {
        expect(fit.y + s.y * fit.scale).toBeGreaterThanOrEqual(0)
        expect(fit.y + (s.y + s.height) * fit.scale).toBeLessThanOrEqual(h)
      }
      // the street is in frame
      expect(fit.y + GROUND * fit.scale).toBeLessThan(h)
    }
  })

  it('never shows past the bottom of the world', () => {
    for (const [w, h] of [
      [1000, 1400],
      [1920, 1080],
      [600, 1200],
    ] as const) {
      const fit = fitWorld(w, h)
      expect(fit.y + WORLD.height * fit.scale).toBeGreaterThanOrEqual(h - 0.001)
    }
  })
})
