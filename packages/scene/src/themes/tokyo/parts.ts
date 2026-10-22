import { Graphics } from 'pixi.js'
import { palette } from '../../palette'

export const tk = {
  tile: 0x3a2a20,
  tileDark: 0x241a14,
  wood: 0x24140c,
  woodLight: 0x3a2214,
  metal: 0x5a5a5e,
  concrete: 0x3a3634,
  red: 0xc8261a,
}

export const INK = { color: palette.ink, width: 1.5, alpha: 0.7 }

/** the box an air conditioner lives in, hung on the wall */
export function acUnit(g: Graphics, x: number, y: number) {
  g.rect(x, y, 44, 30).fill(0x8a8680)
  g.circle(x + 16, y + 15, 10).fill(0x3a3836)
  for (let r = 3; r < 10; r += 3) g.circle(x + 16, y + 15, r).stroke({ color: 0x6a6866, width: 1 })
  for (let ly = y + 6; ly < y + 26; ly += 4) g.rect(x + 30, ly, 10, 1.5).fill(0x5a5856)
  g.rect(x + 40, y + 30, 2, 26).fill(0x3a3836)
}

/** a cat sat facing us, feet at (x, y); returns the tail so it can swish */
export function sittingCat(g: Graphics, x: number, y: number, s = 1) {
  const ink = palette.ink
  g.ellipse(x, y - 11 * s, 10 * s, 12 * s).fill(ink)
  g.circle(x, y - 27 * s, 7 * s).fill(ink)
  g.poly([x - 7 * s, y - 29 * s, x - 6 * s, y - 40 * s, x - 1 * s, y - 32 * s]).fill(ink)
  g.poly([x + 7 * s, y - 29 * s, x + 6 * s, y - 40 * s, x + 1 * s, y - 32 * s]).fill(ink)
  g.ellipse(x - 3 * s, y - 28 * s, 1.5 * s, 1 * s)
    .ellipse(x + 3 * s, y - 28 * s, 1.5 * s, 1 * s)
    .fill(0xffd27a)
  const tail = new Graphics()
    .moveTo(0, 0)
    .bezierCurveTo(10 * s, 2 * s, 16 * s, -6 * s, 12 * s, -18 * s)
    .stroke({ color: ink, width: 3 * s, cap: 'round' })
  tail.position.set(x + 8 * s, y - 4 * s)
  return tail
}

/**
 * A vertical neon sign. Japanese signs are mostly kanji; rather than fake the
 * script, each panel gets a few bold strokes in tube light, which reads right
 * from across the street.
 */
export function strokePanel(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  colour: number,
  rng: () => number,
) {
  g.roundRect(x - 4, y - 4, w + 8, h + 8, 4).fill(0x120806)
  const rows = Math.floor(h / (w + 6))
  for (let r = 0; r < rows; r++) {
    const cy = y + r * (w + 6) + 4
    const s = w - 8
    const c = { color: colour, width: 3, cap: 'round' as const }
    // a few strokes per character: a bar, a post, a hook, a dot
    g.moveTo(x + 4, cy + s * (0.2 + rng() * 0.2))
      .lineTo(x + 4 + s, cy + s * (0.2 + rng() * 0.2))
      .stroke(c)
    const px = x + 4 + s * (0.3 + rng() * 0.4)
    g.moveTo(px, cy + 2)
      .lineTo(px, cy + s)
      .stroke(c)
    if (rng() > 0.4)
      g.moveTo(x + 4 + s * 0.1, cy + s * 0.65)
        .lineTo(x + 4 + s * 0.9, cy + s * 0.8)
        .stroke(c)
    if (rng() > 0.5)
      g.moveTo(x + 4 + s * 0.15, cy + s)
        .quadraticCurveTo(x + 4 + s * 0.3, cy + s * 0.5, x + 4 + s * 0.35, cy + s * 0.45)
        .stroke(c)
    if (rng() > 0.6) g.circle(x + 4 + s * 0.8, cy + s * 0.5, 2).fill(colour)
  }
  g.roundRect(x - 2, y - 2, w + 4, h + 4, 3).stroke({ color: colour, width: 1.5, alpha: 0.6 })
}

/** a red paper lantern, hanging from (x, y) */
export function chochin(g: Graphics, x: number, y: number, s = 1, colour = tk.red) {
  g.rect(x - 1, y, 2, 6 * s).fill(palette.ink)
  g.rect(x - 7 * s, y + 6 * s, 14 * s, 4 * s).fill(palette.ink)
  g.ellipse(x, y + 26 * s, 13 * s, 17 * s).fill(colour)
  // the bamboo ribs
  for (let r = -12; r <= 12; r += 6) {
    const half = 13 * s * Math.sqrt(1 - (r / 17) ** 2)
    g.rect(x - half, y + 26 * s + r * s, half * 2, 1).fill({ color: palette.ink, alpha: 0.3 })
  }
  g.rect(x - 7 * s, y + 42 * s, 14 * s, 4 * s).fill(palette.ink)
}
