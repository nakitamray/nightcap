import { describe, expect, it } from 'vitest'
import { GROUND, intersects, MAX_ROOMS } from '../../layout'
import {
  CORE,
  GARAGE_DOOR,
  GARAGE_WING,
  LEVELS,
  SD_DOOR,
  SD_HOUSE,
  SD_MARQUEE,
  sdSlots,
  TERRACE_WING,
} from './layout'

describe('the san diego house', () => {
  const slots = sdSlots()

  it('has twelve rooms, numbered in order', () => {
    expect(slots).toHaveLength(MAX_ROOMS)
    expect(slots.map((s) => s.index)).toEqual([...Array(MAX_ROOMS).keys()])
  })

  it('keeps every window on a wall, clear of its neighbours', () => {
    const parts = [CORE, GARAGE_WING, TERRACE_WING]
    for (const s of slots) {
      const wall = parts.find((p) => s.x >= p.x && s.x + s.width <= p.x + p.width)
      expect(wall, `window ${s.index}`).toBeDefined()
      expect(s.y).toBeGreaterThan(wall!.y)
      expect(s.y + s.height).toBeLessThan(GROUND)
    }
    for (const a of slots)
      for (const b of slots) {
        if (a.index >= b.index) continue
        const grown = { x: a.x - 12, y: a.y - 20, width: a.width + 24, height: a.height + 30 }
        expect(intersects(grown, b), `${a.index} and ${b.index}`).toBe(false)
      }
  })

  it('keeps the windows clear of the door, the sign and the garage', () => {
    for (const s of slots) {
      expect(intersects(s, SD_DOOR)).toBe(false)
      expect(intersects(s, SD_MARQUEE)).toBe(false)
      expect(intersects(s, GARAGE_DOOR)).toBe(false)
    }
  })

  it('stacks its storeys from the pavement up', () => {
    expect(LEVELS.third).toBeLessThan(LEVELS.second)
    expect(LEVELS.second).toBeLessThan(LEVELS.ground)
    expect(SD_DOOR.y + SD_DOOR.height).toBe(GROUND)
    expect(GARAGE_DOOR.y + GARAGE_DOOR.height).toBe(GROUND)
    expect(SD_HOUSE.x + SD_HOUSE.width).toBe(TERRACE_WING.x + TERRACE_WING.width)
  })
})
