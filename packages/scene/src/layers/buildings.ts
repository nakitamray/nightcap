import { Container, Graphics, Sprite } from 'pixi.js'
import { palette } from '../palette'
import { chance, pick, range, type Rng } from '../rng'
import { glowTexture } from '../textures'

export type Roof = 'flat' | 'mansard' | 'stepped' | 'dome' | 'spire' | 'pitched'

export interface BuildingSpec {
  x: number
  width: number
  top: number
  bottom: number
  color: number
  roof: Roof
  /** chance any given window is lit */
  litChance: number
  windowColor?: number
  windowSize?: [number, number]
  gap?: [number, number]
}

/**
 * Generic mid-century block: body, roof feature, grid of windows.
 * Returns the lit window rects so callers can hang glows / flicker on them.
 */
export function drawBuilding(g: Graphics, spec: BuildingSpec, rng: Rng) {
  const { x, width, top, bottom, color } = spec
  g.rect(x, top, width, bottom - top).fill(color)

  const cx = x + width / 2
  switch (spec.roof) {
    case 'mansard': {
      // sloped zinc roof with a row of chimney pots on top
      g.poly([x - 2, top, x + width + 2, top, x + width - 14, top - 34, x + 14, top - 34]).fill(color)
      for (let px = x + 18; px < x + width - 18; px += range(rng, 14, 30)) {
        g.rect(px, top - 34 - range(rng, 8, 18), 6, 18).fill(color)
      }
      break
    }
    case 'stepped': {
      g.rect(x + width * 0.12, top - 30, width * 0.76, 30).fill(color)
      g.rect(x + width * 0.26, top - 56, width * 0.48, 26).fill(color)
      g.rect(cx - 4, top - 96, 8, 40).fill(color)
      break
    }
    case 'dome': {
      const r = width * 0.28
      g.rect(cx - r, top - 18, r * 2, 18).fill(color)
      g.moveTo(cx - r, top - 18).arc(cx, top - 18, r, Math.PI, 0).fill(color)
      g.rect(cx - 2, top - 18 - r - 22, 4, 22).fill(color)
      break
    }
    case 'spire': {
      g.poly([cx - width * 0.2, top, cx, top - width * 1.1, cx + width * 0.2, top]).fill(color)
      break
    }
    case 'pitched': {
      g.poly([x - 6, top, cx, top - width * 0.35, x + width + 6, top]).fill(color)
      break
    }
    case 'flat':
      g.rect(x - 5, top - 8, width + 10, 8).fill(color)
      break
  }

  const [ww, wh] = spec.windowSize ?? [8, 11]
  const [gx, gy] = spec.gap ?? [9, 12]
  const cols = Math.floor((width - gx) / (ww + gx))
  const rows = Math.floor((bottom - top - 30) / (wh + gy))
  const offsetX = x + (width - (cols * (ww + gx) - gx)) / 2
  const lit: { x: number; y: number; w: number; h: number }[] = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = offsetX + c * (ww + gx)
      const wy = top + 22 + r * (wh + gy)
      if (chance(rng, spec.litChance)) {
        const warm = pick(rng, [palette.amber, palette.amberDeep, 0xffcf85, palette.burnt])
        g.rect(wx, wy, ww, wh).fill({ color: warm, alpha: range(rng, 0.45, 0.9) })
        lit.push({ x: wx, y: wy, w: ww, h: wh })
      } else {
        g.rect(wx, wy, ww, wh).fill({ color: spec.windowColor ?? palette.ink, alpha: 0.55 })
      }
    }
  }
  return lit
}

/** windows in the background that occasionally click on or off */
export class BlinkingWindows extends Container {
  private items: { s: Sprite; on: boolean; next: number }[] = []

  constructor(
    rects: { x: number; y: number; w: number; h: number }[],
    private rng: Rng,
  ) {
    super()
    for (const r of rects) {
      const s = new Sprite(glowTexture())
      s.anchor.set(0.5)
      s.position.set(r.x + r.w / 2, r.y + r.h / 2)
      s.scale.set((r.w * 4) / 256)
      s.tint = palette.amber
      s.blendMode = 'add'
      s.alpha = 0.5
      this.addChild(s)
      this.items.push({ s, on: true, next: range(rng, 3, 40) })
    }
  }

  update(time: number) {
    for (const it of this.items) {
      if (time > it.next) {
        it.on = !it.on
        it.next = time + range(this.rng, 6, 50)
      }
      const target = it.on ? 0.5 : 0
      it.s.alpha += (target - it.s.alpha) * 0.2
    }
  }
}

export function randomRoof(rng: Rng): Roof {
  return pick(rng, ['mansard', 'mansard', 'mansard', 'flat', 'dome', 'pitched', 'spire'] as const)
}
