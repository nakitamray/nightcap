import { Container, Graphics } from 'pixi.js'
import { glow } from '../layers/neon'
import { at, type Ctx } from './context'
import { BOOKS } from './furniture'
import { block, hex, INK, LINE, mix, shade, THIN } from './paint'
import type { Piece } from './plan'
import { paintPoster } from './posters'
import { flat, project, ROOM, type Box, type P3 } from './projection'
import { cushion, drape, pillow, potPlant, vines } from './soft'

const BRASS = 0xd9a54a
const WOOD = 0x5a3420

/** helpers for something standing against a side wall in a zone */
function against(p: Piece) {
  const left = p.zone.wall === 'left'
  const wx = (depth: number) => (left ? ROOM.left + depth : ROOM.right - depth)
  const box = (d0: number, d1: number, y0: number, y1: number, z0: number, z1: number): Box => {
    const a = wx(d0)
    const b = wx(d1)
    return { x0: Math.min(a, b), x1: Math.max(a, b), y0, y1, z0, z1 }
  }
  const mid = (p.zone.z0 + p.zone.z1) / 2
  return { left, wx, box, mid, z0: p.zone.z0, z1: p.zone.z1 }
}

export function drawExtra(ctx: Ctx, p: Piece, index: number) {
  switch (p.kind) {
    case 'bookcase':
      return bookcase(ctx, p, index)
    case 'sofa':
      return sofa(ctx, p)
    case 'armchair':
      return armchair(ctx, p)
    case 'piano':
      return piano(ctx, p)
    case 'easel':
      return easel(ctx, p)
    case 'records':
      return records(ctx, p)
    case 'plantstand':
      return plantstand(ctx, p)
    case 'tree':
      return tree(ctx, p)
    case 'ladder':
      return ladder(ctx, p)
    case 'trunk':
      return trunk(ctx, p)
    case 'floorlamp':
      return floorLamp(ctx, p)
    case 'mirror':
      return mirror(ctx, p)
    case 'monstera':
      return monstera(ctx, p)
  }
}

/** a tall bookcase, crammed: books, a plant spilling off the top, odds and ends */
function bookcase(ctx: Ctx, p: Piece, index: number) {
  const a = against(p)
  const g = ctx.layer('shelves')
  const height = 340
  const z0 = a.z0 + 4
  const z1 = a.z1 - 4
  const wood = [WOOD, 0x3a2418, 0x8a5a3a][index % 3]!
  block(g, a.box(0, 34, 0, height, z0, z1), wood)
  const face = a.wx(34)
  const shelfH = 56
  let n = Math.floor(ctx.rng() * 11)
  for (let y = 12; y + shelfH <= height; y += shelfH) {
    g.poly(
      flat([face, y, z0], [face, y, z1], [face, y + shelfH - 4, z1], [face, y + shelfH - 4, z0]),
    ).fill(0x160c08)
    g.poly(flat([face, y, z0], [face, y, z1]), false).stroke({ color: shade(wood, 0.2), width: 3 })
    let z = z0 + 3
    while (z < z1 - 4) {
      const kind = (n * 7) % 13
      if (kind === 5 && z < z1 - 24) {
        potPlant(
          ctx,
          g,
          [a.wx(18), y, z + 10],
          0.7,
          ctx.plan.variant.plants[n % ctx.plan.variant.plants.length]!,
          n,
        )
        z += 22
      } else if (kind === 9 && z < z1 - 22) {
        // a little framed photo, leaning
        const [px, py] = project([face, y, z + 9])
        const k = at([face, y, z]).s
        g.rect(px - 7 * k, py - 20 * k, 14 * k, 20 * k)
          .fill(0x2a1a10)
          .stroke(THIN)
        g.rect(px - 5 * k, py - 18 * k, 10 * k, 13 * k).fill(BOOKS[(n + 3) % BOOKS.length]!)
        z += 18
      } else if (kind === 2) {
        // a stack lying flat
        for (let s = 0; s < 3; s++)
          g.poly(
            flat(
              [face, y + s * 5, z],
              [face, y + s * 5, z + 18],
              [face, y + s * 5 + 4, z + 18],
              [face, y + s * 5 + 4, z],
            ),
          )
            .fill(BOOKS[(n + s) % BOOKS.length]!)
            .stroke({ ...THIN, width: 0.4 })
        z += 20
      } else {
        const bw = 4 + (n % 3) * 1.6
        const bh = (shelfH - 10) * (0.66 + (n % 5) * 0.07)
        g.poly(flat([face, y, z], [face, y, z + bw], [face, y + bh, z + bw], [face, y + bh, z]))
          .fill(BOOKS[n % BOOKS.length]!)
          .stroke({ ...THIN, width: 0.4 })
        z += bw + 0.5
      }
      n++
    }
  }
  // on top: a trailing plant and a box
  const topP = at([a.wx(17), height, a.mid])
  potPlant(ctx, g, [a.wx(17), height, a.mid - 14], 0.9, 'pothos', index)
  vines(g, topP.x, topP.y - 2, topP.s, 5, 80, index)
  block(g, a.box(6, 28, height, height + 16, a.mid + 8, a.mid + 34), 0xc8a070)
  ctx.hit('shelves', (h) =>
    h.poly(flat([face, 0, z0], [face, 0, z1], [face, height + 20, z1], [face, height + 20, z0])),
  )
}

function sofa(ctx: Ctx, p: Piece) {
  const a = against(p)
  const g = ctx.layer()
  const colour = [0xc8642e, 0x2f5a5a, 0x7a3a4a][ctx.plan.variant.name.length % 3]!
  const z0 = a.z0 + 2
  const z1 = a.z1 - 2
  for (const z of [z0 + 6, z1 - 8]) block(g, a.box(60, 66, 0, 10, z, z + 4), 0x2a1a10, THIN)
  block(g, a.box(0, 72, 10, 36, z0, z1), shade(colour, -0.1))
  block(g, a.box(0, 22, 36, 90, z0 + 8, z1 - 8), colour)
  // plump seat cushions
  const n = 3
  const step = (z1 - z0 - 28) / n
  for (let i = 0; i < n; i++) {
    const za = z0 + 14 + i * step
    cushion(
      g,
      [
        [a.wx(70), 38, za + 2],
        [a.wx(70), 38, za + step - 2],
        [a.wx(22), 40, za + step - 2],
        [a.wx(22), 40, za + 2],
      ],
      shade(colour, 0.06),
    )
  }
  // arms
  for (const [za, zb] of [
    [z0, z0 + 14],
    [z1 - 14, z1],
  ] as [number, number][]) {
    block(g, a.box(0, 72, 10, 58, za, zb), colour)
  }
  // back cushions and a couple of throw pillows
  for (let i = 0; i < n; i++) {
    const pz = z0 + 14 + (i + 0.5) * step
    const pp = at([a.wx(18), 70, pz])
    pillow(g, pp.x, pp.y, 34 * pp.s, 30 * pp.s, shade(colour, 0.08), 0)
  }
  const accents = [0xe8c25a, 0x2f6b66, 0xf2e2bd, 0xc8302a]
  for (const [i, pz] of [
    [0, z0 + 24],
    [1, z1 - 26],
  ] as [number, number][]) {
    const pp = at([a.wx(34), 58, pz])
    pillow(
      g,
      pp.x,
      pp.y,
      24 * pp.s,
      22 * pp.s,
      accents[(i + ctx.plan.variant.name.length) % 4]!,
      (i ? 1 : -1) * 0.3,
    )
  }
  // a throw over one arm
  const edge: P3[] = []
  for (let i = 0; i <= 6; i++) edge.push([a.wx(8 + i * 10), 60, z1 - 7])
  drape(ctx, g, edge, 40, 0xf2e2bd, { wave: 5, folds: 4 })
}

function armchair(ctx: Ctx, p: Piece) {
  const a = against(p)
  const g = ctx.layer()
  const colour = [0x2f6b66, 0xa8432e, 0x5a4a7a, 0xc88a3a][ctx.plan.variant.paneTop % 4]!
  const z0 = a.mid - 32
  const z1 = a.mid + 32
  for (const z of [z0 + 4, z1 - 8]) block(g, a.box(56, 60, 0, 12, z, z + 4), 0x2a1a10, THIN)
  block(g, a.box(4, 64, 12, 38, z0, z1), shade(colour, -0.1))
  block(g, a.box(0, 18, 38, 118, z0 + 4, z1 - 4), colour)
  // wings
  for (const [za, zb] of [
    [z0, z0 + 10],
    [z1 - 10, z1],
  ] as [number, number][])
    block(g, a.box(0, 64, 12, 66, za, zb), colour)
  cushion(
    g,
    [
      [a.wx(62), 40, z0 + 10],
      [a.wx(62), 40, z1 - 10],
      [a.wx(18), 42, z1 - 10],
      [a.wx(18), 42, z0 + 10],
    ],
    shade(colour, 0.08),
  )
  const pp = at([a.wx(24), 66, a.mid])
  pillow(g, pp.x, pp.y, 26 * pp.s, 22 * pp.s, 0xf2e2bd, 0.15)
  const edge: P3[] = []
  for (let i = 0; i <= 5; i++) edge.push([a.wx(10 + i * 10), 68, z0 + 4])
  drape(ctx, g, edge, 44, 0xc8302a, { wave: 4, folds: 3 })
}

function piano(ctx: Ctx, p: Piece) {
  const a = against(p)
  const g = ctx.layer()
  const black = 0x1a1210
  const z0 = a.mid - 56
  const z1 = a.mid + 56
  block(g, a.box(0, 44, 0, 132, z0, z1), black)
  block(g, a.box(0, 60, 64, 74, z0 + 4, z1 - 4), shade(black, 0.15))
  // keys along the ledge
  const keys = new Graphics()
  const kx = a.wx(52)
  keys
    .poly(
      flat(
        [kx, 74.2, z0 + 8],
        [kx, 74.2, z1 - 8],
        [a.wx(60), 74.2, z1 - 8],
        [a.wx(60), 74.2, z0 + 8],
      ),
    )
    .fill(0xf6efe2)
  for (let z = z0 + 10; z < z1 - 10; z += 6) {
    keys
      .poly(flat([kx, 74.4, z], [a.wx(60), 74.4, z]), false)
      .stroke({ color: INK, width: 0.5, alpha: 0.6 })
    if (Math.round((z - z0) / 6) % 7 !== 2 && Math.round((z - z0) / 6) % 7 !== 6)
      keys
        .poly(
          flat(
            [a.wx(48), 74.6, z + 2],
            [a.wx(48), 74.6, z + 5],
            [a.wx(55), 74.6, z + 5],
            [a.wx(55), 74.6, z + 2],
          ),
        )
        .fill(INK)
  }
  ctx.back.addChild(keys)
  // music on the stand, candlesticks on top
  const [mx, my] = project([a.wx(46), 100, a.mid])
  const ms = at([a.wx(46), 100, a.mid]).s
  g.rect(mx - 14 * ms, my - 14 * ms, 28 * ms, 20 * ms)
    .fill(0xf2e2bd)
    .stroke(THIN)
  for (let l = 0; l < 4; l++)
    g.moveTo(mx - 12 * ms, my - 10 * ms + l * 4 * ms)
      .lineTo(mx + 12 * ms, my - 10 * ms + l * 4 * ms)
      .stroke({ color: INK, width: 0.5 })
  for (const z of [z0 + 14, z1 - 14]) candle(ctx, g, [a.wx(22), 132, z], 18)
  potPlant(ctx, g, [a.wx(22), 132, a.mid], 0.9, 'fern', 1)
  // the bench, with a cushion
  block(g, a.box(78, 106, 0, 40, a.mid - 30, a.mid + 30), black)
  cushion(
    g,
    [
      [a.wx(104), 41, a.mid - 28],
      [a.wx(104), 41, a.mid + 28],
      [a.wx(80), 43, a.mid + 28],
      [a.wx(80), 43, a.mid - 28],
    ],
    0x8e2416,
  )
}

function easel(ctx: Ctx, p: Piece) {
  const a = against(p)
  const base = at([a.wx(70), 0, a.mid])
  const g = ctx.layer()
  const s = base.s
  // the a-frame legs
  g.moveTo(base.x - 26 * s, base.y)
    .lineTo(base.x - 4 * s, base.y - 200 * s)
    .moveTo(base.x + 26 * s, base.y)
    .lineTo(base.x + 4 * s, base.y - 200 * s)
    .moveTo(base.x, base.y + 4 * s)
    .lineTo(base.x, base.y - 196 * s)
    .stroke({ color: 0x8a5a3a, width: 4 * s })
  g.rect(base.x - 30 * s, base.y - 82 * s, 60 * s, 5 * s)
    .fill(0x8a5a3a)
    .stroke(THIN)
  // a canvas, half finished
  const canvas = new Container()
  const art = new Graphics()
  paintPoster(art, (ctx.plan.variant.name.length * 3) % 16)
  art.scale.set((52 * s) / 100, (70 * s) / 140)
  art.position.set(base.x - 26 * s, base.y - 156 * s)
  const frame = new Graphics()
    .rect(base.x - 27 * s, base.y - 157 * s, 54 * s, 72 * s)
    .stroke({ color: 0xf2e2bd, width: 3 * s })
  canvas.addChild(art, frame)
  ctx.back.addChild(canvas)
  // the palette and a jar of brushes on the floor
  g.ellipse(base.x + 36 * s, base.y + 2 * s, 14 * s, 5 * s)
    .fill(0xc8a070)
    .stroke(THIN)
  for (const [dx, c] of [
    [-6, 0xc8302a],
    [0, 0xe8c25a],
    [6, 0x2a4a8a],
  ] as const)
    g.circle(base.x + 36 * s + dx * s, base.y + s, 2 * s).fill(c)
}

function records(ctx: Ctx, p: Piece) {
  const a = against(p)
  const g = ctx.layer()
  const z0 = a.mid - 44
  const z1 = a.mid + 44
  block(g, a.box(0, 42, 0, 68, z0, z1), 0x8a5a3a)
  const face = a.wx(42)
  for (const [za, zb] of [
    [z0 + 4, a.mid - 2],
    [a.mid + 2, z1 - 4],
  ] as [number, number][]) {
    g.poly(flat([face, 6, za], [face, 6, zb], [face, 62, zb], [face, 62, za])).fill(0x160c08)
    for (let z = za + 2; z < zb - 2; z += 2.4)
      g.poly(flat([face, 8, z], [face, 8, z + 1.8], [face, 58, z + 1.8], [face, 58, z])).fill(
        BOOKS[Math.round(z * 7) % BOOKS.length]!,
      )
  }
  // the turntable, spinning
  block(g, a.box(6, 38, 68, 76, a.mid - 22, a.mid + 22), 0x2a1a14)
  const disc = at([a.wx(22), 76.5, a.mid - 4])
  const platter = new Graphics()
  platter
    .ellipse(0, 0, 14 * disc.s, 5 * disc.s)
    .fill(0x121014)
    .stroke(THIN)
  platter.ellipse(0, 0, 4 * disc.s, 1.5 * disc.s).fill(0xc8302a)
  platter.position.set(disc.x, disc.y)
  ctx.back.addChild(platter)
  const tick = new Graphics()
    .moveTo(0, 0)
    .lineTo(10 * disc.s, 0)
    .stroke({ color: 0xf2e2bd, width: 0.8, alpha: 0.6 })
  tick.position.set(disc.x, disc.y)
  tick.scale.y = 0.36
  ctx.back.addChild(tick)
  ctx.anim.push((t) => {
    tick.rotation = t * 3.5
  })
  const arm = at([a.wx(12), 80, a.mid + 16])
  g.moveTo(arm.x, arm.y)
    .lineTo(disc.x + 6 * disc.s, disc.y - 2 * disc.s)
    .stroke({ color: 0xd8d8d8, width: 1.5 })
  // a crate of records on the floor next to it
  block(g, a.box(6, 44, 0, 30, z1 + 2, Math.min(a.z1 + 6, z1 + 24)), 0xb8864a)
}

function plantstand(ctx: Ctx, p: Piece) {
  const a = against(p)
  const g = ctx.layer()
  const plants = ctx.plan.variant.plants
  const steps = [
    { d0: 26, d1: 56, y: 40 },
    { d0: 14, d1: 40, y: 80 },
    { d0: 2, d1: 26, y: 120 },
  ]
  for (const [i, s] of steps.entries()) {
    block(g, a.box(s.d0, s.d1, s.y - 4, s.y, a.mid - 34, a.mid + 34), 0xc8a070)
    for (const z of [a.mid - 18, a.mid + 16])
      potPlant(
        ctx,
        g,
        [a.wx((s.d0 + s.d1) / 2), s.y, z],
        0.9,
        plants[(i * 2 + (z > a.mid ? 1 : 0)) % plants.length]!,
        i * 2 + 1,
      )
  }
  for (const [d, z] of [
    [54, a.mid - 32],
    [54, a.mid + 32],
    [4, a.mid - 32],
    [4, a.mid + 32],
  ] as [number, number][]) {
    const top = d > 30 ? 40 : 120
    g.poly(flat([a.wx(d), 0, z], [a.wx(d), top, z]), false).stroke({ color: 0x8a6a3a, width: 2.5 })
  }
}

/** a fiddle-leaf fig nearly up to the ceiling */
function tree(ctx: Ctx, p: Piece) {
  const a = against(p)
  const g = ctx.layer()
  const base: P3 = [a.wx(38), 0, a.mid]
  const { x, y, s } = at(base)
  g.moveTo(x - 20 * s, y - 40 * s)
    .lineTo(x + 20 * s, y - 40 * s)
    .quadraticCurveTo(x + 18 * s, y, x + 14 * s, y)
    .lineTo(x - 14 * s, y)
    .quadraticCurveTo(x - 18 * s, y, x - 20 * s, y - 40 * s)
    .closePath()
    .fill(0xe8d8c0)
    .stroke(LINE)
  g.moveTo(x, y - 40 * s)
    .bezierCurveTo(x - 6 * s, y - 120 * s, x + 10 * s, y - 180 * s, x + 2 * s, y - 280 * s)
    .stroke({ color: 0x5a3a20, width: 4 * s })
  const leaves = new Graphics()
  for (let i = 0; i < 26; i++) {
    const t = 0.25 + (i / 26) * 0.75
    const ly = y - (40 + 240 * t) * s
    const side = i % 2 ? 1 : -1
    const lx = x + side * (10 + ctx.rng() * 22) * s + Math.sin(t * 4) * 6 * s
    const r = (12 + ctx.rng() * 6) * s
    const rot = side * (0.5 + ctx.rng() * 0.6)
    const leaf = new Graphics()
    leaf
      .moveTo(0, -r * 1.3)
      .bezierCurveTo(r * 1.1, -r * 1.1, r * 1.1, r * 0.6, 0, r * 1.2)
      .bezierCurveTo(-r * 1.1, r * 0.6, -r * 1.1, -r * 1.1, 0, -r * 1.3)
      .fill(i % 3 ? 0x3a7a3a : 0x2e6a2e)
      .stroke({ ...THIN, width: 0.7 })
    leaf
      .moveTo(0, -r * 1.1)
      .lineTo(0, r * 1)
      .stroke({ color: 0x8ab06a, width: 0.8 })
    for (const k of [-0.4, 0, 0.4])
      leaf
        .moveTo(0, k * r)
        .lineTo(r * 0.6, k * r - r * 0.3)
        .moveTo(0, k * r)
        .lineTo(-r * 0.6, k * r - r * 0.3)
        .stroke({ color: 0x1e4a1e, width: 0.6 })
    leaf.position.set(lx, ly)
    leaf.rotation = rot
    leaves.addChild(leaf)
    const sway = ctx.rng() * 6
    ctx.anim.push((tt) => {
      leaf.rotation = rot + Math.sin(tt * 0.7 + sway) * 0.04
    })
  }
  ctx.back.addChild(leaves)
}

/** a ladder shelf leaning on the wall, shelves getting narrower up the top */
function ladder(ctx: Ctx, p: Piece) {
  const a = against(p)
  const g = ctx.layer()
  const wood = 0xa86a3a
  const height = 262
  for (const z of [a.mid - 34, a.mid + 34])
    g.poly(flat([a.wx(54), 0, z], [a.wx(4), height, z]), false).stroke({ color: wood, width: 4 })
  const plants = ctx.plan.variant.plants
  for (let i = 0; i < 4; i++) {
    const y = 20 + i * 62
    const d = 54 - (y / height) * 50
    block(g, a.box(d - 24 + i * 3, d, y, y + 4, a.mid - 32, a.mid + 32), wood, THIN)
    const front = a.wx(d - 10)
    if (i % 2) potPlant(ctx, g, [front, y + 4, a.mid - 8], 0.9, plants[i % plants.length]!, i)
    else {
      let z = a.mid - 28
      let n = i * 5
      while (z < a.mid + 26) {
        const bw = 4 + (n % 3)
        const bh = 34 * (0.7 + (n % 4) * 0.08)
        g.poly(
          flat(
            [front, y + 4, z],
            [front, y + 4, z + bw],
            [front, y + 4 + bh, z + bw],
            [front, y + 4 + bh, z],
          ),
        )
          .fill(BOOKS[n % BOOKS.length]!)
          .stroke({ ...THIN, width: 0.4 })
        z += bw + 0.6
        n++
      }
    }
  }
}

function trunk(ctx: Ctx, p: Piece) {
  const a = against(p)
  const g = ctx.layer()
  const c = 0x3a5a6a
  const box = a.box(4, 52, 0, 50, a.mid - 40, a.mid + 40)
  block(g, box, c)
  const face = a.wx(52)
  g.poly(flat([face, 36, a.mid - 40], [face, 36, a.mid + 40]), false).stroke({
    color: INK,
    width: 1.5,
  })
  for (const z of [a.mid - 24, a.mid + 24])
    g.poly(flat([face, 0, z], [face, 50, z]), false).stroke({ color: 0x5a3420, width: 4 })
  for (const [y, z] of [
    [2, a.mid - 38],
    [2, a.mid + 36],
    [46, a.mid - 38],
    [46, a.mid + 36],
  ] as [number, number][]) {
    const [px, py] = project([face, y, z])
    g.rect(px - 3, py - 3, 6, 6).fill(BRASS)
  }
  const [lx, ly] = project([face, 32, a.mid])
  g.rect(lx - 4, ly - 4, 8, 8)
    .fill(BRASS)
    .stroke(THIN)
  // books and a candle on top
  for (let i = 0; i < 3; i++)
    block(
      g,
      a.box(12, 44, 50 + i * 6, 56 + i * 6, a.mid - 30 + i * 2, a.mid + 4 - i * 2),
      BOOKS[i + 2]!,
      { ...THIN, width: 0.6 },
    )
  candle(ctx, g, [a.wx(28), 50, a.mid + 22], 16)
}

function floorLamp(ctx: Ctx, p: Piece) {
  const a = against(p)
  const g = ctx.layer()
  const base = at([a.wx(36), 0, a.mid])
  const top = at([a.wx(36), 196, a.mid])
  g.ellipse(base.x, base.y, 14 * base.s, 4 * base.s)
    .fill(0x2a2420)
    .stroke(THIN)
  g.moveTo(base.x, base.y)
    .lineTo(top.x, top.y)
    .stroke({ color: BRASS, width: 2.5 * top.s })
  const s = top.s
  const shadeShape = (d: Graphics) =>
    d
      .moveTo(top.x - 16 * s, top.y)
      .lineTo(top.x + 16 * s, top.y)
      .lineTo(top.x + 24 * s, top.y + 26 * s)
      .lineTo(top.x - 24 * s, top.y + 26 * s)
      .closePath()
  shadeShape(g)
  g.fill(0xf2d8a0)
  shadeShape(g)
  g.stroke(THIN)
  const lit = new Graphics()
  shadeShape(lit)
  lit.fill({ color: 0xffe0a0, alpha: 0.5 })
  ctx.lights.addChild(lit)
  glow(ctx.lights, top.x, top.y + 20 * s, (130 * s) / 128, (120 * s) / 128, 0xffb04a, 0.45)
  ctx.pool([a.wx(36), 190, a.mid], 300, 0.6)
}

/** a tall arched mirror leaning on the wall */
function mirror(ctx: Ctx, p: Piece) {
  const a = against(p)
  const X = a.wx(3)
  const [z0, z1] = [a.mid - 40, a.mid + 40]
  const bottom = 4
  const top = 250
  const arch = (inset: number) => {
    const pts: P3[] = [[X, bottom + inset, z0 + inset]]
    const r = (z1 - z0) / 2 - inset
    const cz = (z0 + z1) / 2
    const spring = top - r - inset
    pts.push([X, spring, z0 + inset])
    for (let i = 0; i <= 12; i++) {
      const ang = Math.PI - (i / 12) * Math.PI
      pts.push([X, spring + Math.sin(ang) * r, cz + Math.cos(ang) * r])
    }
    pts.push([X, bottom + inset, z1 - inset])
    return flat(...pts)
  }
  const g = ctx.layer()
  g.poly(arch(0)).fill(BRASS).stroke(LINE)
  g.poly(arch(6)).fill(mix(shade(hex(ctx.layout.wall), -0.3), 0x8aa0c8, 0.25))
  const refl = new Graphics()
  const mask = new Graphics().poly(arch(6)).fill(0xffffff)
  const [mx, my] = project([X, 120, a.mid])
  for (let i = 0; i < 3; i++)
    refl
      .poly([
        mx - 60 + i * 30,
        my + 200,
        mx - 40 + i * 30,
        my + 200,
        mx + 40 + i * 30,
        my - 200,
        mx + 20 + i * 30,
        my - 200,
      ])
      .fill({ color: 0xffffff, alpha: 0.1 })
  refl.circle(mx + 10, my - 30, 30).fill({ color: 0xffb04a, alpha: 0.2 })
  refl.mask = mask
  ctx.back.addChild(refl, mask)
  ctx.layer().poly(arch(6)).stroke(THIN)
}

function monstera(ctx: Ctx, p: Piece) {
  const a = against(p)
  const g = ctx.layer()
  const { x, y, s } = at([a.wx(36), 0, a.mid])
  g.moveTo(x - 18 * s, y - 34 * s)
    .lineTo(x + 18 * s, y - 34 * s)
    .quadraticCurveTo(x + 17 * s, y, x + 13 * s, y)
    .lineTo(x - 13 * s, y)
    .quadraticCurveTo(x - 17 * s, y, x - 18 * s, y - 34 * s)
    .closePath()
    .fill(0x8e3a1e)
    .stroke(LINE)
  g.roundRect(x - 20 * s, y - 38 * s, 40 * s, 6 * s, 2)
    .fill(0xa84a26)
    .stroke(THIN)
  for (let i = 0; i < 9; i++) {
    const ang = -Math.PI / 2 + (i - 4) * 0.24 + (ctx.rng() - 0.5) * 0.15
    const len = (70 + ctx.rng() * 70) * s
    const lx = x + Math.cos(ang) * len
    const ly = y - 36 * s + Math.sin(ang) * len
    g.moveTo(x, y - 36 * s)
      .quadraticCurveTo(x + Math.cos(ang) * len * 0.3, ly + 24 * s, lx, ly)
      .stroke({ color: 0x2e4a22, width: 1.6 })
    const leaf = new Graphics()
    const r = (17 + ctx.rng() * 7) * s
    leaf
      .moveTo(0, -r)
      .bezierCurveTo(r * 1.2, -r * 0.9, r * 1.2, r * 0.8, 0, r * 0.75)
      .bezierCurveTo(-r * 1.2, r * 0.8, -r * 1.2, -r * 0.9, 0, -r)
      .fill(i % 3 ? 0x2e7a3a : 0x4a9a3a)
      .stroke({ ...THIN, width: 0.9 })
    for (let c = -2; c <= 2; c++)
      if (c)
        leaf
          .moveTo(c * r * 0.25, -r * 0.1)
          .lineTo(c * r * 0.75, c % 2 ? r * 0.3 : -r * 0.4)
          .stroke({ color: 0x14301a, width: 1.6 })
    leaf
      .moveTo(0, -r * 0.9)
      .lineTo(0, r * 0.7)
      .stroke({ color: 0x8ab06a, width: 0.8 })
    leaf.position.set(lx, ly)
    leaf.rotation = ang + Math.PI / 2
    ctx.back.addChild(leaf)
    const sway = ctx.rng() * 6
    ctx.anim.push((t) => {
      leaf.rotation = ang + Math.PI / 2 + Math.sin(t * 0.6 + sway) * 0.035
    })
  }
}

/** a candle with a flame that flickers */
export function candle(ctx: Ctx, g: Graphics, p: P3, height: number) {
  const { x, y, s } = at(p)
  const h = height * s
  g.rect(x - 2.6 * s, y - h, 5.2 * s, h)
    .fill(0xf6ead0)
    .stroke({ ...THIN, width: 0.6 })
  g.moveTo(x - 2.6 * s, y - h)
    .quadraticCurveTo(x - 3.4 * s, y - h + 4 * s, x - 2.2 * s, y - h + 6 * s)
    .stroke({ color: 0xf6ead0, width: 1.5 })
  const flame = new Graphics()
  flame.ellipse(0, -3 * s, 1.6 * s, 3.4 * s).fill(0xffd27a)
  flame.ellipse(0, -2 * s, 0.8 * s, 1.6 * s).fill(0xfff6e0)
  flame.position.set(x, y - h)
  ctx.lights.addChild(flame)
  const halo = glow(ctx.lights, x, y - h - 3 * s, (24 * s) / 128, (30 * s) / 128, 0xffa040, 0.75)
  ctx.pool([p[0], p[1] + height, p[2]], 70, 0.4)
  const seed = ctx.rng() * 10
  ctx.anim.push((t) => {
    const f = Math.sin(t * 11 + seed) * 0.5 + Math.sin(t * 17.3 + seed * 2) * 0.5
    flame.scale.set(1 + f * 0.08, 1 + f * 0.18)
    flame.rotation = f * 0.08
    halo.alpha = 0.66 + f * 0.12
  })
}
