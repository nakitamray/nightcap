import { type Ctx } from './context'
import { shade, THIN } from './paint'
import { flat, project, type P3 } from './projection'

// Notes that came under the door: folded slips lying on the floor just
// inside it, nearest the camera. Click them to read.

const PAPER = 0xf2e2bd

/** where each slip lands, and how far it's skewed */
const SLIPS: [x: number, z: number, skew: number][] = [
  [-118, 150, 0.25],
  [-86, 160, -0.35],
  [-140, 168, 0.6],
]

export function drawNotes(ctx: Ctx, count: number) {
  if (count <= 0) return
  const g = ctx.layer('notes')
  const shown = SLIPS.slice(0, Math.min(count, SLIPS.length)).reverse()
  for (const [i, [x, z, skew]] of shown.entries()) {
    // a slip lying flat, folded in half: two panels meeting at a crease
    const corner = (dx: number, dz: number): P3 => [
      x + dx * Math.cos(skew) - dz * Math.sin(skew),
      0.5,
      z + dx * Math.sin(skew) + dz * Math.cos(skew),
    ]
    const w = 26
    const d = 20
    // folded and not quite flat: the crease stands up like a little tent
    const crease = (dx: number): P3 => {
      const [cx, , cz] = corner(dx, 0)
      return [cx, 9, cz]
    }
    g.poly(flat(corner(-w, d), corner(w, d), crease(w), crease(-w)))
      .fill(shade(PAPER, -0.18))
      .stroke(THIN)
    g.poly(flat(corner(-w, -d), corner(w, -d), crease(w), crease(-w)))
      .fill(PAPER)
      .stroke(THIN)
    // a line or two of writing showing through
    g.poly(flat(corner(-w * 0.6, -d * 0.45), corner(w * 0.4, -d * 0.45)), false).stroke({
      color: 0x5a3420,
      width: 1,
      alpha: 0.5,
    })
    // a wax seal on the top one
    if (i === shown.length - 1) {
      const [sx, sy] = project(corner(0, -d * 0.7))
      g.circle(sx, sy, 3.2)
        .fill(0xa8201a)
        .stroke({ ...THIN, width: 0.6 })
    }
  }
  // just enough light to notice them
  ctx.pool([-112, 0, 158], 70, 0.2)
  ctx.hit('notes', (h) => {
    const a = project([-170, 0, 128])
    const b = project([-55, 0, 128])
    const c = project([-55, 0, 190])
    const e = project([-170, 0, 190])
    h.poly([...a, ...b, ...c, ...e])
  })
}
