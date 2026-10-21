import { describe, expect, it } from 'vitest'
import { defaultLayout } from './layout'
import { planRoom } from './plan'
import { VARIANTS } from './variants'

const overlaps = (a: { z0: number; z1: number }, b: { z0: number; z1: number }) =>
  a.z0 < b.z1 && b.z0 < a.z1

describe('planRoom', () => {
  it('gives every one of the twelve rooms its own set of things', () => {
    const seen = new Set(
      VARIANTS.map((_, i) => {
        const p = planRoom(defaultLayout(i), i)
        return JSON.stringify([
          p.variant.glazing,
          p.variant.desk,
          p.variant.shelf,
          p.pieces.map((x) => x.kind),
        ])
      }),
    )
    expect(seen.size).toBe(12)
  })

  it('never puts two things in the same spot', () => {
    for (let room = 0; room < 12; room++) {
      for (const spot of ['right', 'window'] as const) {
        for (const wall of ['left', 'right'] as const) {
          const l = {
            ...defaultLayout(room),
            shelves: 3,
            bed: { ...defaultLayout(room).bed, spot },
            desk: { wall, color: '#000000' },
          }
          const plan = planRoom(l, room)
          const pieces = plan.pieces
          for (let i = 0; i < pieces.length; i++) {
            for (let j = i + 1; j < pieces.length; j++) {
              const a = pieces[i]!.zone
              const b = pieces[j]!.zone
              expect(a.wall === b.wall && overlaps(a, b)).toBe(false)
            }
          }
          // nothing in the desk's spot
          expect(pieces.some((p) => p.zone.wall === wall && p.zone.name === 'mid')).toBe(false)
        }
      }
    }
  })

  it('puts your bookcases in before the room’s own things', () => {
    const plan = planRoom({ ...defaultLayout(1), shelves: 2 }, 1)
    expect(plan.pieces.filter((p) => p.kind === 'bookcase').length).toBe(2)
  })

  it('keeps posters off the wall behind a bookcase (above it is fine)', () => {
    for (let room = 0; room < 12; room++) {
      const plan = planRoom({ ...defaultLayout(room), shelves: 3 }, room)
      for (const p of plan.pieces.filter((x) => x.kind === 'bookcase')) {
        for (const s of plan.posters.filter((x) => x.y0 < 340))
          expect(s.wall === p.zone.wall && overlaps(s, p.zone)).toBe(false)
      }
    }
  })

  it('always has somewhere for posters', () => {
    for (let room = 0; room < 12; room++)
      expect(planRoom(defaultLayout(room), room).posters.length).toBeGreaterThan(2)
  })
})
