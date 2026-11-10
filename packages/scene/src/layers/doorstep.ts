import { Container, Graphics, Sprite } from 'pixi.js'
import type { GiftKind } from '../gifts'
import { GROUND, type Rect } from '../layout'
import { palette } from '../palette'
import { glowTexture } from '../textures'

export interface StepGift {
  kind: GiftKind
  /** left for whoever's looking; these get a little light on them */
  mine: boolean
}

const INK = palette.ink
const GAP = 30

/**
 * Gifts waiting on the front step, in a row in front of the door. Each one
 * is drawn small and flat, the way the street draws everything else.
 */
export class Doorstep extends Container {
  private items = new Container()
  private glows = new Container()
  private time = 0
  /** world-space box around everything on the step, for hit testing */
  area: Rect | null = null

  constructor(private centre: { x: number; y: number } = { x: 1200, y: GROUND }) {
    super()
    this.addChild(this.glows, this.items)
  }

  setGifts(gifts: StepGift[]) {
    this.items.removeChildren().forEach((c) => c.destroy())
    this.glows.removeChildren().forEach((c) => c.destroy())
    if (!gifts.length) {
      this.area = null
      return
    }
    const { x: cx, y } = this.centre
    const start = cx - ((gifts.length - 1) * GAP) / 2
    gifts.forEach((gift, i) => {
      const x = start + i * GAP
      const g = new Graphics()
      DRAW[gift.kind](g)
      g.position.set(x, y)
      this.items.addChild(g)
      if (gift.mine) {
        const glow = new Sprite(glowTexture())
        glow.anchor.set(0.5)
        glow.position.set(x, y - 10)
        glow.scale.set(0.22, 0.16)
        glow.tint = palette.amber
        glow.alpha = 0.5
        glow.blendMode = 'add'
        this.glows.addChild(glow)
      }
    })
    const half = ((gifts.length - 1) * GAP) / 2 + 18
    this.area = { x: cx - half, y: y - 46, width: half * 2, height: 56 }
  }

  contains(x: number, y: number) {
    const a = this.area
    return !!a && x >= a.x && x <= a.x + a.width && y >= a.y && y <= a.y + a.height
  }

  update(dt: number, reducedMotion: boolean) {
    if (reducedMotion) return
    this.time += dt
    for (const [i, g] of this.glows.children.entries())
      g.alpha = 0.42 + Math.sin(this.time * 1.4 + i) * 0.1
  }
}

// Each gift is drawn with its base at (0, 0), sitting on the ground.
const DRAW: Record<GiftKind, (g: Graphics) => void> = {
  flowers(g) {
    // a paper cone with blooms poking out the top
    g.poly([-9, -30, 9, -30, 2, 0, -2, 0]).fill(0xf2e2bd).stroke({ color: INK, width: 1 })
    for (const [x, y, c] of [
      [-6, -32, 0xe0505a],
      [0, -36, 0xf6c040],
      [6, -32, 0xe86aa0],
      [-3, -28, 0xf08a40],
      [4, -28, 0xe0505a],
    ] as const)
      g.circle(x, y, 4).fill(c)
    g.rect(-2, -14, 4, 3).fill(0xc2501e)
  },
  cake(g) {
    // a bakery box tied with string
    g.rect(-12, -16, 24, 16).fill(0xf6efe0).stroke({ color: INK, width: 1 })
    g.rect(-1, -16, 2, 16).fill(0xc2501e)
    g.rect(-12, -9, 24, 2).fill(0xc2501e)
    g.circle(-3, -18, 3).circle(3, -18, 3).stroke({ color: 0xc2501e, width: 1.5 })
  },
  wine(g) {
    g.roundRect(-5, -22, 10, 22, 2).fill(0x2a3a1e).stroke({ color: INK, width: 1 })
    g.rect(-2, -32, 4, 11).fill(0x2a3a1e)
    g.rect(-2.5, -34, 5, 3).fill(0x8e2416)
    g.rect(-4, -14, 8, 8).fill(0xf2e2bd)
    g.rect(-6, -2, 12, 2).fill({ color: INK, alpha: 0.4 })
  },
  candle(g) {
    // a candle in a jar, actually lit
    g.roundRect(-7, -16, 14, 16, 2)
      .fill({ color: 0xd8c8a8, alpha: 0.85 })
      .stroke({ color: INK, width: 1 })
    g.rect(-5, -12, 10, 10).fill(0xf6efe0)
    g.ellipse(0, -15, 2.2, 4).fill(0xffd06a)
    g.ellipse(0, -14, 1, 2).fill(0xfff6d0)
  },
  record(g) {
    // a sleeve leaning on the step, the disc peeking out
    g.circle(4, -13, 12).fill(INK)
    g.circle(4, -13, 3).fill(0xe8c25a)
    g.rect(-12, -26, 24, 26).fill(0x2f6b66).stroke({ color: INK, width: 1 })
    g.circle(0, -13, 7).fill(0xf2a04a)
  },
  plant(g) {
    g.poly([-8, -12, 8, -12, 6, 0, -6, 0]).fill(0xb8643a).stroke({ color: INK, width: 1 })
    g.rect(-9, -14, 18, 3).fill(0x8e3a1e)
    for (const [x, y, r] of [
      [-6, -22, 6],
      [5, -24, 6],
      [0, -30, 6],
      [-2, -18, 5],
      [4, -17, 5],
    ] as const)
      g.ellipse(x, y, r * 0.6, r).fill(x < 0 ? 0x3a7a3a : 0x5a9a3a)
  },
  book(g) {
    // two books tied up with a ribbon
    g.rect(-12, -8, 24, 8).fill(0x6e1a12).stroke({ color: INK, width: 1 })
    g.rect(-10, -16, 21, 8).fill(0x1e3a2e).stroke({ color: INK, width: 1 })
    g.rect(-12, -2, 24, 1).fill(0xf2e2bd)
    g.rect(-1, -16, 2, 16).fill(0xd9a54a)
    g.circle(-3, -18, 2.5).circle(3, -18, 2.5).stroke({ color: 0xd9a54a, width: 1.5 })
  },
  tea(g) {
    g.roundRect(-8, -20, 16, 20, 2).fill(0x8e2416).stroke({ color: INK, width: 1 })
    g.rect(-8, -20, 16, 4).fill(0xd9a54a)
    g.rect(-5, -12, 10, 6).fill(0xf2e2bd)
  },
}
