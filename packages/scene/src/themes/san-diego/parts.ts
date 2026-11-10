import { Graphics } from 'pixi.js'
import { palette } from '../../palette'
import type { Rng } from '../../rng'

export const sd = {
  // stucco after dark: what's cream and sand in the afternoon
  stucco: 0x766048,
  stuccoLight: 0x8c7456,
  stuccoDark: 0x4c3c2e,
  tile: 0x8a4428,
  tileLight: 0xa85a36,
  tileDark: 0x5c2a18,
  wood: 0x2e1a10,
  woodLight: 0x4a2c1a,
  iron: 0x0e0c0e,
  leaf: 0x1e3a2a,
  leafLight: 0x2f5a3c,
  agave: 0x3a5a52,
  bougainvillea: 0xb0246a,
  pot: 0x8a4a30,
}

/** every house on the street painted a different one */
export const STUCCOS = [0x766048, 0x6a4a3a, 0x5c5a48, 0x7a5a3a, 0x4e5458, 0x6c4c44, 0x80684a]

export const INK = { color: palette.ink, width: 1.5, alpha: 0.7 }

/** a stucco wall: flat colour, a few trowel patches, grime under the eaves */
export function stuccoWall(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  colour: number,
  rng: Rng,
) {
  g.rect(x, y, w, h).fill(colour)
  for (let i = 0; i < (w * h) / 9000; i++) {
    const pw = 30 + rng() * 80
    const ph = 10 + rng() * 26
    g.roundRect(x + rng() * (w - pw), y + rng() * (h - ph), pw, ph, ph / 2).fill({
      color: rng() < 0.5 ? 0xfff0d0 : palette.ink,
      alpha: 0.05,
    })
  }
  g.rect(x, y, w, 14).fill({ color: palette.ink, alpha: 0.28 })
}

/**
 * Clay barrel tiles seen from the street: a sloping band of roof from the
 * eave line `y` up to `y - rise`, pulled in by `inset` at each end.
 */
export function tileRoof(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  rise: number,
  inset: [left: number, right: number] = [0, 0],
) {
  const over = 18
  const x0 = x - over
  const x1 = x + w + over
  g.poly([x0, y, x1, y, x1 - inset[1] - over, y - rise, x0 + inset[0] + over, y - rise]).fill(
    sd.tile,
  )
  // the rows of barrels running up the slope, squeezed in toward the ridge
  const n = Math.round((x1 - x0) / 13)
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const bx = x0 + t * (x1 - x0)
    const tx = x0 + inset[0] + over + t * (x1 - inset[1] - over - (x0 + inset[0] + over))
    g.moveTo(bx, y)
      .lineTo(tx, y - rise)
      .stroke({ color: i % 2 ? sd.tileDark : sd.tileLight, width: i % 2 ? 2.5 : 1.5, alpha: 0.7 })
  }
  // courses across it, and the fat round ends along the eave
  for (let cy = y - 12; cy > y - rise + 4; cy -= 12) {
    const t = (y - cy) / rise
    g.rect(
      x0 + (inset[0] + over) * t,
      cy,
      x1 - x0 - (inset[0] + inset[1] + over * 2) * t,
      1.5,
    ).fill({ color: palette.ink, alpha: 0.3 })
  }
  for (let bx = x0 + 6; bx < x1 - 2; bx += 13) g.circle(bx, y, 5).fill(sd.tileLight)
  g.rect(x0, y + 3, x1 - x0, 5).fill({ color: palette.ink, alpha: 0.5 })
}

/** an agave: a rosette of fat blue-green blades, base at (x, y) */
export function agave(g: Graphics, x: number, y: number, s = 1, colour = sd.agave) {
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * (0.08 + (i / 8) * 0.84)
    const len = (34 + (i % 3) * 8) * s
    const tx = x + Math.cos(a) * len
    const ty = y + Math.sin(a) * len
    const nx = Math.sin(a) * 5 * s
    const ny = -Math.cos(a) * 5 * s
    g.poly([x - nx, y - ny, tx, ty, x + nx, y + ny]).fill(i % 2 ? colour : 0x2c4842)
  }
}

/** prickly pear: a stack of paddles growing out of each other */
export function pricklyPear(g: Graphics, x: number, y: number, s = 1) {
  const pads: [number, number, number, number][] = [
    [0, -20, 13, 20],
    [-16, -46, 11, 16],
    [14, -50, 12, 17],
    [22, -78, 9, 13],
    [-22, -72, 8, 11],
  ]
  for (const [dx, dy, rx, ry] of pads)
    g.ellipse(x + dx * s, y + dy * s, rx * s, ry * s).fill(sd.leaf)
  for (const [dx, dy, rx, ry] of pads)
    g.ellipse(x + (dx - 2) * s, y + (dy - 2) * s, rx * 0.6 * s, ry * 0.7 * s).fill({
      color: sd.leafLight,
      alpha: 0.5,
    })
  // fruit on the top edges
  g.circle(x + 26 * s, y - 92 * s, 3.5 * s)
    .circle(x - 26 * s, y - 84 * s, 3 * s)
    .circle(x + 8 * s, y - 68 * s, 3 * s)
    .fill(0xb03a4a)
}

/** bird of paradise: paddle leaves on long stems and the orange flowers */
export function birdOfParadise(g: Graphics, x: number, y: number, s = 1) {
  for (const [lean, len] of [
    [-0.5, 78],
    [-0.2, 96],
    [0.1, 88],
    [0.42, 74],
    [0.7, 56],
    [-0.8, 52],
  ] as const) {
    const tx = x + Math.sin(lean) * len * s
    const ty = y - Math.cos(lean) * len * s
    g.moveTo(x, y)
      .lineTo(tx, ty)
      .stroke({ color: sd.leaf, width: 2.5 * s })
    g.ellipse(tx, ty + 8 * s, 9 * s, 24 * s).fill(lean > 0 ? sd.leaf : sd.leafLight)
  }
  for (const [dx, dy] of [
    [-14, -70],
    [16, -62],
  ] as const) {
    g.poly([
      x + dx * s,
      y + dy * s,
      x + (dx + 18) * s,
      y + (dy - 8) * s,
      x + (dx + 6) * s,
      y + (dy - 16) * s,
    ]).fill(0xf08a1e)
    g.poly([
      x + dx * s,
      y + dy * s,
      x + (dx + 14) * s,
      y + (dy + 2) * s,
      x + dx * s,
      y + (dy + 5) * s,
    ]).fill(0x3a4a9a)
  }
}

/** a terracotta pot, standing on (x, y) */
export function pot(g: Graphics, x: number, y: number, s = 1) {
  g.poly([x - 13 * s, y - 24 * s, x + 13 * s, y - 24 * s, x + 9 * s, y, x - 9 * s, y]).fill(sd.pot)
  g.rect(x - 15 * s, y - 28 * s, 30 * s, 6 * s).fill(0xa05a3a)
}

/** bougainvillea: a cloud of magenta bracts over dark leaves, filling the box */
export function bougainvillea(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  rng: Rng,
  colour = sd.bougainvillea,
) {
  const n = Math.round((w * h) / 260)
  for (let i = 0; i < n * 0.5; i++)
    g.circle(x + rng() * w, y + rng() * h, 7 + rng() * 9).fill({ color: sd.leaf, alpha: 0.9 })
  for (let i = 0; i < n; i++) {
    const r = 3 + rng() * 6
    g.circle(x + rng() * w, y + rng() * h, r).fill(
      rng() < 0.25 ? 0xd84a8a : rng() < 0.5 ? 0x8a1a52 : colour,
    )
  }
}

/** a wrought iron lantern on a bracket; the glow goes on separately */
export function lantern(g: Graphics, x: number, y: number, side: -1 | 1 = 1) {
  g.moveTo(x, y)
    .quadraticCurveTo(x + side * 14, y - 8, x + side * 18, y + 6)
    .stroke({ color: sd.iron, width: 2.5 })
  const lx = x + side * 18
  g.poly([lx - 8, y + 10, lx + 8, y + 10, lx + 6, y + 34, lx - 6, y + 34]).fill(0xffc870)
  g.poly([lx - 10, y + 10, lx + 10, y + 10, lx, y + 2]).fill(sd.iron)
  g.rect(lx - 7, y + 33, 14, 3).fill(sd.iron)
  g.rect(lx - 1, y + 10, 2, 24).fill({ color: sd.iron, alpha: 0.7 })
}
