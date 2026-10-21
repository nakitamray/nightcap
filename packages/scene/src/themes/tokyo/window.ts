import { Graphics } from 'pixi.js'
import type { WindowStyle } from '../../layers/window'
import { palette } from '../../palette'
import { tk } from './parts'

/** aluminium sliding windows, a little balcony rail, paper screens behind */
export const tokyoWindow: WindowStyle = {
  glass: (g, w, h) => g.rect(0, 0, w, h),

  frame(g, { width: w, height: h }) {
    g.rect(-10, -10, w + 20, h + 14).fill(tk.tileDark)
    g.rect(-10, -10, w + 20, 6).fill(0x4a3e34)
    g.rect(-6, -6, w + 12, h + 8).fill(tk.metal)
  },

  bars(g, { width: w, height: h }) {
    // two sashes overlapping in the middle
    g.rect(0, 0, w, h).stroke({ color: 0x8a8a90, width: 5 })
    g.rect(w / 2 - 3, 0, 6, h).fill(0x8a8a90)
    g.rect(w / 2 + 3, 0, 2, h).fill({ color: palette.ink, alpha: 0.5 })
    // frosted lower panes
    g.rect(3, h * 0.66, w / 2 - 6, h * 0.34 - 3).fill({ color: 0xe8e0d0, alpha: 0.12 })
    g.rect(w / 2 + 5, h * 0.66, w / 2 - 8, h * 0.34 - 3).fill({ color: 0xe8e0d0, alpha: 0.12 })
  },

  front({ width: w, height: h }) {
    // balcony rail, with the pole people hang their washing on
    const g = new Graphics()
    g.rect(-14, h - 30, w + 28, 3).fill(0x8a8a90)
    for (let bx = -12; bx < w + 14; bx += 7) g.rect(bx, h - 30, 1.5, 34).fill(0x6a6a70)
    g.rect(-14, h + 2, w + 28, 4).fill(0x6a6a70)
    g.rect(-18, h - 56, w + 36, 2).fill(0xa0a0a6)
    return g
  },

  curtains: [0x4a3626, 0xf2b870],
}
