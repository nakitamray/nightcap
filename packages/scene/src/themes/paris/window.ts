import { Graphics } from 'pixi.js'
import { ironRail } from '../../layers/ironwork'
import type { WindowStyle } from '../../layers/window'
import { palette } from '../../palette'

const INK = { color: palette.ink, width: 1.5, alpha: 0.7 }

/** tall french casements in a moulded stone surround */
export const parisWindow: WindowStyle = {
  glass: (g, w, h) => g.rect(0, 0, w, h),

  frame(g, { width: w, height: h, row }) {
    // moulded stone surround with a shadowed reveal
    g.rect(-12, -12, w + 24, h + 16).fill(palette.stoneLight)
    g.rect(-6, -6, w + 12, h + 8).fill(palette.stoneDark)
    g.rect(-12, -12, w + 24, h + 16).stroke(INK)

    if (row === 2) {
      // the noble floor gets a proper triangular pediment
      g.poly([-22, -18, w / 2, -54, w + 22, -18])
        .fill(palette.stoneLight)
        .stroke(INK)
      g.poly([-8, -22, w / 2, -46, w + 8, -22]).fill(palette.stone)
      g.rect(-24, -20, w + 48, 7).fill(palette.stoneLight)
    } else if (row === 1) {
      // flat hood on two little scrolled consoles
      g.rect(-22, -30, w + 44, 12)
        .fill(palette.stoneLight)
        .stroke(INK)
      g.rect(-22, -18, w + 44, 3).fill({ color: palette.ink, alpha: 0.35 })
      for (const cx of [-16, w + 8]) {
        g.rect(cx, -18, 8, 22).fill(palette.stoneLight)
        g.circle(cx + 4, 6, 4).fill(palette.stoneLight)
      }
    } else {
      g.poly([w / 2 - 9, -16, w / 2 + 9, -16, w / 2 + 6, 0, w / 2 - 6, 0]).fill(palette.stoneLight)
    }
  },

  bars(g, { width: w, height: h }) {
    // french casements: centre post, a transom, two lighter glazing bars
    g.rect(w / 2 - 2, h * 0.2, 4, h * 0.8).fill(palette.ink)
    g.rect(0, h * 0.2 - 2, w, 5).fill(palette.ink)
    g.rect(0, h * 0.45, w, 2.5)
      .rect(0, h * 0.7, w, 2.5)
      .fill(palette.ink)
    g.rect(w / 4 - 1, 0, 2, h * 0.2)
      .rect((3 * w) / 4 - 1, 0, 2, h * 0.2)
      .fill(palette.ink)
    g.rect(0, 0, w, h).stroke({ color: palette.ink, width: 5 })
    // a little moonlight caught on the glass
    g.poly([w * 0.08, h * 0.62, w * 0.22, h * 0.5, w * 0.27, h * 0.55, w * 0.13, h * 0.67]).fill({
      color: 0xe6ecff,
      alpha: 0.07,
    })
  },

  front: ({ width: w, height: h, balcony }) =>
    balcony === 'rail' ? ironRail(-8, h - 36, w + 16, 40, new Graphics()) : null,
}
