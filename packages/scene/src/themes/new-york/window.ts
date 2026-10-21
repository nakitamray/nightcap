import type { WindowStyle } from '../../layers/window'
import { palette } from '../../palette'
import { ny } from './parts'

const INK = { color: palette.ink, width: 1.5, alpha: 0.7 }

/** two-over-two sash windows with brownstone hoods and sills */
export const nyWindow: WindowStyle = {
  glass: (g, w, h) => g.rect(0, 0, w, h),

  frame(g, { width: w, height: h, row }) {
    g.rect(-8, -8, w + 16, h + 12).fill(ny.brownstoneDark)
    g.rect(-8, -8, w + 16, h + 12).stroke(INK)
    if (row === 0) {
      // segmental arched hood up under the cornice
      g.moveTo(-18, -6)
        .quadraticCurveTo(w / 2, -46, w + 18, -6)
        .lineTo(w + 18, 2)
        .lineTo(-18, 2)
        .closePath()
        .fill(ny.brownstoneLight)
        .stroke(INK)
    } else {
      // flat hood on two brackets
      g.rect(-20, -28, w + 40, 10).fill(ny.brownstoneLight).stroke(INK)
      g.rect(-16, -18, w + 32, 8).fill(ny.brownstone)
      for (const bx of [-16, w + 8]) g.rect(bx, -10, 8, 16).fill(ny.brownstoneLight)
    }
    // sill
    g.rect(-14, h + 4, w + 28, 9).fill(ny.brownstoneLight).stroke(INK)
  },

  bars(g, { width: w, height: h }) {
    g.rect(0, 0, w, h).stroke({ color: 0x1a0f0b, width: 6 })
    // meeting rail where the two sashes overlap
    g.rect(0, h * 0.5 - 3, w, 6).fill(0x1a0f0b)
    g.rect(w / 2 - 1.5, 0, 3, h).fill(0x1a0f0b)
    g.poly([w * 0.08, h * 0.38, w * 0.22, h * 0.26, w * 0.27, h * 0.31, w * 0.13, h * 0.43]).fill({ color: 0xe6ecff, alpha: 0.06 })
  },

  curtains: [0x5a1a12, 0xd8622e],
}
