import { Container, Graphics, Matrix, Text } from 'pixi.js'
import { SIGN_FONT } from '../fonts'
import { glow } from '../layers/neon'
import { at, type Ctx } from '../room/context'
import { candle } from '../room/extras'
import { BOOKS, steamingMug } from '../room/furniture'
import { block, fillPoly, LINE, mix, shade, THIN } from '../room/paint'
import { paintPoster, POSTER_H } from '../room/posters'
import { flat, onFloor, pictureMatrix, project, ROOM, type Box, type P3 } from '../room/projection'
import { cushion, drape, pillow, potPlant, vines } from '../room/soft'
import { mushroomLamp, tableLamp } from './lamps'
import type { LoungePlan, Seat, TreeKind } from './plan'

// Everything that stands in the living room.

const BRASS = 0xd9a54a

/** a box against a side wall: `side` -1 is the left wall; d0..d1 is how far out from it */
function wallBox(
  plan: LoungePlan,
  side: number,
  d0: number,
  d1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
): Box {
  const h = plan.half
  return side < 0
    ? { x0: -h + d0, x1: -h + d1, y0, y1, z0, z1 }
    : { x0: h - d1, x1: h - d0, y0, y1, z0, z1 }
}

/** the x of a plane `d` out from a side wall */
function wallX(plan: LoungePlan, side: number, d: number) {
  return side < 0 ? -plan.half + d : plan.half - d
}

/** maps a 100 x 100 picture onto a side wall rectangle, reading left to right as you face it */
function wallPicture(
  plan: LoungePlan,
  side: number,
  d: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
) {
  const X = wallX(plan, side, d)
  // facing the left wall, left is the near end; facing the right wall, it's the far end
  const [za, zb] = side < 0 ? [z0, z1] : [z1, z0]
  return pictureMatrix([X, y1, za], [X, y1, zb], [X, y0, za])
}

// -- seating -----------------------------------------------------------------

export function sofa(ctx: Ctx, plan: LoungePlan) {
  const g = ctx.layer()
  const colour = plan.sofa
  const z0 = plan.sofaZ
  const z1 = z0 + 72
  const X = 168
  for (const [x, z] of [
    [-X + 6, z0 + 4],
    [X - 10, z0 + 4],
  ])
    block(g, { x0: x!, x1: x! + 5, y0: 0, y1: 9, z0: z!, z1: z! + 5 }, 0x2a1a10, THIN)
  block(g, { x0: -X, x1: X, y0: 8, y1: 36, z0, z1 }, shade(colour, -0.12))
  block(g, { x0: -X + 18, x1: X - 18, y0: 36, y1: 102, z0: z1 - 24, z1 }, colour)
  // four plump seat cushions
  const inner = X - 20
  const step = (inner * 2) / 4
  for (let i = 0; i < 4; i++) {
    const xa = -inner + i * step + 1
    const xb = xa + step - 2
    cushion(
      g,
      [
        [xa, 40, z0 + 3],
        [xb, 40, z0 + 3],
        [xb, 43, z1 - 24],
        [xa, 43, z1 - 24],
      ],
      shade(colour, 0.06),
    )
  }
  // arms last, so they sit over the cushion ends
  for (const x0 of [-X, X - 20]) block(g, { x0, x1: x0 + 20, y0: 8, y1: 66, z0, z1 }, colour)
  // back cushions, then throw pillows in the accent colours
  for (let i = 0; i < 4; i++) {
    const p = at([-inner + (i + 0.5) * step, 76, z1 - 16])
    pillow(g, p.x, p.y, 78 * p.s, 50 * p.s, shade(colour, 0.1), (i - 1.5) * 0.04)
  }
  const accents = [plan.accent, plan.chairs[0], 0xf2e2bd, plan.chairs[1]]
  for (const [i, x] of [
    [0, -inner + 18],
    [1, -inner + 52],
    [2, inner - 50],
    [3, inner - 16],
  ] as const) {
    const p = at([x, 60, z1 - 30])
    pillow(g, p.x, p.y, 36 * p.s, 32 * p.s, accents[i]!, (i < 2 ? -1 : 1) * 0.28)
  }
  // a knitted throw over one arm
  const arm = plan.books > 0 ? -X + 10 : X - 10
  const edge: P3[] = []
  for (let i = 0; i <= 6; i++) edge.push([arm, 66, z0 + 6 + i * 10])
  drape(ctx, g, edge, 46, mix(plan.accent, 0xf2e2bd, 0.5), { wave: 5, folds: 4 })
}

export function armchair(ctx: Ctx, plan: LoungePlan, seat: Seat, colour: number) {
  const g = ctx.layer()
  const { x, z } = seat
  if (plan.chairStyle === 'tulip') {
    // the white tulip chair: one stem, a shell, an orange cushion
    const foot = at([x, 0, z])
    g.ellipse(foot.x, foot.y, 30 * foot.s, 9 * foot.s)
      .fill(0xf2ece0)
      .stroke(THIN)
    const [, sy] = project([x, 36, z])
    g.moveTo(foot.x - 4 * foot.s, foot.y - 4 * foot.s)
      .quadraticCurveTo(foot.x - 3 * foot.s, sy + 10 * foot.s, foot.x - 12 * foot.s, sy)
      .lineTo(foot.x + 12 * foot.s, sy)
      .quadraticCurveTo(
        foot.x + 3 * foot.s,
        sy + 10 * foot.s,
        foot.x + 4 * foot.s,
        foot.y - 4 * foot.s,
      )
      .closePath()
      .fill(0xf2ece0)
      .stroke(THIN)
    const c = at([x, 40, z])
    const k = c.s
    g.moveTo(c.x - 40 * k, c.y - 10 * k)
      .quadraticCurveTo(c.x - 46 * k, c.y - 70 * k, c.x, c.y - 74 * k)
      .quadraticCurveTo(c.x + 46 * k, c.y - 70 * k, c.x + 40 * k, c.y - 10 * k)
      .quadraticCurveTo(c.x, c.y + 10 * k, c.x - 40 * k, c.y - 10 * k)
      .fill(0xf2ece0)
      .stroke(LINE)
    g.ellipse(c.x - 10 * k, c.y - 50 * k, 14 * k, 8 * k).fill({ color: 0xffffff, alpha: 0.5 })
    g.ellipse(c.x, c.y - 4 * k, 30 * k, 9 * k)
      .fill(colour)
      .stroke(THIN)
    return
  }
  const wing = plan.chairStyle === 'wingback'
  for (const [lx, lz] of [
    [x - 30, z - 28],
    [x + 26, z - 28],
  ])
    block(g, { x0: lx!, x1: lx! + 4, y0: 0, y1: 10, z0: lz!, z1: lz! + 4 }, 0x2a1a10, THIN)
  block(g, { x0: x - 36, x1: x + 36, y0: 10, y1: 36, z0: z - 30, z1: z + 30 }, shade(colour, -0.12))
  block(g, { x0: x - 32, x1: x + 32, y0: 36, y1: wing ? 124 : 100, z0: z + 12, z1: z + 30 }, colour)
  cushion(
    g,
    [
      [x - 24, 38, z - 28],
      [x + 24, 38, z - 28],
      [x + 24, 41, z + 12],
      [x - 24, 41, z + 12],
    ],
    shade(colour, 0.08),
  )
  for (const x0 of [x - 36, x + 22])
    block(
      g,
      { x0, x1: x0 + 14, y0: 10, y1: wing ? 70 : 62, z0: z - 30, z1: z + 30 },
      shade(colour, 0.04),
    )
  if (wing)
    for (const x0 of [x - 34, x + 24])
      block(g, { x0, x1: x0 + 10, y0: 70, y1: 118, z0: z + 2, z1: z + 30 }, colour)
  const p = at([x, 66, z + 6])
  pillow(g, p.x, p.y, 34 * p.s, 28 * p.s, plan.accent, Math.sign(-seat.x) * 0.2)
}

/** big floor cushions, or flat zabuton in Tokyo */
export function floorCushion(ctx: Ctx, plan: LoungePlan, seat: Seat, i: number) {
  const g = ctx.layer()
  const colours = [plan.accent, plan.chairs[0], plan.chairs[1], 0xf2e2bd]
  const c = colours[i % colours.length]!
  const { x, z } = seat
  if (plan.theme === 'tokyo') {
    block(g, { x0: x - 30, x1: x + 30, y0: 0, y1: 7, z0: z - 26, z1: z + 26 }, c)
    const top = at([x, 7, z])
    g.circle(top.x, top.y, 2 * top.s).fill(shade(c, -0.4))
    return
  }
  const p = at([x, 0, z])
  const k = p.s
  g.ellipse(p.x, p.y - 6 * k, 36 * k, 11 * k)
    .fill(shade(c, -0.25))
    .stroke(THIN)
  g.ellipse(p.x, p.y - 10 * k, 34 * k, 10 * k).fill(c)
  // tufted buttons in a ring
  for (let a = 0; a < 6; a++) {
    const ang = (a / 6) * Math.PI * 2
    g.circle(p.x + Math.cos(ang) * 18 * k, p.y - 10 * k + Math.sin(ang) * 5 * k, 1.4 * k).fill(
      shade(c, -0.4),
    )
  }
  g.ellipse(p.x - 8 * k, p.y - 13 * k, 14 * k, 3 * k).fill({ color: shade(c, 0.3), alpha: 0.5 })
  g.ellipse(p.x, p.y - 10 * k, 34 * k, 10 * k).stroke(THIN)
}

export function beanbag(ctx: Ctx, seat: Seat, colour: number) {
  const g = ctx.layer()
  const { x, y, s } = at([seat.x, 0, seat.z])
  const w = 46 * s
  const h = 44 * s
  const shape = (d: Graphics) =>
    d
      .moveTo(x - w, y)
      .bezierCurveTo(x - w * 1.2, y - h * 0.6, x - w * 0.5, y - h * 1.1, x, y - h)
      .bezierCurveTo(x + w * 0.6, y - h * 0.9, x + w * 1.25, y - h * 0.5, x + w, y)
      .quadraticCurveTo(x, y + 6 * s, x - w, y)
      .closePath()
  shape(g).fill(colour)
  g.ellipse(x + w * 0.05, y - h * 0.42, w * 0.5, h * 0.22).fill(shade(colour, -0.22))
  g.ellipse(x - w * 0.35, y - h * 0.78, w * 0.25, h * 0.1).fill({
    color: shade(colour, 0.35),
    alpha: 0.6,
  })
  shape(g).stroke(LINE)
}

export function pouf(ctx: Ctx, seat: Seat, colour: number) {
  const g = ctx.layer()
  const { x, y, s } = at([seat.x, 0, seat.z])
  const rx = 28 * s
  const ry = 8 * s
  const h = 32 * s
  g.rect(x - rx, y - h, rx * 2, h).fill(colour)
  g.ellipse(x, y, rx, ry).fill(colour)
  // knitted ribs
  for (let i = -5; i <= 5; i++) {
    const px = x + (i / 5.5) * rx
    g.moveTo(px, y - h + 2)
      .lineTo(px, y + ry * Math.sqrt(1 - (i / 5.5) ** 2) - 1)
      .stroke({ color: shade(colour, -0.25), width: 1.4 })
  }
  g.ellipse(x, y - h, rx, ry)
    .fill(shade(colour, 0.12))
    .stroke(THIN)
  g.moveTo(x - rx, y - h)
    .lineTo(x - rx, y)
    .moveTo(x + rx, y - h)
    .lineTo(x + rx, y)
    .stroke(THIN)
  g.ellipse(x, y, rx, ry).stroke({ ...THIN, alpha: 0.5 })
}

export function stool(ctx: Ctx, seat: Seat, metal: number) {
  const g = ctx.layer()
  const { x, z, y: h } = seat
  for (const [dx, dz] of [
    [-14, -12],
    [14, -12],
    [-12, 12],
    [12, 12],
  ]) {
    const [ax, ay] = project([x + dx!, 0, z + dz!])
    const [bx, by] = project([x + dx! * 0.6, h - 4, z + dz! * 0.6])
    g.moveTo(ax, ay).lineTo(bx, by).stroke({ color: metal, width: 2.2 })
  }
  const ring = onFloor(
    Array.from({ length: 16 }, (_, i): [number, number] => {
      const a = (i / 16) * Math.PI * 2
      return [x + Math.cos(a) * 12, z + Math.sin(a) * 10]
    }),
    28,
  )
  g.poly(ring).stroke({ color: metal, width: 1.6 })
  const top = at([x, h, z])
  g.ellipse(top.x, top.y + 3 * top.s, 18 * top.s, 6 * top.s)
    .fill(shade(plan_wood(metal), -0.2))
    .stroke(THIN)
  g.ellipse(top.x, top.y, 18 * top.s, 6 * top.s)
    .fill(plan_wood(metal))
    .stroke(THIN)
}

// stools get a wooden seat whatever the frame
function plan_wood(metal: number) {
  return metal === BRASS ? 0x6a3a22 : 0x8a5a3a
}

// -- tables ------------------------------------------------------------------

export function coffeeTable(ctx: Ctx, plan: LoungePlan) {
  const g = ctx.layer()
  const cz = plan.sofaZ - 70
  const X = 84
  const Z = 26
  let top = 40
  if (plan.theme === 'tokyo') {
    // a kotatsu: a low table with a quilt tucked under the top
    top = 34
    const quilt = mix(plan.accent, 0xf2e2bd, 0.35)
    block(
      g,
      { x0: -X + 6, x1: X - 6, y0: 0, y1: 28, z0: cz - Z + 6, z1: cz + Z - 6 },
      shade(quilt, -0.2),
    )
    const edge: P3[] = []
    for (let i = 0; i <= 10; i++) edge.push([-X - 4 + (i * (X * 2 + 8)) / 10, 30, cz - Z - 4])
    drape(ctx, g, edge, 30, quilt, { wave: 3, folds: 6 })
    block(g, { x0: -X, x1: X, y0: 28, y1: top, z0: cz - Z, z1: cz + Z }, plan.wood)
  } else if (plan.coffee === 'glass') {
    // brass frame, a glass top, books on the shelf underneath
    for (const [x, z] of [
      [-X, cz - Z],
      [X - 3, cz - Z],
      [-X, cz + Z - 3],
      [X - 3, cz + Z - 3],
    ])
      block(g, { x0: x!, x1: x! + 3, y0: 0, y1: top, z0: z!, z1: z! + 3 }, BRASS, THIN)
    block(
      g,
      { x0: -X + 2, x1: X - 2, y0: 10, y1: 13, z0: cz - Z + 2, z1: cz + Z - 2 },
      0x2a2624,
      THIN,
    )
    for (let i = 0; i < 3; i++)
      block(
        g,
        {
          x0: -50 + i * 6,
          x1: -10 + i * 4,
          y0: 13 + i * 5,
          y1: 18 + i * 5,
          z0: cz - 14,
          z1: cz + 10,
        },
        BOOKS[(i + 2) % BOOKS.length]!,
        THIN,
      )
    g.poly(flat([-X, top, cz - Z], [X, top, cz - Z], [X, top, cz + Z], [-X, top, cz + Z])).fill({
      color: 0xc8e8f0,
      alpha: 0.28,
    })
    g.poly(flat([-X, top, cz - Z], [X, top, cz - Z], [X, top, cz + Z], [-X, top, cz + Z])).stroke({
      color: BRASS,
      width: 2,
    })
    g.poly(
      flat([-X, top - 3, cz - Z], [X, top - 3, cz - Z], [X, top, cz - Z], [-X, top, cz - Z]),
    ).fill({
      color: 0x9ad0d8,
      alpha: 0.5,
    })
  } else if (plan.coffee === 'marble') {
    // a round marble top on a fat pedestal
    const ring = (y: number, r: number) =>
      onFloor(
        Array.from({ length: 40 }, (_, i): [number, number] => {
          const a = (i / 40) * Math.PI * 2
          return [Math.cos(a) * r, cz + Math.sin(a) * r * 0.45]
        }),
        y,
      )
    block(g, { x0: -18, x1: 18, y0: 0, y1: top - 4, z0: cz - 8, z1: cz + 8 }, 0x2a2624)
    fillPoly(g, ring(top - 4, X * 0.9), 0xb8b0a8, THIN)
    fillPoly(g, ring(top, X * 0.9), 0xf2ece4, LINE)
    for (let i = 0; i < 4; i++) {
      const [ax, ay] = project([-50 + i * 30, top, cz - 10 + (i % 2) * 14])
      g.moveTo(ax, ay)
        .quadraticCurveTo(ax + 10, ay - 3, ax + 24, ay + 2)
        .stroke({ color: 0xa8a0a0, width: 0.8 })
    }
  } else {
    // a chunky wooden one with a drawer
    for (const [x, z] of [
      [-X + 2, cz - Z + 2],
      [X - 8, cz - Z + 2],
    ])
      block(
        g,
        { x0: x!, x1: x! + 6, y0: 0, y1: top - 8, z0: z!, z1: z! + 6 },
        shade(plan.wood, -0.2),
        THIN,
      )
    block(g, { x0: -X, x1: X, y0: top - 10, y1: top, z0: cz - Z, z1: cz + Z }, plan.wood)
    const [dx0, dy] = project([-30, top - 5, cz - Z])
    const [dx1] = project([30, top - 5, cz - Z])
    g.moveTo(dx0, dy)
      .lineTo(dx1, dy)
      .stroke({ color: shade(plan.wood, -0.4), width: 1 })
    g.circle((dx0 + dx1) / 2, dy, 1.6).fill(BRASS)
  }

  // what's on it: magazines, a lamp, drinks, a candle, a little plant
  for (let i = 0; i < 3; i++)
    block(
      g,
      {
        x0: 6 + i * 2,
        x1: 44 - i * 2,
        y0: top + i * 2.4,
        y1: top + i * 2.4 + 2.4,
        z0: cz - 12 + i,
        z1: cz + 14 - i,
      },
      [0xc8302a, 0xf2e2bd, 0x2a4a8a][i]!,
      { ...THIN, width: 0.5 },
    )
  for (const [gx, gz] of [
    [-36, cz - 8],
    [-22, cz + 4],
  ]) {
    const p = at([gx!, top, gz!])
    g.rect(p.x - 3 * p.s, p.y - 11 * p.s, 6 * p.s, 11 * p.s)
      .fill({ color: 0xc8e8ff, alpha: 0.5 })
      .stroke({ ...THIN, width: 0.6 })
    g.rect(p.x - 3 * p.s, p.y - 5 * p.s, 6 * p.s, 5 * p.s).fill({ color: 0xc8302a, alpha: 0.6 })
  }
  candle(ctx, g, [-6, top, cz + 8], 10)
  if (plan.theme === 'tokyo') steamingMug(ctx, g, [26, top, cz - 4])
  potPlant(g, [62, top, cz + 6], 0.8, 'cactus', 2)
  mushroomLamp(ctx, [-62, top, cz + 4], plan.theme === 'new-york' ? 0xe8603a : 0xfff4e0)
}

/** a round red table on a pedestal, with a lamp and a drink */
export function sideTable(ctx: Ctx, plan: LoungePlan) {
  const g = ctx.layer()
  const { x, z } = plan.sideTable
  const top = 54
  const ring = (y: number, r: number) =>
    onFloor(
      Array.from({ length: 32 }, (_, i): [number, number] => {
        const a = (i / 32) * Math.PI * 2
        return [x + Math.cos(a) * r, z + Math.sin(a) * r * 0.7]
      }),
      y,
    )
  fillPoly(g, ring(0.5, 16), shade(plan.accent, -0.4), THIN)
  const [bx, by] = project([x, 0, z])
  const [, ty] = project([x, top, z])
  const s = at([x, 0, z]).s
  g.rect(bx - 2.5 * s, ty, 5 * s, by - ty).fill(0x8a1a12)
  fillPoly(g, ring(top - 3, 24), 0x8a1a12, THIN)
  fillPoly(g, ring(top, 24), 0xc8302a, LINE)
  const styles = ['tiffany', 'banker', 'scallop', 'floral', 'fringe'] as const
  tableLamp(ctx, styles[(plan.posters[0] ?? 0) % styles.length]!, [x - 4, top, z + 4])
}

// -- along the walls ---------------------------------------------------------

/** a long low sideboard with the telly on the wall above */
export function mediaWall(ctx: Ctx, plan: LoungePlan) {
  const side = plan.books
  const g = ctx.layer()
  const z0 = 100
  const z1 = 200
  block(g, wallBox(plan, side, 0, 46, 8, 60, z0, z1), plan.wood)
  for (const [dz0, dz1] of [
    [z0 + 4, z0 + 4],
    [(z0 + z1) / 2, (z0 + z1) / 2],
  ])
    g.poly(
      flat([wallX(plan, side, 46), 12, dz0!], [wallX(plan, side, 46), 56, dz1!]),
      false,
    ).stroke({
      color: shade(plan.wood, -0.4),
      width: 1,
    })
  for (const lz of [z0 + 6, z1 - 8])
    block(g, wallBox(plan, side, 38, 42, 0, 8, lz, lz + 3), 0x1e1a1c, THIN)
  // on top: a stack of records, a speaker, a plant
  const fx = wallX(plan, side, 24)
  for (let i = 0; i < 5; i++)
    block(
      g,
      wallBox(plan, side, 8, 40, 60 + i * 1.6, 61.6 + i * 1.6, z1 - 40, z1 - 8),
      [0x1e1a1c, 0xc8302a, 0x1e1a1c, 0xe8c25a, 0x1e1a1c][i]!,
      {
        ...THIN,
        width: 0.4,
      },
    )
  block(g, wallBox(plan, side, 6, 36, 60, 96, z0 + 4, z0 + 26), 0x2a2624)
  const [spx, spy] = project([wallX(plan, side, 36), 84, z0 + 15])
  const ss = at([fx, 84, z0 + 15]).s
  g.circle(spx, spy, 6 * ss)
    .fill(0x121014)
    .stroke({ color: 0x5a5650, width: 1 })
  g.circle(spx, spy + 9 * ss, 3 * ss).fill(0x121014)
  potPlant(g, [fx, 60, (z0 + z1) / 2 - 6], 1, 'pothos', 1)

  // the telly, fixed to the wall, a film playing
  const X = wallX(plan, side, 2)
  const ty0 = 112
  const ty1 = 196
  const tz0 = z0 + 6
  const tz1 = z1 - 6
  g.poly(flat([X, ty0, tz0], [X, ty0, tz1], [X, ty1, tz1], [X, ty1, tz0]))
    .fill(0x121014)
    .stroke(LINE)
  const screen = ctx.live(ctx.container())
  const pic = new Graphics()
  const m = wallPicture(plan, side, 3, ty0 + 5, ty1 - 5, tz0 + 5, tz1 - 5)
  pic.setFromMatrix(m)
  screen.addChild(pic)
  const lit = new Graphics()
  lit.setFromMatrix(m)
  ctx.lights.addChild(lit)
  const film = (d: Graphics, t: number) => {
    d.clear()
    const scene = Math.floor(t / 7) % 3
    const sky = [0x2a3a6a, 0x6a2a3a, 0x1e4a4a][scene]!
    d.rect(0, 0, 100, 100).fill(sky)
    d.rect(0, 62, 100, 38).fill(shade(sky, -0.4))
    d.circle(70 + Math.sin(t * 0.2) * 6, 28, 10).fill(0xf6d890)
    d.rect(18 + Math.sin(t * 0.5) * 3, 40, 10, 32).fill(0x121014)
    d.circle(23 + Math.sin(t * 0.5) * 3, 36, 6).fill(0x121014)
  }
  ctx.anim.push((t) => {
    film(pic, t)
    lit.clear()
    lit.rect(0, 0, 100, 100).fill({ color: 0x8ab0ff, alpha: 0.12 + Math.sin(t * 3.1) * 0.03 })
  })
  film(pic, 0)
  const [cx, cy] = project([X, (ty0 + ty1) / 2, (tz0 + tz1) / 2])
  glow(ctx.lights, cx, cy, 2.2, 1.6, 0x6a9aff, 0.2)
  ctx.pool([wallX(plan, side, 60), 120, (z0 + z1) / 2], 240, 0.35)
}

/** books floor to nearly the ceiling, with a ladder */
export function bookshelf(ctx: Ctx, plan: LoungePlan) {
  const side = plan.books
  const g = ctx.layer()
  const z0 = 282
  const z1 = 396
  const height = ROOM.ceiling - 70
  const depth = 40
  block(g, wallBox(plan, side, 0, depth, 0, height, z0, z1), plan.wood)
  const face = wallX(plan, side, depth)
  const shelfH = 62
  let n = plan.posters[1] ?? 0
  for (let y = 14; y + shelfH <= height; y += shelfH) {
    g.poly(
      flat(
        [face, y, z0 + 4],
        [face, y, z1 - 4],
        [face, y + shelfH - 5, z1 - 4],
        [face, y + shelfH - 5, z0 + 4],
      ),
    ).fill(0x160c08)
    g.poly(flat([face, y, z0 + 4], [face, y, z1 - 4]), false).stroke({
      color: shade(plan.wood, 0.2),
      width: 3,
    })
    let z = z0 + 6
    while (z < z1 - 8) {
      const kind = (n * 7) % 17
      if (kind === 5 && z < z1 - 26) {
        potPlant(g, [wallX(plan, side, 20), y, z + 11], 0.75, 'pothos', n)
        z += 24
      } else if (kind === 11 && z < z1 - 22) {
        // a framed photo leaning on the books
        const [px, py] = project([face, y, z + 9])
        const k = at([face, y, z]).s
        g.rect(px - 7 * k, py - 22 * k, 14 * k, 22 * k)
          .fill(0x2a1a10)
          .stroke(THIN)
        g.rect(px - 5 * k, py - 20 * k, 10 * k, 15 * k).fill(BOOKS[(n + 3) % BOOKS.length]!)
        z += 18
      } else if (kind === 2) {
        for (let s = 0; s < 4; s++)
          g.poly(
            flat(
              [face, y + s * 5, z],
              [face, y + s * 5, z + 20],
              [face, y + s * 5 + 4, z + 20],
              [face, y + s * 5 + 4, z],
            ),
          )
            .fill(BOOKS[(n + s) % BOOKS.length]!)
            .stroke({ ...THIN, width: 0.4 })
        z += 22
      } else {
        const bw = 4 + (n % 3) * 1.6
        const bh = (shelfH - 12) * (0.62 + (n % 5) * 0.08)
        g.poly(flat([face, y, z], [face, y, z + bw], [face, y + bh, z + bw], [face, y + bh, z]))
          .fill(BOOKS[n % BOOKS.length]!)
          .stroke({ ...THIN, width: 0.4 })
        z += bw + 0.5
      }
      n++
    }
  }
  // trailing plants off the top
  const tp = at([wallX(plan, side, 20), height, (z0 + z1) / 2])
  potPlant(g, [wallX(plan, side, 20), height, (z0 + z1) / 2], 1, 'pothos', 3)
  vines(g, tp.x, tp.y - 2, tp.s, 6, 140, 2)
  // the library ladder, leaning, on a brass rail
  const lad = ctx.layer()
  const rail = wallX(plan, side, depth + 4)
  lad
    .poly(flat([rail, height - 30, z0], [rail, height - 30, z1]), false)
    .stroke({ color: BRASS, width: 2.5 })
  const lz = z0 + 30
  const footX = wallX(plan, side, depth + 70)
  for (const dz of [0, 26])
    lad
      .poly(flat([rail, height - 30, lz + dz], [footX, 0, lz + dz - 10]), false)
      .stroke({ color: 0x4a2a1a, width: 4 })
  for (let r = 1; r < 9; r++) {
    const t = r / 9
    const x = rail + (footX - rail) * t
    const y = height - 30 - (height - 30) * t
    lad
      .poly(flat([x, y, lz + 0 - 10 * t], [x, y, lz + 26 - 10 * t]), false)
      .stroke({ color: 0x6a3a22, width: 2.5 })
  }
}

/** a wire shelf unit: records, a speaker, a turntable, plants, a vase of branches */
export function metalShelf(ctx: Ctx, plan: LoungePlan) {
  const side = plan.books
  const g = ctx.layer()
  const z0 = 206
  const z1 = 270
  const d1 = 40
  const h = 250
  const metal = plan.theme === 'new-york' ? 0x2a2624 : 0xc8ccd0
  const levels = [12, 74, 136, 198, h]
  for (const y of levels) block(g, wallBox(plan, side, 2, d1, y - 2, y, z0, z1), metal, THIN)
  for (const [d, z] of [
    [d1, z0],
    [d1, z1],
  ])
    g.poly(flat([wallX(plan, side, d!), 0, z!], [wallX(plan, side, d!), h, z!]), false).stroke({
      color: metal,
      width: 2.5,
    })
  const face = wallX(plan, side, d1 - 4)
  // bottom: rows of records
  for (const y of [12, 74]) {
    let z = z0 + 4
    let i = y
    while (z < z1 - 4) {
      g.poly(flat([face, y, z], [face, y, z + 2], [face, y + 54, z + 2], [face, y + 54, z]))
        .fill([0x1e1a1c, 0x2a2624, 0xc8302a, 0xf2e2bd, 0x2a4a8a][i % 5]!)
        .stroke({ ...THIN, width: 0.3 })
      z += 2.6
      i++
    }
  }
  // middle: a speaker and a plant
  block(g, wallBox(plan, side, 6, 34, 136, 186, z0 + 6, z0 + 30), 0xe8e0d0)
  const sp = at([wallX(plan, side, 34), 166, z0 + 18])
  g.circle(sp.x, sp.y, 7 * sp.s)
    .fill(0x2a2624)
    .stroke(THIN)
  g.circle(sp.x, sp.y - 13 * sp.s, 3 * sp.s).fill(0x2a2624)
  potPlant(g, [wallX(plan, side, 20), 136, z1 - 16], 1, 'fern', 4)
  // top shelf: the turntable
  block(g, wallBox(plan, side, 6, 34, 198, 206, z0 + 6, z1 - 20), 0x6a4026)
  const tt = at([wallX(plan, side, 20), 207, z0 + 26])
  g.ellipse(tt.x, tt.y, 14 * tt.s, 5 * tt.s)
    .fill(0x121014)
    .stroke(THIN)
  g.ellipse(tt.x, tt.y, 4 * tt.s, 1.5 * tt.s).fill(0xc8302a)
  // on top: a vase with bare branches, and a trailing plant
  const v = at([wallX(plan, side, 20), h, z0 + 16])
  g.ellipse(v.x, v.y - 12 * v.s, 7 * v.s, 12 * v.s)
    .fill(0x1e1a1c)
    .stroke(THIN)
  for (let b = 0; b < 6; b++) {
    const a = -Math.PI / 2 + (b - 2.5) * 0.22
    const len = (70 + (b % 3) * 20) * v.s
    const ex = v.x + Math.cos(a) * len
    const ey = v.y - 22 * v.s + Math.sin(a) * len
    g.moveTo(v.x, v.y - 22 * v.s)
      .quadraticCurveTo(
        v.x + Math.cos(a) * len * 0.5 + 4,
        v.y - 22 * v.s + Math.sin(a) * len * 0.5,
        ex,
        ey,
      )
      .stroke({ color: 0x3a2418, width: 1.2 })
    for (let k = 1; k < 5; k++) {
      const t = k / 5
      g.circle(v.x + (ex - v.x) * t + 2, v.y - 22 * v.s + (ey - v.y + 22 * v.s) * t, 1.6).fill(
        0xf2e2bd,
      )
    }
  }
  const pp = at([wallX(plan, side, 20), h, z1 - 18])
  potPlant(g, [wallX(plan, side, 20), h, z1 - 18], 1, 'pothos', 5)
  vines(g, pp.x, pp.y, pp.s, 4, 90, 7)
}

/** a kitchen counter along the other wall: cupboards, a worktop, open shelves */
export function counter(ctx: Ctx, plan: LoungePlan) {
  const side = -plan.books
  const g = ctx.layer()
  const z0 = 250
  const z1 = 396
  const d = 60
  const fronts =
    plan.theme === 'tokyo'
      ? 0xe8dcc0
      : plan.theme === 'new-york'
        ? 0x2f4a4a
        : plan.theme === 'venice'
          ? 0x5a2a2a
          : 0x8aa08a
  block(g, wallBox(plan, side, 0, d, 6, 90, z0, z1), fronts)
  const face = wallX(plan, side, d)
  for (let z = z0 + 36; z < z1; z += 36)
    g.poly(flat([face, 10, z], [face, 86, z]), false).stroke({
      color: shade(fronts, -0.4),
      width: 1,
    })
  for (let z = z0 + 18; z < z1; z += 36) {
    const [kx, ky] = project([face, 70, z])
    g.circle(kx, ky, 1.8).fill(BRASS)
  }
  const top =
    plan.theme === 'paris' || plan.theme === 'venice'
      ? 0xf2ece4
      : plan.theme === 'tokyo'
        ? 0xb8864a
        : 0x3a3634
  block(g, wallBox(plan, side, 0, d + 6, 90, 97, z0 - 4, z1), top)
  // splashback tiles
  const tile = mix(fronts, 0xf2ece4, 0.6)
  const X = wallX(plan, side, 1)
  fillPoly(g, flat([X, 97, z0], [X, 97, z1], [X, 170, z1], [X, 170, z0]), tile, THIN)
  for (let y = 97; y < 170; y += 12)
    g.poly(flat([X, y, z0], [X, y, z1]), false).stroke({ color: shade(tile, -0.2), width: 0.6 })
  for (let z = z0; z < z1; z += 16)
    g.poly(flat([X, 97, z], [X, 170, z]), false).stroke({ color: shade(tile, -0.2), width: 0.6 })
  // open shelves with jars, plates, a plant
  for (const y of [196, 256]) {
    block(g, wallBox(plan, side, 0, 26, y - 4, y, z0 + 10, z1 - 6), plan.wood, THIN)
    let i = y
    for (let z = z0 + 18; z < z1 - 20; z += 22) {
      const p = at([wallX(plan, side, 13), y, z])
      if (i % 4 === 0) potPlant(g, [wallX(plan, side, 13), y, z], 0.7, 'pothos', i)
      else if (i % 4 === 1) {
        g.roundRect(p.x - 5 * p.s, p.y - 16 * p.s, 10 * p.s, 16 * p.s, 2)
          .fill({ color: 0xc8e8f0, alpha: 0.55 })
          .stroke(THIN)
        g.rect(p.x - 4 * p.s, p.y - 8 * p.s, 8 * p.s, 7 * p.s).fill(
          [0xe8c25a, 0xc8302a, 0x8a5a3a][z % 3]!,
        )
        g.rect(p.x - 5 * p.s, p.y - 19 * p.s, 10 * p.s, 3 * p.s).fill(0x6a3a22)
      } else if (i % 4 === 2) {
        for (let k = 0; k < 3; k++)
          g.ellipse(p.x, p.y - 2 * p.s - k * 2.2 * p.s, 9 * p.s, 2.2 * p.s)
            .fill(0xf2ece4)
            .stroke({ ...THIN, width: 0.5 })
      } else {
        g.rect(p.x - 4 * p.s, p.y - 14 * p.s, 8 * p.s, 14 * p.s)
          .fill(plan.accent)
          .stroke(THIN)
      }
      i++
    }
    vines(g, ...xyOf(wallX(plan, side, 14), y, z1 - 14), at([0, 0, z1]).s, 3, 50, y)
  }
  // on the worktop: a kettle, a fruit bowl, bottles, a chopping board
  const w = (dd: number, z: number): P3 => [wallX(plan, side, dd), 97, z]
  const kp = at(w(30, z1 - 24))
  g.moveTo(kp.x - 9 * kp.s, kp.y)
    .lineTo(kp.x - 7 * kp.s, kp.y - 18 * kp.s)
    .lineTo(kp.x + 7 * kp.s, kp.y - 18 * kp.s)
    .lineTo(kp.x + 9 * kp.s, kp.y)
    .closePath()
    .fill(plan.theme === 'tokyo' ? 0xf2ece4 : 0xc8302a)
    .stroke(THIN)
  g.moveTo(kp.x + 7 * kp.s, kp.y - 14 * kp.s)
    .lineTo(kp.x + 14 * kp.s, kp.y - 18 * kp.s)
    .stroke({ color: 0x1e1a1c, width: 2 })
  const fb = at(w(32, z0 + 50))
  g.ellipse(fb.x, fb.y - 4 * fb.s, 14 * fb.s, 5 * fb.s)
    .fill(0xf2ece4)
    .stroke(THIN)
  for (const [fx, c] of [
    [-6, 0xe8603a],
    [2, 0xe8c25a],
    [8, 0xc8302a],
    [-1, 0x7aa83a],
  ] as const)
    g.circle(fb.x + fx * fb.s, fb.y - 9 * fb.s, 4 * fb.s)
      .fill(c)
      .stroke({ ...THIN, width: 0.5 })
  for (const [i, z] of [z0 + 80, z0 + 88, z0 + 96].entries()) {
    const b = at(w(18, z))
    const c = [0x2a5a2a, 0x8a1a12, 0xd8c8a8][i]!
    g.rect(b.x - 3 * b.s, b.y - 24 * b.s, 6 * b.s, 24 * b.s)
      .fill(c)
      .stroke({ ...THIN, width: 0.6 })
    g.rect(b.x - 1.4 * b.s, b.y - 32 * b.s, 2.8 * b.s, 8 * b.s).fill(c)
  }
  block(g, wallBox(plan, side, 34, 56, 97, 99, z0 + 14, z0 + 40), 0xa86a3a, THIN)
}

function xyOf(x: number, y: number, z: number): [number, number] {
  const [px, py] = project([x, y, z])
  return [px, py]
}

/** a brass bar cart: bottles, glasses, an ice bucket */
export function barCart(ctx: Ctx, plan: LoungePlan) {
  const side = -plan.books
  const g = ctx.layer()
  const z0 = 108
  const z1 = 164
  const d0 = 6
  const d1 = 52
  for (const y of [18, 70]) {
    block(g, wallBox(plan, side, d0, d1, y - 2, y, z0, z1), BRASS, THIN)
    g.poly(
      flat(
        [wallX(plan, side, d0), y + 0.2, z0],
        [wallX(plan, side, d1), y + 0.2, z0],
        [wallX(plan, side, d1), y + 0.2, z1],
        [wallX(plan, side, d0), y + 0.2, z1],
      ),
    ).fill({
      color: 0xc8e8f0,
      alpha: 0.25,
    })
  }
  for (const d of [d0, d1])
    for (const z of [z0, z1])
      g.poly(flat([wallX(plan, side, d), 6, z], [wallX(plan, side, d), 84, z]), false).stroke({
        color: BRASS,
        width: 2,
      })
  for (const z of [z0, z1]) {
    const wp = at([wallX(plan, side, d1), 4, z])
    g.circle(wp.x, wp.y, 4 * wp.s).fill(0x1e1a1c)
  }
  // a handle
  g.poly(flat([wallX(plan, side, d1), 84, z0], [wallX(plan, side, d1), 84, z1]), false).stroke({
    color: BRASS,
    width: 3,
  })
  const bottles = [0x2a5a2a, 0x8a1a12, 0xe8c25a, 0x3a2a6a, 0xd8c8a8, 0xe8603a]
  for (const [i, z] of [z0 + 8, z0 + 18, z0 + 28, z0 + 38].entries()) {
    const b = at([wallX(plan, side, 28), 70, z])
    const c = bottles[(i + plan.posters[2]!) % bottles.length]!
    const tall = 26 + (i % 2) * 6
    g.roundRect(b.x - 4 * b.s, b.y - tall * b.s, 8 * b.s, tall * b.s, 2)
      .fill({ color: c, alpha: 0.85 })
      .stroke({ ...THIN, width: 0.6 })
    g.rect(b.x - 1.6 * b.s, b.y - (tall + 9) * b.s, 3.2 * b.s, 9 * b.s).fill(c)
    if (i % 2 === 0)
      glow(ctx.lights, b.x, b.y - tall * 0.5 * b.s, (14 * b.s) / 128, (26 * b.s) / 128, c, 0.35)
  }
  // glasses and an ice bucket below
  for (const z of [z0 + 10, z0 + 20, z0 + 30]) {
    const p = at([wallX(plan, side, 30), 18, z])
    g.moveTo(p.x - 5 * p.s, p.y - 14 * p.s)
      .lineTo(p.x + 5 * p.s, p.y - 14 * p.s)
      .lineTo(p.x, p.y - 8 * p.s)
      .closePath()
      .fill({ color: 0xc8e8ff, alpha: 0.5 })
      .stroke({ ...THIN, width: 0.5 })
    g.moveTo(p.x, p.y - 8 * p.s)
      .lineTo(p.x, p.y)
      .stroke({ color: 0xc8e8ff, width: 0.8 })
  }
  const ib = at([wallX(plan, side, 30), 18, z1 - 14])
  g.rect(ib.x - 8 * ib.s, ib.y - 16 * ib.s, 16 * ib.s, 16 * ib.s)
    .fill(0xc8ccd0)
    .stroke(THIN)
  potPlant(g, [wallX(plan, side, 30), 70, z1 - 10], 0.8, 'snake', 3)
}

/** frames on the wall above the bar cart */
export function gallery(ctx: Ctx, plan: LoungePlan) {
  const side = -plan.books
  const area = ctx.container()
  const frames = [
    { z0: 104, z1: 146, y0: 240, y1: 300 },
    { z0: 152, z1: 214, y0: 214, y1: 300 },
    { z0: 112, z1: 160, y0: 312, y1: 376 },
    { z0: 168, z1: 206, y0: 310, y1: 362 },
  ]
  frames.forEach((f, i) => {
    const X = wallX(plan, side, 1)
    const g = new Graphics()
    g.poly(
      flat(
        [X, f.y0 - 4, f.z0 - 4],
        [X, f.y0 - 4, f.z1 + 4],
        [X, f.y1 + 4, f.z1 + 4],
        [X, f.y1 + 4, f.z0 - 4],
      ),
    )
      .fill(i % 2 ? BRASS : 0x2a1a10)
      .stroke(LINE)
    const pic = new Container()
    const art = new Graphics()
    paintPoster(art, plan.posters[i % plan.posters.length]! + i)
    const m = wallPicture(plan, side, 1.5, f.y0, f.y1, f.z0, f.z1)
    m.c *= 100 / POSTER_H
    m.d *= 100 / POSTER_H
    art.setFromMatrix(m)
    const mask = new Graphics()
      .poly(flat([X, f.y0, f.z0], [X, f.y0, f.z1], [X, f.y1, f.z1], [X, f.y1, f.z0]))
      .fill(0xffffff)
    pic.addChild(art, mask)
    pic.mask = mask
    area.addChild(g, pic)
  })
  if (plan.neon) {
    // a neon sign over the counter
    const live = ctx.live(ctx.container())
    const text = new Text({
      text: plan.neon,
      style: {
        fontFamily: SIGN_FONT,
        fontSize: 40,
        fill: plan.accent === 0x3ad8ff ? 0x3ad8ff : 0xff3a6a,
      },
      resolution: 2,
    })
    const m = wallPicture(plan, side, 1, 300, 360, 270, 380)
    text.setFromMatrix(
      m.clone().append(new Matrix(100 / text.width, 0, 0, 100 / text.height, 0, 0)),
    )
    live.addChild(text)
    const [cx, cy] = project([wallX(plan, side, 1), 330, 325])
    const halo = glow(ctx.lights, cx, cy, 1.2, 0.6, text.style.fill as number, 0.55)
    ctx.pool([wallX(plan, side, 30), 300, 325], 220, 0.35)
    ctx.anim.push((t) => {
      const flick = Math.sin(t * 23) > 0.97 ? 0.4 : 1
      text.alpha = flick
      halo.alpha = 0.55 * flick
    })
  }
}

/** Paris: a marble fireplace between the windows, a gilt mirror over it */
export function fireplace(ctx: Ctx, plan: LoungePlan) {
  const B = ROOM.back
  const g = ctx.layer()
  const marble = 0xf2ece4
  block(g, { x0: -84, x1: 84, y0: 0, y1: 120, z0: B - 20, z1: B }, marble)
  fillPoly(
    g,
    flat([-46, 8, B - 20], [46, 8, B - 20], [46, 82, B - 20], [-46, 82, B - 20]),
    0x1e1210,
    LINE,
  )
  block(g, { x0: -96, x1: 96, y0: 120, y1: 130, z0: B - 28, z1: B }, shade(marble, -0.05))
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = project([-70 + i * 40, 60 + (i % 2) * 30, B - 20])
    g.moveTo(ax, ay)
      .quadraticCurveTo(ax + 10, ay - 8, ax + 22, ay + 4)
      .stroke({ color: 0xb8b0a8, width: 0.8 })
  }
  // the fire
  const fire = ctx.live(ctx.container())
  const flames = new Graphics()
  fire.addChild(flames)
  const logs = at([0, 10, B - 30])
  g.roundRect(logs.x - 30 * logs.s, logs.y - 8 * logs.s, 60 * logs.s, 8 * logs.s, 4)
    .fill(0x4a2a1a)
    .stroke(THIN)
  const lit = new Graphics()
  ctx.lights.addChild(lit)
  ctx.anim.push((t) => {
    flames.clear()
    lit.clear()
    for (let i = 0; i < 5; i++) {
      const fx = logs.x + (i - 2) * 10 * logs.s
      const h = (24 + Math.sin(t * 7 + i * 1.7) * 6 + Math.sin(t * 13 + i) * 3) * logs.s
      for (const [d, c] of [
        [flames, 0xe8603a],
        [lit, 0xffb04a],
      ] as const)
        d.moveTo(fx - 7 * logs.s, logs.y - 6 * logs.s)
          .quadraticCurveTo(
            fx - 4 * logs.s,
            logs.y - h * 0.6,
            fx + Math.sin(t * 5 + i) * 3,
            logs.y - h,
          )
          .quadraticCurveTo(fx + 4 * logs.s, logs.y - h * 0.6, fx + 7 * logs.s, logs.y - 6 * logs.s)
          .closePath()
          .fill({ color: c, alpha: d === lit ? 0.6 : 1 })
    }
  })
  glow(ctx.lights, logs.x, logs.y - 20 * logs.s, 1.6, 1.1, 0xff7a2a, 0.55)
  ctx.pool([0, 30, B - 40], 340, 0.7)
  // on the mantel: candlesticks, a clock, a little vase
  candle(ctx, g, [-74, 130, B - 14], 16)
  candle(ctx, g, [74, 130, B - 14], 16)
  const ck = at([0, 130, B - 14])
  g.roundRect(ck.x - 12 * ck.s, ck.y - 22 * ck.s, 24 * ck.s, 22 * ck.s, 8 * ck.s)
    .fill(BRASS)
    .stroke(THIN)
  g.circle(ck.x, ck.y - 12 * ck.s, 7 * ck.s)
    .fill(0xf2ece4)
    .stroke({ ...THIN, width: 0.6 })
  potPlant(g, [42, 130, B - 14], 0.8, 'flowers', 2)
  // the mirror: gilt, arched, showing the room's lamps as smudges of light
  const mg = ctx.layer()
  const [mx0, my0] = project([-62, 420, B])
  const [mx1, my1] = project([62, 150, B])
  const r = (mx1 - mx0) / 2
  const arch = (d: Graphics, pad: number) =>
    d
      .moveTo(mx0 - pad, my1 + pad)
      .lineTo(mx0 - pad, my0 + r)
      .arc(mx0 + r, my0 + r, r + pad, Math.PI, 0)
      .lineTo(mx1 + pad, my1 + pad)
      .closePath()
  arch(mg, 9).fill(BRASS)
  arch(mg, 9).stroke(LINE)
  // old silvered glass: dark and a little blue, with the room swimming in it
  const glass = mix(shade(plan.wall, -0.55), 0x3a4a6a, 0.45)
  arch(mg, 0).fill(glass)
  const h = my1 - my0
  // the window behind you, reflected: a pale arch with its glazing bars
  const wx = mx0 + r * 0.95
  const ww = r * 0.7
  const wy = my0 + h * 0.18
  const wh = h * 0.5
  mg.moveTo(wx - ww / 2, wy + wh)
    .lineTo(wx - ww / 2, wy + ww / 2)
    .arc(wx, wy + ww / 2, ww / 2, Math.PI, 0)
    .lineTo(wx + ww / 2, wy + wh)
    .closePath()
    .fill({ color: 0x8aa0c8, alpha: 0.28 })
  mg.moveTo(wx, wy)
    .lineTo(wx, wy + wh)
    .moveTo(wx - ww / 2, wy + wh * 0.55)
    .lineTo(wx + ww / 2, wy + wh * 0.55)
    .stroke({ color: glass, width: 2, alpha: 0.8 })
  // the lamps as warm smudges
  mg.ellipse(mx0 + r * 0.45, my0 + h * 0.72, r * 0.16, r * 0.11).fill({
    color: 0xffd27a,
    alpha: 0.4,
  })
  mg.ellipse(mx0 + r * 1.55, my0 + h * 0.66, r * 0.12, r * 0.09).fill({
    color: 0xffb04a,
    alpha: 0.35,
  })
  mg.ellipse(mx0 + r, my0 + r * 0.55, r * 0.22, r * 0.08).fill({ color: 0xfff0c8, alpha: 0.25 })
  // a sheen across it, and the silvering going spotty at the edges
  mg.poly([
    mx0 + r * 0.15,
    my1,
    mx0 + r * 0.85,
    my0 + r * 0.5,
    mx0 + r * 1.05,
    my0 + r * 0.5,
    mx0 + r * 0.35,
    my1,
  ]).fill({ color: 0xffffff, alpha: 0.07 })
  mg.poly([
    mx0 + r * 1.2,
    my1,
    mx0 + r * 1.75,
    my0 + h * 0.35,
    mx0 + r * 1.82,
    my0 + h * 0.35,
    mx0 + r * 1.3,
    my1,
  ]).fill({ color: 0xffffff, alpha: 0.05 })
  for (const [fx, fy, fr] of [
    [0.12, 0.9, 0.06],
    [0.2, 0.96, 0.04],
    [1.85, 0.88, 0.05],
    [1.9, 0.5, 0.035],
    [0.1, 0.4, 0.04],
  ] as const)
    mg.circle(mx0 + r * fx, my0 + h * fy, r * fr).fill({ color: 0x1a1410, alpha: 0.35 })
  arch(mg, 0).stroke(THIN)
  for (let i = 0; i < 8; i++) {
    const a = Math.PI + (i / 7) * Math.PI
    mg.circle(mx0 + r + Math.cos(a) * (r + 5), my0 + r + Math.sin(a) * (r + 5), 2.2).fill(
      shade(BRASS, 0.3),
    )
  }
}

// -- plants ------------------------------------------------------------------

const LEAVES = [0x3a7a3a, 0x5a9a3a, 0x2e5a2e, 0x4a8a4a]

export function tree(ctx: Ctx, kind: TreeKind, x: number, z: number, size: number) {
  const g = ctx.layer()
  const foot = at([x, 0, z])
  const s = foot.s * size
  // a big pot
  const pot = [0xb8643a, 0xf2ece4, 0x2a2624, 0xe8c25a][Math.abs(Math.round(x)) % 4]!
  g.moveTo(foot.x - 24 * s, foot.y - 44 * s)
    .lineTo(foot.x + 24 * s, foot.y - 44 * s)
    .lineTo(foot.x + 18 * s, foot.y)
    .lineTo(foot.x - 18 * s, foot.y)
    .closePath()
    .fill(pot)
    .stroke(THIN)
  g.rect(foot.x - 26 * s, foot.y - 48 * s, 52 * s, 6 * s)
    .fill(shade(pot, -0.15))
    .stroke(THIN)
  const base = foot.y - 46 * s
  const leaf = (lx: number, ly: number, rx: number, ry: number, rot: number, c: number) => {
    const d = { x: Math.sin(rot), y: -Math.cos(rot) }
    g.moveTo(lx - d.x * ry, ly - d.y * ry)
      .quadraticCurveTo(lx + d.y * rx * 1.4, ly - d.x * rx * 1.4, lx + d.x * ry, ly + d.y * ry)
      .quadraticCurveTo(lx - d.y * rx * 1.4, ly + d.x * rx * 1.4, lx - d.x * ry, ly - d.y * ry)
      .fill(c)
      .stroke({ ...THIN, width: 0.6 })
    g.moveTo(lx - d.x * ry * 0.8, ly - d.y * ry * 0.8)
      .lineTo(lx + d.x * ry * 0.8, ly + d.y * ry * 0.8)
      .stroke({ color: shade(c, -0.35), width: 0.7 })
  }
  let n = 0
  const r = () => {
    n = (n * 9301 + 49297) % 233280
    return n / 233280
  }
  n = Math.abs(Math.round(x * 13 + z * 7))
  switch (kind) {
    case 'fig': {
      // a fiddle leaf fig: a trunk with big paddle leaves all the way up
      const top = base - 250 * s
      g.moveTo(foot.x, base)
        .quadraticCurveTo(foot.x + 8 * s, (base + top) / 2, foot.x - 4 * s, top)
        .stroke({ color: 0x5a3a22, width: 5 * s })
      for (let i = 0; i < 26; i++) {
        const t = i / 26
        const ly = base - 40 * s - t * 220 * s
        const lx = foot.x + (i % 2 ? 1 : -1) * (14 + r() * 30) * s
        leaf(lx, ly, 10 * s, 18 * s, (i % 2 ? 1 : -1) * (0.5 + r() * 0.5), LEAVES[i % 4]!)
      }
      break
    }
    case 'olive': {
      // a thin twisting trunk and clouds of small silvery leaves
      const top = base - 230 * s
      g.moveTo(foot.x, base)
        .bezierCurveTo(foot.x - 14 * s, base - 80 * s, foot.x + 16 * s, base - 150 * s, foot.x, top)
        .stroke({ color: 0x6a5a4a, width: 4 * s })
      for (let i = 0; i < 90; i++) {
        const a = r() * Math.PI * 2
        const d = Math.sqrt(r()) * 60 * s
        leaf(
          foot.x + Math.cos(a) * d,
          top + 30 * s + Math.sin(a) * d * 0.8,
          2.6 * s,
          8 * s,
          a,
          [0x8a9a6a, 0x6a7a4a, 0xa8b088][i % 3]!,
        )
      }
      break
    }
    case 'palm': {
      for (let i = 0; i < 11; i++) {
        const a = -Math.PI / 2 + (i - 5) * 0.3
        const len = (150 + (i % 3) * 30) * s
        const tx = foot.x + Math.cos(a) * len
        const ty = base - 60 * s + Math.sin(a) * len * 0.9
        g.moveTo(foot.x, base)
          .quadraticCurveTo(foot.x + Math.cos(a) * len * 0.3, base - len * 0.7, tx, ty)
          .stroke({ color: 0x3a6a2a, width: 2 * s })
        for (let f = 1; f < 12; f++) {
          const t = f / 12
          const fx = foot.x + (tx - foot.x) * t
          const fy = base + (ty - base) * t - Math.sin(t * Math.PI) * len * 0.25
          for (const sd of [-1, 1])
            g.moveTo(fx, fy)
              .lineTo(fx + sd * 14 * s * (1 - t * 0.5), fy + 12 * s)
              .stroke({ color: LEAVES[(f + i) % 4]!, width: 2.4 * s })
        }
      }
      break
    }
    case 'monstera': {
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (i - 4) * 0.34
        const len = (60 + (i % 3) * 30) * s
        const lx = foot.x + Math.cos(a) * len
        const ly = base + Math.sin(a) * len
        g.moveTo(foot.x, base)
          .quadraticCurveTo(foot.x, (base + ly) / 2, lx, ly)
          .stroke({ color: 0x2e5a2e, width: 2 * s })
        const c = LEAVES[i % 4]!
        g.ellipse(lx, ly, 26 * s, 20 * s)
          .fill(c)
          .stroke({ ...THIN, width: 0.6 })
        for (let k = -2; k <= 2; k++)
          g.moveTo(lx, ly)
            .lineTo(lx + k * 10 * s, ly + (k % 2 ? 18 : -18) * s)
            .stroke({ color: shade(c, -0.4), width: 2 * s })
      }
      break
    }
  }
}

/** a pot hanging off a hook in the ceiling, trailing */
export function hangingPlant(ctx: Ctx, x: number, z: number, drop: number, i: number) {
  const g = ctx.layer()
  const C = ROOM.ceiling
  const p = at([x, C - drop, z])
  const [, top] = project([x, C, z])
  for (const dx of [-10, 0, 10])
    g.moveTo(p.x, top)
      .lineTo(p.x + dx * p.s, p.y - 14 * p.s)
      .stroke({ color: 0xc8a070, width: 1 })
  g.moveTo(p.x - 13 * p.s, p.y - 14 * p.s)
    .lineTo(p.x + 13 * p.s, p.y - 14 * p.s)
    .quadraticCurveTo(p.x + 12 * p.s, p.y, p.x, p.y)
    .quadraticCurveTo(p.x - 12 * p.s, p.y, p.x - 13 * p.s, p.y - 14 * p.s)
    .fill([0xf2ece4, 0xb8643a, 0x2f6b66][i % 3]!)
    .stroke(THIN)
  potPlant(g, [x, C - drop + 2, z], 0.9, i % 2 ? 'pothos' : 'fern', i)
  vines(g, p.x, p.y - 10 * p.s, p.s, 6, 110, i)
}

// -- odds and ends -----------------------------------------------------------

/** the things that pile up on a floor when people are comfortable */
export function clutter(ctx: Ctx, plan: LoungePlan) {
  const g = ctx.layer()
  // a stack of books by the sofa
  const sx = -plan.books * 150
  for (let i = 0; i < 5; i++)
    block(
      g,
      {
        x0: sx - 14 + (i % 2) * 2,
        x1: sx + 14 - (i % 3),
        y0: i * 5,
        y1: i * 5 + 5,
        z0: plan.sofaZ - 22,
        z1: plan.sofaZ - 2,
      },
      BOOKS[(i + 4) % BOOKS.length]!,
      { ...THIN, width: 0.5 },
    )
  // a basket of blankets
  const b = at([plan.books * 226, 0, 40])
  g.moveTo(b.x - 26 * b.s, b.y - 30 * b.s)
    .lineTo(b.x + 26 * b.s, b.y - 30 * b.s)
    .lineTo(b.x + 22 * b.s, b.y)
    .lineTo(b.x - 22 * b.s, b.y)
    .closePath()
    .fill(0xc8a070)
    .stroke(THIN)
  for (let k = 1; k < 5; k++)
    g.moveTo(b.x - 26 * b.s, b.y - 30 * b.s + k * 6 * b.s)
      .lineTo(b.x + 26 * b.s, b.y - 30 * b.s + k * 6 * b.s)
      .stroke({ color: 0x8a6a40, width: 1 })
  g.ellipse(b.x - 4 * b.s, b.y - 34 * b.s, 22 * b.s, 8 * b.s)
    .fill(mix(plan.accent, 0xf2e2bd, 0.4))
    .stroke(THIN)
  g.ellipse(b.x + 8 * b.s, b.y - 38 * b.s, 14 * b.s, 6 * b.s)
    .fill(plan.chairs[1])
    .stroke(THIN)
}
