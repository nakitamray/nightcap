import { Container, Graphics, Sprite } from 'pixi.js'
import { CURB, GROUND, WORLD } from '../../layout'
import { palette } from '../../palette'
import { createRng, range } from '../../rng'
import { glowTexture } from '../../textures'
import { GARAGE_DOOR, SD_DOOR } from './layout'

const STREET_BOTTOM = WORLD.height + 700

/** pale concrete squares, a driveway, a kerb, and sand blown across the road */
export class Road extends Container {
  constructor(seed: number) {
    super()
    const rng = createRng(seed)
    const g = new Graphics()
    g.rect(-500, GROUND, WORLD.width + 1000, CURB - GROUND).fill(0x1e1c1c)
    for (let x = -500; x < WORLD.width + 500; x += 76)
      g.rect(x, GROUND, 2, CURB - GROUND).fill({ color: palette.ink, alpha: 0.5 })
    // the path to the front door and the drive, a shade lighter
    const door = SD_DOOR.x + SD_DOOR.width / 2
    g.poly([door - 60, GROUND, door + 60, GROUND, door + 76, CURB - 7, door - 76, CURB - 7]).fill(
      0x2a2624,
    )
    const d = GARAGE_DOOR
    g.poly([
      d.x - 6,
      GROUND,
      d.x + d.width + 6,
      GROUND,
      d.x + d.width + 30,
      CURB,
      d.x - 30,
      CURB,
    ]).fill(0x282424)
    // oil where the car sits
    g.ellipse(d.x + d.width / 2 + 10, GROUND + 26, 26, 7).fill({ color: palette.ink, alpha: 0.5 })
    g.rect(-500, CURB - 7, d.x - 30 + 500, 7).fill(0x3c3836)
    g.rect(d.x + d.width + 30, CURB - 7, WORLD.width + 500, 7).fill(0x3c3836)
    // red kerb by the lookout: no stopping
    g.rect(330, CURB - 7, 340, 7).fill(0x8a2416)

    g.rect(-500, CURB, WORLD.width + 1000, STREET_BOTTOM - CURB).fill(0x0c0b0d)
    for (let i = 0; i < 36; i++) {
      g.rect(
        range(rng, -400, WORLD.width + 400),
        range(rng, CURB + 10, CURB + 300),
        range(rng, 30, 150),
        range(rng, 5, 22),
      ).fill({ color: 0x151315, alpha: 0.8 })
    }
    // the trolley's rails, set into the road
    for (const ly of [CURB + 138, CURB + 162])
      g.rect(-500, ly, WORLD.width + 1000, 3).fill({ color: 0x6a6a72, alpha: 0.6 })
    // sand off the beach, thicker toward the cliff
    for (let i = 0; i < 260; i++) {
      const t = Math.pow(rng(), 0.5)
      const x = 1500 - t * 1900
      g.rect(x, range(rng, GROUND + 2, CURB + 120), range(rng, 2, 9), 1.5).fill({
        color: 0xc8a878,
        alpha: range(rng, 0.08, 0.3),
      })
    }
    this.addChild(g)
  }
}

/**
 * A mexican fan palm: a trunk like a telegraph pole and a small mop of
 * fronds a long way up, with last year's hanging dead underneath.
 */
export class Palm extends Container {
  private crown = new Container()
  private phase: number

  constructor(seed: number, x: number, top: number, lean = 0) {
    super()
    const rng = createRng(seed)
    this.phase = rng() * 10
    const base = GROUND + 20
    const h = base - top
    const tx = x + lean * h
    const trunk = new Graphics()
    // bends a little on the way up
    const at = (t: number) => ({
      x: x + (tx - x) * t + Math.sin(t * Math.PI) * lean * 240,
      y: base - h * t,
    })
    const left: number[] = []
    const right: number[] = []
    for (let i = 0; i <= 12; i++) {
      const p = at(i / 12)
      const half = 9 - (i / 12) * 4
      left.push(p.x - half, p.y)
      right.unshift(p.x + half, p.y)
    }
    trunk.poly([...left, ...right]).fill(0x241c16)
    for (let i = 1; i < 40; i++) {
      const p = at(i / 40)
      trunk.rect(p.x - 8, p.y, 16, 1.5).fill({ color: palette.ink, alpha: 0.35 })
    }
    // lit up one side by the street lamps
    for (let i = 0; i < 12; i++) {
      const p = at(i / 12)
      trunk.rect(p.x + 2, p.y - h / 12, 3, h / 12).fill({ color: 0xffa040, alpha: 0.12 })
    }
    trunk.ellipse(x, base, 15, 5).fill(0x241c16)
    this.addChild(trunk)

    const fronds = new Graphics()
    // the skirt of dead ones
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * 0.5 + range(rng, -0.7, 0.7)
      const len = range(rng, 36, 62)
      fronds
        .poly([
          -5,
          0,
          5,
          0,
          Math.cos(a) * len + 3,
          Math.sin(a) * len,
          Math.cos(a) * len - 3,
          Math.sin(a) * len,
        ])
        .fill(0x3a2a1a)
    }
    // the live fans, each one a spray of blades
    for (let i = 0; i < 15; i++) {
      const a = -Math.PI * (i / 14) + range(rng, -0.12, 0.12)
      const droop = Math.abs(Math.cos(a))
      const len = range(rng, 58, 84) * (0.85 + 0.15 * droop)
      const colour = i % 3 === 0 ? 0x2f5a3c : i % 3 === 1 ? 0x1e3a2a : 0x16281e
      for (let b = -3; b <= 3; b++) {
        const ba = a + b * 0.075
        const bl = len * (1 - Math.abs(b) * 0.09)
        const ex = Math.cos(ba) * bl
        const ey = Math.sin(ba) * bl + droop * 14
        fronds.moveTo(0, 0).lineTo(ex, ey).stroke({ color: colour, width: 3.2, cap: 'round' })
      }
    }
    fronds.circle(0, 2, 11).fill(0x2a2018)
    this.crown.addChild(fronds)
    this.crown.position.set(tx, top)
    this.addChild(this.crown)
  }

  update(time: number) {
    this.crown.rotation = Math.sin(time * 0.7 + this.phase) * 0.035
    this.crown.skew.x = Math.sin(time * 1.1 + this.phase * 2) * 0.03
  }
}

/** an old split-window bus, two-tone, boards on the roof; faces right, wheels on y = 0 */
export function surfBus() {
  const g = new Graphics()
  const lower = 0x2a7a7a
  const upper = 0xe8dcc0
  g.roundRect(0, -132, 330, 112, 26).fill(lower)
  g.roundRect(0, -132, 330, 62, 26).fill(upper)
  g.rect(0, -92, 330, 22).fill(upper)
  // the v on the nose, seen from the side as a sweep
  g.poly([330, -74, 262, -74, 300, -40, 330, -40]).fill(upper)
  for (const [wx, ww] of [
    [26, 58],
    [94, 58],
    [162, 58],
    [234, 52],
  ] as const)
    g.roundRect(wx, -120, ww, 38, 6).fill(0x1a2028)
  g.roundRect(296, -118, 26, 36, 6).fill(0x1a2028)
  // someone's left the dome light on
  g.roundRect(94, -120, 58, 38, 6).fill({ color: 0xffb84a, alpha: 0.35 })
  g.rect(226, -128, 2, 106).fill({ color: palette.ink, alpha: 0.5 })
  g.rect(158, -76, 2, 54).fill({ color: palette.ink, alpha: 0.5 })
  g.rect(0, -30, 330, 6).fill(0xc8c0b0)
  g.circle(324, -52, 7).fill(0xffe9a8)
  g.rect(-4, -40, 8, 14).fill(0xb02418)
  g.circle(66, -12, 25).circle(262, -12, 25).fill(palette.ink)
  g.circle(66, -12, 12).circle(262, -12, 12).fill(0xd8d0c0)
  g.circle(66, -12, 5).circle(262, -12, 5).fill(0x8a8070)
  // roof rack and three boards strapped down
  for (const rx of [50, 250]) g.rect(rx, -144, 4, 14).fill(palette.ink)
  g.rect(40, -146, 228, 3).fill(palette.ink)
  g.ellipse(160, -152, 150, 7).fill(0xf2e2bd)
  g.rect(20, -153, 280, 2).fill(0xd8502a)
  g.ellipse(150, -163, 128, 6).fill(0x8ac0c8)
  g.ellipse(170, -173, 104, 5).fill(0xe8c25a)
  g.poly([36, -178, 50, -178, 30, -194]).fill(palette.ink)
  for (const sx of [90, 220]) g.rect(sx, -180, 3, 36).fill({ color: palette.ink, alpha: 0.7 })
  return g
}

/** the red trolley, three cars of it, coming through every so often */
export class Trolley extends Container {
  private cars = new Container()
  private beam = new Sprite(glowTexture())
  private wait: number
  private rng: () => number

  constructor(seed: number, lane: number) {
    super()
    this.rng = createRng(seed)
    const g = new Graphics()
    const red = 0xc0241a
    for (let c = 0; c < 3; c++) {
      const x = c * 372
      g.roundRect(x, -150, 360, 128, 14).fill(red)
      g.rect(x, -122, 360, 52).fill(0x14161c)
      for (let wx = x + 14; wx < x + 340; wx += 48) {
        g.rect(wx, -116, 40, 40).fill(0xffe2a8)
        // somebody in most of the windows
        if (this.rng() < 0.6) {
          g.circle(wx + 20, -98, 8).fill(palette.ink)
          g.rect(wx + 10, -90, 20, 14).fill(palette.ink)
        }
      }
      for (const dx of [96, 240]) g.rect(x + dx, -122, 30, 96).fill(0x7a140e)
      g.rect(x, -58, 360, 5).fill(0xf2e2bd)
      g.rect(x + 20, -24, 80, 16)
        .rect(x + 260, -24, 80, 16)
        .fill(palette.ink)
      g.rect(x + 360, -70, 12, 30).fill(0x14161c)
      // pantograph
      g.moveTo(x + 150, -150)
        .lineTo(x + 180, -186)
        .lineTo(x + 210, -150)
        .stroke({ color: 0x14161c, width: 3 })
      g.rect(x + 160, -188, 40, 3).fill(0x14161c)
    }
    this.cars.addChild(g)
    this.beam.anchor.set(0, 0.5)
    this.beam.scale.set(2.4, 0.4)
    this.beam.tint = 0xffe0a0
    this.beam.alpha = 0.5
    this.beam.blendMode = 'add'
    this.addChild(this.beam, this.cars)
    this.wait = range(this.rng, 3, 8)
    this.cars.x = -1500
    this.y = lane
  }

  update(dt: number) {
    if (this.wait > 0) {
      this.wait -= dt
      this.visible = false
      return
    }
    this.visible = true
    this.cars.x += 260 * dt
    this.beam.position.set(this.cars.x + 1100, -50)
    if (this.cars.x > WORLD.width + 600) {
      this.wait = range(this.rng, 14, 30)
      this.cars.x = -1500
    }
  }
}
