import { Container, Graphics, Sprite } from 'pixi.js'
import { GROUND } from '../../layout'
import { chance, createRng, pick, range, type Rng } from '../../rng'
import { glowTexture } from '../../textures'
import { sd } from './parts'

/** where the sea meets the sky */
export const HORIZON = 720
/** everything right of here is open air: the street runs out onto the bluff */
export const CLIFF_EDGE = 1690

// Everything out here is painted for the hour before sunset, which is when
// this street is seen: the colours are the ones that come out gold, teal and
// pink once the evening grade has been over them.
const SEA = 0x0e3952
const SEA_LIGHT = 0x1d4e62
const FOAM = 0x839b9f
const SAND = 0x767a62
const WET = 0x565545
const WARM = [0xffc46a, 0xfff0d0, 0xff9a4a, 0xffd890]
const DARK = 0x16141c

/** the hill the town climbs, behind the shops */
function ridge(x: number) {
  const t = Math.min(1, Math.max(0, (1500 - x) / 800))
  const s = t * t * (3 - 2 * t)
  return HORIZON + 30 - s * (90 + 22 * Math.sin(x / 230))
}

/** the line the waves reach: the beach runs away from you toward the point */
export function shore(x: number) {
  const t = Math.min(1, Math.max(0, (x - 1600) / 1000))
  return 1000 - 240 * Math.pow(t, 0.8)
}

/**
 * The bridge deck. It comes in from somewhere off to the left, already
 * high, and is still coming down when the house gets in the way.
 */
function deck(x: number) {
  const t = Math.min(1, Math.max(0, (x + 900) / 2320))
  return HORIZON - 4 - 300 * Math.pow(Math.sin(t * Math.PI), 0.6)
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

interface Glider {
  node: Container
  x: number
  y: number
  phase: number
  drift: number
}

// What's behind the street. Inland, the hill and downtown standing up over
// the shops, and the Coronado bridge crossing the whole sky. Out past the
// house, the Pacific: the sun going down into it, a long beach running away
// to the next point, surf coming in, and the paragliders off the cliffs
// working the last of the lift.
export class Coast extends Container {
  private far = new Container()
  private near = new Container()
  private blinkers: Sprite[] = []
  private glitter = new Graphics()
  private foam: Graphics[] = []
  private sets: Graphics[] = []
  private fires: { glow: Sprite; flame: Graphics; phase: number }[] = []
  private gliders: Glider[] = []
  private plane = new Container()
  private strobe: Sprite
  private planeT: number

  constructor(seed: number, sunX: number) {
    super()
    const rng = createRng(seed)
    this.planeT = rng() * 0.6
    this.addChild(this.far, this.plane, this.near)

    const g = new Graphics()
    this.far.addChild(g)
    this.water(g, rng, sunX)
    this.far.addChild(this.glitter)
    const land = new Graphics()
    this.far.addChild(land)
    this.hill(land, rng)
    this.downtown(land, rng)
    this.bridge(land)
    this.point(land, rng)

    const cove = new Graphics()
    this.near.addChild(cove)
    this.beach(cove, rng)

    for (const [x, y, s, a, b] of [
      [1800, 250, 1, 0xf0a020, 0xe8603a],
      [2010, 400, 0.8, 0xd8283a, 0xf2e2bd],
      [2230, 300, 0.62, 0xc8d030, 0x2a8a6a],
      [1930, 520, 0.5, 0x3a6ad8, 0xf2e2bd],
      [2330, 470, 0.7, 0xf2e2bd, 0xd8502a],
      [1640, 150, 0.45, 0xe8c02a, 0x2a2a34],
    ] as const)
      this.glider(x, y, s, a, b, rng)

    this.strobe = this.aeroplane()
  }

  private water(g: Graphics, rng: Rng, sunX: number) {
    g.rect(-700, HORIZON, 4000, GROUND - HORIZON).fill(SEA)
    // paler out toward the horizon, where it's all sky
    for (let i = 0; i < 6; i++)
      g.rect(-700, HORIZON + i * 14, 4000, 14).fill({ color: 0x7e694c, alpha: 0.5 - i * 0.08 })
    for (let i = 0; i < 220; i++) {
      const y = HORIZON + 8 + Math.pow(rng(), 1.3) * 250
      const w = 12 + ((y - HORIZON) / 250) * 70 * rng()
      g.rect(range(rng, 1500, 3100), y, w, 2).fill({
        color: chance(rng, 0.5) ? SEA_LIGHT : 0x0a2c42,
        alpha: range(rng, 0.3, 0.7),
      })
    }
    // the sun laid out across the water, wider as it comes toward you
    for (let i = 0; i < 110; i++) {
      const t = Math.pow(rng(), 0.8)
      const y = HORIZON + 3 + t * 230
      const spread = 20 + t * 150
      const w = range(rng, 10, 20 + t * 60)
      this.glitter
        .rect(sunX + range(rng, -spread, spread) - w / 2, y, w, 2.5)
        .fill({ color: 0x8e8a62, alpha: range(rng, 0.35, 0.9) })
    }
  }

  private hill(g: Graphics, rng: Rng) {
    const pts = [-700, GROUND]
    for (let x = -700; x <= 1500; x += 50) pts.push(x, ridge(x))
    pts.push(1500, GROUND)
    g.poly(pts).fill(0x2c2a3a)
    for (let i = 0; i < 300; i++) {
      const x = range(rng, -600, 1460)
      const top = ridge(x) + 8
      const y = top + Math.pow(rng(), 0.7) * (900 - top)
      // roofs and trees, and here and there a window that's caught the sun
      if (chance(rng, 0.4))
        g.rect(x, y, range(rng, 10, 22), 6).fill({ color: 0x3e3440, alpha: 0.9 })
      else if (chance(rng, 0.5))
        g.circle(x, y, range(rng, 4, 8)).fill({ color: 0x1e2a2a, alpha: 0.9 })
      else g.rect(x, y, 3, 2.5).fill({ color: pick(rng, WARM), alpha: range(rng, 0.5, 0.9) })
    }
  }

  /** downtown, standing up behind the shops with the light coming through it */
  private downtown(g: Graphics, rng: Rng) {
    const x0 = 120
    const x1 = 700
    const base = 830
    add(this.far, (x0 + x1) / 2, 600, 6, 3, 0xffa040, 0.25)
    let x = x0
    let n = 0
    while (x < x1) {
      const w = range(rng, 34, 70)
      const mid = 1 - Math.abs((x + w / 2 - (x0 + x1) / 2) / ((x1 - x0) / 2))
      const h = 90 + mid * range(rng, 120, 300) + range(rng, 0, 50)
      const top = base - h
      const body = pick(rng, [0x2a2c48, 0x34304e, 0x262a44, 0x3a3450])
      g.rect(x, top, w, h).fill(body)
      // the side toward the sun
      g.rect(x + w - 7, top, 7, h).fill({ color: 0x9a6a4a, alpha: 0.55 })
      const crown = n % 4
      if (crown === 0 && h > 200) {
        // the one with the pointed top that looks like a screwdriver
        g.poly([x, top, x + w / 2, top - 44, x + w, top]).fill(body)
        g.poly([x + w / 2, top - 44, x + w, top, x + w - 7, top]).fill({
          color: 0x9a6a4a,
          alpha: 0.55,
        })
        this.blinker(x + w / 2, top - 46)
      } else if (crown === 1) {
        g.rect(x + w * 0.2, top - 16, w * 0.6, 16).fill(body)
      } else if (crown === 2 && h > 220) {
        g.rect(x + w / 2 - 1.5, top - 40, 3, 40).fill(body)
        this.blinker(x + w / 2, top - 40)
      } else if (crown === 3) {
        g.rect(x, top - 6, w, 6).fill(0x1e2038)
      }
      for (let wy = top + 8; wy < base - 10; wy += 11)
        for (let wx = x + 4; wx < x + w - 10; wx += 8)
          if (chance(rng, 0.3))
            g.rect(wx, wy, 4, 6).fill({ color: pick(rng, WARM), alpha: range(rng, 0.5, 0.9) })
      x += w + range(rng, -4, 10)
      n++
    }
  }

  /** the blue bridge to Coronado, on its tall thin legs */
  private bridge(g: Graphics) {
    const blue = 0x234878
    for (let x = -640; x < 1400; x += 150) {
      const y = deck(x)
      g.poly([x - 6, y, x + 6, y, x + 11, GROUND, x - 11, GROUND]).fill(0x1c3460)
      g.rect(x - 16, y, 32, 10).fill(0x1c3460)
      g.rect(x + 3, y, 4, GROUND - y).fill({ color: 0x9a7a5a, alpha: 0.5 })
    }
    const pts: number[] = []
    for (let x = -900; x <= 1420; x += 20) pts.push(x, deck(x))
    g.poly(pts, false).stroke({ color: blue, width: 18 })
    g.poly(
      pts.map((v, i) => (i % 2 ? v - 9 : v)),
      false,
    ).stroke({ color: 0x9a8a7a, width: 3 })
    g.poly(
      pts.map((v, i) => (i % 2 ? v + 9 : v)),
      false,
    ).stroke({ color: 0x142a50, width: 3.5 })
    for (let x = -880; x < 1400; x += 46) {
      const y = deck(x) - 18
      g.rect(x - 1, y, 2, 9).fill(blue)
      g.circle(x, y, 2.5).fill(0xffe0a0)
      add(this.far, x, y, 0.12, 0.12, 0xffc870, 0.8)
    }
    // going over to the island for dinner
    for (const cx of [-420, 96, 310, 468, 644, 890]) {
      g.roundRect(cx, deck(cx + 8) - 17, 16, 7, 2).fill(
        pick(createRng(cx + 5000), [0xc8281e, 0xe8e0d0, 0x2a2a34, 0x3a6a9a]),
      )
    }
  }

  /** the next point up the coast: a low cliff with palms and houses along the top */
  private point(g: Graphics, rng: Rng) {
    const top = [2120, 762, 2150, 734, 2230, 716, 2380, 704, 2700, 694, 3300, 686]
    g.poly([...top, 3300, 840, 2120, 840]).fill(0x61553b)
    g.poly([2120, 762, 2150, 734, 2230, 716, 2250, 728, 2190, 760, 2180, 840, 2120, 840]).fill(
      0x7e7350,
    )
    for (let y = 730; y < 800; y += 12)
      g.moveTo(2200 - (y - 730), y + 8)
        .bezierCurveTo(2500, y - 6, 2800, y + 6, 3300, y - 4)
        .stroke({ color: y % 24 < 12 ? 0x4a3d26 : 0x756d41, width: 2.5, alpha: 0.6 })
    g.poly([...top, 3300, 700, 2380, 716, 2230, 728, 2150, 746], false).stroke({
      color: 0x263d29,
      width: 7,
    })
    // white water round the foot of it
    g.ellipse(2130, 770, 40, 5).fill({ color: FOAM, alpha: 0.8 })
    for (const [hx, hw, hh] of [
      [2270, 60, 26],
      [2350, 84, 36],
      [2470, 66, 28],
      [2570, 96, 40],
      [2700, 70, 30],
    ] as const) {
      const base = 712 - (hx - 2270) * 0.035
      g.rect(hx, base - hh, hw, hh).fill(pick(rng, [0x847a6a, 0x7a6a5a, 0x6e7478]))
      g.rect(hx - 4, base - hh - 5, hw + 8, 6).fill(sd.tileDark)
      for (let wx = hx + 8; wx < hx + hw - 10; wx += 18)
        g.rect(wx, base - hh + 8, 9, 10).fill(chance(rng, 0.5) ? 0xffd890 : 0x2a3444)
    }
    for (let i = 0; i < 16; i++) {
      const px = 2190 + i * 42 + range(rng, -12, 12)
      const base = 724 - (px - 2190) * 0.045
      const h = range(rng, 34, 74)
      g.rect(px - 1.2, base - h, 2.4, h).fill(DARK)
      for (let k = 0; k < 9; k++) {
        const a = -Math.PI * (k / 8)
        g.moveTo(px, base - h)
          .lineTo(px + Math.cos(a) * 10, base - h + Math.sin(a) * 8 + Math.abs(Math.cos(a)) * 6)
          .stroke({ color: DARK, width: 2 })
      }
    }
  }

  /** sand, three lines of foam, the sets coming in behind them, and everybody still down there */
  private beach(g: Graphics, rng: Rng) {
    const line = (off: number, wobble = 0, k = 0) => {
      const p: number[] = []
      for (let x = 1500; x <= 2700; x += 24)
        p.push(
          x,
          shore(x) - off * (1 - (x - 1500) / 1700) + Math.sin(x / (38 + k * 9) + k * 2) * wobble,
        )
      return p
    }
    g.poly([1500, GROUND, ...line(0), 2700, GROUND]).fill(SAND)
    g.poly(line(-10), false).stroke({ color: WET, width: 20, alpha: 0.8 })
    g.poly(line(-3), false).stroke({ color: 0x8a8a70, width: 3, alpha: 0.6 })
    for (let i = 0; i < 260; i++) {
      const x = range(rng, 1600, 2500)
      const y = range(rng, shore(x) + 24, GROUND)
      g.rect(x, y, range(rng, 3, 12), 1.5).fill({
        color: chance(rng, 0.5) ? WET : 0x8a8a70,
        alpha: 0.35,
      })
    }
    // kelp along the tide line
    for (let i = 0; i < 18; i++) {
      const x = range(rng, 1660, 2300)
      g.ellipse(x, shore(x) + range(rng, 22, 34), range(rng, 6, 16), 2.5).fill({
        color: 0x2a2416,
        alpha: 0.8,
      })
    }

    // the sets: long lines of swell, each with a strip of white where it's breaking
    for (let k = 0; k < 4; k++) {
      const set = new Graphics()
      const off = 70 + k * 44
      set.poly(line(off, 3, k + 4), false).stroke({ color: SEA_LIGHT, width: 7 - k, alpha: 0.9 })
      const pts = line(off - 4, 3, k + 4)
      for (let i = 0; i < pts.length - 6; i += 2) {
        if ((i / 2 + k * 3) % 7 > 3) continue
        set
          .moveTo(pts[i]!, pts[i + 1]!)
          .lineTo(pts[i + 2]!, pts[i + 3]!)
          .stroke({ color: FOAM, width: 6 - k, alpha: 0.95 })
      }
      this.near.addChild(set)
      this.sets.push(set)
    }
    ;[6, 20, 38].forEach((off, i) => {
      const f = new Graphics()
      f.poly(line(off, 2 + i * 1.5, i), false).stroke({
        color: FOAM,
        width: 7 - i * 2,
        alpha: 0.95 - i * 0.2,
      })
      this.near.addChild(f)
      this.foam.push(f)
    })

    // surfers out the back, waiting
    for (const sx of [1830, 1880, 2010, 2075]) {
      const sy = shore(sx) - 96 - (sx % 30)
      g.ellipse(sx, sy + 3, 11, 2).fill(0xe8e0d0)
      g.rect(sx - 2.5, sy - 9, 5, 11).fill(DARK)
      g.circle(sx, sy - 12, 3).fill(DARK)
    }

    const tower = new Graphics()
    this.near.addChild(tower)
    this.lifeguardTower(tower, 1930, shore(1930) + 62)
    this.people(tower, rng)
    this.fire(tower, 2085, shore(2085) + 70, 0.8, rng)
  }

  /** towels, umbrellas, people standing with their feet in it */
  private people(g: Graphics, rng: Rng) {
    const tops = [0xd8283a, 0xf2e2bd, 0x2a6a9a, 0xe8a020, 0x1a1a24, 0xd85a8a, 0x2a8a6a]
    for (let i = 0; i < 26; i++) {
      const x = 1700 + i * 26 + range(rng, -10, 10)
      const far = (x - 1700) / 700
      const s = 1 - far * 0.45
      const y = shore(x) + range(rng, 4, 90 - far * 40)
      const kind = rng()
      if (kind < 0.2) {
        // an umbrella with a towel in its shade
        const c = pick(rng, tops)
        g.rect(x - 0.8, y - 22 * s, 1.6, 22 * s).fill(DARK)
        g.moveTo(x - 15 * s, y - 20 * s)
          .arc(x, y - 20 * s, 15 * s, Math.PI, 0)
          .closePath()
          .fill(c)
        g.rect(x + 4 * s, y - 2, 16 * s, 4 * s).fill(pick(rng, tops))
      } else if (kind < 0.4) {
        // lying down
        g.rect(x - 9 * s, y - 2, 20 * s, 4.5 * s).fill(pick(rng, tops))
        g.ellipse(x, y - 4 * s, 8 * s, 2.5 * s).fill(0x5a3a2a)
        g.circle(x - 9 * s, y - 5 * s, 2.5 * s).fill(0x3a2418)
      } else {
        g.rect(x - 2.5 * s, y - 22 * s, 5 * s, 12 * s).fill(pick(rng, tops))
        g.rect(x - 2.5 * s, y - 10 * s, 2 * s, 10 * s)
          .rect(x + 0.5 * s, y - 10 * s, 2 * s, 10 * s)
          .fill(0x5a3a2a)
        g.circle(x, y - 25 * s, 3 * s).fill(0x3a2418)
        // a board under one arm
        if (kind > 0.85) g.ellipse(x + 5 * s, y - 14 * s, 2 * s, 14 * s).fill(0xf2e2bd)
      }
    }
  }

  private lifeguardTower(g: Graphics, x: number, y: number) {
    const leg = { color: 0x9a9a94, width: 2.5 }
    g.moveTo(x - 16, y)
      .lineTo(x - 12, y - 26)
      .moveTo(x + 16, y)
      .lineTo(x + 12, y - 26)
      .stroke(leg)
    g.moveTo(x - 16, y)
      .lineTo(x + 12, y - 26)
      .stroke({ ...leg, width: 1.5 })
    g.rect(x - 20, y - 30, 40, 4).fill(0x9a9a94)
    g.rect(x - 14, y - 54, 28, 24).fill(0x5a8494)
    g.rect(x - 8, y - 48, 16, 10).fill(0x101820)
    g.poly([x - 20, y - 54, x + 20, y - 54, x + 14, y - 62, x - 14, y - 62]).fill(0x9a9a94)
    // the ramp down to the sand
    g.moveTo(x - 20, y - 28)
      .lineTo(x - 50, y)
      .stroke({ color: 0x9a9a94, width: 3 })
    g.rect(x - 1, y - 80, 2, 18).fill(0x9a9a94)
    g.rect(x + 1, y - 80, 13, 8).fill(0xd8a02a)
  }

  /** a concrete fire ring with people round it, just lit */
  private fire(g: Graphics, x: number, y: number, s: number, rng: Rng) {
    g.ellipse(x, y, 20 * s, 6 * s).fill(0x2a2620)
    for (let i = 0; i < 5; i++) {
      const px = x + (i - 2) * 22 * s + range(rng, -4, 4)
      if (Math.abs(px - x) < 12 * s) continue
      const py = y + (i % 2 ? 9 : -5) * s
      g.circle(px, py - 20 * s, 5 * s).fill(DARK)
      g.poly([
        px - 7 * s,
        py - 15 * s,
        px + 7 * s,
        py - 15 * s,
        px + 10 * s,
        py,
        px - 10 * s,
        py,
      ]).fill(DARK)
    }
    const flame = new Graphics()
      .poly([-9, 0, -4, -16, 0, -8, 4, -24, 10, 0])
      .fill(0xff8a2a)
      .poly([-4, 0, 0, -12, 5, 0])
      .fill(0xffe08a)
    flame.position.set(x, y)
    flame.scale.set(s)
    this.near.addChild(flame)
    this.fires.push({
      glow: add(this.near, x, y - 10 * s, 0.9 * s, 0.9 * s, 0xff8a2a, 0.7),
      flame,
      phase: rng() * 10,
    })
  }

  /** a paraglider: the wing in two colours, the lines, somebody sat under it */
  private glider(x: number, y: number, s: number, a: number, b: number, rng: Rng) {
    const node = new Container()
    const g = new Graphics()
    const w = 92
    g.moveTo(-w, 10)
      .bezierCurveTo(-w * 0.6, -34, w * 0.6, -34, w, 10)
      .bezierCurveTo(w * 0.55, -12, -w * 0.55, -12, -w, 10)
      .fill(a)
    g.moveTo(-w * 0.5, -14)
      .bezierCurveTo(-w * 0.2, -26, w * 0.2, -26, w * 0.5, -14)
      .bezierCurveTo(w * 0.2, -16, -w * 0.2, -16, -w * 0.5, -14)
      .fill(b)
    for (const lx of [-w + 6, -w * 0.5, 0, w * 0.5, w - 6])
      g.moveTo(lx, lx === 0 ? -8 : Math.abs(lx) > w * 0.7 ? 8 : -6)
        .lineTo(0, 92)
        .stroke({ color: DARK, width: 1, alpha: 0.7 })
    g.roundRect(-7, 90, 14, 20, 5).fill(DARK)
    g.circle(0, 86, 6).fill(DARK)
    g.rect(-3, 108, 14, 4).fill(DARK)
    node.addChild(g)
    node.scale.set(s)
    node.position.set(x, y)
    this.addChild(node)
    this.gliders.push({
      node,
      x,
      y,
      phase: rng() * 10,
      drift: range(rng, 0.12, 0.26) * (chance(rng, 0.5) ? 1 : -1),
    })
  }

  /** coming in low over the city, the way they all do here */
  private aeroplane() {
    const g = new Graphics()
    g.roundRect(-34, -4, 68, 8, 4).fill(0x4a5068)
    g.poly([-34, -2, -44, -16, -36, -16, -24, -2]).fill(0x4a5068)
    g.poly([-6, 2, 8, 2, -10, 16, -16, 16]).fill(0x3a4058)
    for (let wx = -20; wx < 26; wx += 5)
      g.rect(wx, -2, 2.5, 2).fill({ color: 0xfff0d0, alpha: 0.8 })
    this.plane.addChild(g)
    add(this.plane, 30, 2, 0.5, 0.14, 0xfff0d0, 0.6)
    return add(this.plane, -40, -16, 0.16, 0.16, 0xff2a1a, 1)
  }

  private blinker(x: number, y: number) {
    this.blinkers.push(add(this.far, x, y, 0.13, 0.13, 0xff2a1a, 1))
  }

  update(time: number, dt: number, px: number, reducedMotion: boolean) {
    this.far.x += (-px * 6 - this.far.x) * 0.05
    this.near.x += (-px * 12 - this.near.x) * 0.05
    this.blinkers.forEach((b, i) => (b.alpha = Math.sin(time * 2 + i * 1.3) > 0.4 ? 1 : 0.1))
    this.strobe.alpha = Math.sin(time * 6) > 0.7 ? 1 : 0.1

    // one flight every minute or so, in from the east and down toward the field
    this.planeT += dt / (reducedMotion ? 160 : 55)
    if (this.planeT > 1.5) this.planeT = 0
    const t = this.planeT
    this.plane.visible = t < 1
    this.plane.position.set(1500 - t * 2200, 60 + t * 330)
    this.plane.rotation = -0.06
    this.plane.scale.set(-1, 1)

    if (reducedMotion) return
    this.glitter.alpha = 0.8 + Math.sin(time * 1.7) * 0.2
    this.foam.forEach((f, i) => {
      const w = Math.sin(time * 0.6 - i * 0.9)
      f.y = w * (4 + i * 2)
      f.alpha = 0.7 + w * 0.3
    })
    this.sets.forEach((s, i) => {
      // each line of swell walks in, fades as it reaches the sand, starts again
      const k = (time * 0.05 + i * 0.25) % 1
      s.y = k * 40
      s.x = -k * 16
      s.alpha = Math.sin(k * Math.PI)
    })
    for (const g of this.gliders) {
      // big slow figures of eight along the cliff
      g.node.x = g.x + Math.sin(time * g.drift + g.phase) * 110
      g.node.y = g.y + Math.sin(time * g.drift * 2 + g.phase) * 26
      g.node.rotation = Math.cos(time * g.drift + g.phase) * 0.14
    }
    for (const f of this.fires) {
      const k = Math.sin(time * 11 + f.phase) * 0.5 + Math.sin(time * 17 + f.phase * 2) * 0.5
      f.glow.alpha = 0.6 + k * 0.15
      f.flame.scale.y = Math.abs(f.flame.scale.x) * (1 + k * 0.18)
      f.flame.skew.x = k * 0.12
    }
  }
}
