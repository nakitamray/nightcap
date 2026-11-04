import { Graphics } from 'pixi.js'
import { glow } from '../layers/neon'
import { at, type Ctx } from '../room/context'
import { drawLamp } from '../room/lamps'
import type { LampStyle } from '../room/layout'
import { shade, THIN } from '../room/paint'
import { project, ROOM, type P3 } from '../room/projection'
import type { FloorLampKind, LoungePlan } from './plan'

// The living room has lamps everywhere: tall ones on the floor, little ones
// on the tables, something hanging from the ceiling. Like the bedroom lamps,
// each shade is drawn twice, once on the lights layer so the bloom catches it.

const BRASS = 0xd9a54a
const WARM = 0xffb04a

function bulb(ctx: Ctx, x: number, y: number, s: number, size = 1, tint = WARM) {
  glow(ctx.lights, x, y, (150 * s * size) / 128, (130 * s * size) / 128, tint, 0.3)
  glow(ctx.lights, x, y, (24 * s * size) / 128, (18 * s * size) / 128, 0xfff0c8, 0.55)
}

/** a floor lamp standing at floor point (x, z) */
export function floorLamp(ctx: Ctx, kind: FloorLampKind, x: number, z: number, towards: number) {
  const g = ctx.layer()
  const lit = new Graphics()
  ctx.lights.addChild(lit)
  lit.alpha = 0.5
  const foot = at([x, 0, z])
  const s = foot.s
  switch (kind) {
    case 'arc': {
      // a heavy marble block, a long steel arc, a dome hanging over the table
      g.roundRect(foot.x - 16 * s, foot.y - 14 * s, 32 * s, 14 * s, 2)
        .fill(0xe8e0d0)
        .stroke(THIN)
      const reach = towards * 150
      const top: P3 = [x + reach * 0.35, 320, z - 30]
      const end: P3 = [x + reach, 230, z - 60]
      const [tx, ty] = project(top)
      const [ex, ey] = project(end)
      g.moveTo(foot.x, foot.y - 14 * s)
        .bezierCurveTo(foot.x, ty - 40 * s, tx, ty - 30 * s, ex, ey)
        .stroke({ color: 0x2a2624, width: 3 * s })
      const es = at(end).s
      const dome = (d: Graphics) =>
        d
          .moveTo(ex - 26 * es, ey + 22 * es)
          .quadraticCurveTo(ex - 24 * es, ey, ex, ey)
          .quadraticCurveTo(ex + 24 * es, ey, ex + 26 * es, ey + 22 * es)
          .closePath()
      dome(g).fill(0x2a2624)
      dome(g).stroke(THIN)
      lit.ellipse(ex, ey + 22 * es, 22 * es, 4 * es).fill(0xfff0c8)
      bulb(ctx, ex, ey + 24 * es, es)
      ctx.pool([end[0], 60, end[2]], 300, 0.65)
      break
    }
    case 'tripod': {
      // wooden legs splayed, a fat drum shade
      const h = 170
      const [hx, hy] = project([x, h - 40, z])
      for (const dx of [-18, 0, 18])
        g.moveTo(foot.x + dx * s, foot.y + (dx === 0 ? -3 : 0))
          .lineTo(hx, hy)
          .stroke({ color: 0x6a3a22, width: 3 * s })
      const [sx, sy] = project([x, h, z])
      for (const d of [g, lit])
        d.moveTo(sx - 26 * s, sy - 30 * s)
          .lineTo(sx + 26 * s, sy - 30 * s)
          .lineTo(sx + 30 * s, sy + 4 * s)
          .lineTo(sx - 30 * s, sy + 4 * s)
          .closePath()
          .fill(0xf2e2bd)
      g.moveTo(sx - 26 * s, sy - 30 * s)
        .lineTo(sx + 26 * s, sy - 30 * s)
        .lineTo(sx + 30 * s, sy + 4 * s)
        .lineTo(sx - 30 * s, sy + 4 * s)
        .closePath()
        .stroke(THIN)
      bulb(ctx, sx, sy - 6 * s, s)
      ctx.pool([x, h, z], 300, 0.7)
      break
    }
    case 'shade': {
      // the old standard lamp: brass pole, pleated shade with a fringe
      const h = 176
      const [sx, sy] = project([x, h, z])
      g.ellipse(foot.x, foot.y - 2 * s, 16 * s, 5 * s)
        .fill(BRASS)
        .stroke(THIN)
      g.rect(foot.x - 1.5 * s, sy, 3 * s, foot.y - sy).fill(BRASS)
      const shadeShape = (d: Graphics) =>
        d
          .moveTo(sx - 16 * s, sy - 34 * s)
          .lineTo(sx + 16 * s, sy - 34 * s)
          .lineTo(sx + 32 * s, sy)
          .lineTo(sx - 32 * s, sy)
          .closePath()
      for (const d of [g, lit]) shadeShape(d).fill(0xe8a050)
      shadeShape(g).stroke(THIN)
      for (let i = -3; i <= 3; i++)
        g.moveTo(sx + i * 4 * s, sy - 34 * s)
          .lineTo(sx + i * 9 * s, sy)
          .stroke({ color: shade(0xe8a050, -0.25), width: 0.8 })
      for (let i = -30; i <= 30; i += 4)
        g.moveTo(sx + i * s, sy)
          .lineTo(sx + i * s, sy + 6 * s)
          .stroke({ color: 0xc8642e, width: 1 })
      bulb(ctx, sx, sy - 10 * s, s)
      ctx.pool([x, h, z], 300, 0.7)
      break
    }
    case 'globe': {
      // a slim black pole with an opal globe on top
      const h = 160
      const [sx, sy] = project([x, h, z])
      g.ellipse(foot.x, foot.y - 2 * s, 14 * s, 4 * s)
        .fill(0x1e1a1c)
        .stroke(THIN)
      g.rect(foot.x - 1.5 * s, sy, 3 * s, foot.y - sy).fill(0x1e1a1c)
      for (const d of [g, lit]) d.circle(sx, sy - 14 * s, 16 * s).fill(0xfff4e0)
      g.circle(sx, sy - 14 * s, 16 * s).stroke(THIN)
      bulb(ctx, sx, sy - 14 * s, s, 0.9)
      ctx.pool([x, h, z], 280, 0.65)
      break
    }
  }
  breathe(ctx, lit, 0.5)
}

/** a little mushroom lamp on a table top at `p` */
export function mushroomLamp(ctx: Ctx, p: P3, colour = 0xfff4e0) {
  const { x, y, s } = at(p)
  const g = ctx.layer()
  const lit = new Graphics()
  ctx.lights.addChild(lit)
  g.ellipse(x, y, 9 * s, 3 * s)
    .fill(colour)
    .stroke(THIN)
  g.rect(x - 2 * s, y - 22 * s, 4 * s, 22 * s)
    .fill(colour)
    .stroke({ ...THIN, width: 0.6 })
  for (const d of [g, lit])
    d.moveTo(x - 18 * s, y - 20 * s)
      .quadraticCurveTo(x - 17 * s, y - 38 * s, x, y - 38 * s)
      .quadraticCurveTo(x + 17 * s, y - 38 * s, x + 18 * s, y - 20 * s)
      .closePath()
      .fill(colour)
  g.moveTo(x - 18 * s, y - 20 * s)
    .quadraticCurveTo(x - 17 * s, y - 38 * s, x, y - 38 * s)
    .quadraticCurveTo(x + 17 * s, y - 38 * s, x + 18 * s, y - 20 * s)
    .closePath()
    .stroke(THIN)
  lit.alpha = 0.55
  bulb(ctx, x, y - 22 * s, s, 0.7)
  ctx.pool([p[0], p[1] + 20, p[2]], 170, 0.5)
  breathe(ctx, lit, 0.55)
}

/** one of the bedroom's old table lamps, on a table top at `p` */
export function tableLamp(ctx: Ctx, style: Exclude<LampStyle, 'lantern'>, p: P3) {
  // the bedroom lamps read their style off the room's layout, so lend them one
  const lent = Object.create(ctx) as Ctx
  Object.defineProperty(lent, 'layout', { value: { ...ctx.layout, lamp: style } })
  drawLamp(lent, p)
}

/** the light hanging from the middle of the ceiling, different in every city */
export function ceilingLights(ctx: Ctx, plan: LoungePlan) {
  const C = ROOM.ceiling
  switch (plan.theme) {
    case 'paris':
      chandelier(ctx, [0, C - 150, 190], 0xf2f0e8, false)
      break
    case 'venice':
      chandelier(ctx, [0, C - 170, 200], 0xd9a54a, true)
      break
    case 'new-york':
      for (const [x, z, drop] of [
        [-60, 200, 200],
        [10, 230, 240],
        [70, 190, 180],
        [-20, 160, 260],
      ] as const)
        edison(ctx, [x, C - drop, z])
      break
    case 'tokyo':
      for (const [x, z, drop, c] of [
        [-120, 220, 200, 0xf2ece0],
        [-40, 180, 260, 0xd8281e],
        [60, 230, 220, 0xf2ece0],
        [150, 200, 280, 0xe8c25a],
      ] as const)
        paperLantern(ctx, [x, C - drop, z], c)
      break
  }
  // and little pendants over the counter
  const cx = -plan.books * (plan.half - 40)
  for (const z of [300, 360])
    pendant(ctx, [cx, C - 240, z], plan.theme === 'tokyo' ? 0xf2ece0 : 0x2f6b66)
}

function cord(g: Graphics, p: P3) {
  const [x, y] = project(p)
  const [, top] = project([p[0], ROOM.ceiling, p[2]])
  g.moveTo(x, top).lineTo(x, y).stroke({ color: 0x121014, width: 1.2 })
}

/** crystal drops for Paris, coloured Murano glass for Venice */
function chandelier(ctx: Ctx, p: P3, metal: number, murano: boolean) {
  const g = ctx.layer()
  const lit = new Graphics()
  ctx.lights.addChild(lit)
  cord(g, p)
  const { x, y, s } = at(p)
  const k = s * 1.3
  g.ellipse(x, y, 10 * k, 6 * k)
    .fill(metal)
    .stroke(THIN)
  const arms = 6
  const colours = [0xff7a9a, 0x3ad8ff, 0xe8c25a, 0x5aff9a, 0xc89aff, 0xff9a3a]
  for (let i = 0; i < arms; i++) {
    const a = (i / arms) * Math.PI * 2
    const ax = x + Math.cos(a) * 46 * k
    const ay = y + Math.sin(a) * 12 * k + 6 * k
    g.moveTo(x, y + 4 * k)
      .quadraticCurveTo((x + ax) / 2, y + 22 * k, ax, ay)
      .stroke({ color: metal, width: 2.4 * k })
    if (murano) {
      // twisted glass flowers
      const c = colours[i % colours.length]!
      for (const d of [g, lit])
        d.moveTo(ax - 8 * k, ay)
          .quadraticCurveTo(ax, ay - 18 * k, ax + 8 * k, ay)
          .quadraticCurveTo(ax, ay + 6 * k, ax - 8 * k, ay)
          .fill({ color: c, alpha: 0.9 })
      g.moveTo(ax - 8 * k, ay)
        .quadraticCurveTo(ax, ay - 18 * k, ax + 8 * k, ay)
        .stroke({ ...THIN, width: 0.6 })
    } else {
      // candle bulbs and hanging drops
      g.rect(ax - 2 * k, ay - 10 * k, 4 * k, 10 * k).fill(0xf6ead0)
      lit.ellipse(ax, ay - 13 * k, 2.4 * k, 4 * k).fill(0xfff0c8)
      for (let d = 0; d < 3; d++)
        g.moveTo(ax, ay + 2 * k)
          .lineTo(ax + (d - 1) * 3 * k, ay + (10 + d * 4) * k)
          .stroke({ color: 0xe8f0f8, width: 0.8 })
    }
    glow(
      ctx.lights,
      ax,
      ay - 8 * k,
      (30 * k) / 128,
      (30 * k) / 128,
      murano ? colours[i % colours.length]! : WARM,
      0.3,
    )
  }
  // a cascade of drops in the middle
  for (let i = 0; i < 9; i++)
    g.circle(x + (i - 4) * 4 * k, y + (16 + Math.abs(i - 4) * -2 + 10) * k, 1.8 * k).fill({
      color: murano ? colours[i % colours.length]! : 0xe8f0f8,
      alpha: 0.9,
    })
  bulb(ctx, x, y + 10 * k, s, 1)
  ctx.pool([p[0], p[1] - 100, p[2]], 420, 0.5)
  lit.alpha = 0.6
  breathe(ctx, lit, 0.6)
}

/** a bare filament bulb on a long flex */
function edison(ctx: Ctx, p: P3) {
  const g = ctx.layer()
  cord(g, p)
  const { x, y, s } = at(p)
  g.rect(x - 3 * s, y - 6 * s, 6 * s, 6 * s).fill(0x2a2624)
  const lit = new Graphics()
  ctx.lights.addChild(lit)
  for (const d of [g, lit])
    d.moveTo(x - 5 * s, y)
      .quadraticCurveTo(x - 9 * s, y + 14 * s, x, y + 18 * s)
      .quadraticCurveTo(x + 9 * s, y + 14 * s, x + 5 * s, y)
      .closePath()
      .fill({ color: 0xffd27a, alpha: 0.85 })
  g.moveTo(x - 2 * s, y + 4 * s)
    .lineTo(x, y + 12 * s)
    .lineTo(x + 2 * s, y + 4 * s)
    .stroke({ color: 0xff8a2a, width: 0.8 })
  bulb(ctx, x, y + 10 * s, s, 0.7)
  ctx.pool([p[0], p[1] - 60, p[2]], 200, 0.35)
  breathe(ctx, lit, 1)
}

function paperLantern(ctx: Ctx, p: P3, colour: number) {
  const g = ctx.layer()
  cord(g, p)
  const { x, y, s } = at(p)
  const lit = new Graphics()
  ctx.lights.addChild(lit)
  const r = 26 * s
  for (const d of [g, lit]) d.ellipse(x, y, r, r * 0.9).fill(colour)
  g.ellipse(x, y, r, r * 0.9).stroke(THIN)
  for (let i = -3; i <= 3; i++) {
    const yy = y + (i / 4) * r * 0.9
    const half = r * Math.sqrt(1 - (i / 4) ** 2)
    g.moveTo(x - half, yy)
      .quadraticCurveTo(x, yy + 2 * s, x + half, yy)
      .stroke({ color: shade(colour, -0.3), width: 0.8 })
  }
  g.rect(x - r * 0.4, y - r * 0.95, r * 0.8, 4 * s)
    .rect(x - r * 0.4, y + r * 0.8, r * 0.8, 4 * s)
    .fill(0x121014)
  lit.alpha = 0.4
  bulb(ctx, x, y, s, 0.9, colour === 0xd8281e ? 0xff4a2a : WARM)
  ctx.pool([p[0], p[1] - 80, p[2]], 260, 0.45)
  const seed = p[0]
  ctx.anim.push((t) => {
    lit.alpha = 0.4 + Math.sin(t * 1.1 + seed) * 0.03
  })
}

/** a small enamel pendant over the counter */
function pendant(ctx: Ctx, p: P3, colour: number) {
  const g = ctx.layer()
  cord(g, p)
  const { x, y, s } = at(p)
  const lit = new Graphics()
  ctx.lights.addChild(lit)
  g.moveTo(x - 16 * s, y + 14 * s)
    .quadraticCurveTo(x - 14 * s, y, x, y)
    .quadraticCurveTo(x + 14 * s, y, x + 16 * s, y + 14 * s)
    .closePath()
    .fill(colour)
    .stroke(THIN)
  lit.ellipse(x, y + 14 * s, 13 * s, 3 * s).fill(0xfff0c8)
  bulb(ctx, x, y + 16 * s, s, 0.8)
  ctx.pool([p[0], 100, p[2]], 200, 0.5)
  breathe(ctx, lit, 0.6)
}

/** bulbs aren't perfectly steady */
function breathe(ctx: Ctx, lit: Graphics, base: number) {
  const seed = ctx.rng() * 10
  ctx.anim.push((t) => {
    lit.alpha = base + Math.sin(t * 9.1 + seed) * 0.015 + Math.sin(t * 2.3 + seed) * 0.02
  })
}
