import { Container, Graphics, Sprite } from 'pixi.js'
import { createRng, range } from '../../rng'
import { dotTexture, glowTexture } from '../../textures'

/**
 * The tower, lit gold, over the rooftops to the right. Its feet are hidden
 * behind the street so only the top two-thirds ever show. Every so often it
 * does the sparkle, like it does on the hour.
 */
export class EiffelTower extends Container {
  private beacon: Sprite
  private sweep: Sprite
  private sparkles: Sprite[] = []
  private nextSparkle = 6
  private sparkleUntil = 0

  constructor(seed: number, cx: number, tip: number, foot: number) {
    super()
    const rng = createRng(seed)
    const h = foot - tip
    const at = (t: number) => ({ y: foot - t * h, half: 6 + 190 * Math.pow(1 - t, 2) })

    const halo = new Sprite(glowTexture())
    halo.anchor.set(0.5)
    halo.position.set(cx, foot - h * 0.55)
    halo.scale.set(2.2, (h * 3) / 256)
    halo.tint = 0xff9a3a
    halo.alpha = 0.35
    halo.blendMode = 'add'
    this.addChild(halo)

    const g = new Graphics()
    const outline: number[] = []
    for (let i = 0; i <= 30; i++) {
      const { y, half } = at(i / 30)
      outline.push(cx - half, y)
    }
    for (let i = 30; i >= 0; i--) {
      const { y, half } = at(i / 30)
      outline.push(cx + half, y)
    }
    g.poly(outline).fill(0x9a4a14)
    // criss-cross lattice in brighter gold
    for (let i = 0; i < 30; i++) {
      const a = at(i / 30)
      const b = at((i + 1) / 30)
      g.moveTo(cx - a.half, a.y)
        .lineTo(cx + b.half, b.y)
        .moveTo(cx + a.half, a.y)
        .lineTo(cx - b.half, b.y)
        .stroke({ color: 0xffc46a, width: 1.4, alpha: 0.75 })
    }
    // the legs' edges, lit
    g.poly(outline).stroke({ color: 0xffd890, width: 2, alpha: 0.8 })
    for (const t of [0.6, 0.82]) {
      const { y, half } = at(t)
      g.rect(cx - half - 10, y - 7, (half + 10) * 2, 9).fill(0xffb24a)
    }
    g.rect(cx - 2, tip - 46, 4, 46).fill(0xffb24a)
    this.addChild(g)

    // the searchlight that sweeps round from the top
    this.sweep = new Sprite(glowTexture())
    this.sweep.anchor.set(0, 0.5)
    this.sweep.position.set(cx, tip - 40)
    this.sweep.scale.set(4.5, 0.12)
    this.sweep.tint = 0xfff0c8
    this.sweep.alpha = 0.25
    this.sweep.blendMode = 'add'
    this.addChild(this.sweep)

    this.beacon = new Sprite(glowTexture())
    this.beacon.anchor.set(0.5)
    this.beacon.position.set(cx, tip - 44)
    this.beacon.scale.set(0.45)
    this.beacon.tint = 0xfff2cc
    this.beacon.blendMode = 'add'
    this.addChild(this.beacon)

    for (let i = 0; i < 90; i++) {
      const t = Math.pow(rng(), 0.8) * 0.95
      const { y, half } = at(t)
      const s = new Sprite(dotTexture())
      s.anchor.set(0.5)
      s.position.set(cx + range(rng, -half, half), y)
      s.scale.set(range(rng, 0.04, 0.08))
      s.tint = 0xffffff
      s.alpha = 0
      s.blendMode = 'add'
      this.addChild(s)
      this.sparkles.push(s)
    }
  }

  update(time: number, reducedMotion: boolean) {
    this.beacon.alpha = 0.7 + Math.sin(time * 2.4) * 0.3
    if (reducedMotion) return
    // slow sweep, mostly toward us so it shows as a stretching beam
    const angle = time * 0.4
    this.sweep.rotation = Math.PI + Math.sin(angle) * 0.6
    this.sweep.scale.x = 2 + Math.abs(Math.cos(angle)) * 3.5

    if (time > this.nextSparkle) {
      this.sparkleUntil = time + 5
      this.nextSparkle = time + 25
    }
    const on = time < this.sparkleUntil
    this.sparkles.forEach((s, i) => {
      s.alpha = on ? Math.max(0, Math.sin(time * 23 + i * 7.3)) ** 6 : 0
    })
  }
}
