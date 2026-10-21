import { Graphics } from 'pixi.js'
import { palette } from '../../palette'

export const vn = {
  // plaster at night: what's ochre, rose and terracotta by day
  ochre: 0x785218,
  rose: 0x6c282c,
  terracotta: 0x743418,
  plaster: 0x742e28,
  brick: 0x3e160e,
  istria: 0x7a6a58,
  istriaDark: 0x4a3e32,
  shutter: 0x1a3226,
  tile: 0x5a2014,
  water: 0x060c16,
}

export const INK = { color: palette.ink, width: 1.5, alpha: 0.7 }

/** venetian plaster after dark: every house on the canal a different one */
export const PLASTERS = [
  0x6b282b, // rose
  0x78521c, // ochre
  0x733318, // terracotta
  0x2a4944, // verdigris
  0x73412b, // salmon
  0x5f542b, // butter
  0x521c17, // oxblood
  0x49334a, // mauve
  0x7c4420, // apricot
  0x39465f, // faded blue
]

/**
 * A pointed gothic arch window outline. `a` is how far down the sides the arch
 * starts; everything is relative to (x, y).
 */
export function lancet(g: Graphics, x: number, y: number, w: number, h: number, a = w * 0.75) {
  return g
    .moveTo(x, y + h)
    .lineTo(x, y + a)
    .bezierCurveTo(x, y + a * 0.45, x + w * 0.3, y + a * 0.12, x + w / 2, y)
    .bezierCurveTo(x + w * 0.7, y + a * 0.12, x + w, y + a * 0.45, x + w, y + a)
    .lineTo(x + w, y + h)
    .closePath()
}

/** venetian chimney: a stack that flares out into a funnel at the top */
export function funnelChimney(g: Graphics, x: number, base: number, colour = vn.terracotta) {
  g.rect(x - 7, base - 46, 14, 46).fill(colour)
  g.poly([x - 7, base - 46, x + 7, base - 46, x + 18, base - 74, x - 18, base - 74]).fill(colour)
  g.rect(x - 20, base - 80, 40, 7).fill(0x2a120c)
}

/** a pair of open green shutters either side of an opening */
export function shutters(g: Graphics, x: number, y: number, w: number, h: number) {
  const sw = w * 0.42
  for (const sx of [x - sw - 4, x + w + 4]) {
    g.rect(sx, y, sw, h).fill(vn.shutter)
    for (let ly = y + 6; ly < y + h - 4; ly += 6) g.rect(sx + 3, ly, sw - 6, 1.5).fill({ color: palette.ink, alpha: 0.45 })
    g.rect(sx, y, sw, h).stroke({ color: palette.ink, width: 1, alpha: 0.6 })
  }
}

/** crumbling plaster: patches where it's come away and the brick shows */
export function plasterWall(g: Graphics, x: number, y: number, w: number, h: number, colour: number, rng: () => number) {
  g.rect(x, y, w, h).fill(colour)
  for (let i = 0; i < (w * h) / 26000; i++) {
    const px = x + rng() * (w - 60)
    const py = y + rng() * (h - 40)
    const pw = 24 + rng() * 60
    const ph = 14 + rng() * 34
    g.roundRect(px, py, pw, ph, 6).fill(vn.brick)
    for (let by = py + 4; by < py + ph - 2; by += 6) g.rect(px + 2, by, pw - 4, 1).fill({ color: palette.ink, alpha: 0.4 })
  }
  // damp creeping up from the water
  g.rect(x, y + h - 70, w, 70).fill({ color: palette.ink, alpha: 0.22 })
}
