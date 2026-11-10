import { Graphics } from 'pixi.js'
import type { WindowStyle } from '../../layers/window'
import { palette } from '../../palette'
import { sd } from './parts'

/** how far down the sides the arched head starts */
const SPRING = 26

function arched(g: Graphics, x: number, y: number, w: number, h: number, spring = SPRING) {
  return g
    .moveTo(x, y + h)
    .lineTo(x, y + spring)
    .bezierCurveTo(x, y + spring * 0.3, x + w * 0.22, y, x + w / 2, y)
    .bezierCurveTo(x + w * 0.78, y, x + w, y + spring * 0.3, x + w, y + spring)
    .lineTo(x + w, y + h)
    .closePath()
}

/**
 * Round-headed casements set deep in the stucco, dark wood frames, a clay
 * tile sill. Upstairs they get a little iron rail with a pot hung on it.
 */
export const sanDiegoWindow: WindowStyle = {
  glass: (g, w, h) => arched(g, 0, 0, w, h),

  frame(g, { width: w, height: h }) {
    // the reveal, then the frame
    arched(g, -12, -12, w + 24, h + 14, SPRING + 8).fill(sd.stuccoLight)
    arched(g, -7, -7, w + 14, h + 8, SPRING + 4).fill(sd.stuccoDark)
    arched(g, -4, -4, w + 8, h + 5, SPRING + 2).fill(sd.wood)
    // sill of clay tiles on edge
    g.rect(-14, h + 1, w + 28, 8).fill(sd.tile)
    for (let tx = -12; tx < w + 12; tx += 10)
      g.rect(tx, h + 1, 1.5, 8).fill({ color: palette.ink, alpha: 0.4 })
    g.rect(-14, h + 9, w + 28, 3).fill({ color: palette.ink, alpha: 0.35 })
  },

  bars(g, { width: w, height: h }) {
    arched(g, 0, 0, w, h).stroke({ color: sd.wood, width: 5 })
    g.rect(w / 2 - 2, 0, 4, h).fill(sd.wood)
    g.rect(0, SPRING + 8, w, 3).fill(sd.wood)
    g.rect(0, h * 0.62, w, 3).fill(sd.wood)
  },

  front({ width: w, height: h, row }) {
    if (row === 2) return null
    const g = new Graphics()
    const iron = { color: sd.iron, width: 2 }
    g.rect(-10, h - 34, w + 20, 2.5).fill(sd.iron)
    g.rect(-10, h - 2, w + 20, 2.5).fill(sd.iron)
    for (let bx = -8; bx <= w + 8; bx += 9) g.rect(bx, h - 34, 1.5, 34).fill(sd.iron)
    // a scroll at each end
    for (const sx of [-10, w + 10])
      g.moveTo(sx, h - 34)
        .quadraticCurveTo(sx + (sx < 0 ? -8 : 8), h - 40, sx + (sx < 0 ? -4 : 4), h - 46)
        .stroke(iron)
    return g
  },

  curtains: [0x4a3a2a, 0xf0c080],
}
