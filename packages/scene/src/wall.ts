import { AdvancedBloomFilter } from 'pixi-filters'
import { Application, Container, FillGradient, Graphics, Sprite } from 'pixi.js'
import { PaperFilter } from './filters/PaperFilter'
import { createRng, int, pick, range, type Rng } from './rng'
import { glowTexture } from './textures'

// The backdrop for the sign-in pages: a wall of other people's windows at
// night, each with a little life going on inside. Lights click on and off,
// people sway, a cat's tail goes. Drawn in screen pixels and rebuilt on
// resize -- there's no world to scale here, just a wall.

const INK = 0x07080d

type Shape = 'rect' | 'arch' | 'segment' | 'gothic' | 'round' | 'twin' | 'tall'
type Bars = 'none' | 'cross' | 'transom' | 'grid' | 'sash' | 'lattice' | 'vertical' | 'fan'
type Balcony = 'none' | 'iron' | 'railing' | 'balustrade' | 'box' | 'plants'
type Shade = 'none' | 'shutters' | 'blind' | 'cafe'
type Life =
  | 'sax'
  | 'dinner'
  | 'reader'
  | 'sill'
  | 'desk'
  | 'dance'
  | 'cat'
  | 'party'
  | 'plants'
  | 'books'
  | 'kiss'
  | 'tv'
  | 'cook'
  | 'piano'
  | 'painter'
  | 'phone'
  | 'guitar'

const SHAPES: Shape[] = ['rect', 'arch', 'segment', 'gothic', 'round', 'twin', 'tall']
const BARS: Bars[] = ['none', 'cross', 'transom', 'grid', 'sash', 'lattice', 'vertical', 'fan']
const BALCONIES: Balcony[] = ['none', 'iron', 'railing', 'balustrade', 'box', 'plants']
const SHADES: Shade[] = ['none', 'shutters', 'blind', 'cafe']
const LIVES: Life[] = [
  'sax',
  'dinner',
  'reader',
  'sill',
  'desk',
  'dance',
  'cat',
  'party',
  'plants',
  'books',
  'kiss',
  'tv',
  'cook',
  'piano',
  'painter',
  'phone',
  'guitar',
]

// mostly lamplight -- amber, honey, apricot, candle -- with the odd room lit
// some other colour: a tv, a rose shade, a green glass lamp.
const LIGHTS: { weight: number; stops: [number, number, number] }[] = [
  { weight: 4, stops: [0xd8582a, 0xf5823a, 0xffad5c] },
  { weight: 4, stops: [0xc8862a, 0xf0b048, 0xffda8a] },
  { weight: 3, stops: [0xb8582a, 0xe88a50, 0xf8c09a] },
  { weight: 3, stops: [0xd89a3a, 0xf8c868, 0xfff0c0] },
  { weight: 2, stops: [0x9a2a1a, 0xd04a28, 0xf08a4a] },
  { weight: 1, stops: [0x1a2a6a, 0x3a5ab0, 0x8aa8e8] },
  { weight: 1, stops: [0x8a2a4a, 0xc86a7a, 0xf0b0b0] },
  { weight: 1, stops: [0x2a4a2a, 0x5a8a50, 0xb8d890] },
  { weight: 1, stops: [0x4a2a5a, 0x8a5a9a, 0xd0b0d8] },
]

function pickLight(rng: Rng) {
  const total = LIGHTS.reduce((n, l) => n + l.weight, 0)
  let r = rng() * total
  for (const l of LIGHTS) {
    r -= l.weight
    if (r < 0) return l.stops
  }
  return LIGHTS[0]!.stops
}

const FRAMES = [0x2a1810, 0x3a2416, 0x1c2840, 0x6e5e4a, 0x4a1612, 0x1d3324, 0x3a2a3e, 0x5a4a38]

interface Design {
  shape: Shape
  bars: Bars
  balcony: Balcony
  shade: Shade
  life: Life
}

/**
 * Hands out window designs so no two on the wall are the same: every
 * combination of shape, glazing, balcony, blind and what's going on inside
 * is used at most once. Neighbours also get a different shape and scene from
 * the window before.
 */
class Designer {
  private used = new Set<string>()
  private last: Design | null = null

  constructor(private rng: Rng) {}

  next(): Design {
    for (let tries = 0; tries < 400; tries++) {
      const d: Design = {
        shape: pick(this.rng, SHAPES),
        bars: pick(this.rng, BARS),
        balcony: pick(this.rng, BALCONIES),
        shade: pick(this.rng, SHADES),
        life: pick(this.rng, LIVES),
      }
      // an oculus is too small for a balcony or shutters
      if (d.shape === 'round') {
        d.balcony = 'none'
        d.shade = 'none'
      }
      const key = `${d.shape}|${d.bars}|${d.balcony}|${d.shade}|${d.life}`
      if (this.used.has(key)) continue
      if (this.last && (this.last.shape === d.shape || this.last.life === d.life)) continue
      this.used.add(key)
      this.last = d
      return d
    }
    throw new Error('ran out of window designs')
  }
}

interface Pane {
  root: Container
  interior: Container
  halo: Sprite
  light: number
  target: number
  animate: (t: number) => void
}

export class WindowWall {
  private wall = new Container()
  private lights = new Container()
  private panes: Pane[] = []
  private paper = new PaperFilter()
  private rng: Rng
  private time = 0
  private nextFlip = 2
  private destroyed = false

  private constructor(
    private app: Application,
    private seed: number,
    private reducedMotion: boolean,
  ) {
    this.rng = createRng(seed)
  }

  static async create(host: HTMLElement, opts: { seed?: number; reducedMotion?: boolean } = {}) {
    const app = new Application()
    await app.init({
      resizeTo: host,
      preference: 'webgl',
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      background: 0x050304,
    })
    const wall = new WindowWall(app, opts.seed ?? 1971, opts.reducedMotion ?? false)
    wall.build()
    host.appendChild(app.canvas)
    return wall
  }

  private build() {
    const { app } = this
    app.stage.addChild(this.wall, this.lights)
    const bloom = new AdvancedBloomFilter({
      threshold: 0.55,
      bloomScale: 0.6,
      brightness: 1,
      blur: 6,
      quality: 4,
    })
    this.lights.filters = [bloom]
    app.stage.filters = [this.paper]
    app.stage.filterArea = app.screen

    this.layout(app.screen.width, app.screen.height)
    app.renderer.on('resize', (w: number, h: number) => this.layout(w, h))
    app.ticker.add((t) => this.tick(Math.min(t.deltaMS, 50) / 1000))
  }

  /** columns of windows of different sizes, staggered so it doesn't look like a grid */
  private layout(width: number, height: number) {
    this.wall.removeChildren().forEach((c) => c.destroy({ children: true }))
    this.lights.removeChildren().forEach((c) => c.destroy())
    this.panes = []
    this.paper.setScreen(width, height)

    const rng = createRng(this.seed)
    const designer = new Designer(rng)
    // lots of small windows: a whole city's worth of other people's evenings
    const colW = width < 700 ? 92 : 118
    const cols = Math.ceil(width / colW) + 1
    const offset = (width - cols * colW) / 2
    for (let c = 0; c < cols; c++) {
      let y = range(rng, -120, -10)
      while (y < height + 20) {
        const design = designer.next()
        let w = range(rng, colW * 0.6, colW * 0.84)
        let h = range(rng, w * 1.05, w * 1.75)
        if (design.shape === 'round') h = w = range(rng, colW * 0.5, colW * 0.66)
        if (design.shape === 'tall') {
          w *= 0.78
          h = w * range(rng, 1.9, 2.3)
        }
        const x = offset + c * colW + (colW - w) / 2 + range(rng, -10, 10)
        this.addPane(rng, design, x, y, w, h)
        y += h + range(rng, 26, 50) + (design.balcony === 'none' ? 0 : 10)
      }
    }
  }

  private addPane(rng: Rng, d: Design, x: number, y: number, w: number, h: number) {
    const frame = pick(rng, FRAMES)
    const light = pickLight(rng)
    const root = new Container()
    root.position.set(x, y)

    const glass = (g: Graphics, pad = 0) => outline(g, d.shape, w, h, pad)

    // shutters sit behind the frame, folded back against the wall
    const f = new Graphics()
    if (d.shade === 'shutters') {
      const sw = w * 0.36
      const tint = pick(rng, [0x1d3324, 0x3a1a14, 0x1c2840, 0x5a4a38])
      for (const sx of [-8 - sw, w + 8]) {
        f.rect(sx, -4, sw, h + 8).fill(tint)
        for (let ly = 2; ly < h; ly += 6)
          f.rect(sx + 3, ly, sw - 6, 2).fill({ color: INK, alpha: 0.4 })
      }
    }
    glass(f, 8).fill(frame)
    root.addChild(f)

    // the room
    const interior = new Container()
    const wall = new Graphics()
    glass(wall).fill(
      new FillGradient({
        type: 'linear',
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
        colorStops: light.map((color, i) => ({ offset: i / 2, color })),
        textureSpace: 'local',
      }),
    )
    const hot = new Sprite(glowTexture())
    hot.anchor.set(0.5)
    hot.position.set(range(rng, w * 0.25, w * 0.75), h * range(rng, 0.15, 0.35))
    hot.scale.set((w * 1.4) / 256)
    hot.tint = 0xfff0d0
    hot.alpha = 0.5
    hot.blendMode = 'add'
    const { node, animate } = scene(d.life, w, h, rng)
    const mask = new Graphics()
    glass(mask).fill(0xffffff)
    interior.addChild(wall, hot, node)
    if (d.shade === 'blind') {
      // roller blind pulled part way down
      const drop = h * range(rng, 0.2, 0.45)
      interior.addChild(
        new Graphics()
          .rect(0, 0, w, drop)
          .fill({ color: 0xf0dcb0, alpha: 0.82 })
          .rect(0, drop - 3, w, 3)
          .fill(0x8a6a4a),
      )
    } else if (d.shade === 'cafe') {
      // café curtain on a rod across the bottom half
      const top = h * 0.58
      const c = new Graphics()
        .rect(0, top, w, h - top)
        .fill({ color: pick(rng, [0xf0e6d0, 0xd88a8a, 0xe8d090]), alpha: 0.78 })
      for (let fx = 4; fx < w; fx += 7)
        c.rect(fx, top, 2, h - top).fill({ color: INK, alpha: 0.08 })
      c.rect(-2, top - 2, w + 4, 3).fill(0x5a3a1a)
      interior.addChild(c)
    }
    interior.addChild(mask)
    interior.mask = mask
    root.addChild(interior)

    // glazing bars are clipped to the glass; lattice and fan bars run long
    const bars = new Graphics()
    glazing(bars, d, w, h, frame)
    const clip = new Graphics()
    glass(clip).fill(0xffffff)
    bars.mask = clip
    const edge = new Graphics()
    glass(edge).stroke({ color: frame, width: 4 })
    balcony(edge, d.balcony, w, h, rng)
    root.addChild(bars, clip, edge)

    const halo = new Sprite(glowTexture())
    halo.anchor.set(0.5)
    halo.position.set(x + w / 2, y + h / 2)
    halo.scale.set((w * 2.6) / 256, (h * 2) / 256)
    halo.tint = light[1]
    halo.blendMode = 'add'
    this.lights.addChild(halo)
    this.wall.addChild(root)

    const on = rng() < 0.82
    const pane: Pane = { root, interior, halo, light: on ? 1 : 0, target: on ? 1 : 0, animate }
    this.apply(pane)
    this.panes.push(pane)
  }

  private apply(p: Pane) {
    // dark rooms still show a little: the street light, a tv, whatever
    p.interior.alpha = 0.12 + p.light * 0.88
    p.halo.alpha = p.light * 0.32
  }

  private tick(dt: number) {
    if (this.destroyed) return
    this.time += dt
    this.paper.time = this.time

    // every few seconds someone gets home or goes to bed
    if (!this.reducedMotion && this.time > this.nextFlip && this.panes.length) {
      const p = this.panes[int(this.rng, 0, this.panes.length - 1)]!
      p.target = p.target ? 0 : 1
      this.nextFlip = this.time + range(this.rng, 1.2, 3.5)
    }
    for (const p of this.panes) {
      if (p.light !== p.target) {
        // switching on flickers, switching off just fades
        const step = p.target ? dt * 4 : dt * 1.6
        p.light = p.target ? Math.min(1, p.light + step) : Math.max(0, p.light - step)
        const flicker = p.target && p.light < 0.6 && Math.sin(this.time * 60) > 0.3 ? 0.4 : 1
        p.interior.alpha = (0.12 + p.light * 0.88) * flicker
        p.halo.alpha = p.light * 0.32 * flicker
      }
      if (!this.reducedMotion) p.animate(this.time)
    }
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.app.destroy({ removeView: true }, { children: true })
  }
}

// ---- the window itself ---------------------------------------------------------

/** the outline of the glass, grown by `pad` for the frame around it */
function outline(g: Graphics, shape: Shape, w: number, h: number, pad: number) {
  const x0 = -pad
  const x1 = w + pad
  const y1 = h + pad
  switch (shape) {
    case 'arch': {
      const r = w / 2 + pad
      return g
        .moveTo(x0, y1)
        .lineTo(x0, w / 2)
        .arc(w / 2, w / 2, r, Math.PI, 0)
        .lineTo(x1, y1)
        .closePath()
    }
    case 'segment': {
      const rise = w * 0.2
      return g
        .moveTo(x0, y1)
        .lineTo(x0, rise)
        .quadraticCurveTo(w / 2, -rise - pad * 1.5, x1, rise)
        .lineTo(x1, y1)
        .closePath()
    }
    case 'gothic': {
      const a = w * 0.7
      return g
        .moveTo(x0, y1)
        .lineTo(x0, a)
        .bezierCurveTo(x0, a * 0.4, w * 0.3, a * 0.1 - pad, w / 2, -pad)
        .bezierCurveTo(w * 0.7, a * 0.1 - pad, x1, a * 0.4, x1, a)
        .lineTo(x1, y1)
        .closePath()
    }
    case 'round':
      return g.ellipse(w / 2, h / 2, w / 2 + pad, h / 2 + pad)
    default:
      return g.rect(x0, -pad, w + pad * 2, h + pad * 2)
  }
}

function glazing(g: Graphics, d: Design, w: number, h: number, colour: number) {
  const bar = (x: number, y: number, bw: number, bh: number) => g.rect(x, y, bw, bh)
  if (d.shape === 'twin') bar(w / 2 - 3, 0, 6, h)
  switch (d.bars) {
    case 'cross':
      bar(w / 2 - 1.5, 0, 3, h)
      bar(0, h * 0.45, w, 3)
      break
    case 'transom':
      bar(0, h * 0.24, w, 4)
      bar(w / 2 - 1.5, h * 0.24, 3, h * 0.76)
      break
    case 'grid':
      for (let i = 1; i < 3; i++) bar((w * i) / 3 - 1, 0, 2, h)
      for (let i = 1; i < 4; i++) bar(0, (h * i) / 4 - 1, w, 2)
      break
    case 'sash':
      // six over six
      bar(0, h * 0.5 - 2.5, w, 5)
      for (let i = 1; i < 3; i++) bar((w * i) / 3 - 1, 0, 2, h)
      bar(0, h * 0.25 - 1, w, 2)
      bar(0, h * 0.75 - 1, w, 2)
      break
    case 'lattice':
      for (let t = -h; t < w + h; t += 16) {
        g.moveTo(t, 0)
          .lineTo(t + h, h)
          .moveTo(t + h, 0)
          .lineTo(t, h)
      }
      g.stroke({ color: colour, width: 1.4 })
      return
    case 'vertical':
      for (let i = 1; i < 4; i++) bar((w * i) / 4 - 1, 0, 2, h)
      break
    case 'fan': {
      // sunburst bars radiating from the bottom of the top pane
      const cy = h * 0.32
      bar(0, cy - 2, w, 4)
      for (let i = 1; i < 6; i++) {
        const a = Math.PI + (i / 6) * Math.PI
        g.moveTo(w / 2, cy).lineTo(w / 2 + Math.cos(a) * w, cy + Math.sin(a) * w)
      }
      g.stroke({ color: colour, width: 2 })
      bar(w / 2 - 1.5, cy, 3, h - cy)
      break
    }
    case 'none':
      break
  }
  g.fill(colour)
}

function balcony(g: Graphics, kind: Balcony, w: number, h: number, rng: Rng) {
  const flowers = [0xe0402a, 0xf06a3a, 0xf0c050, 0xd04a8a, 0xf6f0e0]
  switch (kind) {
    case 'iron': {
      // curly wrought-iron balconette over the bottom of the window
      const top = h - h * 0.24
      g.rect(-12, top, w + 24, 3)
        .rect(-12, h + 6, w + 24, 3)
        .fill(INK)
      for (let bx = -10; bx <= w + 10; bx += 7) g.rect(bx, top, 1.5, h * 0.24 + 8).fill(INK)
      for (let bx = -4; bx < w + 4; bx += 14)
        g.ellipse(bx + 7, top + h * 0.12, 5.5, h * 0.06).stroke({ color: INK, width: 1.4 })
      break
    }
    case 'railing': {
      // plain bars, a ledge to stand on
      g.rect(-14, h + 4, w + 28, 6).fill(0x3a3028)
      g.rect(-14, h - 30, w + 28, 3).fill(INK)
      for (let bx = -12; bx <= w + 12; bx += 10) g.rect(bx, h - 30, 2, 36).fill(INK)
      break
    }
    case 'balustrade': {
      // little stone balcony with fat balusters
      g.rect(-16, h + 2, w + 32, 8).fill(0x8a7a64)
      g.rect(-16, h - 28, w + 32, 6).fill(0x8a7a64)
      for (let bx = -10; bx <= w + 8; bx += 12) g.ellipse(bx + 4, h - 10, 4, 11).fill(0x8a7a64)
      break
    }
    case 'box': {
      const f = pick(rng, flowers)
      g.rect(-6, h + 4, w + 12, 13).fill(pick(rng, [0x2a3a1a, 0x4a1e12, 0x1e2a3a, 0x5a3a20]))
      for (let i = 0; i < 9; i++) {
        const fx = -2 + (i / 8) * (w + 4)
        g.ellipse(fx, h + 1, 6, 7).fill(0x1b2a14)
        if (rng() < 0.75) g.circle(fx + range(rng, -3, 3), h - 4 - range(rng, 0, 5), 3).fill(f)
      }
      break
    }
    case 'plants': {
      // pots on the sill, a trailing plant hanging over the edge
      g.rect(-10, h + 4, w + 20, 6).fill(0x5a4a38)
      for (let i = 0; i < 3; i++) {
        const px = 8 + i * ((w - 16) / 2)
        g.poly([px - 7, h - 8, px + 7, h - 8, px + 5, h + 4, px - 5, h + 4]).fill(0x8a4a30)
        for (let l = 0; l < 5; l++)
          g.ellipse(px + range(rng, -6, 6), h - 12 - range(rng, 0, 10), 3, 6).fill(0x1b2a14)
      }
      for (let t = 0; t < 6; t++)
        g.circle(w - 10 + Math.sin(t) * 3, h + 10 + t * 6, 3).fill(0x1b2a14)
      break
    }
    case 'none':
      // just a sill
      g.rect(-10, h + 4, w + 20, 5).fill(0x5a4a38)
      break
  }
}

// ---- what's going on inside --------------------------------------------------

interface Inside {
  node: Container
  animate: (t: number) => void
}

/** everything's drawn in a 100-wide box with the floor at y=0, then fitted to the window */
function scene(kind: Life, w: number, h: number, rng: Rng): Inside {
  const node = new Container()
  const s = Math.min(w / 100, h / 130)
  node.scale.set(s)
  node.position.set(w / 2 - 50 * s, h)
  const phase = rng() * 10
  const g = () => {
    const x = new Graphics()
    node.addChild(x)
    return x
  }
  const person = (x: Graphics, cx: number, floor: number, height: number) => {
    x.circle(cx, floor - height + 6, 6.5).fill(INK)
    x.poly([
      cx - 7,
      floor - height + 13,
      cx + 7,
      floor - height + 13,
      cx + 9,
      floor,
      cx - 9,
      floor,
    ]).fill(INK)
  }
  const seated = (x: Graphics, cx: number, floor: number, facing: 1 | -1) => {
    x.circle(cx, floor - 58, 6.5).fill(INK)
    x.poly([cx - 7, floor - 51, cx + 7, floor - 51, cx + 8, floor - 24, cx - 8, floor - 24]).fill(
      INK,
    )
    x.rect(cx - 8, floor - 26, 8 * facing + 18 * facing, 7).fill(INK)
    x.rect(cx + 16 * facing - 2, floor - 26, 4, 26).fill(INK)
  }
  let animate: (t: number) => void = () => {}

  switch (kind) {
    case 'sax': {
      // big, close to the glass, swaying
      const p = g()
      p.pivot.set(50, 0)
      p.position.set(50, 0)
      p.circle(50, -92, 11).fill(INK)
      p.poly([36, -80, 64, -80, 70, 0, 30, 0]).fill(INK)
      p.moveTo(60, -86).lineTo(72, -70).lineTo(76, -40).stroke({ color: INK, width: 5 })
      p.moveTo(76, -40)
        .quadraticCurveTo(84, -22, 72, -20)
        .stroke({ color: INK, width: 9, cap: 'round' })
      p.ellipse(68, -18, 9, 6).fill(INK)
      animate = (t) => (p.rotation = Math.sin(t * 1.6 + phase) * 0.06)
      break
    }
    case 'dinner': {
      const x = g()
      x.rect(20, -34, 60, 4).rect(48, -30, 4, 30).fill(INK)
      x.rect(45, -44, 2, 10).circle(46, -46, 3).fill(INK)
      seated(x, 18, 0, 1)
      seated(x, 82, 0, -1)
      const lamp = g()
      lamp.rect(49, -130, 2, 50).poly([38, -80, 62, -80, 56, -90, 44, -90]).fill(INK)
      lamp.pivot.set(50, -130)
      lamp.position.set(50, -130)
      animate = (t) => (lamp.rotation = Math.sin(t * 0.8 + phase) * 0.04)
      break
    }
    case 'reader': {
      const x = g()
      x.roundRect(14, -46, 50, 46, 8).fill(INK)
      x.circle(38, -64, 7).fill(INK)
      x.rect(30, -58, 16, 14).fill(INK)
      x.rect(84, -98, 2, 98).poly([74, -98, 96, -98, 90, -112, 80, -112]).fill(INK)
      const book = g()
      book.poly([44, -46, 56, -50, 56, -42, 44, -40]).fill(INK)
      animate = (t) => (book.y = Math.sin(t * 0.5 + phase) > 0.95 ? -1.5 : 0)
      break
    }
    case 'sill': {
      // two people sat on the sill facing each other, knees up
      const a = g()
      const b = g()
      a.circle(18, -52, 7).fill(INK)
      a.poly([10, -45, 26, -45, 30, -10, 8, -10]).fill(INK)
      a.poly([24, -16, 46, -30, 50, -24, 30, -6]).fill(INK)
      b.circle(82, -52, 7).fill(INK)
      b.poly([74, -45, 90, -45, 92, -10, 70, -10]).fill(INK)
      b.poly([76, -16, 54, -30, 50, -24, 70, -6]).fill(INK)
      animate = (t) => {
        a.y = Math.sin(t * 1.1 + phase) * 1.2
        b.y = Math.sin(t * 1.3 + phase + 1) * 1.2
      }
      break
    }
    case 'desk': {
      const x = g()
      x.rect(30, -40, 64, 4).rect(88, -36, 4, 36).fill(INK)
      x.rect(70, -62, 18, 22).fill({ color: INK, alpha: 0.9 })
      seated(x, 34, 0, 1)
      const arm = g()
      arm.rect(0, 0, 22, 4).fill(INK)
      arm.position.set(36, -46)
      animate = (t) => (arm.rotation = Math.sin(t * 3 + phase) * 0.12)
      break
    }
    case 'dance': {
      const p = g()
      p.pivot.set(50, 0)
      p.position.set(50, 0)
      person(p, 42, 0, 92)
      person(p, 58, 0, 84)
      p.poly([46, -70, 54, -70, 54, -64, 46, -64]).fill(INK)
      // her skirt flaring
      p.poly([50, -40, 72, 0, 44, 0]).fill(INK)
      animate = (t) => {
        p.rotation = Math.sin(t * 1.2 + phase) * 0.08
        p.x = 50 + Math.sin(t * 0.6 + phase) * 6
      }
      break
    }
    case 'cat': {
      const x = g()
      x.ellipse(50, -12, 13, 14).fill(INK)
      x.circle(50, -32, 9).fill(INK)
      x.poly([42, -35, 43, -48, 48, -38]).poly([58, -35, 57, -48, 52, -38]).fill(INK)
      const tail = g()
      tail
        .moveTo(0, 0)
        .bezierCurveTo(14, 2, 18, -10, 12, -22)
        .stroke({ color: INK, width: 4, cap: 'round' })
      tail.position.set(60, -4)
      x.rect(78, -60, 2, 60).poly([70, -60, 88, -60, 84, -70, 74, -70]).fill(INK)
      animate = (t) => (tail.rotation = Math.sin(t * 1.8 + phase) * 0.3)
      break
    }
    case 'party': {
      const heads = [g(), g(), g(), g()]
      heads.forEach((x, i) => person(x, 16 + i * 23, 0, 78 + (i % 2) * 10))
      const deco = g()
      for (let i = 0; i < 6; i++)
        deco.circle(10 + i * 16, -118 + Math.sin(i) * 4, 2.5).fill(0xfff0c0)
      deco.moveTo(4, -120).quadraticCurveTo(50, -100, 96, -120).stroke({ color: INK, width: 1 })
      animate = (t) =>
        heads.forEach((x, i) => (x.y = Math.abs(Math.sin(t * 3 + i * 1.3 + phase)) * -3))
      break
    }
    case 'plants': {
      const x = g()
      for (const [px, ph] of [
        [22, 50],
        [50, 70],
        [78, 40],
      ] as const) {
        x.rect(px - 9, -18, 18, 18).fill(INK)
        for (let l = 0; l < 6; l++) {
          const a = -Math.PI / 2 + (l - 2.5) * 0.35
          x.ellipse(px + Math.cos(a) * ph * 0.4, -18 + Math.sin(a) * ph * 0.5, 4, ph / 3).fill(INK)
        }
      }
      const lamp = g()
      lamp.rect(-1, 0, 2, 40).circle(0, 46, 9).fill(INK)
      lamp.position.set(50, -130)
      animate = (t) => (lamp.rotation = Math.sin(t * 0.7 + phase) * 0.05)
      break
    }
    case 'books': {
      const x = g()
      for (let sh = 0; sh < 4; sh++) {
        const y = -14 - sh * 28
        x.rect(6, y, 88, 3).fill(INK)
        let bx = 8
        while (bx < 90) {
          const bw = range(rng, 3, 7)
          const bh = range(rng, 12, 22)
          x.rect(bx, y - bh, bw, bh).fill({ color: INK, alpha: range(rng, 0.7, 1) })
          bx += bw + 1
        }
      }
      break
    }
    case 'tv': {
      // someone on the sofa, the set flickering blue at them
      const x = g()
      x.roundRect(10, -40, 60, 40, 6).fill(INK)
      x.circle(40, -54, 7).fill(INK)
      x.rect(32, -48, 16, 12).fill(INK)
      x.rect(76, -40, 20, 40).fill(INK)
      const screen = g()
      screen.rect(78, -36, 16, 12).fill(0x8ab8ff)
      animate = (t) => (screen.alpha = 0.6 + Math.abs(Math.sin(t * 7 + phase)) * 0.4)
      break
    }
    case 'cook': {
      // at the stove, a pot steaming
      const x = g()
      person(x, 36, 0, 90)
      x.rect(52, -40, 44, 40).fill(INK)
      x.rect(60, -52, 20, 12).fill(INK)
      x.rect(46, -64, 10, 4).fill(INK)
      const steam = [g(), g(), g()]
      steam.forEach((p, i) => p.circle(0, 0, 4 + i).fill({ color: 0xfff6e0, alpha: 0.35 }))
      animate = (t) =>
        steam.forEach((p, i) => {
          const k = (t * 0.6 + i / 3 + phase) % 1
          p.position.set(70 + Math.sin(k * 6 + i) * 4, -56 - k * 50)
          p.alpha = 1 - k
        })
      break
    }
    case 'piano': {
      const x = g()
      x.rect(40, -50, 56, 50).fill(INK)
      x.rect(36, -30, 64, 4).fill(INK)
      x.rect(20, -24, 18, 4).rect(22, -20, 3, 20).rect(34, -20, 3, 20).fill(INK)
      const p = g()
      p.circle(26, -58, 6.5).fill(INK)
      p.poly([18, -51, 34, -51, 36, -24, 18, -24]).fill(INK)
      p.rect(30, -40, 14, 4).fill(INK)
      animate = (t) => (p.rotation = Math.sin(t * 2.2 + phase) * 0.03)
      break
    }
    case 'painter': {
      // an easel, a canvas with a dab of colour, the painter leaning in
      const x = g()
      x.moveTo(62, 0)
        .lineTo(72, -86)
        .lineTo(82, 0)
        .moveTo(72, -86)
        .lineTo(72, 0)
        .stroke({ color: INK, width: 3 })
      x.rect(56, -78, 34, 40).fill(0xf0e6d0)
      x.circle(66, -62, 5).fill(0xd04a2a)
      x.rect(72, -54, 12, 6).fill(0x3a6ab0)
      const p = g()
      person(p, 34, 0, 88)
      const arm = g()
      arm.rect(0, 0, 22, 3.5).fill(INK)
      arm.position.set(38, -62)
      animate = (t) => (arm.rotation = -0.3 + Math.sin(t * 1.8 + phase) * 0.15)
      break
    }
    case 'phone': {
      // curled up on a chair, on the phone, cord looping to the wall
      const x = g()
      x.roundRect(20, -36, 44, 36, 6).fill(INK)
      x.circle(42, -50, 7).fill(INK)
      x.rect(34, -44, 16, 12).fill(INK)
      x.rect(46, -54, 5, 10).fill(INK)
      const cord = g()
      animate = (t) => {
        const sag = Math.sin(t * 1.3 + phase) * 3
        cord
          .clear()
          .moveTo(50, -48)
          .bezierCurveTo(70, -20 + sag, 80, -60, 92, -70)
          .stroke({ color: INK, width: 1.5 })
      }
      x.rect(88, -78, 8, 14).fill(INK)
      break
    }
    case 'guitar': {
      // on the edge of the bed with a guitar, foot tapping
      const x = g()
      x.rect(4, -24, 92, 24).fill(INK)
      x.rect(4, -40, 8, 16).fill(INK)
      const p = g()
      p.circle(50, -70, 7).fill(INK)
      p.poly([42, -62, 58, -62, 60, -26, 40, -26]).fill(INK)
      p.ellipse(62, -36, 10, 8).fill(INK)
      p.rect(62, -44, 26, 3).fill(INK)
      animate = (t) => (p.y = Math.abs(Math.sin(t * 4 + phase)) * -1.5)
      break
    }
    case 'kiss': {
      // two profiles leaning in, very close to the glass
      const a = g()
      const b = g()
      a.circle(34, -60, 14).fill(INK)
      a.poly([20, -48, 44, -48, 48, 0, 10, 0]).fill(INK)
      b.circle(66, -62, 13).fill(INK)
      b.poly([56, -50, 80, -50, 90, 0, 52, 0]).fill(INK)
      animate = (t) => {
        const lean = (Math.sin(t * 0.5 + phase) + 1) * 1.5
        a.x = lean
        b.x = -lean
      }
      break
    }
  }
  return { node, animate }
}
