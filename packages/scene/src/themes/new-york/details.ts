import { Container, Graphics, Sprite } from 'pixi.js'
import { glow } from '../../layers/neon'
import { GROUND } from '../../layout'
import { palette } from '../../palette'
import { chance, pick, range, type Rng } from '../../rng'
import { dotTexture } from '../../textures'
import { ny } from './parts'

const INK = palette.ink

/**
 * A high stoop: steps from the pavement up to the parlor door, getting
 * wider toward the bottom, iron rails down both sides ending in a scroll.
 */
export function stoop(g: Graphics, cx: number, top: number, doorW: number, tone = ny.brownstone, light = ny.brownstoneLight) {
  const steps = 7
  const stepH = (GROUND - top) / steps
  for (let i = 0; i < steps; i++) {
    const half = doorW / 2 + 12 + i * 9
    const y = top + i * stepH
    g.rect(cx - half, y, half * 2, stepH).fill(i % 2 ? tone : light)
    g.rect(cx - half, y, half * 2, 2).fill({ color: 0x8a6242, alpha: 0.5 })
  }
  // the cheek walls either side
  for (const side of [-1, 1]) {
    const inner = cx + side * (doorW / 2 + 12)
    const outer = cx + side * (doorW / 2 + 12 + steps * 9)
    g.poly([inner, top, inner + side * 8, top, outer + side * 8, GROUND, outer, GROUND]).fill(ny.brownstoneDark)
  }
  for (const side of [-1, 1]) {
    const topX = cx + side * (doorW / 2 + 14)
    const botX = cx + side * (doorW / 2 + 18 + steps * 9)
    const railTop = top - 34
    const railBot = GROUND - 36
    g.moveTo(topX, railTop).lineTo(botX, railBot).stroke({ color: INK, width: 3 })
    g.moveTo(topX, railTop + 8).lineTo(botX, railBot + 8).stroke({ color: INK, width: 1.5 })
    for (let t = 0; t <= 1.001; t += 0.1) {
      const bx = topX + (botX - topX) * t
      const by = railTop + (railBot - railTop) * t
      g.rect(bx - 0.75, by, 1.5, 34).fill(INK)
      // little ball finials along the rail
      if (Math.round(t * 10) % 3 === 0) g.circle(bx, by - 2, 2).fill(INK)
    }
    // newel post with a scroll at the foot
    g.rect(botX - 4, railBot - 4, 8, GROUND - railBot + 4).fill(INK)
    g.circle(botX, railBot - 8, 6).fill(INK)
    g.moveTo(botX, GROUND - 6)
      .quadraticCurveTo(botX + side * 20, GROUND - 12, botX + side * 14, GROUND - 26)
      .stroke({ color: INK, width: 2.5 })
  }
}

/** low iron fence round a front garden / areaway */
export function areaway(g: Graphics, x: number, w: number, h = 40) {
  g.rect(x, GROUND - h, w, 3).rect(x, GROUND - 4, w, 4).fill(INK)
  for (let bx = x; bx <= x + w; bx += 7) {
    g.rect(bx, GROUND - h, 1.6, h).fill(INK)
    g.poly([bx - 2, GROUND - h, bx + 0.8, GROUND - h - 7, bx + 3.6, GROUND - h]).fill(INK)
  }
}

/** a tree pit with its little iron fence, at the kerb */
export function treePit(g: Graphics, x: number, y: number) {
  g.rect(x - 34, y - 2, 68, 6).fill(0x1a1410)
  for (let bx = x - 32; bx <= x + 32; bx += 8) {
    g.rect(bx, y - 16, 1.5, 16).fill(INK)
  }
  g.rect(x - 32, y - 16, 64, 2).fill(INK)
  // a few flowers someone planted round the trunk
  for (let i = 0; i < 6; i++) g.circle(x - 24 + i * 9, y - 4, 2.5).fill(i % 2 ? 0xe0402a : 0xf0c050)
}

export type Extra = 'ac' | 'box' | 'fairy' | 'plants' | 'flag' | 'none'

/**
 * Bits that make a window somebody's: an air conditioner jammed in the
 * sash, a box of geraniums, fairy lights, plants on the sill, a pennant.
 */
export function windowExtras(
  g: Graphics,
  lights: Container,
  bulbs: Container,
  rng: Rng,
  x: number,
  y: number,
  w: number,
  h: number,
  kind: Extra = pick(rng, ['ac', 'ac', 'box', 'box', 'fairy', 'plants', 'flag', 'none'] as const),
) {
  switch (kind) {
    case 'ac': {
      const ax = x + range(rng, 6, w - 46)
      const ay = y + h * 0.5 + 6
      g.rect(ax, ay, 40, 26).fill(0x8a8478).stroke({ color: INK, width: 1.5 })
      for (let i = 0; i < 5; i++) g.rect(ax + 4, ay + 4 + i * 4, 32, 1.5).fill({ color: INK, alpha: 0.5 })
      g.rect(ax - 4, ay + 26, 48, 4).fill({ color: INK, alpha: 0.7 })
      break
    }
    case 'box': {
      const flower = pick(rng, [0xe0402a, 0xf06a3a, 0xf0c050, 0xd04a8a, 0xf6f0e0])
      g.rect(x - 6, y + h + 14, w + 12, 14).fill(pick(rng, [0x2a3a1a, 0x4a1e12, 0x1e2a3a]))
      for (let i = 0; i < 9; i++) {
        const fx = x - 2 + (i / 8) * (w + 4)
        g.ellipse(fx, y + h + 10, 6, 8).fill(0x1b2a14)
        if (chance(rng, 0.75)) g.circle(fx + range(rng, -3, 3), y + h + 4 - range(rng, 0, 5), 3).fill(flower)
      }
      break
    }
    case 'fairy': {
      // fairy lights looped across the top of the glass
      const colours = [0xffd27a, 0xff7a5a, 0x8ad0ff, 0xb0ff9a, 0xff9ad8]
      for (let i = 0; i <= 8; i++) {
        const t = i / 8
        const bx = x + 6 + t * (w - 12)
        const by = y + 12 + Math.sin(t * Math.PI) * 10
        const s = new Sprite(dotTexture())
        s.anchor.set(0.5)
        s.position.set(bx, by)
        s.scale.set(0.06)
        s.tint = colours[i % colours.length]!
        bulbs.addChild(s)
        if (i % 2 === 0) glow(lights, bx, by, 0.14, 0.14, colours[i % colours.length]!, 0.5)
      }
      break
    }
    case 'plants': {
      for (let i = 0; i < 3; i++) {
        const px = x + 10 + i * ((w - 20) / 2)
        g.poly([px - 7, y + h - 2, px + 7, y + h - 2, px + 5, y + h + 10, px - 5, y + h + 10]).fill(palette.terracotta)
        for (let l = 0; l < 5; l++) g.ellipse(px + range(rng, -7, 7), y + h - 8 - range(rng, 0, 12), 3, 7).fill(0x1b2a14)
      }
      break
    }
    case 'flag': {
      // a pennant from some team or other, hung inside the glass
      const fx = x + range(rng, 10, w - 40)
      g.poly([fx, y + 20, fx + 34, y + 30, fx, y + 40]).fill(pick(rng, [0x1e3a8a, 0xb0201a, 0xf0b020, 0x0a6a3a]))
      g.rect(fx - 2, y + 18, 2, 26).fill(INK)
      break
    }
    case 'none':
      break
  }
}

/** people sat out on the stoops: it's warm, nobody wants to go in yet */
export function stoopSitters() {
  const g = new Graphics()
  const sit = (x: number, y: number, coat: number, legs: number, hair: number, facing: 1 | -1, skin: number) => {
    g.circle(x, y - 46, 7).fill(skin)
    g.ellipse(x, y - 52, 8, 5).fill(hair)
    g.poly([x - 8, y - 38, x + 8, y - 38, x + 9, y - 12, x - 9, y - 12]).fill(coat)
    // thighs along the step, shins down to the next
    g.rect(x - 4 + facing * 2, y - 14, facing * 22, 8).fill(legs)
    g.rect(x + facing * 20 - 4, y - 14, 7, 22).fill(legs)
    g.ellipse(x + facing * 22, y + 8, 7, 3).fill(INK)
  }
  // two friends sharing a step next door, and someone alone with a book on ours
  sit(905, 1040, 0xb0501e, 0x2a3448, 0x1a0e08, -1, 0x6e4224)
  sit(935, 1040, 0x3a5a8a, 0x8a5a2a, 0x8a5a2a, -1, 0xd4a47c)
  sit(1160, 1058, 0x6a2a3a, 0x1a120e, 0x2e1a0e, 1, 0xb07c50)
  g.rect(1176, 1034, 12, 9).fill(0xe8d8b0)
  sit(1490, 1050, 0x2a4a2a, 0x2a2a2e, 0x0a0a0a, 1, 0x4e2e1a)
  return g
}
