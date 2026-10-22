import type { WindowStyle } from '../../layers/window'
import { palette } from '../../palette'
import { INK, lancet, shutters, vn } from './parts'

/** gothic pointed windows in istrian stone, green shutters on the top floor */
export const veniceWindow: WindowStyle = {
  glass: (g, w, h) => lancet(g, 0, 0, w, h),

  frame(g, { width: w, height: h, row }) {
    if (row === 0) shutters(g, 0, 2, w, h - 2)
    lancet(g, -11, -14, w + 22, h + 18, (w + 22) * 0.75)
      .fill(vn.istria)
      .stroke(INK)
    lancet(g, -5, -6, w + 10, h + 8, (w + 10) * 0.75).fill(vn.istriaDark)
    // a little stone cross on the tip of the arch
    g.rect(w / 2 - 1.5, -26, 3, 12)
      .rect(w / 2 - 5, -22, 10, 3)
      .fill(vn.istria)
    // sill
    g.rect(-16, h + 2, w + 32, 9)
      .fill(vn.istria)
      .stroke(INK)
  },

  bars(g, { width: w, height: h }) {
    const a = w * 0.75
    lancet(g, 0, 0, w, h).stroke({ color: palette.ink, width: 5 })
    g.rect(w / 2 - 2, a * 0.5, 4, h - a * 0.5).fill(palette.ink)
    g.rect(0, a - 2, w, 4).fill(palette.ink)
    // the little roundels of old venetian glass in the head of the arch
    for (const [cx, cy] of [
      [w / 2, a * 0.48],
      [w * 0.28, a * 0.78],
      [w * 0.72, a * 0.78],
    ] as const) {
      g.circle(cx, cy, 7).stroke({ color: palette.ink, width: 2 })
    }
    g.rect(0, h * 0.72, w, 2.5).fill(palette.ink)
  },

  curtains: [0x5a1a12, 0xe0702e],
}
