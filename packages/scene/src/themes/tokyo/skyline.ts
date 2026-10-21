import { Container, Graphics, Sprite } from 'pixi.js'
import { WORLD } from '../../layout'
import { chance, createRng, pick, range } from '../../rng'
import { glowTexture } from '../../textures'

const BASE = 760
const FAR = 0x0e0c18
const NEAR = 0x15111c

// The city over the bars: blocks with billboards on their roofs and red
// aircraft lights blinking, and Tokyo Tower lit up orange and white.
export class TokyoSkyline extends Container {
  private far = new Container()
  private near = new Container()
  private blinkers: Sprite[] = []

  constructor(seed: number) {
    super()
    const rng = createRng(seed)
    for (const [x, sx, sy, a, tint] of [
      [WORLD.width / 2, 16, 3.4, 0.5, 0xff4a1e],
      [1960, 5, 2.6, 0.45, 0xff8a2a],
    ] as const) {
      const s = new Sprite(glowTexture())
      s.anchor.set(0.5)
      s.position.set(x, BASE - 200)
      s.scale.set(sx, sy)
      s.tint = tint
      s.alpha = a
      s.blendMode = 'add'
      this.addChild(s)
    }
    this.addChild(this.far, this.near)

    const far = new Graphics()
    let x = -500
    while (x < WORLD.width + 500) {
      const w = range(rng, 60, 140)
      const top = range(rng, 300, 520)
      far.rect(x, top, w, BASE - top).fill(FAR)
      for (let wy = top + 8; wy < BASE - 8; wy += 10) {
        for (let wx = x + 5; wx < x + w - 5; wx += 8) {
          if (chance(rng, 0.16)) far.rect(wx, wy, 4, 5).fill({ color: pick(rng, [0xffc46a, 0xfff0d0, 0xff8a4a]), alpha: 0.6 })
        }
      }
      // rooftop billboards and blinking aircraft lights
      if (chance(rng, 0.35)) {
        const bw = w * 0.7
        far.rect(x + (w - bw) / 2, top - 34, bw, 28).fill(pick(rng, [0xc8261a, 0xe08a2a, 0xd84a6a, 0xf0c040]))
        far.rect(x + (w - bw) / 2 + 4, top - 6, 2, 6).rect(x + (w + bw) / 2 - 6, top - 6, 2, 6).fill(FAR)
      }
      if (chance(rng, 0.3)) this.blinker(x + w / 2, top - 4)
      x += w + range(rng, -4, 8)
    }
    this.far.addChild(far)

    const near = new Graphics()
    this.tower(near, 1960, 60)
    this.near.addChild(near)
  }

  /** Tokyo Tower: a red-and-white lattice, two observation decks, lit */
  private tower(g: Graphics, cx: number, tip: number) {
    const h = BASE - tip
    const at = (t: number) => ({ y: BASE - t * h, half: 4 + 130 * Math.pow(1 - t, 2.4) })
    const outline: number[] = []
    for (let i = 0; i <= 24; i++) {
      const { y, half } = at(i / 24)
      outline.push(cx - half, y)
    }
    for (let i = 24; i >= 0; i--) {
      const { y, half } = at(i / 24)
      outline.push(cx + half, y)
    }
    g.poly(outline).fill(0xc8401e)
    // the white bands
    for (let i = 0; i < 6; i++) {
      const t0 = 0.12 + i * 0.13
      const a = at(t0)
      const b = at(t0 + 0.04)
      g.poly([cx - a.half, a.y, cx + a.half, a.y, cx + b.half, b.y, cx - b.half, b.y]).fill(0xf2d8b0)
    }
    // lattice
    for (let i = 1; i < 24; i++) {
      const a = at(i / 24)
      const b = at((i + 1) / 24)
      g.moveTo(cx - a.half, a.y).lineTo(cx + b.half, b.y).moveTo(cx + a.half, a.y).lineTo(cx - b.half, b.y).stroke({ color: 0xffb060, width: 1.2, alpha: 0.6 })
    }
    for (const t of [0.33, 0.62]) {
      const { y, half } = at(t)
      g.rect(cx - half - 12, y - 16, (half + 12) * 2, 18).fill(0x2a1810)
      for (let wx = cx - half - 8; wx < cx + half + 10; wx += 6) g.rect(wx, y - 12, 3, 8).fill(0xffe0a0)
    }
    g.rect(cx - 2, tip - 50, 4, 50).fill(0xf2d8b0)
    const halo = new Sprite(glowTexture())
    halo.anchor.set(0.5)
    halo.position.set(cx, BASE - h * 0.45)
    halo.scale.set(1.6, 3.6)
    halo.tint = 0xff7a2a
    halo.alpha = 0.45
    halo.blendMode = 'add'
    this.near.addChild(halo)
    this.blinker(cx, tip - 50)
  }

  private blinker(x: number, y: number) {
    const s = new Sprite(glowTexture())
    s.anchor.set(0.5)
    s.position.set(x, y)
    s.scale.set(0.14)
    s.tint = 0xff2a1a
    s.blendMode = 'add'
    this.addChild(s)
    this.blinkers.push(s)
  }

  update(time: number, px: number) {
    this.far.x += (-px * 8 - this.far.x) * 0.05
    this.near.x += (-px * 14 - this.near.x) * 0.05
    this.blinkers.forEach((b, i) => (b.alpha = Math.sin(time * 2 + i * 1.3) > 0.4 ? 1 : 0.1))
  }
}
