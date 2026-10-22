import { Container, Sprite } from 'pixi.js'
import { createRng, range } from '../rng'
import { puffTexture } from '../textures'

interface Puff {
  s: Sprite
  age: number
  life: number
  drift: number
  wobble: number
}

/**
 * Steam curling off a chimney. A fixed pool of soft puffs, each one rising,
 * widening and fading out, then starting again at the pot. Leans a little
 * with the wind.
 */
export class Smoke extends Container {
  private puffs: Puff[] = []
  private rng: () => number

  constructor(
    seed: number,
    private source: { x: number; y: number },
    private opts = { tint: 0xc8b2a2, strength: 0.42, rise: 190, count: 20 },
  ) {
    super()
    this.rng = createRng(seed)
    for (let i = 0; i < opts.count; i++) {
      const s = new Sprite(puffTexture())
      s.anchor.set(0.5)
      s.tint = opts.tint
      this.addChild(s)
      const life = range(this.rng, 4.5, 7.5)
      // stagger them so the column is already going on the first frame
      this.puffs.push({
        s,
        age: (i / opts.count) * life,
        life,
        drift: range(this.rng, 8, 18),
        wobble: this.rng() * 10,
      })
    }
  }

  update(time: number, dt: number) {
    const { x, y } = this.source
    for (const p of this.puffs) {
      p.age += dt
      if (p.age > p.life) {
        p.age = 0
        p.life = range(this.rng, 4.5, 7.5)
      }
      const t = p.age / p.life
      p.s.x = x + Math.sin(time * 0.7 + p.wobble) * (3 + t * 8) + t * t * p.drift * 6
      p.s.y = y - t * this.opts.rise
      p.s.scale.set(0.1 + t * 0.55, 0.08 + t * 0.4)
      // quick fade in at the pot, long fade out at the top
      p.s.alpha = Math.min(1, t * 6) * (1 - t) * this.opts.strength
    }
  }
}
