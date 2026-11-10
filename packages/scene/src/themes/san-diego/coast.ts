import { Container, Graphics, Sprite } from 'pixi.js'
import { GROUND } from '../../layout'
import { palette } from '../../palette'
import { chance, createRng, pick, range, type Rng } from '../../rng'
import { glowTexture } from '../../textures'
import { sd } from './parts'

/** where the sea meets the sky */
export const HORIZON = 720
/**
 * The view is drawn looking right and then turned round: the street runs out
 * along the cliff on the left of the house. x here = MIRROR - x on the street.
 */
export const MIRROR = 2430
/** in drawing coordinates; on the street it's the left wall of the house */
export const CLIFF_EDGE = 1690

const WATER = 0x08101f
const SAND = 0x4a3e2c
const SANDSTONE = 0x5e4830
const WARM = [0xffc46a, 0xfff0d0, 0xff9a4a, 0xffd890]

/** the hill the town climbs behind the shops, falling to a point at the bay */
function ridge(x: number) {
  const t = Math.min(1, Math.max(0, (1800 - x) / 700))
  const s = t * t * (3 - 2 * t)
  return HORIZON + 4 - s * (120 + 26 * Math.sin(x / 230))
}

/** the line the waves reach on the beach below */
function shore(x: number) {
  return 902 + 30 * Math.sin(Math.min(1, Math.max(0, (x - 1600) / 760)) * Math.PI)
}

/** the bridge deck, in street coordinates: one long hump right over the rooftops */
function deck(x: number) {
  const t = Math.min(1, Math.max(0, (x - 480) / 1500))
  return HORIZON - 4 - 290 * Math.pow(Math.sin(t * Math.PI), 0.6)
}

function add(
  parent: Container,
  x: number,
  y: number,
  sx: number,
  sy: number,
  tint: number,
  a: number,
) {
  const s = new Sprite(glowTexture())
  s.anchor.set(0.5)
  s.position.set(x, y)
  s.scale.set(sx, sy)
  s.tint = tint
  s.alpha = a
  s.blendMode = 'add'
  parent.addChild(s)
  return s
}

// What you see from the top of the cliffs: off the end of the street the bay,
// downtown across the water and the beach in the cove below with its fire
// rings going; the Coronado bridge climbing right over the rooftops; and the
// hill full of lights behind the shops.
export class Coast extends Container {
  private far = new Container()
  private near = new Container()
  /** the turned-round layers the view is drawn into */
  private ff = new Container()
  private nf = new Container()
  private bursts: { g: Graphics; glow: Sprite; t: number; wait: number }[] = []
  private rng: Rng
  private blinkers: Sprite[] = []
  private glitter = new Graphics()
  private foam: Graphics[] = []
  private fires: { glow: Sprite; flame: Graphics; phase: number }[] = []
  private plane = new Container()
  private strobe: Sprite
  private planeT: number

  constructor(seed: number, moonX: number) {
    super()
    const rng = createRng(seed)
    this.planeT = rng() * 0.6
    this.rng = createRng(seed + 99)
    for (const f of [this.ff, this.nf]) {
      f.scale.x = -1
      f.x = MIRROR
    }
    this.far.addChild(this.ff)
    this.near.addChild(this.nf)
    this.addChild(this.far, this.plane, this.near)

    const g = new Graphics()
    this.ff.addChild(g)
    this.water(g, rng, moonX)
    this.ff.addChild(this.glitter)
    const city = new Graphics()
    this.ff.addChild(city)
    this.downtown(city, rng)
    this.hill(city, rng)
    this.fireworks()
    const span = new Graphics()
    this.far.addChild(span)
    this.bridge(span)

    const cove = new Graphics()
    this.nf.addChild(cove)
    this.beach(cove, rng)
    this.headland(cove, rng)

    this.strobe = this.aeroplane()
  }

  private water(g: Graphics, rng: Rng, moonX: number) {
    g.rect(-700, HORIZON, 4000, GROUND - HORIZON).fill(WATER)
    g.rect(-700, HORIZON, 4000, 26).fill({ color: 0x1a2a4a, alpha: 0.5 })
    for (let i = 0; i < 170; i++) {
      const y = HORIZON + 6 + Math.pow(rng(), 1.4) * 190
      const w = 10 + ((y - HORIZON) / 190) * 50 * rng()
      g.rect(range(rng, 1500, 3100), y, w, 1.5).fill({
        color: 0x8aa0c8,
        alpha: range(rng, 0.08, 0.28),
      })
    }
    // the moon laid out across the water, wider as it comes toward you
    for (let i = 0; i < 70; i++) {
      const t = Math.pow(rng(), 0.8)
      const y = HORIZON + 4 + t * 170
      const spread = 14 + t * 90
      const w = range(rng, 8, 16 + t * 40)
      this.glitter
        .rect(moonX + range(rng, -spread, spread) - w / 2, y, w, 2)
        .fill({ color: palette.moon, alpha: range(rng, 0.25, 0.7) })
    }
  }

  /** the towers across the bay, small and a long way off, doubled in the water */
  private downtown(g: Graphics, rng: Rng) {
    const x0 = 1740
    const x1 = 2150
    add(this.ff, (x0 + x1) / 2, HORIZON - 50, 5, 2, 0xff7a2a, 0.45)
    g.rect(x0 - 70, HORIZON - 5, x1 - x0 + 130, 8).fill(0x0a0e1c)
    let x = x0
    let n = 0
    while (x < x1) {
      const w = range(rng, 26, 56)
      const mid = 1 - Math.abs((x + w / 2 - (x0 + x1) / 2) / ((x1 - x0) / 2))
      const h = 44 + mid * range(rng, 90, 250) + range(rng, 0, 40)
      const top = HORIZON - h
      const body = pick(rng, [0x0e1226, 0x12162c, 0x0c1020])
      g.rect(x, top, w, h).fill(body)
      const crown = n % 4
      if (crown === 0 && h > 110) {
        // the one with the pointed top that looks like a screwdriver
        g.poly([x, top, x + w / 2, top - 30, x + w, top]).fill(body)
        this.blinker(x + w / 2, top - 32)
      } else if (crown === 1) {
        g.rect(x + w * 0.2, top - 12, w * 0.6, 12).fill(body)
      } else if (crown === 2 && h > 120) {
        g.rect(x + w / 2 - 1, top - 26, 2, 26).fill(body)
        this.blinker(x + w / 2, top - 26)
      }
      for (let wy = top + 6; wy < HORIZON - 8; wy += 8)
        for (let wx = x + 3; wx < x + w - 4; wx += 6)
          if (chance(rng, 0.36))
            g.rect(wx, wy, 3, 4.5).fill({ color: pick(rng, WARM), alpha: 0.75 })
      // and its lights run down the bay toward you
      g.rect(x + 2, HORIZON + 4, w - 4, h * 0.55).fill({ color: pick(rng, WARM), alpha: 0.07 })
      for (let k = 0; k < 4; k++)
        g.rect(
          x + range(rng, 0, w - 8),
          HORIZON + range(rng, 6, h * 0.5),
          range(rng, 6, 14),
          1.5,
        ).fill({
          color: pick(rng, WARM),
          alpha: 0.3,
        })
      x += w + range(rng, -3, 6)
      n++
    }
    // marina lights along the foot of it
    for (let lx = x0 - 60; lx < x1 + 60; lx += range(rng, 8, 20))
      g.rect(lx, HORIZON - 2, 2, 2).fill(pick(rng, WARM))
  }

  /**
   * The blue bridge to Coronado. It leaves from beside downtown, climbs on
   * its tall thin legs until the navy can sail under it, and comes down
   * somewhere behind the shops.
   */
  private bridge(g: Graphics) {
    const blue = 0x234878
    for (let x = 560; x < 1980; x += 118) {
      const y = deck(x)
      g.poly([x - 5, y, x + 5, y, x + 9, GROUND, x - 9, GROUND]).fill(0x172c50)
      g.rect(x - 14, y, 28, 9).fill(0x172c50)
      g.rect(x - 5, y, 3, GROUND - y).fill({ color: 0x6a8ac0, alpha: 0.18 })
    }
    const pts: number[] = []
    for (let x = 480; x <= 1980; x += 20) pts.push(x, deck(x))
    g.poly(pts, false).stroke({ color: blue, width: 16 })
    g.poly(
      pts.map((v, i) => (i % 2 ? v - 8 : v)),
      false,
    ).stroke({ color: 0x6a8ac0, width: 2.5 })
    g.poly(
      pts.map((v, i) => (i % 2 ? v + 8 : v)),
      false,
    ).stroke({ color: 0x122444, width: 3 })
    // lamps along the deck, tail lights going over to the island
    for (let x = 500; x < 1980; x += 44) {
      const y = deck(x) - 16
      g.rect(x - 1, y, 2, 8).fill(blue)
      g.circle(x, y, 2.5).fill(0xffe0a0)
      add(this.far, x, y, 0.16, 0.16, 0xffc870, 0.9)
    }
    for (const cx of [640, 905, 1470, 1710, 1820]) {
      g.rect(cx, deck(cx) - 12, 7, 3).fill(0xff3a2a)
      g.rect(cx + 60, deck(cx + 60) - 12, 6, 3).fill(0xfff0d0)
    }
  }

  private hill(g: Graphics, rng: Rng) {
    const pts = [-700, GROUND]
    for (let x = -700; x <= 1800; x += 50) pts.push(x, ridge(x))
    pts.push(1800, GROUND)
    g.poly(pts).fill(0x0b0d19)
    for (let i = 0; i < 420; i++) {
      const x = range(rng, -600, 1760)
      const top = ridge(x) + 8
      const y = top + Math.pow(rng(), 0.7) * (900 - top)
      if (y < top) continue
      g.rect(x, y, 3, 2.5).fill({ color: pick(rng, WARM), alpha: range(rng, 0.45, 0.9) })
    }
    // streets running up it
    for (let i = 0; i < 5; i++) {
      const x = range(rng, -300, 1300)
      const y0 = ridge(x) + 30
      for (let k = 0; k < 12; k++)
        g.rect(x + k * 9, y0 + k * 11, 2.5, 2.5).fill({ color: 0xffb050, alpha: 0.8 })
    }
    // the masts on top
    for (const mx of [380, 430, 1020]) {
      const top = ridge(mx)
      g.rect(mx - 1, top - 70, 2, 70).fill(0x0b0d19)
      g.poly([mx - 8, top, mx, top - 40, mx + 8, top]).fill(0x0b0d19)
      this.blinker(mx, top - 70)
    }
  }

  /** the cove at the foot of the cliff: sand, three lines of foam, fire rings */
  private beach(g: Graphics, rng: Rng) {
    const pts = [1500, GROUND]
    for (let x = 1500; x <= 3100; x += 40) pts.push(x, shore(x))
    pts.push(3100, GROUND)
    g.poly(pts).fill(SAND)
    // wet sand where the last wave went back
    const wet: number[] = []
    for (let x = 1500; x <= 3100; x += 40) wet.push(x, shore(x) + 9)
    g.poly(wet, false).stroke({ color: 0x5a5648, width: 16, alpha: 0.5 })
    for (let i = 0; i < 300; i++)
      g.rect(range(rng, 1600, 3000), range(rng, 935, GROUND), range(rng, 3, 12), 1.5).fill({
        color: chance(rng, 0.5) ? palette.ink : 0x6a5a40,
        alpha: 0.2,
      })
    // kelp along the tide line
    for (let i = 0; i < 14; i++) {
      const x = range(rng, 1720, 2240)
      g.ellipse(x, shore(x) + range(rng, 20, 30), range(rng, 6, 16), 2.5).fill({
        color: 0x1a2416,
        alpha: 0.8,
      })
    }

    ;[5, 17, 31].forEach((off, i) => {
      const line = new Graphics()
      const p: number[] = []
      for (let x = 1500; x <= 3100; x += 24)
        p.push(x, shore(x) - off + Math.sin(x / (38 + i * 9) + i * 2) * (2 + i * 1.5))
      line.poly(p, false).stroke({ color: 0xdfe8f0, width: 5 - i * 1.5, alpha: 0.75 - i * 0.2 })
      this.nf.addChild(line)
      this.foam.push(line)
    })

    // a rock off the point with the swell breaking round it
    g.ellipse(2170, 872, 34, 5).fill({ color: 0xdfe8f0, alpha: 0.45 })
    g.poly([2142, 872, 2152, 850, 2170, 842, 2184, 854, 2198, 872]).fill(0x1c1610)

    // sea lions hauled out on it, one with its nose in the air
    g.ellipse(2160, 846, 11, 4.5).ellipse(2180, 850, 9, 4).fill(0x0c0a08)
    g.poly([2166, 846, 2172, 832, 2176, 834, 2172, 848]).fill(0x0c0a08)

    this.lifeguardTower(g, 1830, 990)
    this.fire(g, 1990, 1000, 1, rng)
    this.fire(g, 2150, 966, 0.7, rng)
    // boards stuck in the sand, towels nobody came back for
    for (const [bx, c] of [
      [1912, 0xf2e2bd],
      [1924, 0x8ac0c8],
    ] as const)
      g.ellipse(bx, 978, 4, 22).fill(c)
    g.rect(2080, 1026, 22, 9).fill(0xd8502a)
    g.rect(1770, 1012, 20, 8).fill(0x2a7a7a)
  }

  private lifeguardTower(g: Graphics, x: number, y: number) {
    const leg = { color: 0x8a8a84, width: 2.5 }
    g.moveTo(x - 16, y)
      .lineTo(x - 12, y - 26)
      .moveTo(x + 16, y)
      .lineTo(x + 12, y - 26)
      .stroke(leg)
    g.moveTo(x - 16, y)
      .lineTo(x + 12, y - 26)
      .stroke({ ...leg, width: 1.5 })
    g.rect(x - 20, y - 30, 40, 4).fill(0x8a8a84)
    g.rect(x - 14, y - 54, 28, 24).fill(0x5a8494)
    g.rect(x - 8, y - 48, 16, 10).fill(0x101820)
    g.poly([x - 20, y - 54, x + 20, y - 54, x + 14, y - 62, x - 14, y - 62]).fill(0x8a8a84)
    // the ramp down to the sand
    g.moveTo(x + 20, y - 28)
      .lineTo(x + 50, y)
      .stroke({ color: 0x8a8a84, width: 3 })
    g.rect(x - 1, y - 78, 2, 16).fill(0x8a8a84)
    g.rect(x + 1, y - 78, 12, 8).fill(0xd8a02a)
  }

  /** a concrete fire ring with people round it */
  private fire(g: Graphics, x: number, y: number, s: number, rng: Rng) {
    g.ellipse(x, y, 20 * s, 6 * s).fill(0x1a1612)
    for (let i = 0; i < 5; i++) {
      const px = x + (i - 2) * 22 * s + range(rng, -4, 4)
      if (Math.abs(px - x) < 12 * s) continue
      const py = y + (i % 2 ? 9 : -5) * s
      g.circle(px, py - 20 * s, 5 * s).fill(palette.ink)
      g.poly([
        px - 7 * s,
        py - 15 * s,
        px + 7 * s,
        py - 15 * s,
        px + 10 * s,
        py,
        px - 10 * s,
        py,
      ]).fill(palette.ink)
    }
    const flame = new Graphics()
      .poly([-9, 0, -4, -16, 0, -8, 4, -24, 10, 0])
      .fill(0xff8a2a)
      .poly([-4, 0, 0, -12, 5, 0])
      .fill(0xffe08a)
    flame.position.set(x, y)
    flame.scale.set(s)
    this.nf.addChild(flame)
    add(this.nf, x, y + 4, 2.4 * s, 0.7 * s, 0xff7a2a, 0.5)
    this.fires.push({
      glow: add(this.nf, x, y - 10 * s, 0.9 * s, 0.9 * s, 0xff8a2a, 0.9),
      flame,
      phase: rng() * 10,
    })
  }

  /** the next point along: sandstone going straight down into the cove, houses on top */
  private headland(g: Graphics, rng: Rng) {
    const top = [2250, 812, 2290, 786, 2370, 770, 2510, 762, 2710, 752, 3200, 748]
    g.poly([2220, 1010, 2234, 900, 2250, 812, ...top.slice(2), 3200, GROUND, 2190, GROUND]).fill(
      SANDSTONE,
    )
    // strata, and the gullies the rain cuts
    for (let y = 800; y < 1060; y += 22)
      g.moveTo(2230 - (y - 800) * 0.1, y + 10)
        .bezierCurveTo(2410, y - 8, 2610, y + 12, 3200, y - 4)
        .stroke({ color: y % 44 < 22 ? 0x3a2a1a : 0x6a5236, width: 3, alpha: 0.55 })
    for (let i = 0; i < 9; i++) {
      const x = range(rng, 2280, 2810)
      g.poly([x, 790, x + 8, 790, x + range(rng, 10, 30), range(rng, 900, 1040)]).fill({
        color: palette.ink,
        alpha: 0.28,
      })
    }
    g.poly([
      2190,
      GROUND,
      2220,
      1010,
      2234,
      900,
      2250,
      812,
      2270,
      830,
      2260,
      930,
      2250,
      GROUND,
    ]).fill({
      color: 0x8a6a44,
      alpha: 0.3,
    })
    // scrub along the lip, then the houses that paid for the view
    g.poly([...top, 3200, 772, 2370, 790, 2280, 808], false).stroke({ color: sd.leaf, width: 10 })
    for (const [hx, hw, hh] of [
      [2350, 86, 44],
      [2470, 110, 60],
      [2620, 90, 46],
      [2740, 120, 58],
    ] as const) {
      const base = 768 - (hx - 2350) * 0.03
      g.rect(hx, base - hh, hw, hh).fill(0x2a2420)
      g.poly([
        hx - 8,
        base - hh,
        hx + hw + 8,
        base - hh,
        hx + hw - 10,
        base - hh - 14,
        hx + 10,
        base - hh - 14,
      ]).fill(sd.tileDark)
      for (let wx = hx + 10; wx < hx + hw - 14; wx += 26)
        if (chance(rng, 0.75)) {
          g.rect(wx, base - hh + 12, 14, 16).fill(pick(rng, WARM))
          add(this.nf, wx + 7, base - hh + 20, 0.2, 0.2, 0xffb050, 0.5)
        }
    }
    for (const px of [2326, 2450, 2600, 2716, 2850]) {
      const h = range(rng, 70, 120)
      g.rect(px - 1.5, 770 - h, 3, h).fill(0x14100c)
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI * (i / 8)
        g.moveTo(px, 770 - h)
          .lineTo(px + Math.cos(a) * 15, 770 - h + Math.sin(a) * 12 + Math.abs(Math.cos(a)) * 8)
          .stroke({ color: 0x14100c, width: 2.5 })
      }
    }
  }

  /** the fireworks they let off over the bay every night of the summer */
  private fireworks() {
    for (const [x, y, colour] of [
      [560, 300, 0xff5a8a],
      [330, 380, 0xffd040],
      [470, 250, 0x6ad0ff],
    ] as const) {
      const g = new Graphics()
      for (let ring = 1; ring <= 2; ring++)
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2 + ring
          g.circle(Math.cos(a) * 40 * ring, Math.sin(a) * 40 * ring, 4.5 - ring).fill(0xffffff)
          g.moveTo(Math.cos(a) * 26 * ring, Math.sin(a) * 26 * ring)
            .lineTo(Math.cos(a) * 38 * ring, Math.sin(a) * 38 * ring)
            .stroke({ color: 0xffffff, width: 1.5, alpha: 0.6 })
        }
      g.tint = colour
      g.position.set(x, y)
      g.visible = false
      this.far.addChild(g)
      const glow = add(this.far, x, y, 2.2, 2.2, colour, 0)
      this.bursts.push({ g, glow, t: 1, wait: 2 + this.bursts.length * 2.3 })
    }
  }

  /** coming in low over the city, the way they all do here */
  private aeroplane() {
    const g = new Graphics()
    g.roundRect(-34, -4, 68, 8, 4).fill(0x1a1e2e)
    g.poly([-34, -2, -44, -16, -36, -16, -24, -2]).fill(0x1a1e2e)
    g.poly([-6, 2, 8, 2, -10, 16, -16, 16]).fill(0x12162a)
    for (let wx = -20; wx < 26; wx += 5)
      g.rect(wx, -2, 2.5, 2).fill({ color: 0xfff0d0, alpha: 0.8 })
    this.plane.addChild(g)
    add(this.plane, 30, 2, 0.5, 0.14, 0xfff0d0, 0.8)
    add(this.plane, -10, 14, 0.1, 0.1, 0x40ff80, 0.9)
    return add(this.plane, -40, -16, 0.16, 0.16, 0xff2a1a, 1)
  }

  private blinker(x: number, y: number) {
    this.blinkers.push(add(this.ff, x, y, 0.13, 0.13, 0xff2a1a, 1))
  }

  update(time: number, dt: number, px: number, reducedMotion: boolean) {
    this.far.x += (-px * 6 - this.far.x) * 0.05
    this.near.x += (-px * 12 - this.near.x) * 0.05
    this.blinkers.forEach((b, i) => (b.alpha = Math.sin(time * 2 + i * 1.3) > 0.4 ? 1 : 0.1))
    this.strobe.alpha = Math.sin(time * 6) > 0.7 ? 1 : 0.1

    // one flight every minute or so, right to left and down toward the field
    this.planeT += dt / (reducedMotion ? 160 : 55)
    if (this.planeT > 1.5) this.planeT = 0
    const t = this.planeT
    this.plane.visible = t < 1
    this.plane.position.set(3000 - t * 3500, 130 + t * 330)
    this.plane.rotation = -0.06
    this.plane.scale.set(-1, 1)

    if (reducedMotion) return
    for (const b of this.bursts) {
      if (b.wait > 0) {
        b.wait -= dt
        if (b.wait <= 0) b.t = 0
        continue
      }
      b.t += dt / 1.8
      const k = Math.min(1, b.t)
      b.g.visible = true
      b.g.scale.set(0.2 + Math.pow(k, 0.4) * 0.9)
      b.g.y += dt * 9
      b.g.alpha = 1 - k * k
      b.glow.alpha = (1 - k) * 0.45
      if (k >= 1) {
        b.g.visible = false
        b.g.y = range(this.rng, 240, 400)
        b.g.x = range(this.rng, 300, 640)
        b.glow.position.copyFrom(b.g.position)
        b.wait = range(this.rng, 4, 11)
      }
    }
    this.glitter.alpha = 0.8 + Math.sin(time * 1.7) * 0.2
    this.foam.forEach((f, i) => {
      const w = Math.sin(time * 0.6 - i * 0.9)
      f.y = w * (5 + i * 2)
      f.alpha = 0.65 + w * 0.35
    })
    for (const f of this.fires) {
      const k = Math.sin(time * 11 + f.phase) * 0.5 + Math.sin(time * 17 + f.phase * 2) * 0.5
      f.glow.alpha = 0.8 + k * 0.15
      f.flame.scale.y = Math.abs(f.flame.scale.x) * (1 + k * 0.18)
      f.flame.skew.x = k * 0.12
    }
  }
}
