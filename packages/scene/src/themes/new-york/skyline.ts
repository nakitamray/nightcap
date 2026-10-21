import { Container, Graphics, Sprite } from 'pixi.js'
import { WORLD } from '../../layout'
import { chance, createRng, pick, range, type Rng } from '../../rng'
import { glowTexture } from '../../textures'

const BASE = 720
const FAR = 0x0c0c1a
const NEAR = 0x131020

// Manhattan across the river: a wall of towers with their offices still lit,
// the Empire State (left, over the bodega) and the Chrysler standing out of it, the sky over the city
// burning orange.
export class Manhattan extends Container {
  private far = new Container()
  private near = new Container()
  private beacons: Sprite[] = []

  constructor(seed: number) {
    super()
    const rng = createRng(seed)

    // city glow behind everything
    for (const [x, sx, sy, a, tint] of [
      [WORLD.width / 2, 16, 3.6, 0.5, 0xff4a1e],
      [450, 5, 2.6, 0.4, 0xff8a2a],
      [1950, 5, 2.6, 0.4, 0xff8a2a],
    ] as const) {
      const s = new Sprite(glowTexture())
      s.anchor.set(0.5)
      s.position.set(x, BASE - 160)
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
      const w = range(rng, 50, 110)
      this.tower(far, rng, x, w, range(rng, 250, 470), FAR, 0.14)
      x += w + range(rng, -6, 10)
    }
    this.far.addChild(far)

    const near = new Graphics()
    x = -500
    while (x < WORLD.width + 500) {
      const w = range(rng, 70, 150)
      // leave the two landmarks some sky
      const nearLandmark = Math.abs(x + w / 2 - 470) < 120 || Math.abs(x + w / 2 - 1960) < 140
      this.tower(near, rng, x, w, nearLandmark ? range(rng, 420, 520) : range(rng, 300, 540), NEAR, 0.22)
      x += w + range(rng, 0, 18)
    }
    this.empireState(near, 470)
    this.chrysler(near, 1960)
    this.near.addChild(near)
  }

  /** a plain slab with a grid of office windows, some lit */
  private tower(g: Graphics, rng: Rng, x: number, w: number, top: number, colour: number, lit: number) {
    g.rect(x, top, w, BASE - top).fill(colour)
    if (chance(rng, 0.35)) g.rect(x + w * 0.2, top - range(rng, 20, 50), w * 0.6, 50).fill(colour)
    if (chance(rng, 0.2)) g.rect(x + w / 2 - 1, top - 70, 2, 30).fill(colour)
    for (let wy = top + 10; wy < BASE - 10; wy += 9) {
      for (let wx = x + 5; wx < x + w - 6; wx += 7) {
        if (chance(rng, lit)) g.rect(wx, wy, 3.5, 5).fill({ color: pick(rng, [0xffc46a, 0xffa040, 0xffe0a0]), alpha: range(rng, 0.45, 0.9) })
      }
    }
  }

  private empireState(g: Graphics, cx: number) {
    const c = NEAR
    // setbacks, getting narrower toward the mast
    const tiers: [number, number][] = [
      [190, 330],
      [150, 250],
      [104, 214],
      [70, 190],
      [46, 160],
    ]
    for (const [w, top] of tiers) g.rect(cx - w / 2, top, w, BASE - top).fill(c)
    // lit crown and the mooring mast
    g.rect(cx - 23, 130, 46, 30).fill(c)
    for (let i = 0; i < 4; i++) g.rect(cx - 18 + i * 11, 136, 5, 20).fill({ color: 0xffd27a, alpha: 0.95 })
    g.poly([cx - 14, 130, cx, 76, cx + 14, 130]).fill(c)
    g.rect(cx - 3, 30, 6, 50).fill(c)
    g.rect(cx - 1, -10, 2, 42).fill(c)
    // vertical piers of lit windows down the middle
    for (let wy = 220; wy < BASE - 10; wy += 9) {
      for (let wx = cx - 40; wx < cx + 40; wx += 8) {
        if ((wx + wy) % 3 !== 0) g.rect(wx, wy, 3, 5).fill({ color: 0xffc46a, alpha: 0.6 })
      }
    }
    this.halo(cx, 140, 1.4, 0xffb050, 0.55)
    this.beacon(cx, -8)
  }

  private chrysler(g: Graphics, cx: number) {
    const c = NEAR
    g.rect(cx - 50, 300, 100, BASE - 300).fill(c)
    g.rect(cx - 36, 240, 72, 60).fill(c)
    // the stacked sunburst arches, each with its row of triangular windows
    const arches = 6
    for (let i = 0; i < arches; i++) {
      const half = 34 - i * 5
      const base = 240 - i * 20
      g.moveTo(cx - half, base).quadraticCurveTo(cx, base - 34, cx + half, base).closePath().fill(c)
      for (let k = -2; k <= 2; k++) {
        const tx = cx + k * half * 0.38
        const ty = base - 8 - (1 - Math.abs(k) / 3) * 10
        g.poly([tx - 3, ty + 6, tx, ty - 3, tx + 3, ty + 6]).fill({ color: 0xfff0c0, alpha: 0.95 })
      }
    }
    g.poly([cx - 6, 128, cx, 40, cx + 6, 128]).fill(c)
    for (let wy = 310; wy < BASE - 10; wy += 9) {
      for (let wx = cx - 42; wx < cx + 42; wx += 8) {
        if ((wx * 3 + wy) % 4 !== 0) g.rect(wx, wy, 3, 5).fill({ color: 0xffc46a, alpha: 0.55 })
      }
    }
    this.halo(cx, 190, 1.2, 0xfff0c0, 0.4)
  }

  private halo(x: number, y: number, s: number, tint: number, alpha: number) {
    const h = new Sprite(glowTexture())
    h.anchor.set(0.5)
    h.position.set(x, y)
    h.scale.set(s, s * 1.4)
    h.tint = tint
    h.alpha = alpha
    h.blendMode = 'add'
    this.near.addChild(h)
  }

  private beacon(x: number, y: number) {
    const b = new Sprite(glowTexture())
    b.anchor.set(0.5)
    b.position.set(x, y)
    b.scale.set(0.22)
    b.tint = 0xff2a1a
    b.blendMode = 'add'
    this.near.addChild(b)
    this.beacons.push(b)
  }

  update(time: number, px: number) {
    this.far.x += (-px * 8 - this.far.x) * 0.05
    this.near.x += (-px * 16 - this.near.x) * 0.05
    for (const b of this.beacons) b.alpha = Math.sin(time * 2) > 0.2 ? 1 : 0.15
  }
}
