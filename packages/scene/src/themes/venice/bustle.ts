import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { SIGN_FONT } from '../../fonts'
import { glow } from '../../layers/neon'
import { HAIR, SKIN_TONES } from '../../layers/people'
import { CURB, GROUND, WORLD } from '../../layout'
import { palette } from '../../palette'
import { createRng, pick, range, type Rng } from '../../rng'
import { glowTexture } from '../../textures'

// Everything that makes the canal busy: the water bus, water taxis, the
// floating greengrocer, the stop with its queue, the Rialto-style bridge
// crowded with people, the bacaro crowd, lights strung along the water.

const INK = palette.ink

/** something that slides along the canal and draws its own reflection */
abstract class Boat extends Container {
  protected body = new Container()
  protected mirror = new Container()
  private x0: number

  constructor(
    private waterline: number,
    private speed: number,
    start: number,
    scale: number,
  ) {
    super()
    this.x0 = start
    this.scale.set(scale)
    const dir = Math.sign(speed) || 1
    this.body.scale.x = dir
    this.mirror.scale.set(dir, -0.5)
    this.mirror.alpha = 0.22
    this.addChild(this.mirror, this.body)
  }

  /** draw the boat facing right with the waterline at y=0 */
  protected build() {
    this.body.addChild(this.draw(new Graphics()))
    this.mirror.addChild(this.draw(new Graphics()))
  }

  protected abstract draw(g: Graphics): Container

  update(dt: number, time: number) {
    this.x0 += this.speed * dt
    const reach = (WORLD.width + 1200) / this.scale.x
    if (this.speed > 0 && this.x0 > reach) this.x0 = -1200
    if (this.speed < 0 && this.x0 < -1200) this.x0 = reach
    const line = this.waterline / this.scale.y
    const bob = Math.sin(time * 1.1 + this.x0 * 0.001) * 2
    this.body.position.set(this.x0, line + bob)
    this.mirror.position.set(this.x0, line + 6 - bob * 0.4)
  }
}

/** the water bus: white cabin full of lit windows and heads, route number on the front */
export class Vaporetto extends Boat {
  private rng: Rng
  constructor(
    waterline: number,
    opts: { speed?: number; start?: number; scale?: number; seed?: number } = {},
  ) {
    super(waterline, opts.speed ?? -26, opts.start ?? 1800, opts.scale ?? 0.8)
    this.rng = createRng(opts.seed ?? 7)
    this.build()
  }

  protected draw(g: Graphics) {
    const rng = createRng(this.rng() * 1e9)
    // dark hull with the rubber fender
    g.moveTo(-330, -40)
      .lineTo(300, -40)
      .quadraticCurveTo(350, -40, 352, -10)
      .lineTo(330, 6)
      .lineTo(-320, 6)
      .quadraticCurveTo(-338, -10, -330, -40)
      .closePath()
      .fill(0x1a1e24)
    g.rect(-332, -46, 684, 10).fill(0x2a2a2a)
    // cream cabin, rounded at the front
    g.moveTo(-300, -46)
      .lineTo(-300, -140)
      .lineTo(250, -140)
      .quadraticCurveTo(300, -140, 310, -100)
      .lineTo(320, -46)
      .closePath()
      .fill(0xe8e0cc)
    g.rect(-300, -150, 560, 12).fill(0xd8d0bc)
    // the yellow band
    g.rect(-300, -62, 616, 10).fill(0xe8b020)
    // a long row of lit windows with people in them
    for (let x = -284; x < 250; x += 46) {
      g.rect(x, -126, 38, 52).fill(0xffd890)
      for (let k = 0; k < 2; k++) {
        if (rng() < 0.75) {
          const hx = x + 10 + k * 18
          g.circle(hx, -96, 7).fill(pick(rng, [0x2a1a14, 0x3a2418, 0x1a1210]))
          g.rect(hx - 8, -88, 16, 14).fill(pick(rng, [0x5a2a3a, 0x2a3a5a, 0x3a3a3a, 0x8a3a1a]))
        }
      }
      g.rect(x, -126, 38, 52).stroke({ color: INK, width: 2 })
    }
    g.moveTo(262, -126)
      .lineTo(296, -126)
      .lineTo(306, -80)
      .lineTo(262, -80)
      .closePath()
      .fill(0x9ab0c0)
      .stroke({ color: INK, width: 2 })
    // route number and the company on the side
    g.rect(150, -186, 64, 36).fill(0x1a1e24)
    const n = new Text({
      text: '1',
      style: { fontFamily: SIGN_FONT, fontSize: 28, fill: 0xffd030 },
      resolution: 2,
    })
    n.anchor.set(0.5)
    n.position.set(182, -168)
    const label = new Text({
      text: 'ACTV',
      style: { fontFamily: SIGN_FONT, fontSize: 18, fill: 0x2a3a6a, letterSpacing: 4 },
      resolution: 2,
    })
    label.anchor.set(0.5)
    label.position.set(-160, -30)
    const wrap = new Container()
    wrap.addChild(g, n, label)
    return wrap
  }
}

/** a varnished wooden water taxi, fast, with a white wake behind it */
export class WaterTaxi extends Boat {
  private wake = new Graphics()
  constructor(waterline: number, opts: { speed?: number; start?: number; scale?: number } = {}) {
    super(waterline, opts.speed ?? 150, opts.start ?? -600, opts.scale ?? 0.7)
    this.build()
    this.body.addChildAt(this.wake, 0)
  }

  protected draw(g: Graphics) {
    g.moveTo(-200, -30)
      .lineTo(170, -30)
      .quadraticCurveTo(230, -26, 240, -6)
      .lineTo(220, 4)
      .lineTo(-196, 4)
      .closePath()
      .fill(0x8a4a1e)
    for (let y = -24; y < 0; y += 7) g.rect(-196, y, 400, 1.5).fill({ color: 0x5a2a0e, alpha: 0.8 })
    // the cabin, white with round portholes
    g.moveTo(-120, -30)
      .lineTo(-120, -76)
      .lineTo(80, -76)
      .quadraticCurveTo(120, -74, 130, -30)
      .closePath()
      .fill(0xe8e0d0)
      .stroke({ color: INK, width: 2 })
    for (let x = -100; x < 90; x += 34)
      g.circle(x, -54, 9).fill(0xffd890).stroke({ color: INK, width: 2 })
    g.circle(-40, -54, 5).fill(0x2a1a14)
    g.rect(-196, -36, 50, 6).fill(0xd8c8a8)
    // the driver at the back
    g.circle(-160, -64, 8).fill(0x2a1a14)
    g.rect(-168, -56, 16, 22).fill(0xe8e0d0)
    return g
  }

  override update(dt: number, time: number) {
    super.update(dt, time)
    this.wake.clear()
    for (let i = 0; i < 5; i++) {
      const len = 60 + i * 50
      const off = Math.sin(time * 6 + i) * 3
      this.wake
        .moveTo(-200, -4 + off)
        .quadraticCurveTo(-200 - len / 2, 6 + i * 3, -200 - len, 4 + i * 6)
        .stroke({ color: 0xe8f0ff, width: 2, alpha: 0.5 - i * 0.08 })
    }
  }
}

/** the floating greengrocer: a barge piled with fruit under a striped awning */
export function fruitBarge(x: number, lights: Container) {
  const c = new Container()
  const g = new Graphics()
  const line = CURB + 30
  g.moveTo(x - 160, line - 30)
    .lineTo(x + 160, line - 30)
    .lineTo(x + 150, line + 6)
    .lineTo(x - 150, line + 6)
    .closePath()
    .fill(0x3a2a1e)
  g.rect(x - 160, line - 36, 320, 8).fill(0x6a4a2e)
  const rng = createRng(x)
  for (let i = 0; i < 9; i++) {
    const cx = x - 140 + i * 32
    g.rect(cx, line - 64, 28, 28)
      .fill(0x7a5a2a)
      .stroke({ color: INK, width: 1 })
    const fruit = pick(rng, [0xe0461f, 0xf0a030, 0x6a9a2a, 0xc0281a, 0xf0d040, 0x8a2a5a])
    for (let f = 0; f < 6; f++)
      g.circle(cx + 5 + (f % 3) * 9, line - 66 + Math.floor(f / 3) * 7, 4.5).fill(fruit)
  }
  // awning poles and the striped canopy
  for (const px of [x - 150, x + 150]) g.rect(px - 2, line - 160, 4, 124).fill(0x2a1a10)
  for (let i = 0; i < 10; i++)
    g.rect(x - 160 + i * 32, line - 170, 32, 24).fill(i % 2 ? 0xf2e2c0 : 0x2a6a4a)
  g.poly([x - 160, line - 146, x + 160, line - 146, x + 168, line - 136, x - 168, line - 136]).fill(
    0x2a6a4a,
  )
  // the grocer
  g.circle(x + 100, line - 110, 9).fill(0x2a1a14)
  g.rect(x + 90, line - 100, 20, 36).fill(0xe8dcc8)
  c.addChild(g)
  for (const bx of [x - 100, x, x + 100]) glow(lights, bx, line - 130, 0.4, 0.3, 0xffd890, 0.5)
  const bulbs = new Graphics()
  for (let i = 0; i < 6; i++) bulbs.circle(x - 140 + i * 56, line - 142, 3).fill(0xffe0a0)
  c.addChild(bulbs)
  return c
}

/** a vaporetto stop: a floating yellow-and-white pontoon, the name, a little queue */
export function vaporettoStop(x: number, lights: Container) {
  const c = new Container()
  const g = new Graphics()
  const line = CURB + 26
  g.rect(x - 130, line - 12, 260, 20).fill(0x3a3a40)
  g.rect(x - 120, line - 120, 240, 108)
    .fill(0xe8e0cc)
    .stroke({ color: INK, width: 2 })
  g.rect(x - 120, line - 128, 240, 14).fill(0xe8b020)
  g.rect(x - 120, line - 40, 240, 8).fill(0xe8b020)
  for (let wx = x - 104; wx < x + 100; wx += 52)
    g.rect(wx, line - 104, 40, 50)
      .fill(0xffd890)
      .stroke({ color: INK, width: 1.5 })
  // people waiting
  const rng = createRng(x + 1)
  for (let i = 0; i < 4; i++) {
    const px = x - 90 + i * 52 + range(rng, -6, 6)
    g.circle(px + 12, line - 80, 7).fill(pick(rng, SKIN_TONES))
    g.rect(px + 4, line - 72, 16, 18).fill(
      pick(rng, [0x5a2a3a, 0x2a3a5a, 0x3a3a3a, 0x8a3a1a, 0x2a5a4a]),
    )
  }
  const name = new Text({
    text: 'RIALTO',
    style: { fontFamily: SIGN_FONT, fontSize: 18, fill: 0x1a1e24, letterSpacing: 3 },
    resolution: 2,
  })
  name.anchor.set(0.5)
  name.position.set(x, line - 121)
  c.addChild(g, name)
  glow(lights, x, line - 80, 1.4, 0.7, 0xffd890, 0.45)
  return c
}

/** the big bridge: one steep white arch with a covered arcade along the top */
export function rialto(x: number, w: number, lights: Container) {
  const g = new Graphics()
  const crown = GROUND - 200
  // istrian stone, by lamplight
  const stone = 0x7a6a58
  const shadow = 0x4a3e32
  // the arch and its body, water showing through underneath
  g.moveTo(x, CURB + 30)
    .lineTo(x, GROUND - 30)
    .quadraticCurveTo(x + w / 2, crown - 70, x + w, GROUND - 30)
    .lineTo(x + w, CURB + 30)
    .lineTo(x + w - 60, CURB + 30)
    .quadraticCurveTo(x + w / 2, crown + 70, x + 60, CURB + 30)
    .closePath()
    .fill(stone)
  g.moveTo(x + 60, CURB + 30)
    .quadraticCurveTo(x + w / 2, crown + 70, x + w - 60, CURB + 30)
    .stroke({ color: shadow, width: 8 })
  // voussoirs round the arch
  for (let t = 0.05; t < 1; t += 0.06) {
    const px = (1 - t) * (1 - t) * (x + 60) + 2 * (1 - t) * t * (x + w / 2) + t * t * (x + w - 60)
    const py =
      (1 - t) * (1 - t) * (CURB + 30) + 2 * (1 - t) * t * (crown + 70) + t * t * (CURB + 30)
    g.rect(px - 1, py - 14, 2, 14).fill(shadow)
  }
  // balustrade along the top
  g.moveTo(x, GROUND - 60)
    .quadraticCurveTo(x + w / 2, crown - 120, x + w, GROUND - 60)
    .stroke({ color: 0x9a8a74, width: 6 })
  // the arcade on top: arched openings, shops either side, a pitched roof
  const ax = x + w / 2
  const top = crown - 110
  g.rect(ax - 120, top - 70, 240, 70)
    .fill(stone)
    .stroke({ color: INK, width: 1.5, alpha: 0.6 })
  g.poly([ax - 134, top - 70, ax, top - 120, ax + 134, top - 70])
    .fill(0x7a2a1a)
    .stroke({ color: INK, width: 1.5, alpha: 0.6 })
  for (const dx of [-80, 0, 80]) {
    g.moveTo(ax + dx - 22, top)
      .lineTo(ax + dx - 22, top - 40)
      .arc(ax + dx, top - 40, 22, Math.PI, 0)
      .lineTo(ax + dx + 22, top)
      .closePath()
      .fill(dx === 0 ? 0x1a1210 : 0xffc870)
  }
  glow(lights, ax - 80, top - 30, 0.5, 0.5, 0xffc870, 0.5)
  glow(lights, ax + 80, top - 30, 0.5, 0.5, 0xffc870, 0.5)
  // little shop roofs stepping down each side
  for (const side of [-1, 1]) {
    for (let k = 1; k <= 3; k++) {
      const sx = ax + side * (120 + k * 46)
      const t = 0.5 + (side * (k * 46 + 120)) / w
      const sy =
        (1 - t) * (1 - t) * (GROUND - 60) + 2 * (1 - t) * t * (crown - 120) + t * t * (GROUND - 60)
      g.rect(sx - 22, sy - 44, 44, 44)
        .fill(stone)
        .stroke({ color: INK, width: 1, alpha: 0.5 })
      g.rect(sx - 14, sy - 34, 28, 24).fill(0xffc870)
      g.poly([sx - 26, sy - 44, sx, sy - 60, sx + 26, sy - 44]).fill(0x7a2a1a)
      glow(lights, sx, sy - 22, 0.3, 0.3, 0xffc870, 0.4)
    }
  }
  // people on the steps
  const rng = createRng(x)
  for (let i = 0; i < 12; i++) {
    const t = 0.08 + (i / 12) * 0.84
    if (Math.abs(t - 0.5) < 0.12) continue
    const px = x + w * t
    const py =
      (1 - t) * (1 - t) * (GROUND - 60) + 2 * (1 - t) * t * (crown - 120) + t * t * (GROUND - 60)
    figure(g, rng, px, py - 2, 0.32)
  }
  return g
}

/** a little standing person, flat, for crowds */
export function figure(
  g: Graphics,
  rng: Rng,
  x: number,
  base: number,
  scale: number,
  drink = false,
) {
  const s = scale
  const coat = pick(
    rng,
    [0x5a1420, 0x1a2a3a, 0x3a3a3a, 0x8a3a1a, 0x2a5a4a, 0xb8a080, 0x6a2a5a, 0x1a1a24],
  )
  g.rect(x - 8 * s, base - 110 * s, 6 * s, 110 * s)
    .rect(x + 2 * s, base - 110 * s, 6 * s, 110 * s)
    .fill(pick(rng, [0x1a1210, 0x2a2a30, 0x3a2a22]))
  g.poly([
    x - 16 * s,
    base - 210 * s,
    x + 16 * s,
    base - 210 * s,
    x + 18 * s,
    base - 100 * s,
    x - 18 * s,
    base - 100 * s,
  ]).fill(coat)
  g.circle(x, base - 228 * s, 14 * s).fill(pick(rng, SKIN_TONES))
  g.ellipse(x, base - 238 * s, 14 * s, 8 * s).fill(pick(rng, HAIR))
  if (drink) {
    // a spritz, glowing orange
    g.rect(x + 14 * s, base - 170 * s, 8 * s, 20 * s).fill(0xff7a1a)
    g.rect(x + 12 * s, base - 172 * s, 12 * s, 3 * s).fill(0xffd890)
  }
}

/** the crowd outside the bacaro, glasses in hand */
export function bacaroCrowd(x0: number, x1: number, lights: Container) {
  const g = new Graphics()
  const rng = createRng(x0 * 3)
  for (let x = x0; x < x1; x += range(rng, 30, 46)) {
    const base = range(rng, GROUND + 30, GROUND + 46)
    figure(g, rng, x, base, range(rng, 0.42, 0.48), rng() < 0.7)
  }
  // a couple of tall tables, wine and spritz on them
  for (const tx of [x0 + 40, x1 - 50]) {
    g.rect(tx - 2, GROUND - 24, 4, 60).fill(0x2a1a10)
    g.ellipse(tx, GROUND - 24, 22, 5).fill(0x3a2418)
    g.rect(tx - 10, GROUND - 34, 4, 10)
      .rect(tx + 6, GROUND - 34, 4, 10)
      .fill(0xff7a1a)
  }
  glow(lights, (x0 + x1) / 2, GROUND, ((x1 - x0) * 2) / 256, 0.6, 0xff9a3a, 0.25)
  return g
}

/** strings of bulbs swagged from post to post along the fondamenta */
export function festoons(xs: number[], y: number, lights: Container) {
  const c = new Container()
  const g = new Graphics()
  const lit = new Container()
  for (const x of xs) {
    g.rect(x - 3, y, 6, CURB - 6 - y).fill(0x1e1a18)
    g.circle(x, y, 6).fill(0x1e1a18)
  }
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i]!
    const b = xs[i + 1]!
    const pts: number[] = []
    for (let k = 0; k <= 20; k++) {
      const t = k / 20
      const px = a + (b - a) * t
      const py = y + Math.sin(t * Math.PI) * 40
      pts.push(px, py)
      if (k % 2 === 1) {
        g.circle(px, py + 5, 4).fill(0xffe0a0)
        const s = new Sprite(glowTexture())
        s.anchor.set(0.5)
        s.position.set(px, py + 5)
        s.scale.set(0.18)
        s.tint = [0xffc870, 0xff9a5a, 0xffe0a0][k % 3]!
        s.blendMode = 'add'
        lit.addChild(s)
      }
    }
    g.poly(pts, false).stroke({ color: INK, width: 1.5 })
  }
  c.addChild(g)
  lights.addChild(lit)
  return { node: c, update: (t: number) => (lit.alpha = 0.85 + Math.sin(t * 1.3) * 0.1) }
}

/** the winged lion of St Mark, red and gold, hanging off a pole */
export function lionFlag(x: number, y: number) {
  const g = new Graphics()
  g.rect(x, y - 6, 120, 5).fill(0x2a1a10)
  const flag = new Graphics()
  flag.poly([0, 0, 70, 0, 70, 90, 50, 110, 35, 90, 20, 110, 0, 90]).fill(0xa8201a)
  flag.circle(35, 40, 18).fill(0xd9a54a)
  flag.poly([20, 40, 10, 22, 30, 32]).poly([50, 40, 60, 22, 40, 32]).fill(0xd9a54a)
  flag.rect(15, 60, 40, 6).fill(0xd9a54a)
  flag.position.set(x + 40, y)
  const c = new Container()
  c.addChild(g, flag)
  return { node: c, update: (t: number) => (flag.skew.y = Math.sin(t * 1.6) * 0.05) }
}
