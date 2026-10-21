import { Container, Graphics, Sprite } from 'pixi.js'
import { Smoke } from '../../layers/smoke'
import { CURB, GROUND, WORLD } from '../../layout'
import { palette } from '../../palette'
import { createRng, range } from '../../rng'
import { coneTexture, glowTexture } from '../../textures'
import { ny } from './parts'

const STREET_BOTTOM = WORLD.height + 700
const SODIUM = 0xffa63a

/** concrete flags, a granite kerb, patched asphalt, a manhole letting off steam */
export class Pavement extends Container {
  private steam: Smoke

  constructor(seed: number) {
    super()
    const rng = createRng(seed)
    const g = new Graphics()
    g.rect(-500, GROUND, WORLD.width + 1000, CURB - GROUND).fill(0x1a1716)
    for (let x = -500; x < WORLD.width + 500; x += 90) g.rect(x, GROUND, 2, CURB - GROUND).fill({ color: palette.ink, alpha: 0.6 })
    g.rect(-500, GROUND + 22, WORLD.width + 1000, 1.5).fill({ color: palette.ink, alpha: 0.4 })
    g.rect(-500, CURB - 7, WORLD.width + 1000, 7).fill(0x3a3430)
    g.rect(-500, CURB, WORLD.width + 1000, STREET_BOTTOM - CURB).fill(0x0b0a0c)
    // patches and cracks
    for (let i = 0; i < 40; i++) {
      g.rect(range(rng, -400, WORLD.width + 400), range(rng, CURB + 10, CURB + 300), range(rng, 30, 140), range(rng, 6, 26)).fill({
        color: 0x141214,
        alpha: 0.8,
      })
    }
    // manhole
    g.ellipse(1250, CURB + 52, 46, 9).fill(0x1c1a1a)
    g.ellipse(1250, CURB + 52, 38, 6.5).stroke({ color: 0x2e2a28, width: 2 })
    this.addChild(g)
    this.steam = new Smoke(seed + 1, { x: 1250, y: CURB + 40 }, { tint: 0xe0b890, strength: 0.4, rise: 300, count: 26 })
    this.addChild(this.steam)
  }

  update(time: number, dt: number) {
    this.steam.update(time, dt)
  }
}

/** the curved-neck "cobra head" lamps the city put up everywhere */
export class CobraLamps extends Container {
  readonly pools = new Container()
  private heads: Sprite[] = []

  constructor(lights: Container, xs: number[]) {
    super()
    const g = new Graphics()
    for (const x of xs) {
      const top = 690
      const hx = x + 96
      g.poly([x - 10, GROUND + 26, x + 10, GROUND + 26, x + 6, GROUND - 20, x - 6, GROUND - 20]).fill(0x14161a)
      g.rect(x - 4, top, 8, GROUND - top).fill(0x14161a)
      g.moveTo(x, top + 6).bezierCurveTo(x, top - 40, x + 50, top - 40, hx - 20, top - 22).stroke({ color: 0x14161a, width: 6 })
      g.ellipse(hx, top - 20, 34, 9).fill(0x14161a)
      g.ellipse(hx + 2, top - 14, 24, 5).fill(0xffd27a)

      const glow = new Sprite(glowTexture())
      glow.anchor.set(0.5)
      glow.position.set(hx, top - 12)
      glow.scale.set(1.1, 0.7)
      glow.tint = SODIUM
      glow.alpha = 0.9
      glow.blendMode = 'add'
      const halo = new Sprite(glowTexture())
      halo.anchor.set(0.5)
      halo.position.set(hx, top - 10)
      halo.scale.set(3.4)
      halo.tint = 0xff7a22
      halo.alpha = 0.22
      halo.blendMode = 'add'
      const cone = new Sprite(coneTexture())
      cone.anchor.set(0.5, 0)
      cone.position.set(hx, top - 10)
      cone.scale.set(1.6, (GROUND - top + 10) / 256)
      cone.tint = SODIUM
      cone.alpha = 0.26
      cone.blendMode = 'add'
      lights.addChild(halo, cone, glow)
      this.heads.push(glow)

      const pool = new Sprite(glowTexture())
      pool.anchor.set(0.5)
      pool.position.set(hx, GROUND + 26)
      pool.scale.set(3, 0.6)
      pool.tint = SODIUM
      pool.alpha = 0.55
      pool.blendMode = 'add'
      this.pools.addChild(pool)
    }
    this.addChild(g)
  }

  update(time: number) {
    this.heads.forEach((h, i) => {
      // sodium lamps hum and every so often one sulks
      h.alpha = 0.85 + Math.sin(time * 7 + i * 4) * 0.02 - (Math.sin(time * 0.31 + i * 9) > 0.995 ? 0.5 : 0)
    })
  }
}

/** a red hydrant with a yellow cap, feet at the origin */
export function hydrant() {
  const g = new Graphics()
  g.rect(-16, -6, 32, 6).fill(0x5a120c)
  g.roundRect(-11, -58, 22, 54, 4).fill(0xa82414)
  g.rect(-20, -42, 40, 10).fill(0xa82414)
  g.circle(-20, -37, 6).circle(20, -37, 6).fill(0x7a1a10)
  g.rect(-14, -60, 28, 6).fill(0xd9a018)
  g.ellipse(0, -66, 10, 8).fill(0xd9a018)
  g.rect(-2, -76, 4, 6).fill(0xd9a018)
  g.rect(-8, -56, 3, 46).fill({ color: 0xffb070, alpha: 0.35 })
  return g
}

/** checker cab, facing right, wheels on y = 0 */
export function checkerCab(withRider = false) {
  const g = new Graphics()
  const body = ny.taxi
  g.moveTo(0, -24)
    .lineTo(0, -54)
    .lineTo(70, -58)
    .lineTo(108, -100)
    .lineTo(268, -102)
    .lineTo(300, -60)
    .lineTo(372, -56)
    .lineTo(376, -24)
    .closePath()
    .fill(body)
  g.poly([118, -94, 184, -95, 184, -62, 92, -60]).fill(0x2a1810)
  g.poly([192, -95, 262, -96, 288, -62, 192, -62]).fill(0x2a1810)
  if (withRider) {
    g.circle(220, -76, 9).fill(palette.ink)
    g.rect(210, -68, 20, 8).fill(palette.ink)
  }
  // checker band along the side
  for (let i = 0; i < 24; i++) g.rect(20 + i * 14, -50 + (i % 2) * 5, 7, 5).fill(palette.ink)
  g.rect(0, -28, 376, 5).fill(0xc8c0b0)
  g.roundRect(166, -116, 44, 14, 3).fill(0xffe9a8)
  g.circle(66, -10, 24).circle(304, -10, 24).fill(palette.ink)
  g.circle(66, -10, 9).circle(304, -10, 9).fill(0x8a8070)
  g.moveTo(108, -100).lineTo(268, -102).stroke({ color: 0xffb060, width: 2, alpha: 0.7 })
  return g
}

/** a cab that comes down the street every so often, lights on */
export class PassingCab extends Container {
  private cab = checkerCab(true)
  private beam = new Sprite(glowTexture())
  private tail = new Sprite(glowTexture())
  private wait: number
  private rng: () => number
  private speed = 0

  constructor(seed: number, private lane: number) {
    super()
    this.rng = createRng(seed)
    this.beam.anchor.set(0, 0.5)
    this.beam.scale.set(2.6, 0.4)
    this.beam.tint = 0xffe0a0
    this.beam.alpha = 0.55
    this.beam.blendMode = 'add'
    this.tail.anchor.set(0.5)
    this.tail.scale.set(0.3)
    this.tail.tint = 0xff2a1a
    this.tail.blendMode = 'add'
    this.addChild(this.beam, this.cab, this.tail)
    this.wait = range(this.rng, 1, 4)
    this.reset()
  }

  private reset() {
    this.speed = range(this.rng, 220, 320)
    this.cab.x = -900
  }

  update(dt: number) {
    if (this.wait > 0) {
      this.wait -= dt
      this.visible = false
      return
    }
    this.visible = true
    this.cab.x += this.speed * dt
    this.cab.y = this.lane
    this.beam.position.set(this.cab.x + 370, this.lane - 34)
    this.tail.position.set(this.cab.x + 2, this.lane - 40)
    if (this.cab.x > WORLD.width + 600) {
      this.wait = range(this.rng, 5, 14)
      this.reset()
    }
  }
}
