import { Container, FillGradient, Graphics, Sprite } from 'pixi.js'
import { GROUND, WORLD } from '../layout'
import { palette } from '../palette'
import { createRng, range, type Rng } from '../rng'
import { dotTexture, glowTexture } from '../textures'

interface Star {
  sprite: Sprite
  base: number
  speed: number
  phase: number
}

interface Cloud {
  g: Graphics
  speed: number
}

const MOON = { x: 430, y: 200, r: 105 }

export class Sky extends Container {
  private stars: Star[] = []
  private clouds: Cloud[] = []

  constructor(seed: number) {
    super()
    const rng = createRng(seed)

    // the gradient runs way above the world so tall/narrow screens still get sky
    const top = -1600
    const gradient = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: palette.skyTop },
        { offset: 0.7, color: palette.skyTop },
        { offset: 0.88, color: palette.skyMid },
        { offset: 1, color: palette.skyLow },
      ],
      textureSpace: 'local',
    })
    this.addChild(new Graphics().rect(-400, top, WORLD.width + 800, GROUND - top).fill(gradient))

    // the rest of the city glowing red-orange low behind the rooftops
    for (const [x, sx, sy, a, tint] of [
      [WORLD.width / 2, 14, 3.2, 0.5, 0xff4a1e],
      [WORLD.width * 0.2, 6, 2.2, 0.45, 0xff8a2a],
      [WORLD.width * 0.8, 6, 2.2, 0.45, 0xff8a2a],
    ] as const) {
      const glow = new Sprite(glowTexture())
      glow.anchor.set(0.5)
      glow.position.set(x, GROUND - 120)
      glow.scale.set(sx, sy)
      glow.tint = tint
      glow.alpha = a
      glow.blendMode = 'add'
      this.addChild(glow)
    }

    this.addStars(rng, top)
    this.addMoon(rng)
    this.addClouds(rng)
  }

  private addStars(rng: Rng, top: number) {
    // printed stars: hard round dots in a few sizes, the odd big one with a halo
    const tex = dotTexture()
    const halo = glowTexture()
    for (let i = 0; i < 300; i++) {
      const big = rng() > 0.94
      const s = new Sprite(tex)
      s.anchor.set(0.5)
      s.x = range(rng, -400, WORLD.width + 400)
      // more stars up high, fewer near the city haze
      s.y = top + Math.pow(rng(), 1.5) * (GROUND - 360 - top)
      s.scale.set(big ? range(rng, 0.24, 0.34) : range(rng, 0.07, 0.15))
      s.tint = rng() > 0.7 ? 0xffe2a8 : 0xfff6e2
      if (big) {
        const h = new Sprite(halo)
        h.anchor.set(0.5)
        h.position.copyFrom(s.position)
        h.scale.set(0.12)
        h.tint = 0xffe2a8
        h.alpha = 0.5
        h.blendMode = 'add'
        this.addChild(h)
      }
      this.addChild(s)
      this.stars.push({ sprite: s, base: range(rng, 0.45, 1), speed: range(rng, 0.4, 2.2), phase: rng() * 10 })
    }
  }

  private addMoon(rng: Rng) {
    const halo = new Sprite(glowTexture())
    halo.anchor.set(0.5)
    halo.position.set(MOON.x, MOON.y)
    halo.scale.set(3.4)
    halo.tint = 0xffc070
    halo.alpha = 0.4
    halo.blendMode = 'add'
    this.addChild(halo)

    const moon = new Graphics().circle(MOON.x, MOON.y, MOON.r).fill(palette.moon)
    // maria -- the big dark patches, then a sprinkle of craters
    const patches = [
      [-30, -25, 38, 30],
      [18, -40, 26, 20],
      [28, 10, 34, 26],
      [-22, 30, 22, 16],
      [-55, 5, 16, 22],
    ] as const
    for (const [dx, dy, rx, ry] of patches) {
      moon.ellipse(MOON.x + dx, MOON.y + dy, rx, ry).fill({ color: palette.moonShade, alpha: 0.55 })
    }
    for (let i = 0; i < 26; i++) {
      const a = rng() * Math.PI * 2
      const d = Math.sqrt(rng()) * (MOON.r - 14)
      const r = range(rng, 2, 7)
      moon
        .circle(MOON.x + Math.cos(a) * d, MOON.y + Math.sin(a) * d, r)
        .fill({ color: palette.moonShade, alpha: 0.5 })
    }
    this.addChild(moon)
  }

  private addClouds(rng: Rng) {
    for (let i = 0; i < 5; i++) {
      const g = new Graphics()
      const w = range(rng, 260, 520)
      const h = range(rng, 14, 30)
      for (let j = 0; j < 4; j++) {
        g.roundRect(range(rng, 0, w * 0.4), j * h * 0.55, range(rng, w * 0.4, w), h, h / 2)
      }
      g.fill({ color: palette.cloud, alpha: 0.8 })
      g.x = range(rng, -300, WORLD.width)
      g.y = range(rng, 90, 420)
      this.addChild(g)
      this.clouds.push({ g, speed: range(rng, 4, 11) })
    }
  }

  update(time: number, dt: number) {
    for (const s of this.stars) {
      s.sprite.alpha = s.base * (0.65 + 0.35 * Math.sin(time * s.speed + s.phase))
    }
    for (const c of this.clouds) {
      c.g.x += c.speed * dt
      if (c.g.x > WORLD.width + 400) c.g.x = -700
    }
  }
}
