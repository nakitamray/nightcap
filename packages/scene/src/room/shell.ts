import { Graphics } from 'pixi.js'
import { range } from '../rng'
import type { Ctx } from './context'
import { block, fillPoly, hex, INK, mix, shade, THIN } from './paint'
import { flat, NEAR, ROOM, type P3 } from './projection'

const { left: L, right: R, ceiling: C, back: B } = ROOM
const PLASTER = 0xe8b070
const FLOOR = 0x8a4524

type Wall = 'back' | 'left' | 'right'

/** wall coordinates (u across, v up) to room space */
function w(wall: Wall, u: number, v: number): P3 {
  if (wall === 'back') return [u, v, B]
  return [wall === 'left' ? L + 0.3 : R - 0.3, v, u]
}

function span(wall: Wall): [number, number] {
  return wall === 'back' ? [L, R] : [NEAR, B]
}

/** a lumpy blob on a wall, for patches of damp and peeled paint */
function blob(ctx: Ctx, wall: Wall, u: number, v: number, ru: number, rv: number) {
  const pts: P3[] = []
  const n = 11
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const k = 0.7 + ctx.rng() * 0.5
    pts.push(w(wall, u + Math.cos(a) * ru * k, v + Math.sin(a) * rv * k))
  }
  return flat(...pts)
}

export function drawShell(ctx: Ctx) {
  const wall = hex(ctx.layout.wall)
  const g = ctx.layer('wall')

  // ceiling, side walls, back wall
  fillPoly(g, flat([L, C, NEAR], [R, C, NEAR], [R, C, B], [L, C, B]), shade(wall, -0.55), null)
  fillPoly(g, flat([L, 0, NEAR], [L, 0, B], [L, C, B], [L, C, NEAR]), shade(wall, -0.12), null)
  fillPoly(g, flat([R, 0, NEAR], [R, 0, B], [R, C, B], [R, C, NEAR]), shade(wall, -0.2), null)
  fillPoly(g, flat([L, 0, B], [R, 0, B], [R, C, B], [L, C, B]), wall, null)

  // old plaster: damp patches, scuffs, and bits where the paint has come
  // away and the warm plaster underneath shows through
  for (const side of ['back', 'left', 'right'] as Wall[]) {
    const [u0, u1] = span(side)
    const base = side === 'back' ? wall : shade(wall, side === 'left' ? -0.12 : -0.2)
    for (let i = 0; i < 9; i++) {
      const u = range(ctx.rng, u0 + 20, u1 - 20)
      const v = range(ctx.rng, 20, C - 30)
      g.poly(blob(ctx, side, u, v, range(ctx.rng, 14, 40), range(ctx.rng, 10, 34))).fill({
        color: i % 3 ? shade(base, -0.25) : shade(base, 0.18),
        alpha: range(ctx.rng, 0.18, 0.4),
      })
    }
    for (let i = 0; i < 4; i++) {
      const u = range(ctx.rng, u0 + 30, u1 - 30)
      const v = range(ctx.rng, 30, C - 50)
      const pts = blob(ctx, side, u, v, range(ctx.rng, 6, 16), range(ctx.rng, 4, 12))
      g.poly(pts).fill(mix(PLASTER, base, 0.25))
      g.poly(pts).stroke({ ...THIN, alpha: 0.45 })
    }
    // long vertical drips and grain
    for (let i = 0; i < 26; i++) {
      const u = range(ctx.rng, u0, u1)
      const top = range(ctx.rng, 40, C)
      g.poly(flat(w(side, u, top), w(side, u, top - range(ctx.rng, 30, 140))), false).stroke({
        color: shade(base, -0.4),
        width: range(ctx.rng, 0.6, 1.6),
        alpha: 0.3,
      })
    }
  }

  // picture rail, crown and skirting all the way round
  const rail = shade(wall, 0.22)
  const ring = (y: number): P3[] => [
    [L, y, NEAR],
    [L, y, B],
    [R, y, B],
    [R, y, NEAR],
  ]
  g.poly(flat(...ring(232)), false).stroke({ color: rail, width: 3 })
  g.poly(flat(...ring(232)), false).stroke({ ...THIN, alpha: 0.5 })
  g.poly(flat(...ring(C - 6)), false).stroke({ color: shade(wall, 0.3), width: 5 })
  for (const side of [L, R]) {
    fillPoly(
      g,
      flat([side, 0, NEAR], [side, 0, B], [side, 14, B], [side, 14, NEAR]),
      shade(wall, -0.5),
      THIN,
    )
  }
  fillPoly(g, flat([L, 0, B], [R, 0, B], [R, 14, B], [L, 14, B]), shade(wall, -0.45), THIN)

  // the corners, inked
  for (const p of [
    [L, 0, B, L, C, B],
    [R, 0, B, R, C, B],
    [L, C, B, R, C, B],
    [L, 0, B, R, 0, B],
  ]) {
    g.poly(flat([p[0]!, p[1]!, p[2]!], [p[3]!, p[4]!, p[5]!]), false).stroke({
      color: INK,
      width: 2,
      alpha: 0.8,
    })
  }

  // ceiling beams, dark old wood
  const beams = ctx.layer()
  for (const z of [40, 200, 345])
    block(beams, { x0: L, x1: R, y0: C - 16, y1: C, z0: z - 9, z1: z + 9 }, 0x3a2216)

  ctx.hit('wall', (h) => h.rect(-2000, -2000, 5000, 5000))
  ctx.hit('led', (h) => h.poly(flat([L, C, NEAR], [R, C, NEAR], [R, C, B], [L, C, B])))

  drawFloor(ctx)
  drawStrip(ctx)
}

function drawFloor(ctx: Ctx) {
  const g = ctx.layer()
  fillPoly(g, flat([L, 0, NEAR], [R, 0, NEAR], [R, 0, B], [L, 0, B]), FLOOR, null)
  // boards run towards the window, ends staggered
  for (let x = L; x <= R; x += 24) {
    g.poly(flat([x, 0, NEAR], [x, 0, B]), false).stroke({ color: INK, width: 1.2, alpha: 0.55 })
  }
  for (let x = L; x < R; x += 24) {
    for (let z = NEAR + ((x / 24) % 3) * 40; z < B; z += 120) {
      g.poly(flat([x, 0, z], [x + 24, 0, z]), false).stroke({ color: INK, width: 1, alpha: 0.45 })
    }
    // a lighter grain stripe down some boards
    if (ctx.rng() < 0.4) {
      g.poly(flat([x + 4, 0, NEAR], [x + 9, 0, NEAR], [x + 9, 0, B], [x + 4, 0, B])).fill({
        color: shade(FLOOR, 0.15),
        alpha: 0.35,
      })
    }
  }
}

/** the strip of light round the ceiling, if it's on */
function drawStrip(ctx: Ctx) {
  const led = ctx.layout.led
  const pts: P3[] = [
    [L + 2, C - 20, NEAR],
    [L + 2, C - 20, B - 2],
    [R - 2, C - 20, B - 2],
    [R - 2, C - 20, NEAR],
  ]
  const g = ctx.layer('led')
  if (!led) {
    g.poly(flat(...pts), false).stroke({ color: INK, width: 3, alpha: 0.5 })
    return
  }
  const c = hex(led)
  g.poly(flat(...pts), false).stroke({ color: shade(c, 0.7), width: 3 })
  const lights = new Graphics()
  lights.poly(flat(...pts), false).stroke({ color: c, width: 6, alpha: 0.65 })
  // the wash it throws across the ceiling and the tops of the walls
  lights
    .poly(flat([L, C, NEAR], [R, C, NEAR], [R, C, B], [L, C, B]))
    .fill({ color: c, alpha: 0.16 })
  for (const side of [L, R]) {
    lights
      .poly(flat([side, C - 20, NEAR], [side, C - 20, B], [side, C - 90, B], [side, C - 90, NEAR]))
      .fill({ color: c, alpha: 0.12 })
  }
  lights
    .poly(flat([L, C - 20, B], [R, C - 20, B], [R, C - 90, B], [L, C - 90, B]))
    .fill({ color: c, alpha: 0.12 })
  ctx.lights.addChild(lights)
  for (const p of [
    [-150, C - 30, B],
    [150, C - 30, B],
    [L, C - 30, 150],
    [R, C - 30, 150],
  ] as P3[]) {
    ctx.pool(p, 220, 0.35)
  }
}
