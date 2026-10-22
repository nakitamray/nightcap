import { describe, expect, it } from 'vitest'
import { defaultLayout } from './layout'
import { canAdd, planRoom } from './plan'
import { VARIANTS } from './variants'

const overlaps = (a: { z0: number; z1: number }, b: { z0: number; z1: number }) =>
  a.z0 < b.z1 && b.z0 < a.z1
const boxesOverlap = (
  a: { x0: number; x1: number; z0: number; z1: number },
  b: { x0: number; x1: number; z0: number; z1: number },
) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1

describe('planRoom', () => {
  it('gives every one of the twelve rooms its own set of things and its own shape', () => {
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
    expect(new Set(VARIANTS.map((v) => `${v.half}x${v.height}`)).size).toBeGreaterThan(8)
  })

  it('never puts two things in the same spot', () => {
    for (let room = 0; room < 12; room++) {
      for (const spot of ['right', 'window'] as const) {
        for (const wall of ['left', 'right'] as const) {
          const d = defaultLayout(room)
          const l = {
            ...d,
            furniture: ['bookcase', 'beanbag', 'lounger'] as const,
            bed: { ...d.bed, spot },
            desk: { wall, color: '#000000' },
          }
          const plan = planRoom({ ...l, furniture: [...l.furniture] }, room)
          const pieces = plan.pieces
          for (let i = 0; i < pieces.length; i++) {
            for (let j = i + 1; j < pieces.length; j++) {
              const a = pieces[i]!.zone
              const b = pieces[j]!.zone
              expect(a.wall === b.wall && a.inset === b.inset && overlaps(a, b)).toBe(false)
            }
          }
          // nothing in the desk's spot, and the nightstand clear of the bed, desk and low shelf
          expect(pieces.some((p) => p.zone.wall === wall && p.zone.name === 'mid')).toBe(false)
          const ns = plan.nightstand
          expect(boxesOverlap(ns, plan.bed)).toBe(false)
          if (plan.lowShelf) expect(boxesOverlap(ns, plan.lowShelf)).toBe(false)
          if (plan.desk.wall === 'right') expect(overlaps(plan.desk, ns)).toBe(false)
        }
      }
    }
  })

  it('puts your furniture in before the room’s own things', () => {
    const plan = planRoom({ ...defaultLayout(1), furniture: ['bookcase', 'bookcase'] }, 1)
    expect(plan.pieces.filter((p) => p.mine).length).toBe(2)
  })

  it('has floor out in the room for soft things only in the wide rooms', () => {
    for (let room = 0; room < 12; room++) {
      const plan = planRoom(defaultLayout(room), room)
      const floor = plan.free.some((z) => z.name === 'floor')
      expect(floor).toBe(plan.half >= 220)
    }
  })

  it('stops offering furniture once the floor is full', () => {
    const plan = planRoom(
      {
        ...defaultLayout(6),
        furniture: ['bookcase', 'bookcase', 'bookcase', 'bookcase', 'bookcase'],
      },
      6,
    )
    expect(canAdd(plan, 'bookcase')).toBe(false)
  })

  it('keeps posters off the wall behind a bookcase (above it is fine)', () => {
    for (let room = 0; room < 12; room++) {
      const plan = planRoom(
        { ...defaultLayout(room), furniture: ['bookcase', 'bookcase', 'bookcase'] },
        room,
      )
      for (const p of plan.pieces.filter((x) => x.kind === 'bookcase')) {
        for (const s of plan.posters.filter((x) => x.y0 < plan.height - 100))
          expect(s.wall === p.zone.wall && overlaps(s, p.zone)).toBe(false)
      }
    }
  })

  it('keeps every window out of the ceiling and clear of the walls', () => {
    for (let room = 0; room < 12; room++) {
      const plan = planRoom(defaultLayout(room), room)
      expect(plan.pane.top).toBeLessThanOrEqual(plan.height - 60)
      expect(plan.pane.reach).toBeLessThan(plan.half - 40)
    }
  })
})
