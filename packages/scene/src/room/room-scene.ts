import { AdvancedBloomFilter } from 'pixi-filters'
import { Application, ColorMatrixFilter, Container, Sprite, Texture, type PointData } from 'pixi.js'
import { Emitter } from '../emitter'
import { PaperFilter } from '../filters/PaperFilter'
import { loadDisplayFont } from '../fonts'
import { createRng } from '../rng'
import { StreetWorld } from '../street-world'
import type { ThemeId } from '../themes/types'
import { Ctx, type Light, type Pin, type Thing } from './context'
import {
  drawFan,
  drawFloorThings,
  drawHangingPlants,
  drawMap,
  drawNeon,
  drawPosters,
  drawShelfTop,
  drawShelves,
  drawVinyl,
} from './decor'
import { drawExtra } from './extras'
import { planRoom } from './plan'
import { drawBed, drawBookshelf, drawDesk, drawRug } from './furniture'
import { drawLamp } from './lamps'
import type { Layout } from './layout'
import { VIEW } from './projection'
import { drawShell } from './shell'
import { drawWindow, placeStreet } from './window'

export interface RoomOptions {
  layout: Layout
  theme: ThemeId
  /** anything stable, e.g. the house id, so the room's clutter stays put */
  seed: string
  /** which of the house's twelve rooms this is; each one is laid out differently */
  room: number
  playing?: boolean
  pins?: Pin[]
  reducedMotion?: boolean
}

export interface RoomEvents extends Record<string, unknown> {
  pick: Thing
  hover: Thing | null
}

// how far past the 1000x700 picture the walls go, for the night shading
const SHADE = { x: -700, y: -500, width: 2400, height: 1700 }

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/**
 * Your room, drawn the same way as the street: flat colour, ink lines, glows
 * with bloom on top and the paper pass over everything. The street itself is
 * live behind the window glass.
 */
export class RoomScene {
  readonly events = new Emitter<RoomEvents>()
  private view = new Container()
  private content: Container | null = null
  private street: StreetWorld
  private ctx: Ctx | null = null
  private paper = new PaperFilter()
  private bright = new ColorMatrixFilter()
  private hovered: Thing | null = null
  private time = 0
  private destroyed = false
  private shadeTexture: Texture | null = null

  private constructor(
    private app: Application,
    private options: RoomOptions,
  ) {
    this.street = new StreetWorld({
      theme: options.theme,
      seed: 1931,
      reducedMotion: options.reducedMotion ?? false,
    })
    this.bright.brightness(1.3, false)
  }

  static async create(host: HTMLElement, options: RoomOptions) {
    const app = new Application()
    await app.init({
      resizeTo: host,
      preference: 'webgl',
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      background: 0x07080d,
    })
    await loadDisplayFont()
    const scene = new RoomScene(app, options)
    scene.build()
    host.appendChild(app.canvas)
    return scene
  }

  private build() {
    const { app } = this
    app.stage.addChild(this.view)
    app.stage.filters = [this.paper]
    app.stage.filterArea = app.screen
    app.stage.eventMode = 'static'
    app.stage.hitArea = app.screen
    app.stage.on('pointermove', (e) => this.hover(this.thingAt(e.global)))
    app.stage.on('pointertap', (e) => {
      const t = this.thingAt(e.global)
      if (t) this.events.emit('pick', t)
    })
    app.canvas.addEventListener('pointerleave', () => this.hover(null))
    this.draw()
    this.layout(app.screen.width, app.screen.height)
    app.renderer.on('resize', (w: number, h: number) => this.layout(w, h))
    app.ticker.add((t) => this.tick(t.deltaMS))
  }

  /** rebuilds everything except the street, which keeps walking */
  private draw() {
    this.street.parent?.removeChild(this.street)
    this.content?.destroy({ children: true })
    this.hovered = null

    const back = new Container()
    const lights = new Container()
    lights.filters = [
      new AdvancedBloomFilter({
        threshold: 0.25,
        bloomScale: 1.1,
        brightness: 1,
        blur: 6,
        quality: 4,
      }),
    ]
    const o = this.options
    const plan = planRoom(o.layout, o.room)
    const rng = createRng(hash(`${o.seed}:${o.room}`))
    const ctx = (this.ctx = new Ctx(
      o.layout,
      plan,
      o.theme,
      rng,
      back,
      lights,
      o.playing ?? false,
      o.pins ?? [],
    ))

    drawShell(ctx)
    drawWindow(ctx, this.street)
    const { top } = placeStreet(this.street, o.theme, plan.variant, o.room)
    this.street.setRainTop(top - 100)
    drawVinyl(ctx)
    drawMap(ctx)
    drawShelves(ctx)
    drawPosters(ctx)
    drawNeon(ctx)
    drawRug(ctx)
    drawBookshelf(ctx)
    drawShelfTop(ctx)
    // things against the back half of the walls first, so nearer ones overlap them
    const pieces = [...plan.pieces].sort((a, b) => b.zone.z0 - a.zone.z0)
    pieces.filter((p) => p.zone.name === 'back').forEach((p, i) => drawExtra(ctx, p, i))
    drawBed(ctx)
    drawLamp(ctx, drawDesk(ctx))
    pieces.filter((p) => p.zone.name !== 'back').forEach((p, i) => drawExtra(ctx, p, i + 3))
    drawFloorThings(ctx)
    drawHangingPlants(ctx)
    drawFan(ctx)

    const night = new Sprite(this.shading(ctx.pools))
    night.position.set(SHADE.x, SHADE.y)
    night.width = SHADE.width
    night.height = SHADE.height
    night.blendMode = 'multiply'

    const content = (this.content = new Container())
    content.addChild(back, night, lights)
    this.view.addChild(content)
  }

  /**
   * The night: a dim blue-violet over everything, cut away wherever a lamp,
   * candle or the window throws light. Multiplied over the room so the
   * colours stay strong where it's lit and sink where it isn't.
   */
  private shading(pools: Light[]) {
    const k = 0.2
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(SHADE.width * k)
    canvas.height = Math.round(SHADE.height * k)
    const c = canvas.getContext('2d')!
    c.fillStyle = 'rgb(84, 72, 124)'
    c.fillRect(0, 0, canvas.width, canvas.height)
    c.globalCompositeOperation = 'lighter'
    for (const p of pools) {
      const x = (p.x - SHADE.x) * k
      const y = (p.y - SHADE.y) * k
      const r = p.r * k
      const g = c.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `rgba(255, 220, 180, ${p.k * 0.85})`)
      g.addColorStop(0.5, `rgba(255, 200, 160, ${p.k * 0.3})`)
      g.addColorStop(1, 'rgba(255, 200, 160, 0)')
      c.fillStyle = g
      c.fillRect(x - r, y - r, r * 2, r * 2)
    }
    this.shadeTexture?.destroy(true)
    this.shadeTexture = Texture.from(canvas)
    return this.shadeTexture
  }

  private thingAt(global: PointData): Thing | null {
    if (!this.ctx) return null
    const p = this.view.toLocal(global)
    for (let i = this.ctx.hits.length - 1; i >= 0; i--) {
      const [thing, shape] = this.ctx.hits[i]!
      if (shape.containsPoint(p)) return thing
    }
    return null
  }

  private hover(thing: Thing | null) {
    if (thing === this.hovered) return
    for (const c of this.groupsOf(this.hovered)) c.filters = []
    this.hovered = thing
    // the walls are everywhere, so hovering them shouldn't light up the room
    if (thing && thing !== 'wall') for (const c of this.groupsOf(thing)) c.filters = [this.bright]
    this.app.canvas.style.cursor = thing ? 'pointer' : ''
    this.events.emit('hover', thing)
  }

  private groupsOf(thing: Thing | null) {
    return (thing && this.ctx?.groups.get(thing)) || []
  }

  private layout(width: number, height: number) {
    const scale = Math.min(width / VIEW.width, height / VIEW.height)
    this.view.scale.set(scale)
    this.view.position.set((width - VIEW.width * scale) / 2, (height - VIEW.height * scale) / 2)
    this.paper.setScreen(width, height)
  }

  private tick(deltaMs: number) {
    if (this.destroyed) return
    const dt = Math.min(deltaMs, 50) / 1000
    this.time += dt
    const reduced = this.options.reducedMotion ?? false
    this.street.update(this.app.renderer, this.time, dt, 0, reduced)
    this.paper.time = this.time
    if (!reduced) for (const a of this.ctx?.anim ?? []) a(this.time, dt)
  }

  setLayout(layout: Layout) {
    this.options = { ...this.options, layout }
    this.draw()
  }

  setPlaying(playing: boolean) {
    if (playing === (this.options.playing ?? false)) return
    this.options = { ...this.options, playing }
    this.draw()
  }

  setPins(pins: Pin[]) {
    this.options = { ...this.options, pins }
    this.draw()
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.events.clear()
    this.street.parent?.removeChild(this.street)
    this.street.destroy()
    this.shadeTexture?.destroy(true)
    this.app.destroy({ removeView: true }, { children: true })
  }
}
