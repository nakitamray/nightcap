import { ColorMatrixFilter, Container, FillGradient, Graphics, Sprite } from 'pixi.js'
import type { Conditions, Phase, Weather } from '../conditions'
import { GROUND, WORLD } from '../layout'
import { createRng, range, type Rng } from '../rng'
import { dotTexture, glowTexture } from '../textures'

// Everything that changes the street when it isn't a clear-ish night: the sky
// for each part of the day, the sun, clouds, snow, fog and lightning, and one
// colour grade over the whole street that lifts the night-painted buildings
// into daylight. The sky is drawn already "un-graded" (see `before`), so after
// the grade it comes out exactly the poster colours written here.

type RGB = [number, number, number]

interface Look {
  /** per-channel gain and lift after a saturation step */
  gain: RGB
  lift: RGB
  saturation: number
  /** top, middle and horizon of the sky, as they should finally look */
  sky: [number, number, number]
  /** how much of the night shows through at the very top (stars at dusk) */
  skyTop: number
  sun: { colour: number; glow: number; size: number; low: boolean } | null
  /** lamps, lit windows' bloom and the pools of light under them */
  lights: number
  pools: number
}

const LOOKS: Record<Exclude<Phase, 'night'>, Look> = {
  dawn: {
    gain: [1.45, 1.28, 1.32],
    lift: [0.06, 0.03, 0.06],
    saturation: 0.95,
    sky: [0x4a5a9a, 0xe89aa8, 0xffd0a0],
    skyTop: 1,
    sun: { colour: 0xffe2b0, glow: 0xff9a6a, size: 0.9, low: true },
    lights: 0.65,
    pools: 0.6,
  },
  morning: {
    gain: [2.05, 2.15, 2.25],
    lift: [0.09, 0.11, 0.14],
    saturation: 0.85,
    sky: [0x5a9ad8, 0x9ccbe8, 0xe0eeea],
    skyTop: 1,
    sun: { colour: 0xfff4d8, glow: 0xffe8a0, size: 0.75, low: false },
    lights: 0.3,
    pools: 0.15,
  },
  midday: {
    gain: [2.4, 2.45, 2.45],
    lift: [0.13, 0.13, 0.14],
    saturation: 0.82,
    sky: [0x2f7ad8, 0x6ab0ea, 0xbfe2f2],
    skyTop: 1,
    sun: { colour: 0xfffbe8, glow: 0xfff0b0, size: 0.7, low: false },
    lights: 0.15,
    pools: 0,
  },
  afternoon: {
    gain: [2.2, 2.05, 1.8],
    lift: [0.13, 0.1, 0.06],
    saturation: 0.9,
    sky: [0x4a8ad0, 0x9cc0dc, 0xf2d8a0],
    skyTop: 1,
    sun: { colour: 0xfff0c0, glow: 0xffc860, size: 0.8, low: false },
    lights: 0.3,
    pools: 0.1,
  },
  dusk: {
    gain: [1.3, 1.08, 1.12],
    lift: [0.05, 0.02, 0.04],
    saturation: 1,
    sky: [0x3a2a62, 0xff6a3a, 0xffb050],
    skyTop: 0.35,
    sun: { colour: 0xffb050, glow: 0xff5a1e, size: 1.3, low: true },
    lights: 0.9,
    pools: 0.9,
  },
}

/** how heavy the weather is: sky washed toward `to`, grade dulled */
const DULL: Record<
  Weather,
  { to: number; amount: number; gain: number; sat: number; sun: number }
> = {
  clear: { to: 0, amount: 0, gain: 1, sat: 1, sun: 1 },
  cloudy: { to: 0x9aa4b0, amount: 0.45, gain: 0.92, sat: 0.8, sun: 0.5 },
  rain: { to: 0x7a8494, amount: 0.6, gain: 0.82, sat: 0.7, sun: 0 },
  storm: { to: 0x444c5c, amount: 0.75, gain: 0.66, sat: 0.6, sun: 0 },
  snow: { to: 0xc4cad4, amount: 0.55, gain: 0.95, sat: 0.6, sun: 0.2 },
  fog: { to: 0xb4b6b8, amount: 0.65, gain: 0.9, sat: 0.6, sun: 0.25 },
}

function css(c: number, alpha: number) {
  return `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${alpha})`
}

function rgb(c: number): RGB {
  return [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255]
}

function hex([r, g, b]: RGB) {
  const ch = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255)
  return (ch(r) << 16) | (ch(g) << 8) | ch(b)
}

export function mix(a: number, b: number, t: number) {
  const x = rgb(a)
  const y = rgb(b)
  return hex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t])
}

/** the 3x3 part of the grade: saturation, then per-channel gain */
function gradeMatrix(look: Look): number[] {
  const s = look.saturation
  const lr = 0.2126 * (1 - s)
  const lg = 0.7152 * (1 - s)
  const lb = 0.0722 * (1 - s)
  const sat = [lr + s, lg, lb, lr, lg + s, lb, lr, lg, lb + s]
  return sat.map((v, i) => v * look.gain[Math.floor(i / 3)]!)
}

function invert3(m: number[]): number[] {
  const [a, b, c, d, e, f, g, h, i] = m as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ]
  const A = e * i - f * h
  const B = -(d * i - f * g)
  const C = d * h - e * g
  const det = a * A + b * B + c * C
  return [
    A / det,
    -(b * i - c * h) / det,
    (b * f - c * e) / det,
    B / det,
    (a * i - c * g) / det,
    -(a * f - c * d) / det,
    C / det,
    -(a * h - b * g) / det,
    (a * e - b * d) / det,
  ]
}

/** the colour to paint so that after the grade it reads as `target` */
function before(target: number, inv: number[], lift: RGB) {
  const t = rgb(target)
  const v: RGB = [t[0] - lift[0], t[1] - lift[1], t[2] - lift[2]]
  return hex([
    inv[0]! * v[0] + inv[1]! * v[1] + inv[2]! * v[2],
    inv[3]! * v[0] + inv[4]! * v[1] + inv[5]! * v[2],
    inv[6]! * v[0] + inv[7]! * v[1] + inv[8]! * v[2],
  ])
}

/** works out the finished look for a phase and weather, or null for the plain night */
export function lookFor(c: Conditions): Look | null {
  if (c.phase === 'night') return null
  const base = LOOKS[c.phase]
  const w = DULL[c.weather ?? 'clear']
  return {
    ...base,
    gain: base.gain.map((g) => 1 + (g - 1) * w.gain) as RGB,
    saturation: base.saturation * w.sat,
    sky: base.sky.map((col) => mix(col, w.to, w.amount)) as Look['sky'],
    skyTop: c.weather && c.weather !== 'clear' ? 1 : base.skyTop,
    sun: base.sun && w.sun > 0 ? base.sun : null,
  }
}

/** the grade filter for a look, plus the colour converter for things drawn under it */
export function grading(look: Look) {
  const m = gradeMatrix(look)
  const inv = invert3(m)
  const filter = new ColorMatrixFilter()
  const [l0, l1, l2] = look.lift
  // prettier-ignore
  filter.matrix = [
    m[0]!, m[1]!, m[2]!, 0, l0,
    m[3]!, m[4]!, m[5]!, 0, l1,
    m[6]!, m[7]!, m[8]!, 0, l2,
    0, 0, 0, 1, 0,
  ]
  return { filter, paint: (target: number) => before(target, inv, look.lift) }
}

// sky ----------------------------------------------------------------------

const SKY_TOP = -1600

/**
 * The day sky: a gradient over the night one, a sun, and clouds drifting
 * across. Sits right above the city's own sky so the rooftops still cut it.
 */
export class DaySky extends Container {
  private clouds: { g: Graphics; speed: number }[] = []

  constructor(
    look: Look,
    paint: (c: number) => number,
    weather: Weather | undefined,
    sun: { x: number; y: number; r: number },
    seed: number,
  ) {
    super()
    const [top, mid, low] = look.sky
    // the colours change over the band of sky you actually see above the
    // roofs, not over the whole (mostly hidden) height of it. At dusk the top
    // of the sky is still the night, so the stars show through.
    const at = (y: number) => (y - SKY_TOP) / (GROUND - SKY_TOP)
    const gradient = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: css(paint(top), look.skyTop * 0.6) },
        { offset: at(-900), color: css(paint(top), look.skyTop) },
        { offset: at(-300), color: css(paint(top), 1) },
        { offset: at(40), color: css(paint(top), 1) },
        { offset: at(260), color: css(paint(mid), 1) },
        { offset: at(520), color: css(paint(low), 1) },
        { offset: 1, color: css(paint(low), 1) },
      ],
      textureSpace: 'local',
    })
    this.addChild(
      new Graphics().rect(-400, SKY_TOP, WORLD.width + 800, GROUND - SKY_TOP).fill(gradient),
    )

    if (look.sun) {
      const s = look.sun
      const r = sun.r * s.size
      // a low sun sits on the rooftops
      const y = s.low ? sun.y + sun.r * 2.4 : sun.y
      const halo = new Sprite(glowTexture())
      halo.anchor.set(0.5)
      halo.position.set(sun.x, y)
      halo.scale.set((r / 105) * (s.low ? 5.5 : 4))
      halo.tint = paint(s.glow)
      halo.alpha = s.low ? 0.75 : 0.55
      halo.blendMode = 'add'
      const disc = new Graphics().circle(sun.x, y, r).fill(paint(s.colour))
      // a few flat bands across a low sun, the way old travel posters do it
      if (s.low) {
        for (let i = 1; i <= 3; i++) {
          disc.rect(sun.x - r, y + r * (0.15 + i * 0.2), r * 2, r * 0.07).fill(paint(look.sky[2]))
        }
        disc.circle(sun.x, y, r).stroke({ color: paint(s.glow), width: 3, alpha: 0.6 })
      }
      this.addChild(halo, disc)
    }

    this.addClouds(createRng(seed), look, paint, weather)
  }

  private addClouds(rng: Rng, look: Look, paint: (c: number) => number, weather?: Weather) {
    const heavy =
      weather === 'cloudy' || weather === 'rain' || weather === 'storm' || weather === 'snow'
    const count = heavy ? 11 : weather === 'fog' ? 4 : 5
    // a low sun turns the clouds into dark shapes with burning edges
    const low = !!look.sun?.low
    const base = low
      ? mix(look.sky[0], 0x14142a, 0.3)
      : mix(look.sky[1], 0xffffff, weather === 'storm' ? 0.05 : heavy ? 0.35 : 0.7)
    const shadow = mix(
      base,
      weather === 'storm' || low ? 0x0e0e1c : look.sky[0],
      heavy ? 0.45 : 0.3,
    )
    const rim = low ? look.sun!.glow : 0xffffff
    for (let i = 0; i < count; i++) {
      const g = cloud(
        rng,
        heavy ? range(rng, 420, 820) : range(rng, 240, 480),
        paint(base),
        paint(shadow),
        paint(low ? rim : mix(base, rim, 0.5)),
      )
      g.x = range(rng, -500, WORLD.width + 200)
      g.y = range(rng, heavy ? -60 : -30, heavy ? 230 : 200)
      this.addChild(g)
      this.clouds.push({ g, speed: range(rng, 5, heavy ? 16 : 10) })
    }
  }

  update(dt: number) {
    for (const c of this.clouds) {
      c.g.x += c.speed * dt
      if (c.g.x > WORLD.width + 500) c.g.x = -900
    }
  }
}

/** a flat poster cloud: lumpy top, a flat bottom, a darker belly, a lit rim */
function cloud(rng: Rng, w: number, body: number, belly: number, rim: number) {
  const g = new Graphics()
  const h = w * 0.22
  const lumps: [number, number, number][] = []
  let x = h * 0.6
  while (x < w - h * 0.4) {
    const r = range(rng, h * 0.45, h * 0.95)
    lumps.push([x, h - r * 0.9, r])
    x += r * range(rng, 0.9, 1.4)
  }
  for (const [lx, ly, r] of lumps) g.circle(lx, ly, r)
  g.roundRect(0, h * 0.3, w, h * 0.7, h * 0.35)
  g.fill(body)
  // the belly
  g.roundRect(h * 0.2, h * 0.68, w - h * 0.4, h * 0.32, h * 0.16).fill(belly)
  // sunlit tops
  for (const [lx, ly, r] of lumps)
    g.arc(lx, ly, r * 0.92, Math.PI * 1.15, Math.PI * 1.75).stroke({
      color: rim,
      width: 3,
      alpha: 0.7,
    })
  return g
}

// night clouds ---------------------------------------------------------------

/** a heavier night sky: low dark clouds lit from below by the city */
export class NightClouds extends Container {
  private clouds: { g: Graphics; speed: number }[] = []

  constructor(seed: number, weather: Weather) {
    super()
    const rng = createRng(seed)
    const count = weather === 'storm' ? 12 : weather === 'fog' ? 4 : 9
    for (let i = 0; i < count; i++) {
      const g = cloud(rng, range(rng, 420, 800), 0x161a2e, 0x0c0f1e, 0x3a2a3a)
      g.alpha = weather === 'fog' ? 0.6 : 0.9
      g.x = range(rng, -500, WORLD.width + 200)
      g.y = range(rng, -40, 220)
      this.addChild(g)
      this.clouds.push({ g, speed: range(rng, 6, 18) })
    }
  }

  update(dt: number) {
    for (const c of this.clouds) {
      c.g.x += c.speed * dt
      if (c.g.x > WORLD.width + 500) c.g.x = -900
    }
  }
}

// snow -----------------------------------------------------------------------

interface Flake {
  s: Sprite
  speed: number
  sway: number
  phase: number
}

export class Snow extends Container {
  private flakes: Flake[] = []
  private rng: Rng
  private top = -900
  private time = 0

  constructor(seed: number, count: number) {
    super()
    this.rng = createRng(seed)
    for (let i = 0; i < count; i++) {
      const s = new Sprite(dotTexture())
      s.anchor.set(0.5)
      s.tint = 0xf4f6ff
      this.addChild(s)
      const f: Flake = { s, speed: 0, sway: 0, phase: 0 }
      this.reset(f, true)
      this.flakes.push(f)
    }
  }

  setTop(top: number) {
    this.top = Math.min(-200, top)
  }

  private reset(f: Flake, anywhere = false) {
    const rng = this.rng
    const near = rng()
    f.speed = range(rng, 40, 80) * (0.6 + near * 0.8)
    f.sway = range(rng, 10, 30)
    f.phase = rng() * 10
    f.s.scale.set(0.1 + near * 0.18)
    f.s.alpha = 0.55 + near * 0.45
    f.s.x = range(rng, -300, WORLD.width + 300)
    f.s.y = anywhere ? range(rng, this.top, WORLD.height) : this.top - range(rng, 0, 100)
  }

  update(dt: number) {
    this.time += dt
    for (const f of this.flakes) {
      f.s.y += f.speed * dt
      f.s.x += Math.sin(this.time * 0.8 + f.phase) * f.sway * dt
      if (f.s.y > WORLD.height + 20) this.reset(f)
    }
  }
}

// fog ------------------------------------------------------------------------

/** soft bands of haze, thickest low down, drifting slowly */
export class Fog extends Container {
  private bands: { g: Graphics; speed: number }[] = []

  constructor(seed: number, colour: number, night: boolean) {
    super()
    const rng = createRng(seed)
    const rows = [GROUND - 520, GROUND - 360, GROUND - 200, GROUND - 60, GROUND + 80]
    rows.forEach((y, i) => {
      const h = range(rng, 140, 220)
      const fade = new FillGradient({
        type: 'linear',
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
        colorStops: [
          { offset: 0, color: 'rgba(255,255,255,0)' },
          { offset: 0.5, color: 'rgba(255,255,255,1)' },
          { offset: 1, color: 'rgba(255,255,255,0)' },
        ],
        textureSpace: 'local',
      })
      const g = new Graphics().rect(-600, y - h / 2, WORLD.width + 1200, h).fill(fade)
      g.tint = colour
      g.alpha = (night ? 0.28 : 0.4) + i * 0.06
      this.addChild(g)
      this.bands.push({ g, speed: range(rng, 3, 9) * (i % 2 ? 1 : -1) })
    })
  }

  update(dt: number) {
    for (const b of this.bands) {
      b.g.x += b.speed * dt
      if (Math.abs(b.g.x) > 400) b.speed = -b.speed
    }
  }
}

// lightning --------------------------------------------------------------------

/** every so often the sky goes white and a bolt cracks down behind the roofs */
export class Lightning extends Container {
  private flash = new Graphics()
  private bolt = new Graphics()
  private rng: Rng
  private wait: number
  private age = 99

  constructor(seed: number) {
    super()
    this.rng = createRng(seed)
    this.wait = range(this.rng, 2, 6)
    this.flash.rect(-600, -1800, WORLD.width + 1200, WORLD.height + 2000).fill(0xdfe6ff)
    this.flash.blendMode = 'add'
    this.flash.alpha = 0
    this.bolt.alpha = 0
    this.addChild(this.bolt, this.flash)
  }

  /** the bolt sits in the sky, behind the buildings */
  get sky() {
    return this.bolt
  }

  private strike() {
    const rng = this.rng
    const b = this.bolt.clear()
    let x = range(rng, 200, WORLD.width - 200)
    let y = -100
    const pts = [x, y]
    while (y < GROUND - 450) {
      x += range(rng, -60, 60)
      y += range(rng, 50, 110)
      pts.push(x, y)
    }
    b.poly(pts, false).stroke({ color: 0xf4f0ff, width: 6, join: 'miter' })
    b.poly(pts, false).stroke({ color: 0xffffff, width: 2 })
  }

  update(dt: number) {
    this.wait -= dt
    if (this.wait <= 0) {
      this.strike()
      this.age = 0
      this.wait = range(this.rng, 3, 9)
    }
    this.age += dt
    // two quick flickers, then fade
    const a =
      this.age < 0.08
        ? 0.5
        : this.age < 0.14
          ? 0.1
          : this.age < 0.22
            ? 0.35
            : Math.max(0, 0.35 - (this.age - 0.22) * 1.2)
    this.flash.alpha = a * 0.6
    this.bolt.alpha = this.age < 0.5 ? 1 - this.age * 2 : 0
  }
}
