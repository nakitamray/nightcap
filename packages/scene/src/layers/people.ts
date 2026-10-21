import { Container, Graphics } from 'pixi.js'
import { CURB, GROUND, WORLD } from '../layout'
import { palette } from '../palette'
import { createRng, range, type Rng } from '../rng'

// Passers-by, Paris in the seventies: trench coats, flares, berets, a mini
// dress and knee boots, a poodle. Drawn as flat cut-out shapes like the rest
// of the street, feet at the origin, roughly 300 units tall before scaling.

const INK = palette.ink
const SKIN = 0x2a1812

type Hat = 'none' | 'beret' | 'fedora' | 'wide' | 'scarf'

interface Outfit {
  coat: number
  coatHem: number
  /** coat flares out at the hem */
  flare: number
  legs: number
  bellBottoms: boolean
  boots: number | null
  hat: Hat
  hatColour: number
  longHair: boolean
  scarf?: number
  umbrella?: number
  baguette?: boolean
  poodle?: boolean
}

const OUTFITS: Outfit[] = [
  // camel trench, belted, big floppy hat
  { coat: 0x9a6a32, coatHem: -70, flare: 14, legs: 0x1a120e, bellBottoms: false, boots: 0x140c08, hat: 'wide', hatColour: 0x3a140c, longHair: true },
  // leather jacket, turtleneck, tan flares, a baguette under the arm
  { coat: 0x4a1e10, coatHem: -132, flare: 2, legs: 0x8a5a2a, bellBottoms: true, boots: null, hat: 'none', hatColour: 0, longHair: false, baguette: true },
  // mustard mini dress, knee boots, red umbrella
  { coat: 0xc08a1c, coatHem: -118, flare: 10, legs: 0x2a160e, bellBottoms: false, boots: 0x0e0806, hat: 'none', hatColour: 0, longHair: true, umbrella: 0xc0301e },
  // long dark coat, beret, red scarf, flares
  { coat: 0x24202a, coatHem: -80, flare: 6, legs: 0x3a2a22, bellBottoms: true, boots: null, hat: 'beret', hatColour: 0x0e0a0a, longHair: false, scarf: 0xb02418 },
  // red maxi coat with a fur collar, headscarf, and the dog
  { coat: 0x8a1a14, coatHem: -40, flare: 16, legs: 0x140c0a, bellBottoms: false, boots: 0x140c0a, hat: 'scarf', hatColour: 0xd8a040, longHair: false, poodle: true },
  // fedora, wide lapels, flares
  { coat: 0x5a3a1e, coatHem: -110, flare: 4, legs: 0x2e2018, bellBottoms: true, boots: null, hat: 'fedora', hatColour: 0x1a100c, longHair: false },
]

class Walker extends Container {
  private legL = new Graphics()
  private legR = new Graphics()
  private armL = new Graphics()
  private armR = new Graphics()
  private body = new Container()
  private dog: Graphics | null = null
  private leash: Graphics | null = null
  private phase: number
  private dir: 1 | -1
  private speed: number

  constructor(o: Outfit, rng: Rng) {
    super()
    this.phase = rng() * 10
    this.dir = rng() > 0.5 ? 1 : -1
    this.speed = range(rng, 34, 52)

    const hip = -130
    for (const leg of [this.legL, this.legR]) {
      const flare = o.bellBottoms ? 9 : 0
      leg.poly([-7, 0, 7, 0, 7 + flare, 130, -7 - flare, 130]).fill(o.legs)
      if (o.boots !== null) leg.poly([-7, 74, 7, 74, 8, 130, -8, 130]).fill(o.boots)
      leg.ellipse(5, 130, 11, 4).fill(INK)
      leg.position.set(0, hip)
    }
    this.legR.tint = 0xb0a0a0
    this.addChild(this.legR, this.legL)

    // coat / dress
    const shoulder = -232
    const coat = new Graphics().poly([-17, shoulder, 17, shoulder, 18 + o.flare, o.coatHem, -18 - o.flare, o.coatHem]).fill(o.coat)
    coat.rect(-1, shoulder + 6, 2, o.coatHem - shoulder - 6).fill({ color: INK, alpha: 0.25 })
    if (o.coatHem < -100 && o.coat !== 0xc08a1c) {
      // jacket: show a belt line and the turtleneck
      coat.rect(-17, -150, 34, 3).fill({ color: INK, alpha: 0.35 })
      coat.rect(-6, shoulder - 6, 12, 8).fill(0x1a120e)
    }
    if (o.coatHem > -90) coat.rect(-19, -160, 38, 4).fill({ color: INK, alpha: 0.4 })
    if (o.poodle) coat.ellipse(0, shoulder + 2, 20, 8).fill(0xe8d8c0)
    if (o.scarf) {
      coat.rect(-14, shoulder - 2, 28, 9).fill(o.scarf)
      coat.rect(4, shoulder + 4, 8, 40).fill(o.scarf)
    }
    this.body.addChild(coat)

    // head, hair, hat
    const head = new Graphics()
    const hy = shoulder - 22
    if (o.longHair) head.poly([-13, hy - 6, 13, hy - 6, 15, hy + 36, -15, hy + 36]).fill(0x1a0e08)
    head.rect(-4, hy + 10, 8, 14).fill(SKIN)
    head.circle(0, hy, 14).fill(SKIN)
    switch (o.hat) {
      case 'wide':
        head.ellipse(0, hy - 10, 30, 6).fill(o.hatColour)
        head.ellipse(0, hy - 16, 14, 10).fill(o.hatColour)
        break
      case 'fedora':
        head.ellipse(0, hy - 10, 21, 4).fill(o.hatColour)
        head.poly([-12, hy - 10, 12, hy - 10, 10, hy - 26, -10, hy - 26]).fill(o.hatColour)
        head.rect(-12, hy - 14, 24, 3).fill(0x4a2a18)
        break
      case 'beret':
        head.ellipse(2, hy - 11, 17, 7).fill(o.hatColour)
        head.rect(1, hy - 21, 2, 4).fill(o.hatColour)
        break
      case 'scarf':
        head.poly([-15, hy - 4, 0, hy - 18, 15, hy - 4, 12, hy + 12, -12, hy + 12]).fill(o.hatColour)
        // big sunglasses, at night, obviously
        head.ellipse(-5, hy + 1, 5, 4).ellipse(6, hy + 1, 5, 4).fill(INK)
        break
      default:
        if (!o.longHair) head.ellipse(0, hy - 8, 14, 8).fill(0x1a0e08)
        else head.ellipse(0, hy - 8, 15, 9).fill(0x1a0e08)
    }
    this.body.addChild(head)

    for (const arm of [this.armL, this.armR]) {
      arm.poly([-6, 0, 6, 0, 5, 92, -5, 92]).fill(o.coat)
      arm.circle(0, 96, 5).fill(SKIN)
      arm.position.set(0, shoulder + 8)
    }
    this.armR.tint = 0xb0a0a0
    if (o.baguette) {
      // tucked under the front arm, sticking out both sides
      const b = new Graphics().roundRect(-34, 0, 74, 9, 4).fill(0xc88a3a)
      b.rect(-20, 2, 6, 1.5).rect(-4, 2, 6, 1.5).rect(12, 2, 6, 1.5).fill(0x7a4a1a)
      b.position.set(0, shoulder + 34)
      b.rotation = -0.25
      this.body.addChild(b)
    }
    if (o.umbrella) {
      const u = new Graphics()
      u.rect(-1.5, -110, 3, 110).fill(INK)
      u.moveTo(-58, -96)
        .bezierCurveTo(-50, -150, 50, -150, 58, -96)
        .lineTo(38, -102)
        .lineTo(19, -94)
        .lineTo(0, -102)
        .lineTo(-19, -94)
        .lineTo(-38, -102)
        .closePath()
        .fill(o.umbrella)
      // held up from the hand
      u.position.set(0, 96)
      this.armL.addChild(u)
      u.rotation = 0.1
    }
    this.addChild(this.armR, this.body, this.armL)

    if (o.poodle) {
      this.dog = poodle()
      this.leash = new Graphics()
      this.addChild(this.leash, this.dog)
    }
  }

  update(dt: number, reducedMotion: boolean) {
    const step = this.speed * dt
    this.x += step * this.dir
    this.scale.x = Math.abs(this.scale.x) * this.dir
    if (this.x > WORLD.width + 400) this.x = -400
    if (this.x < -400) this.x = WORLD.width + 400
    if (reducedMotion) return

    // one stride every ~70 units walked
    this.phase += (step / 70) * Math.PI * 2
    const swing = Math.sin(this.phase)
    this.legL.rotation = swing * 0.32
    this.legR.rotation = -swing * 0.32
    this.armL.rotation = -swing * 0.22
    this.armR.rotation = swing * 0.22
    // umbrella arm stays up
    if (this.armL.children.length) this.armL.rotation = -0.9 + swing * 0.03
    this.body.y = -Math.abs(Math.cos(this.phase)) * 3

    if (this.dog && this.leash) {
      this.dog.position.set(78, -Math.abs(Math.sin(this.phase * 1.6)) * 4)
      this.leash
        .clear()
        .moveTo(0, -136)
        .quadraticCurveTo(46, -60, this.dog.x - 6, this.dog.y - 44)
        .stroke({ color: INK, width: 1.5 })
    }
  }
}

/** pompom poodle, facing right */
function poodle() {
  const g = new Graphics()
  const c = 0xe8dcc8
  g.rect(-14, -28, 3, 28).rect(-4, -28, 3, 28).rect(10, -28, 3, 28).rect(18, -28, 3, 28).fill(0x6a5a4a)
  for (const [x, y] of [
    [-12, -2],
    [-2, -2],
    [12, -2],
    [20, -2],
  ] as const) {
    g.circle(x, y, 4).fill(c)
  }
  g.ellipse(2, -34, 18, 10).fill(c)
  g.circle(-16, -38, 7).fill(c)
  g.circle(-22, -44, 3).fill(c)
  g.rect(20, -48, 7, 22).fill(c)
  g.circle(26, -54, 9).fill(c)
  g.ellipse(32, -52, 8, 4).fill(c)
  g.circle(23, -62, 6).fill(c)
  g.circle(28, -55, 1.5).fill(INK)
  g.ellipse(36, -52, 2, 1.5).fill(INK)
  return g
}

/** everyone on the pavement, sorted so whoever's nearer the kerb draws in front */
export class People extends Container {
  private walkers: Walker[] = []

  constructor(seed: number) {
    super()
    const rng = createRng(seed)
    this.sortableChildren = true
    OUTFITS.forEach((o, i) => {
      const w = new Walker(o, rng)
      w.x = (i / OUTFITS.length) * (WORLD.width + 800) - 400 + range(rng, -80, 80)
      w.y = range(rng, GROUND + 26, CURB - 6)
      w.scale.set(range(rng, 0.58, 0.64))
      w.zIndex = w.y
      this.walkers.push(w)
      this.addChild(w)
    })
  }

  /** anyone else standing about (the couple) gets slotted in by depth too */
  addStanding(c: Container) {
    c.zIndex = c.y
    this.addChild(c)
  }

  update(dt: number, reducedMotion: boolean) {
    for (const w of this.walkers) w.update(reducedMotion ? dt * 0.5 : dt, reducedMotion)
  }
}
