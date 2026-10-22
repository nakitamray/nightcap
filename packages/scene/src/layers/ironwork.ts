import { Graphics } from 'pixi.js'
import { palette } from '../palette'

/**
 * Wrought-iron balcony railing: rails top and bottom, balusters, and a band
 * of ovals through the middle. Everything Parisian has this.
 */
export function ironRail(x: number, y: number, width: number, height: number, g = new Graphics()) {
  const c = palette.iron
  g.rect(x, y, width, 3)
    .rect(x, y + height - 3, width, 3)
    .fill(c)
  const pitch = 9
  for (let bx = x + 2; bx < x + width - 1; bx += pitch) g.rect(bx, y, 1.6, height).fill(c)
  const midY = y + height * 0.52
  for (let ox = x + pitch / 2 + 2; ox < x + width - pitch / 2; ox += pitch * 2) {
    g.ellipse(ox + pitch / 2, midY, pitch / 2 - 0.5, height * 0.2).stroke({ color: c, width: 1.4 })
  }
  // little finials along the top rail
  for (let fx = x + 2; fx < x + width; fx += pitch * 4) g.circle(fx + 0.8, y - 2, 2).fill(c)
  return g
}

/** stone slab the continuous balconies sit on, with brackets underneath */
export function balconySlab(x: number, y: number, width: number, g: Graphics) {
  g.rect(x, y, width, 9).fill(palette.stoneLight)
  g.rect(x, y + 9, width, 3).fill({ color: palette.ink, alpha: 0.4 })
  for (let bx = x + 18; bx < x + width - 10; bx += 46) {
    g.poly([bx, y + 9, bx + 12, y + 9, bx + 9, y + 24, bx + 3, y + 24]).fill(palette.stone)
  }
  return g
}
