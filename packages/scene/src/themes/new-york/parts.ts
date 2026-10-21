import { Graphics } from 'pixi.js'
import { palette } from '../../palette'
import { chance, pick, range, type Rng } from '../../rng'

export const ny = {
  brick: 0x48190f,
  brickDark: 0x2e0f0a,
  mortar: 0x1e0a07,
  brownstone: 0x3a2116,
  brownstoneLight: 0x5a3622,
  brownstoneDark: 0x24130c,
  cornice: 0x1a1210,
  iron: palette.ink,
  taxi: 0xd99a18,
}

/** a brick wall with the odd brick picked out and the soot running down */
export function brickWall(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  rng: Rng,
  base = ny.brick,
) {
  g.rect(x, y, w, h).fill(base)
  const course = 11
  const brickW = 26
  for (let by = y; by < y + h; by += course) {
    const offset = Math.round((by - y) / course) % 2 ? brickW / 2 : 0
    g.rect(x, by, w, 1.4).fill({ color: ny.mortar, alpha: 0.55 })
    for (let bx = x - offset; bx < x + w; bx += brickW) {
      g.rect(Math.max(bx, x), by, 1.4, course).fill({ color: ny.mortar, alpha: 0.4 })
      if (chance(rng, 0.16)) {
        const tone = pick(rng, [0x5a2216, 0x3a120c, 0x642a18, 0x401610])
        const left = Math.max(bx + 1.4, x)
        const width = Math.min(brickW - 1.4, x + w - left)
        if (width > 0)
          g.rect(left, by + 1.4, width, course - 1.4).fill({
            color: tone,
            alpha: range(rng, 0.4, 0.8),
          })
      }
    }
  }
  for (let i = 0; i < w / 40; i++) {
    g.rect(
      range(rng, x, x + w - 4),
      range(rng, y, y + h - 100),
      range(rng, 2, 5),
      range(rng, 30, 100),
    ).fill({
      color: palette.ink,
      alpha: range(rng, 0.06, 0.14),
    })
  }
}

/** zig-zag fire escape: landings at each floor, ladders between, alternating */
export function fireEscape(
  g: Graphics,
  x: number,
  top: number,
  w: number,
  floors: number,
  floorH: number,
) {
  const c = { color: ny.iron, alpha: 0.95 }
  for (let f = 0; f < floors; f++) {
    const py = top + f * floorH
    g.rect(x - 2, py, w + 4, 6).fill(c)
    g.rect(x, py - 30, w, 3).fill(c)
    g.rect(x, py - 16, w, 1.5).fill(c)
    for (let bx = x; bx <= x + w; bx += 8) g.rect(bx, py - 30, 2, 30).fill(c)
    // brackets back into the wall
    g.moveTo(x + 6, py + 6)
      .lineTo(x + 20, py + 26)
      .moveTo(x + w - 6, py + 6)
      .lineTo(x + w - 20, py + 26)
      .stroke({ color: ny.iron, width: 2 })
    if (f < floors - 1) {
      const fromX = f % 2 ? x + 8 : x + w - 28
      const toX = f % 2 ? x + w - 28 : x + 8
      g.moveTo(fromX, py + 4)
        .lineTo(toX, py + floorH)
        .moveTo(fromX + 16, py + 4)
        .lineTo(toX + 16, py + floorH)
        .stroke({ color: ny.iron, width: 3 })
      for (let s = 1; s < 9; s++) {
        const t = s / 9
        g.rect(fromX + (toX - fromX) * t, py + 4 + (floorH - 4) * t, 16, 2.2).fill(c)
      }
    } else {
      // the drop ladder, pulled up
      g.rect(x + w - 26, py + 4, 3, 70)
        .rect(x + w - 12, py + 4, 3, 70)
        .fill(c)
      for (let s = 10; s < 70; s += 9) g.rect(x + w - 26, py + 4 + s, 16, 2.2).fill(c)
    }
  }
}

/** wooden water tank on a steel stand, the shape every NY roofline has */
export function waterTower(g: Graphics, x: number, base: number, size = 1, colour = 0x1c1412) {
  const w = 58 * size
  const h = 60 * size
  const legs = 30 * size
  for (const lx of [x + 4 * size, x + w * 0.35, x + w * 0.65, x + w - 6 * size])
    g.rect(lx, base - legs, 3 * size, legs).fill(colour)
  g.moveTo(x + 4 * size, base - legs)
    .lineTo(x + w - 4 * size, base - 4)
    .moveTo(x + w - 4 * size, base - legs)
    .lineTo(x + 4 * size, base - 4)
    .stroke({ color: colour, width: 1.5 * size })
  g.rect(x, base - legs - h, w, h).fill(colour)
  for (let by = base - legs - h + 10 * size; by < base - legs; by += 12 * size)
    g.rect(x, by, w, 2 * size).fill({ color: 0x2e221c, alpha: 0.9 })
  g.poly([
    x - 3 * size,
    base - legs - h,
    x + w / 2,
    base - legs - h - 26 * size,
    x + w + 3 * size,
    base - legs - h,
  ]).fill(colour)
  g.rect(x + w / 2 - 1, base - legs - h - 34 * size, 2, 10 * size).fill(colour)
}
