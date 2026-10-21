import { Graphics } from 'pixi.js'
import { range } from '../rng'
import type { Ctx } from './context'
import { block, fillPoly, hex, INK, mix, shade, THIN } from './paint'
import { flat, NEAR, onFloor, ROOM, type P3 } from './projection'
import type { Floor } from './variants'

const { left: L, right: R, ceiling: C, back: B } = ROOM
const PLASTER = 0xe8c890

type Wall = 'back' | 'left' | 'right'

/** wall coordinates (u across, v up) to room space */
function w(wall: Wall, u: number, v: number): P3 {
  if (wall === 'back') return [u, v, B]
  return [wall === 'left' ? L + 0.3 : R - 0.3, v, u]
}

function span(wall: Wall): [number, number] {
  return wall === 'back' ? [L, R] : [NEAR, B]
}

/** a lumpy blob on a wall, for damp patches and peeled paint */
function blob(ctx: Ctx, wall: Wall, u: number, v: number, ru: number, rv: number) {
  const pts: P3[] = []
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2
    const k = 0.7 + ctx.rng() * 0.5
    pts.push(w(wall, u + Math.cos(a) * ru * k, v + Math.sin(a) * rv * k))
  }
  return flat(...pts)
}

export function drawShell(ctx: Ctx) {
  const wall = hex(ctx.layout.wall)
  const g = ctx.layer('wall')

  fillPoly(
    g,
    flat([L, C, NEAR], [R, C, NEAR], [R, C, B], [L, C, B]),
    mix(shade(wall, -0.35), 0xf2e2bd, 0.12),
    null,
  )
  fillPoly(g, flat([L, 0, NEAR], [L, 0, B], [L, C, B], [L, C, NEAR]), shade(wall, -0.1), null)
  fillPoly(g, flat([R, 0, NEAR], [R, 0, B], [R, C, B], [R, C, NEAR]), shade(wall, -0.18), null)
  fillPoly(g, flat([L, 0, B], [R, 0, B], [R, C, B], [L, C, B]), wall, null)

  // old plaster: soft damp patches, scuffs, the odd bit where it's come away
  for (const side of ['back', 'left', 'right'] as Wall[]) {
    const [u0, u1] = span(side)
    const base = side === 'back' ? wall : shade(wall, side === 'left' ? -0.1 : -0.18)
    for (let i = 0; i < 10; i++) {
      g.poly(
        blob(
          ctx,
          side,
          range(ctx.rng, u0 + 20, u1 - 20),
          range(ctx.rng, 20, C - 30),
          range(ctx.rng, 16, 44),
          range(ctx.rng, 12, 40),
        ),
      ).fill({
        color: i % 3 ? shade(base, -0.18) : shade(base, 0.14),
        alpha: range(ctx.rng, 0.12, 0.3),
      })
    }
    for (let i = 0; i < 3; i++) {
      const pts = blob(
        ctx,
        side,
        range(ctx.rng, u0 + 30, u1 - 30),
        range(ctx.rng, 40, C - 60),
        range(ctx.rng, 6, 14),
        range(ctx.rng, 4, 10),
      )
      g.poly(pts).fill(mix(PLASTER, base, 0.3))
      g.poly(pts).stroke({ ...THIN, alpha: 0.35 })
    }
    for (let i = 0; i < 20; i++) {
      const u = range(ctx.rng, u0, u1)
      const top = range(ctx.rng, 60, C)
      g.poly(flat(w(side, u, top), w(side, u, top - range(ctx.rng, 30, 160))), false).stroke({
        color: shade(base, -0.3),
        width: range(ctx.rng, 0.6, 1.4),
        alpha: 0.22,
      })
    }
  }

  // crown moulding and skirting all the way round, the corners inked
  const ring = (y: number): P3[] => [
    [L, y, NEAR],
    [L, y, B],
    [R, y, B],
    [R, y, NEAR],
  ]
  g.poly(flat(...ring(C - 8)), false).stroke({ color: shade(wall, 0.3), width: 6 })
  g.poly(flat(...ring(C - 8)), false).stroke({ ...THIN, alpha: 0.4 })
  for (const side of [L, R])
    fillPoly(
      g,
      flat([side, 0, NEAR], [side, 0, B], [side, 16, B], [side, 16, NEAR]),
      shade(wall, -0.45),
      THIN,
    )
  fillPoly(g, flat([L, 0, B], [R, 0, B], [R, 16, B], [L, 16, B]), shade(wall, -0.4), THIN)
  for (const [a, b] of [
    [
      [L, 0, B],
      [L, C, B],
    ],
    [
      [R, 0, B],
      [R, C, B],
    ],
    [
      [L, C, B],
      [R, C, B],
    ],
  ] as [P3, P3][]) {
    g.poly(flat(a, b), false).stroke({ color: INK, width: 2, alpha: 0.7 })
  }

  if (ctx.plan.variant.ceiling === 'beams') {
    const beams = ctx.layer()
    for (const z of [30, 170, 310])
      block(beams, { x0: L, x1: R, y0: C - 18, y1: C, z0: z - 10, z1: z + 10 }, 0x4a2c1c)
  }

  ctx.hit('wall', (h) => h.rect(-2000, -2000, 5000, 5000))
  ctx.hit('led', (h) => h.poly(flat([L, C, NEAR], [R, C, NEAR], [R, C, B], [L, C, B])))

  drawFloor(ctx, ctx.plan.variant.floor)
  drawStrip(ctx)
}

const WOOD: Record<Floor, number> = {
  planks: 0x9a5a30,
  dark: 0x5a3220,
  tiles: 0xb8582e,
  herringbone: 0x8a5028,
}

function drawFloor(ctx: Ctx, kind: Floor) {
  const g = ctx.layer()
  const base = WOOD[kind]
  fillPoly(g, flat([L, 0, NEAR], [R, 0, NEAR], [R, 0, B], [L, 0, B]), base, null)
  const seam = { color: INK, width: 1, alpha: 0.45 }
  if (kind === 'tiles') {
    // terracotta squares, every other one a shade darker
    const t = 40
    for (let x = L; x < R; x += t) {
      for (let z = NEAR; z < B; z += t) {
        const odd = (Math.round((x - L) / t) + Math.round((z - NEAR) / t)) % 2
        g.poly(
          onFloor([
            [x, z],
            [x + t, z],
            [x + t, z + t],
            [x, z + t],
          ]),
        ).fill(odd ? shade(base, -0.14) : shade(base, 0.04))
      }
    }
    for (let x = L; x <= R; x += t)
      g.poly(flat([x, 0.6, NEAR], [x, 0.6, B]), false).stroke({
        color: 0x3a1a10,
        width: 1.4,
        alpha: 0.6,
      })
    for (let z = NEAR; z <= B; z += t)
      g.poly(flat([L, 0.6, z], [R, 0.6, z]), false).stroke({
        color: 0x3a1a10,
        width: 1.4,
        alpha: 0.6,
      })
    return
  }
  if (kind === 'herringbone') {
    // columns of short boards, each column slanting the other way: a chevron
    const bw = 20
    const bl = 52
    for (let i = 0; L + i * bw < R; i++) {
      const x = L + i * bw
      const d = i % 2 ? bw : -bw
      for (let z = NEAR - bl + (i % 2) * (bl / 2); z < B; z += bl) {
        const pts: [number, number][] = [
          [x, z],
          [x + bw, z + d],
          [x + bw, z + d + bl],
          [x, z + bl],
        ]
        const c = pts.map(([px, pz]): [number, number] => [px, Math.min(B, Math.max(NEAR, pz))])
        g.poly(onFloor(c))
          .fill(ctx.rng() < 0.55 ? base : shade(base, ctx.rng() < 0.5 ? 0.1 : -0.12))
          .stroke(seam)
      }
    }
    return
  }
  // boards running towards the window, ends staggered, a lighter grain here and there
  for (let x = L; x <= R; x += 22)
    g.poly(flat([x, 0, NEAR], [x, 0, B]), false).stroke({ ...seam, width: 1.2 })
  for (let x = L; x < R; x += 22) {
    for (let z = NEAR + ((x / 22) % 3) * 40; z < B; z += 120)
      g.poly(flat([x, 0, z], [x + 22, 0, z]), false).stroke(seam)
    if (ctx.rng() < 0.4)
      g.poly(
        onFloor(
          [
            [x + 4, NEAR],
            [x + 9, NEAR],
            [x + 9, B],
            [x + 4, B],
          ],
          0.2,
        ),
      ).fill({ color: shade(base, 0.16), alpha: 0.35 })
  }
}

/**
 * The led strip, if this room has one and it's on: a single line tucked
 * right into the corner where the walls meet the ceiling, all the way round.
 * Nothing else is ever drawn up there in these rooms.
 */
function drawStrip(ctx: Ctx) {
  if (ctx.plan.variant.fairy) return
  const led = ctx.layout.led
  const y = C - 2
  const pts: P3[] = [
    [L + 1, y, NEAR],
    [L + 1, y, B - 1],
    [R - 1, y, B - 1],
    [R - 1, y, NEAR],
  ]
  const g = ctx.layer('led')
  if (!led) {
    g.poly(flat(...pts), false).stroke({ color: INK, width: 2.5, alpha: 0.45 })
    return
  }
  const c = hex(led)
  g.poly(flat(...pts), false).stroke({ color: shade(c, 0.75), width: 2.5 })
  const lights = new Graphics()
  lights.poly(flat(...pts), false).stroke({ color: c, width: 5, alpha: 0.7 })
  // the wash it throws over the ceiling and down the tops of the walls
  lights
    .poly(flat([L, C, NEAR], [R, C, NEAR], [R, C, B], [L, C, B]))
    .fill({ color: c, alpha: 0.16 })
  for (const side of [L, R])
    lights
      .poly(flat([side, C, NEAR], [side, C, B], [side, C - 80, B], [side, C - 80, NEAR]))
      .fill({ color: c, alpha: 0.1 })
  lights
    .poly(flat([L, C, B], [R, C, B], [R, C - 80, B], [L, C - 80, B]))
    .fill({ color: c, alpha: 0.1 })
  ctx.lights.addChild(lights)
  for (const p of [
    [-150, C - 20, B],
    [150, C - 20, B],
    [L, C - 20, 150],
    [R, C - 20, 150],
  ] as P3[])
    ctx.pool(p, 240, 0.32)
}
