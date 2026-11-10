import { describe, expect, it } from 'vitest'
import { THEME_IDS } from '../themes/types'
import { planLounge } from './plan'

describe('planLounge', () => {
  it('has room for the whole house, twelve people', () => {
    for (const theme of THEME_IDS) {
      const plan = planLounge(theme, 'house-1')
      expect(plan.seats.length).toBeGreaterThanOrEqual(12)
    }
  })

  it('never puts two people in the same place', () => {
    for (const theme of THEME_IDS) {
      for (const seed of ['a', 'b', 'c', 'd']) {
        const seats = planLounge(theme, seed).seats
        for (let i = 0; i < seats.length; i++)
          for (let j = i + 1; j < seats.length; j++) {
            const a = seats[i]!
            const b = seats[j]!
            expect(Math.hypot(a.x - b.x, a.z - b.z), `${theme} ${seed} ${i}/${j}`).toBeGreaterThan(
              40,
            )
          }
      }
    }
  })

  it('keeps everyone inside the walls', () => {
    for (const theme of THEME_IDS) {
      const plan = planLounge(theme, 'x')
      for (const s of plan.seats) {
        expect(Math.abs(s.x)).toBeLessThan(plan.half - 40)
        expect(s.z).toBeGreaterThan(0)
        expect(s.z).toBeLessThan(400)
      }
    }
  })

  it('is the same every visit, and different from house to house', () => {
    expect(planLounge('paris', 'h1')).toEqual(planLounge('paris', 'h1'))
    const looks = new Set(
      ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((h) => {
        const p = planLounge('paris', h)
        return `${p.wall}:${p.sofa}:${p.books}:${p.coffee}:${p.rugs[0]!.pattern}`
      }),
    )
    expect(looks.size).toBeGreaterThan(3)
  })

  it('looks different in every city', () => {
    const floors = new Set(THEME_IDS.map((t) => planLounge(t, 'h').floor))
    expect(floors.size).toBe(THEME_IDS.length)
  })
})
