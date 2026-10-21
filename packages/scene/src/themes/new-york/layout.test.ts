import { describe, expect, it } from 'vitest'
import { GROUND, gridSlots, intersects, MAX_ROOMS } from '../../layout'
import { NY_DOOR, NY_GRID, NY_HOUSE, NY_MARQUEE, PARLOR, TREES } from './layout'

describe('new york brownstone', () => {
  const slots = gridSlots(NY_GRID)

  it('is three across and four high', () => {
    expect(slots).toHaveLength(MAX_ROOMS)
    expect(new Set(slots.map((s) => s.col)).size).toBe(3)
    expect(new Set(slots.map((s) => s.row)).size).toBe(4)
  })

  it('keeps every room on the facade, above the parlor floor', () => {
    for (const s of slots) {
      expect(s.x).toBeGreaterThan(NY_HOUSE.x)
      expect(s.x + s.width).toBeLessThan(NY_HOUSE.x + NY_HOUSE.width)
      expect(s.y + s.height).toBeLessThan(PARLOR.top)
    }
  })

  it('never puts the sign or the door over a room', () => {
    for (const s of slots) {
      expect(intersects(s, NY_MARQUEE)).toBe(false)
      expect(intersects(s, NY_DOOR)).toBe(false)
    }
    expect(NY_DOOR.y + NY_DOOR.height).toBeLessThanOrEqual(GROUND)
  })

  it('keeps the street trees off our windows', () => {
    for (const t of TREES) {
      // crowns are roughly 270 units wide at scale 1
      const reach = 270 * t.scale
      const overlaps = t.x + reach > NY_HOUSE.x && t.x - reach < NY_HOUSE.x + NY_HOUSE.width
      expect(overlaps).toBe(false)
    }
  })
})
