import { Graphics } from 'pixi.js'
import { glow } from '../layers/neon'
import { at, type Ctx } from './context'
import { shade, THIN } from './paint'
import { project, ROOM, type P3 } from './projection'

const BRONZE = 0x5a4224
const BRASS = 0xd9a54a
const WARM = 0xffb04a

/**
 * Old lamps, the junk-shop kind: drawn flat, front on, the way the windows
 * outside are. Each draws its shade twice -- once normally, once on the lights
 * layer -- so the bloom makes the shade itself glow.
 */
export function drawLamp(ctx: Ctx, deskTop: P3) {
  const style = ctx.layout.lamp
  if (style === 'lantern') return lantern(ctx)
  const { x, y, s } = at(deskTop)
  const g = ctx.layer('lamp')
  const lit = new Graphics()
  const u = s * 0.95
  g.position.set(x, y)
  lit.position.set(x, y)
  g.scale.set(u)
  lit.scale.set(u)
  ctx.lights.addChild(lit)
  lit.alpha = 0.4

  let bulbY = -40
  switch (style) {
    case 'tiffany':
      bulbY = tiffany(g, lit)
      break
    case 'fringe':
      bulbY = fringe(g, lit)
      break
    case 'scallop':
      bulbY = scallop(g, lit)
      break
    case 'floral':
      bulbY = floral(g, lit)
      break
    case 'banker':
      bulbY = banker(g, lit)
      break
  }
  const by = y + bulbY * u
  glow(ctx.lights, x, by, (200 * u) / 128, (170 * u) / 128, WARM, 0.45)
  glow(ctx.lights, x, by + 6 * u, (30 * u) / 128, (20 * u) / 128, 0xfff0c8, 0.6)
  const p: P3 = [deskTop[0], deskTop[1] + 40, deskTop[2]]
  ctx.pool(p, 420, 1)
  ctx.anim.push((t) => {
    lit.alpha = 0.4 + Math.sin(t * 9.1) * 0.015 + Math.sin(t * 2.3) * 0.02
  })
  ctx.hit('lamp', (h) => h.rect(x - 34 * u, y - 80 * u, 68 * u, 82 * u))
}

function base(g: Graphics, color: number, w: number) {
  g.ellipse(0, 0, w, w * 0.28)
    .fill(color)
    .stroke(THIN)
  g.ellipse(0, -3, w * 0.8, w * 0.22)
    .fill(shade(color, 0.2))
    .stroke(THIN)
}

function tiffany(g: Graphics, lit: Graphics) {
  base(g, BRONZE, 15)
  g.roundRect(-2.5, -40, 5, 38, 2).fill(BRONZE).stroke(THIN)
  for (const yy of [-12, -26]) g.ellipse(0, yy, 4.5, 2.5).fill(shade(BRONZE, 0.25)).stroke(THIN)
  const dome = (d: Graphics) => {
    d.moveTo(-30, -40)
      .quadraticCurveTo(-30, -68, 0, -70)
      .quadraticCurveTo(30, -68, 30, -40)
      .closePath()
  }
  for (const [d, a] of [
    [g, 1],
    [lit, 1],
  ] as const) {
    dome(d)
    d.fill({ color: 0xf0d8a0, alpha: a })
  }
  // stained glass tiles: amber, green, a dragonfly or two
  const tiles = [0xe8803a, 0x3a7a3a, 0xe8c25a, 0x5a9a3a, 0xc8502a]
  for (let r = 0; r < 3; r++) {
    for (let i = 0; i < 7; i++) {
      const tx = -24 + i * 8 + (r % 2) * 4
      const ty = -46 - r * 7
      if (Math.abs(tx) > 26 - r * 5) continue
      for (const d of [g, lit]) d.ellipse(tx, ty, 3.4, 2.8).fill(tiles[(i + r * 2) % tiles.length]!)
    }
  }
  for (const d of [g, lit]) {
    d.ellipse(-10, -60, 7, 2).ellipse(10, -60, 7, 2).fill(0x2e5a3a)
  }
  dome(g)
  g.stroke({ color: 0x2a1a10, width: 1.6 })
  for (const yy of [-47, -54, -61])
    g.moveTo(-28, yy)
      .quadraticCurveTo(0, yy - 4, 28, yy)
      .stroke({ color: 0x2a1a10, width: 0.8 })
  for (let i = -3; i <= 3; i++)
    g.moveTo(i * 9, -40)
      .lineTo(i * 4, -68)
      .stroke({ color: 0x2a1a10, width: 0.7 })
  for (let i = -28; i <= 28; i += 7) g.circle(i, -39, 1.6).fill(BRASS)
  g.circle(0, -72, 2.5).fill(BRONZE).stroke(THIN)
  return -36
}

function fringe(g: Graphics, lit: Graphics) {
  const purple = 0x4a3a6a
  g.moveTo(-16, 0)
    .quadraticCurveTo(-8, -8, -10, -14)
    .lineTo(10, -14)
    .quadraticCurveTo(8, -8, 16, 0)
    .closePath()
    .fill(purple)
    .stroke(THIN)
  g.roundRect(-2, -58, 4, 46, 2).fill(0x2a3a6a).stroke(THIN)
  g.poly([-6, -14, 6, -14, 0, -22]).fill(0x3a7a3a)
  const bell = (d: Graphics) => {
    d.moveTo(-10, -84)
      .quadraticCurveTo(-16, -66, -32, -56)
      .quadraticCurveTo(0, -50, 32, -56)
      .quadraticCurveTo(16, -66, 10, -84)
      .closePath()
  }
  for (const d of [g, lit]) {
    bell(d)
    d.fill(0x2a4a8a)
    // cream roses
    for (const [rx, ry] of [
      [-14, -62],
      [2, -70],
      [16, -62],
      [-4, -60],
    ]) {
      d.circle(rx!, ry!, 4.2).fill(0xf2e2bd)
      d.circle(rx!, ry!, 1.6).fill(0xe8c25a)
    }
  }
  bell(g)
  g.stroke(THIN)
  // beaded fringe
  for (let i = -30; i <= 30; i += 3) {
    const top = -56 + Math.abs(i) * 0.02
    g.moveTo(i, top)
      .lineTo(i, top + 11 + (Math.abs(i) % 2) * 2)
      .stroke({ color: 0xc8b8e8, width: 1 })
    g.circle(i, top + 12, 1.1).fill([0xe8803a, 0x5a9a3a, 0xc8b8e8][(i + 30) % 3]!)
  }
  return -62
}

function scallop(g: Graphics, lit: Graphics) {
  // fluted brass urn
  g.moveTo(-14, 0).lineTo(14, 0).lineTo(10, -5).lineTo(-10, -5).closePath().fill(BRASS).stroke(THIN)
  g.moveTo(-6, -5)
    .quadraticCurveTo(-14, -18, -8, -30)
    .lineTo(8, -30)
    .quadraticCurveTo(14, -18, 6, -5)
    .closePath()
    .fill(BRASS)
    .stroke(THIN)
  for (let i = -6; i <= 6; i += 3)
    g.moveTo(i * 0.7, -6)
      .lineTo(i, -28)
      .stroke({ color: shade(BRASS, -0.35), width: 0.7 })
  g.circle(0, -34, 4).fill(0xe8f0f8).stroke(THIN)
  g.rect(-1.5, -44, 3, 8).fill(BRASS)
  const shadeShape = (d: Graphics) => {
    d.moveTo(-12, -78).lineTo(12, -78).lineTo(30, -46)
    for (let i = 0; i < 6; i++) {
      const x0 = 30 - i * 10
      d.quadraticCurveTo(x0 - 5, -38, x0 - 10, -46)
    }
    d.closePath()
  }
  for (const d of [g, lit]) {
    shadeShape(d)
    d.fill(0xfff4dc)
  }
  shadeShape(g)
  g.stroke({ color: BRASS, width: 1.6 })
  for (let i = -2; i <= 2; i++)
    g.moveTo(i * 6, -78)
      .lineTo(i * 15, -46)
      .stroke({ color: BRASS, width: 1 })
  return -58
}

function floral(g: Graphics, lit: Graphics) {
  const pot = 0x1e2a30
  g.ellipse(0, -8, 13, 9).fill(pot).stroke(THIN)
  g.ellipse(0, -22, 10, 8).fill(pot).stroke(THIN)
  g.ellipse(0, -33, 7, 5).fill(pot).stroke(THIN)
  g.ellipse(-4, -24, 3, 5).fill({ color: 0xffffff, alpha: 0.15 })
  g.rect(-1.5, -42, 3, 6).fill(BRASS)
  for (const d of [g, lit]) {
    d.rect(-26, -76, 52, 34).fill(0xe8902a)
    for (const [fx, fy, c] of [
      [-14, -62, 0xc8302a],
      [8, -56, 0xa8201a],
      [16, -68, 0xe85a2a],
      [-4, -70, 0x8a3a1a],
    ] as const) {
      for (let p = 0; p < 6; p++) {
        const a = (p / 6) * Math.PI * 2
        d.ellipse(fx + Math.cos(a) * 3.5, fy + Math.sin(a) * 3.5, 2.8, 2.8).fill(c)
      }
      d.circle(fx, fy, 2).fill(0x3a1a0a)
    }
  }
  for (const [lx, ly] of [
    [-22, -50],
    [-2, -48],
    [22, -50],
    [0, -64],
  ])
    g.ellipse(lx!, ly!, 4, 1.6).fill(0x4a5a2a)
  g.rect(-26, -76, 52, 34).stroke(THIN)
  g.ellipse(0, -76, 26, 3).stroke(THIN)
  return -54
}

function banker(g: Graphics, lit: Graphics) {
  g.roundRect(-18, -6, 36, 6, 2).fill(BRASS).stroke(THIN)
  g.rect(-2, -34, 4, 28).fill(BRASS).stroke(THIN)
  g.moveTo(-14, -34).lineTo(14, -34).stroke({ color: BRASS, width: 2 })
  const shadeShape = (d: Graphics) => {
    d.moveTo(-26, -34)
      .quadraticCurveTo(-24, -50, 0, -50)
      .quadraticCurveTo(24, -50, 26, -34)
      .closePath()
  }
  shadeShape(g)
  g.fill(0x1e6a3a)
  shadeShape(lit)
  lit.fill({ color: 0x3aaa5a, alpha: 0.5 })
  shadeShape(g)
  g.stroke(THIN)
  g.moveTo(-18, -46)
    .quadraticCurveTo(0, -50, 16, -46)
    .stroke({ color: 0xffffff, width: 1.5, alpha: 0.35 })
  // pull chain
  g.moveTo(16, -34).lineTo(16, -20).stroke({ color: BRASS, width: 0.8 })
  g.circle(16, -19, 1.5).fill(BRASS)
  lit.ellipse(0, -33, 22, 4).fill(0xfff0c8)
  return -32
}

/** a big red paper lantern hanging from the beam */
function lantern(ctx: Ctx) {
  const p: P3 = [-50, 214, 250]
  const { x, y, s } = at(p)
  const [, cy] = project([p[0], ROOM.ceiling - 16, p[2]])
  const g = ctx.layer('lamp')
  const lit = new Graphics()
  ctx.lights.addChild(lit)
  const rx = 34 * s
  const ry = 30 * s
  g.moveTo(x, cy)
    .lineTo(x, y - ry)
    .stroke({ color: 0x121014, width: 1.4 })
  for (const d of [g, lit]) d.ellipse(x, y, rx, ry).fill(0xd8281e)
  lit.alpha = 0.3
  g.ellipse(x, y, rx, ry).stroke(THIN)
  for (let i = -3; i <= 3; i++) {
    const yy = y + (i / 4) * ry
    const half = rx * Math.sqrt(1 - (i / 4) ** 2)
    g.moveTo(x - half, yy)
      .quadraticCurveTo(x, yy + 3 * s, x + half, yy)
      .stroke({ color: 0x8a1a12, width: 1 })
  }
  // brushed marks down the front, the way shop lanterns have them
  g.roundRect(x - 4 * s, y - ry * 0.55, 8 * s, ry * 1.1, 3 * s).fill({
    color: 0x121014,
    alpha: 0.8,
  })
  g.rect(x - rx * 0.45, y - ry - 4 * s, rx * 0.9, 6 * s)
    .rect(x - rx * 0.45, y + ry - 2 * s, rx * 0.9, 6 * s)
    .fill(0x121014)
  for (let i = -3; i <= 3; i++)
    g.moveTo(x + i * 1.5 * s, y + ry + 4 * s)
      .lineTo(x + i * 1.8 * s, y + ry + 18 * s)
      .stroke({ color: 0xe8c25a, width: 1 })
  glow(ctx.lights, x, y, (rx * 5) / 128, (ry * 5) / 128, 0xff4a2a, 0.4)
  ctx.pool(p, 460, 1)
  ctx.anim.push((t) => {
    g.rotation = 0
    lit.alpha = 0.3 + Math.sin(t * 1.1) * 0.03
  })
  ctx.hit('lamp', (h) => h.ellipse(x, y, rx * 1.2, ry * 1.3))
}
