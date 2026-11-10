import { Container, Graphics, Sprite } from 'pixi.js'
import type { RoomWindow } from './window'
import { GROUND } from '../layout'
import type { Occasion } from '../occasions'
import { palette } from '../palette'
import { createRng, pick, range, type Rng } from '../rng'
import { glowTexture } from '../textures'

/**
 * Whatever the street puts on for an occasion. `sky` goes in front of the
 * whole street (lanterns let go from the pavement, fireworks over the roofs),
 * `front` sits on the house itself (bunting across the facade). Either can be
 * empty.
 */
export interface Celebration {
  sky: Container
  front: Container
  update(dt: number): void
  destroy(): void
}

const SKY_LEFT = 200
const SKY_RIGHT = 2200

export function celebrate(
  occasion: Occasion,
  seed: number,
  windows: RoomWindow[],
  reducedMotion: boolean,
): Celebration {
  const sky = new Container()
  const front = new Container()
  const parts: { update(dt: number): void }[] = []

  if (occasion === 'new-year') {
    const lanterns = new Lanterns(seed, reducedMotion ? 10 : 26, reducedMotion)
    sky.addChild(lanterns)
    parts.push(lanterns)
  }
  // flashing bursts aren't for everyone: with reduced motion a birthday gets
  // the bunting instead
  if (occasion === 'birthday' && !reducedMotion) {
    const fireworks = new Fireworks(seed)
    sky.addChild(fireworks)
    parts.push(fireworks)
  }
  if (occasion === 'house-warming' || (occasion === 'birthday' && reducedMotion)) {
    const bunting = new Bunting(seed, windows, reducedMotion)
    front.addChild(bunting)
    parts.push(bunting)
  }

  return {
    sky,
    front,
    update: (dt) => parts.forEach((p) => p.update(dt)),
    destroy: () => {
      sky.destroy({ children: true })
      front.destroy({ children: true })
    },
  }
}

// lanterns -------------------------------------------------------------------

interface Lantern {
  body: Container
  rise: number
  sway: number
  phase: number
  scale: number
}

/**
 * Paper sky lanterns drifting up from behind the roofs, a candle in each,
 * swaying a little as they go, fading out high above the city.
 */
class Lanterns extends Container {
  private rng: Rng
  private lanterns: Lantern[] = []
  private time = 0

  constructor(
    seed: number,
    count: number,
    private slow: boolean,
  ) {
    super()
    this.rng = createRng(seed + 61)
    for (let i = 0; i < count; i++) {
      const l = this.make()
      // spread out up the sky so it's already going on the first frame
      l.body.y = range(this.rng, -250, 1000)
      this.lanterns.push(l)
    }
  }

  private make(): Lantern {
    const scale = range(this.rng, 0.6, 1.35)
    const body = new Container()
    const halo = new Sprite(glowTexture())
    halo.anchor.set(0.5)
    halo.scale.set(0.42 * scale)
    halo.tint = palette.amber
    halo.alpha = 0.55
    halo.blendMode = 'add'
    const paper = new Graphics()
    const w = 20 * scale
    const h = 26 * scale
    paper
      .poly([-w * 0.5, -h * 0.5, w * 0.5, -h * 0.5, w * 0.38, h * 0.5, -w * 0.38, h * 0.5])
      .fill(pick(this.rng, [0xf2a04a, 0xf6b65a, 0xe8843a, 0xf0c070]))
      .rect(-w * 0.38, h * 0.42, w * 0.76, h * 0.08)
      .fill({ color: palette.ink, alpha: 0.5 })
    // the flame showing through the bottom
    paper.circle(0, h * 0.34, 2.4 * scale).fill(0xfff2c0)
    body.addChild(halo, paper)
    body.x = range(this.rng, SKY_LEFT, SKY_RIGHT)
    body.y = 1040
    body.alpha = 0.95
    this.addChild(body)
    return {
      body,
      rise: range(this.rng, 22, 40) * scale,
      sway: range(this.rng, 4, 12),
      phase: this.rng() * Math.PI * 2,
      scale,
    }
  }

  update(dt: number) {
    this.time += dt
    const pace = this.slow ? 0.35 : 1
    for (const l of this.lanterns) {
      l.body.y -= l.rise * dt * pace
      l.body.x += Math.sin(this.time * 0.4 + l.phase) * l.sway * dt * 0.3 * pace + 3 * dt * pace
      // fade out as they get small and high
      l.body.alpha = Math.max(0, Math.min(0.95, (l.body.y + 300) / 400))
      if (l.body.y < -320) {
        // let go from the pavement again, somewhere along the street
        l.body.y = range(this.rng, 980, 1060)
        l.body.x = range(this.rng, SKY_LEFT, SKY_RIGHT)
      }
    }
  }
}

// fireworks ------------------------------------------------------------------

interface Spark {
  s: Sprite
  vx: number
  vy: number
  age: number
  life: number
}

interface Rocket {
  s: Sprite
  x: number
  y: number
  vy: number
  burstAt: number
  colour: number
}

const BURST_COLOURS = [0xffd36a, 0xff6a5a, 0x7ad0ff, 0xb68aff, 0x8affb0, 0xfff2e0]
const GRAVITY = 70

/**
 * Rockets going up from behind the house and bursting over it, one every
 * second or so. Sparks are a fixed pool of glow sprites that get reused.
 */
class Fireworks extends Container {
  private rng: Rng
  private sparks: Spark[] = []
  private free: Sprite[] = []
  private rockets: Rocket[] = []
  private wait = 0.4

  constructor(seed: number) {
    super()
    this.rng = createRng(seed + 62)
    // start mid-show, so there's something in the sky as soon as you arrive
    for (let i = 0; i < 75; i++) this.update(1 / 30)
  }

  private sprite() {
    const s = this.free.pop() ?? new Sprite(glowTexture())
    s.anchor.set(0.5)
    s.blendMode = 'add'
    s.visible = true
    if (!s.parent) this.addChild(s)
    return s
  }

  private launch() {
    const s = this.sprite()
    s.tint = 0xffe0a0
    s.scale.set(0.06)
    s.alpha = 0.9
    const x = range(this.rng, 600, 1800)
    this.rockets.push({
      s,
      x,
      y: 1050,
      vy: -range(this.rng, 560, 680),
      burstAt: range(this.rng, 40, 200),
      colour: pick(this.rng, BURST_COLOURS),
    })
  }

  private burst(r: Rocket) {
    const count = 56
    const speed = range(this.rng, 150, 230)
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + this.rng() * 0.1
      const v = speed * range(this.rng, 0.75, 1)
      const s = this.sprite()
      s.tint = this.rng() < 0.15 ? 0xffffff : r.colour
      s.scale.set(0.11)
      s.position.set(r.x, r.y)
      this.sparks.push({
        s,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        age: 0,
        life: range(this.rng, 1.3, 1.9),
      })
    }
    // a brief flash where it went off
    const flash = this.sprite()
    flash.tint = r.colour
    flash.scale.set(1.3)
    flash.position.set(r.x, r.y)
    this.sparks.push({ s: flash, vx: 0, vy: 0, age: 0, life: 0.35 })
  }

  private release(s: Sprite) {
    s.visible = false
    this.free.push(s)
  }

  update(dt: number) {
    this.wait -= dt
    if (this.wait <= 0) {
      this.launch()
      this.wait = range(this.rng, 0.5, 1.4)
    }

    this.rockets = this.rockets.filter((r) => {
      r.y += r.vy * dt
      r.vy += GRAVITY * dt
      r.x += Math.sin(r.y * 0.05) * 0.2
      r.s.position.set(r.x, r.y)
      if (r.y > r.burstAt) return true
      this.release(r.s)
      this.burst(r)
      return false
    })

    this.sparks = this.sparks.filter((p) => {
      p.age += dt
      if (p.age >= p.life) {
        this.release(p.s)
        return false
      }
      const drag = Math.pow(0.35, dt)
      p.vx *= drag
      p.vy = p.vy * drag + GRAVITY * dt
      p.s.x += p.vx * dt
      p.s.y += p.vy * dt
      const t = p.age / p.life
      p.s.alpha = Math.min(1, (1 - t) * 1.4)
      return true
    })
  }
}

// bunting --------------------------------------------------------------------

interface Bulb {
  glow: Sprite
  phase: number
}

const BULB_COLOURS = [0xffc458, 0xff7a5a, 0x8ad0ff, 0xa8f0a0, 0xf8a0d8]

/**
 * Strings of coloured bulbs swagged across the front of the house, under
 * each row of windows, for a house-warming.
 */
class Bunting extends Container {
  private bulbs: Bulb[] = []
  private time = 0

  constructor(
    seed: number,
    windows: RoomWindow[],
    private still: boolean,
  ) {
    super()
    const rng = createRng(seed + 63)
    const slots = windows.map((w) => w.slot)
    if (!slots.length) return
    const left = Math.min(...slots.map((s) => s.x)) - 34
    const right = Math.max(...slots.map((s) => s.x + s.width)) + 34
    const rows = [...new Set(slots.map((s) => s.y + s.height))].sort((a, b) => a - b)
    const wire = new Graphics()
    const bulbs = new Graphics()
    const glows = new Container()
    this.addChild(wire, bulbs, glows)

    for (const bottom of rows) {
      const y = Math.min(bottom + 22, GROUND - 40)
      const swags = Math.max(2, Math.round((right - left) / 190))
      const span = (right - left) / swags
      for (let i = 0; i < swags; i++) {
        const x0 = left + i * span
        const sag = 18
        wire.moveTo(x0, y)
        wire.quadraticCurveTo(x0 + span / 2, y + sag * 2, x0 + span, y)
        for (let b = 1; b < 7; b++) {
          const t = b / 7
          // a point on the curve, with the bulb hanging just below it
          const bx = x0 + span * t
          const by = y + 2 * sag * 2 * t * (1 - t) + 4
          const colour = pick(rng, BULB_COLOURS)
          bulbs.circle(bx, by, 3.2).fill(colour)
          const g = new Sprite(glowTexture())
          g.anchor.set(0.5)
          g.position.set(bx, by)
          g.scale.set(0.12)
          g.tint = colour
          g.alpha = 0.7
          g.blendMode = 'add'
          glows.addChild(g)
          this.bulbs.push({ glow: g, phase: rng() * Math.PI * 2 })
        }
      }
      wire.stroke({ color: palette.ink, width: 1.4 })
    }
  }

  update(dt: number) {
    if (this.still) return
    this.time += dt
    for (const b of this.bulbs) b.glow.alpha = 0.55 + Math.sin(this.time * 1.6 + b.phase) * 0.18
  }
}
