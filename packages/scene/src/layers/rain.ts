import { Container, Sprite } from 'pixi.js'
import { CURB, GROUND, WORLD } from '../layout'
import { palette } from '../palette'
import { createRng, range, type Rng } from '../rng'
import { ringTexture, streakTexture } from '../textures'

interface Drop {
  s: Sprite
  speed: number
  floor: number
}

interface Splash {
  s: Sprite
  age: number
}

const WIND = 0.14
const SPLASH_LIFE = 0.38

export class Rain extends Container {
  private drops: Drop[] = []
  private splashes: Splash[] = []
  private splashLayer = new Container()
  private rng: Rng
  private top = -900

  constructor(seed: number, count: number) {
    super()
    this.rng = createRng(seed)
    this.addChild(this.splashLayer)
    for (let i = 0; i < count; i++) {
      const s = new Sprite(streakTexture())
      s.anchor.set(0.5, 1)
      s.tint = palette.rain
      s.rotation = -WIND
      this.addChild(s)
      const d: Drop = { s, speed: 0, floor: 0 }
      this.reset(d, true)
      this.drops.push(d)
    }
    for (let i = 0; i < 50; i++) {
      const s = new Sprite(ringTexture())
      s.anchor.set(0.5)
      s.tint = palette.rain
      s.visible = false
      this.splashLayer.addChild(s)
      this.splashes.push({ s, age: SPLASH_LIFE })
    }
  }

  /** how far above the world the rain needs to start (narrow screens show more sky) */
  setTop(top: number) {
    this.top = Math.min(-200, top)
  }

  private reset(d: Drop, anywhere = false) {
    const rng = this.rng
    const near = rng()
    d.speed = range(rng, 900, 1300) * (0.7 + near * 0.5)
    d.s.scale.set(0.6 + near * 0.5, range(rng, 0.7, 1.4) * (0.7 + near * 0.6))
    d.s.alpha = 0.06 + near * 0.16
    d.s.x = range(rng, -300, WORLD.width + 300)
    d.s.y = anywhere ? range(rng, this.top, WORLD.height) : this.top - range(rng, 0, 200)
    // some drops end on the sidewalk, most on the road
    d.floor = rng() < 0.2 ? range(rng, GROUND + 4, CURB) : range(rng, CURB + 4, WORLD.height + 80)
  }

  private splash(x: number, y: number) {
    const free = this.splashes.find((s) => s.age >= SPLASH_LIFE)
    if (!free) return
    free.age = 0
    free.s.position.set(x, y)
    free.s.visible = true
  }

  update(dt: number) {
    for (const d of this.drops) {
      d.s.y += d.speed * dt
      d.s.x += d.speed * WIND * dt
      if (d.s.y >= d.floor) {
        if (this.rng() < 0.35) this.splash(d.s.x, d.floor)
        this.reset(d)
      }
    }
    for (const sp of this.splashes) {
      if (sp.age >= SPLASH_LIFE) continue
      sp.age += dt
      const t = Math.min(1, sp.age / SPLASH_LIFE)
      const size = 0.08 + t * 0.32
      sp.s.scale.set(size, size * 0.28)
      sp.s.alpha = (1 - t) * 0.4
      if (t >= 1) sp.s.visible = false
    }
  }
}
