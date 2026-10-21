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

type Shape = 'rect' | 'arch' | 'french' | 'grid' | 'shutters'
type Life = 'sax' | 'dinner' | 'reader' | 'sill' | 'desk' | 'dance' | 'cat' | 'party' | 'plants' | 'books' | 'kiss'

// every colour a room can be lit at night: lamps, tvs, coloured shades,
// fairy lights. warm ones still win, but not by much.
const LIGHTS: { weight: number; stops: [number, number, number] }[] = [
  { weight: 3, stops: [0xd8582a, 0xf5823a, 0xffad5c] },
  { weight: 2, stops: [0xc89a2a, 0xf0c050, 0xffe08a] },
  { weight: 2, stops: [0x8e1a12, 0xc8301e, 0xe8582a] },
  { weight: 2, stops: [0x1a2a6a, 0x3a5ab0, 0x8aa8e8] },
  { weight: 2, stops: [0x0f4a4a, 0x2a8a80, 0x8ad0c0] },
  { weight: 2, stops: [0x3a1a5a, 0x7040a0, 0xc09ae0] },
  { weight: 1, stops: [0x1a4a2a, 0x3a8a4a, 0xa8d890] },
  { weight: 2, stops: [0x8a2a5a, 0xd0608a, 0xf6b0c8] },
  { weight: 1, stops: [0x3a5a5a, 0x7a9a92, 0xb8d0c4] },
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

const FRAMES = [0x2a1810, 0x1d3324, 0x1c2840, 0x6e5e4a, 0x4a1612, 0x1a1210]

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
    const bloom = new AdvancedBloomFilter({ threshold: 0.55, bloomScale: 0.6, brightness: 1, blur: 6, quality: 4 })
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
    const colW = width < 700 ? 130 : 178
    const cols = Math.ceil(width / colW) + 1
    const offset = (width - cols * colW) / 2
    for (let c = 0; c < cols; c++) {
      let y = range(rng, -120, -10)
      while (y < height + 20) {
        const w = range(rng, colW * 0.6, colW * 0.84)
        const h = range(rng, w * 1.05, w * 1.75)
        const x = offset + c * colW + (colW - w) / 2 + range(rng, -10, 10)
        this.addPane(rng, x, y, w, h)
        y += h + range(rng, 22, 46)
      }
    }
  }

  private addPane(rng: Rng, x: number, y: number, w: number, h: number) {
    const shape: Shape = pick(rng, ['rect', 'rect', 'arch', 'french', 'grid', 'shutters'] as const)
    const frame = pick(rng, FRAMES)
    const light = pickLight(rng)
    const life: Life = pick(rng, ['sax', 'dinner', 'reader', 'sill', 'desk', 'dance', 'cat', 'party', 'plants', 'books', 'kiss'] as const)

    const root = new Container()
    root.position.set(x, y)

    const glass = (g: Graphics) =>
      shape === 'arch' ? g.moveTo(0, h).lineTo(0, w / 2).arc(w / 2, w / 2, w / 2, Math.PI, 0).lineTo(w, h).closePath() : g.rect(0, 0, w, h)

    // frame and reveal
    const f = new Graphics()
    if (shape === 'arch') {
      f.moveTo(-8, h + 8).lineTo(-8, w / 2).arc(w / 2, w / 2, w / 2 + 8, Math.PI, 0).lineTo(w + 8, h + 8).closePath().fill(frame)
    } else {
      f.rect(-8, -8, w + 16, h + 16).fill(frame)
    }
    if (shape === 'shutters') {
      for (const sx of [-8 - w * 0.36, w + 8]) {
        f.rect(sx, -8, w * 0.36, h + 16).fill(0x1d3324)
        for (let ly = 0; ly < h; ly += 7) f.rect(sx + 3, ly, w * 0.36 - 6, 2).fill({ color: INK, alpha: 0.4 })
      }
    }
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
    const { node, animate } = scene(life, w, h, rng)
    const mask = new Graphics()
    glass(mask).fill(0xffffff)
    interior.addChild(wall, hot, node, mask)
    interior.mask = mask
    root.addChild(interior)

    // muntins / rails over the glass
    const bars = new Graphics()
    if (shape === 'grid') {
      for (let gx = 1; gx < 4; gx++) bars.rect((w * gx) / 4 - 1, 0, 2, h)
      for (let gy = 1; gy < 5; gy++) bars.rect(0, (h * gy) / 5 - 1, w, 2)
      bars.fill(frame)
    } else if (shape !== 'arch' || rng() < 0.5) {
      bars.rect(w / 2 - 2, h * 0.22, 4, h * 0.78).rect(0, h * 0.22 - 2, w, 4).fill(frame)
    }
    glass(bars).stroke({ color: frame, width: 4 })
    if (shape === 'french') {
      // little iron balcony
      const ry = h - h * 0.24
      bars.rect(-10, ry, w + 20, 3).rect(-10, h + 4, w + 20, 3).fill(INK)
      for (let bx = -8; bx <= w + 8; bx += 7) bars.rect(bx, ry, 1.5, h * 0.24 + 6).fill(INK)
      for (let bx = -2; bx < w; bx += 16) bars.ellipse(bx + 8, ry + h * 0.12, 6, h * 0.06).stroke({ color: INK, width: 1.4 })
    }
    root.addChild(bars)

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
    x.poly([cx - 7, floor - height + 13, cx + 7, floor - height + 13, cx + 9, floor, cx - 9, floor]).fill(INK)
  }
  const seated = (x: Graphics, cx: number, floor: number, facing: 1 | -1) => {
    x.circle(cx, floor - 58, 6.5).fill(INK)
    x.poly([cx - 7, floor - 51, cx + 7, floor - 51, cx + 8, floor - 24, cx - 8, floor - 24]).fill(INK)
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
      p.moveTo(76, -40).quadraticCurveTo(84, -22, 72, -20).stroke({ color: INK, width: 9, cap: 'round' })
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
      tail.moveTo(0, 0).bezierCurveTo(14, 2, 18, -10, 12, -22).stroke({ color: INK, width: 4, cap: 'round' })
      tail.position.set(60, -4)
      x.rect(78, -60, 2, 60).poly([70, -60, 88, -60, 84, -70, 74, -70]).fill(INK)
      animate = (t) => (tail.rotation = Math.sin(t * 1.8 + phase) * 0.3)
      break
    }
    case 'party': {
      const heads = [g(), g(), g(), g()]
      heads.forEach((x, i) => person(x, 16 + i * 23, 0, 78 + (i % 2) * 10))
      const deco = g()
      for (let i = 0; i < 6; i++) deco.circle(10 + i * 16, -118 + Math.sin(i) * 4, 2.5).fill(0xfff0c0)
      deco.moveTo(4, -120).quadraticCurveTo(50, -100, 96, -120).stroke({ color: INK, width: 1 })
      animate = (t) => heads.forEach((x, i) => (x.y = Math.abs(Math.sin(t * 3 + i * 1.3 + phase)) * -3))
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
