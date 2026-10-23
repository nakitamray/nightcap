import { AdvancedBloomFilter } from 'pixi-filters'
import {
  Application,
  Container,
  Graphics,
  Matrix,
  RenderTexture,
  Sprite,
  Texture,
  type PointData,
} from 'pixi.js'
import type { Guest } from '../characters/guest'
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
import { drawBed, drawBookshelf, drawDesk, drawNightstand, drawRug } from './furniture'
import { drawGuests } from './guests'
import { drawLamp } from './lamps'
import { drawNotes } from './notes'
import type { Layout } from './layout'
import { drawPet } from './pets'
import { planRoom } from './plan'
import { setRoomShape, VIEW } from './projection'
import { drawShell } from './shell'
import { drawWindow, paneRect, streetFrame } from './window'

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
  /** off when you're looking round someone else's room */
  editable?: boolean
  /** whoever's in the room right now */
  people?: Guest[]
  /** unread notes under the door */
  notes?: number
}

export interface RoomEvents extends Record<string, unknown> {
  pick: Thing
  hover: Thing | null
}

// how far past the picture the walls go, for the night shading
const SHADE = { x: -700, y: -500, width: 2400, height: 1900 }
// cached pictures bigger than this (in pixels) aren't worth the memory
const MAX_CACHE = 2600

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/**
 * Your room, drawn the same way as the street: flat colour, ink lines, glows
 * with bloom on top and the paper pass over everything. The street itself is
 * live behind the window glass.
 *
 * Kept quick by drawing everything that doesn't move into cached pictures
 * once, and by rendering the street into a window-sized texture at half rate.
 */
export class RoomScene {
  readonly events = new Emitter<RoomEvents>()
  private view = new Container()
  private content: Container | null = null
  private runs: Container[] = []
  private highlight = new Container()
  private street: StreetWorld
  private streetTexture: RenderTexture | null = null
  private streetSprite = new Sprite()
  private streetMatrix = new Matrix()
  private ctx: Ctx | null = null
  private paper = new PaperFilter()
  private hovered: Thing | null = null
  private time = 0
  private frame = 0
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
    this.street.lowDetail()
  }

  static async create(host: HTMLElement, options: RoomOptions) {
    const app = new Application()
    await app.init({
      resizeTo: host,
      preference: 'webgl',
      antialias: true,
      autoDensity: true,
      // past 1.5x the extra pixels cost a lot of filter work for little gain
      resolution: Math.min(window.devicePixelRatio || 1, 1.5),
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
    this.highlight.alpha = 0.12
    this.highlight.blendMode = 'add'
    this.view.addChild(this.highlight)
    app.stage.filters = [this.paper]
    app.stage.filterArea = app.screen
    // someone else's room: look, but nothing lights up under the pointer
    if (this.options.editable === false) return this.finish()
    app.stage.eventMode = 'static'
    app.stage.hitArea = app.screen
    app.stage.on('pointermove', (e) => this.hover(this.thingAt(e.global)))
    app.stage.on('pointertap', (e) => {
      const t = this.thingAt(e.global)
      if (t) this.events.emit('pick', t)
    })
    app.canvas.addEventListener('pointerleave', () => this.hover(null))
    this.finish()
  }

  private finish() {
    const { app } = this
    this.layout(app.screen.width, app.screen.height)
    app.renderer.on('resize', (w: number, h: number) => this.layout(w, h))
    app.ticker.add((t) => this.tick(t.deltaMS))
  }

  /** rebuilds the room; the street outside keeps walking */
  private draw() {
    // the street sprite outlives every redraw, so take it out before the rest goes
    this.streetSprite.removeFromParent()
    this.content?.destroy({ children: true })
    this.runs = []
    this.hovered = null

    const o = this.options
    const plan = planRoom(o.layout, o.room)
    setRoomShape(plan.half, plan.height)

    const back = new Container()
    const lights = new Container()
    lights.filters = [
      new AdvancedBloomFilter({
        threshold: 0.25,
        bloomScale: 1.1,
        brightness: 1,
        blur: 6,
        quality: 3,
      }),
    ]
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

    this.fitStreet()
    drawShell(ctx)
    drawWindow(ctx, this.streetSprite)
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
    drawLamp(ctx, drawNightstand(ctx))
    drawPet(ctx)
    drawDesk(ctx)
    pieces.filter((p) => p.zone.name !== 'back').forEach((p, i) => drawExtra(ctx, p, i + 3))
    drawNotes(ctx, o.notes ?? 0)
    drawGuests(ctx, o.people ?? [])
    drawFloorThings(ctx)
    drawHangingPlants(ctx)
    drawFan(ctx)

    const night = new Sprite(this.shading(ctx.pools))
    night.position.set(SHADE.x, SHADE.y)
    night.width = SHADE.width
    night.height = SHADE.height
    night.blendMode = 'multiply'

    const content = (this.content = new Container())
    content.addChild(this.bake(back, ctx), night, lights)
    this.view.addChildAt(content, 0)
    this.highlight.removeChildren().forEach((c) => c.destroy())
    this.cacheRuns()
  }

  /**
   * Groups everything that never moves into runs, in drawing order, so each
   * run can be cached as one picture. Moving things stay as they are, between
   * the runs, so nothing changes which way round it overlaps.
   */
  private bake(back: Container, ctx: Ctx) {
    const out = new Container()
    let run: Container | null = null
    for (const child of [...back.children]) {
      if (ctx.moving.has(child)) {
        out.addChild(child)
        run = null
        continue
      }
      if (!run) {
        run = new Container()
        this.runs.push(run)
        out.addChild(run)
      }
      run.addChild(child)
    }
    back.destroy()
    return out
  }

  /** caches each static run at the current scale, skipping any too big to be worth it */
  private cacheRuns() {
    const res = this.app.renderer.resolution
    for (const run of this.runs) {
      run.cacheAsTexture(false)
      const b = run.getBounds()
      if (b.width * res < MAX_CACHE && b.height * res < MAX_CACHE)
        run.cacheAsTexture({ resolution: res, antialias: true })
    }
  }

  /** sizes the texture the street is drawn into to the window, at screen resolution */
  private fitStreet() {
    if (!this.ctx) return
    const v = this.ctx.plan.variant
    const k = this.view.scale.x || 1
    const { w, h } = paneRect(v)
    const width = Math.max(8, Math.ceil(w * k))
    const height = Math.max(8, Math.ceil(h * k))
    if (
      !this.streetTexture ||
      this.streetTexture.width !== width ||
      this.streetTexture.height !== height
    ) {
      this.streetTexture?.destroy(true)
      this.streetTexture = RenderTexture.create({
        width,
        height,
        resolution: this.app.renderer.resolution,
      })
      this.streetSprite.texture = this.streetTexture
    }
    const f = streetFrame(this.options.theme, v, this.options.room)
    this.streetMatrix.set(f.scale * k, 0, 0, f.scale * k, f.x * k, f.y * k)
    this.street.setRainTop(f.top - 100)
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

  /** hovering outlines whatever's under the pointer, softly, without touching the cache */
  private hover(thing: Thing | null) {
    if (thing === this.hovered) return
    this.hovered = thing
    // the outlines borrow the click shapes' geometry, so take them down without destroying it
    this.highlight.removeChildren().forEach((c) => c.destroy())
    // the walls are everywhere, so hovering them shouldn't light up the room
    if (thing && thing !== 'wall' && this.ctx) {
      for (const [t, shape] of this.ctx.hits)
        if (t === thing) this.highlight.addChild(new Graphics(shape.context))
    }
    this.app.canvas.style.cursor = thing ? 'pointer' : ''
    this.events.emit('hover', thing)
  }

  private layout(width: number, height: number) {
    const scale = Math.min(width / VIEW.width, height / VIEW.height)
    this.view.scale.set(scale)
    this.view.position.set((width - VIEW.width * scale) / 2, (height - VIEW.height * scale) / 2)
    this.paper.setScreen(width, height)
    // the cached pictures were drawn at the old size, so redraw at the new one
    if (this.content) {
      this.fitStreet()
      this.cacheRuns()
    } else this.draw()
  }

  private tick(deltaMs: number) {
    if (this.destroyed) return
    const dt = Math.min(deltaMs, 50) / 1000
    this.time += dt
    const reduced = this.options.reducedMotion ?? false
    this.paper.time = this.time
    if (!reduced) for (const a of this.ctx?.anim ?? []) a(this.time, dt)
    // the view out of the window only needs thirty frames a second
    if (this.frame++ % 2 === 0 && this.streetTexture) {
      this.street.update(this.app.renderer, this.time, dt * 2, 0, reduced)
      this.app.renderer.render({
        container: this.street,
        target: this.streetTexture,
        transform: this.streetMatrix,
        clear: true,
      })
    }
  }

  setLayout(layout: Layout) {
    if (layout === this.options.layout) return
    this.options = { ...this.options, layout }
    this.draw()
  }

  setPlaying(playing: boolean) {
    if (playing === (this.options.playing ?? false)) return
    this.options = { ...this.options, playing }
    this.draw()
  }

  setPeople(people: Guest[]) {
    const now = this.options.people ?? []
    // the same people as before (it's polled) shouldn't rebuild the room
    const same =
      now.length === people.length &&
      now.every((p, i) => p.id === people[i]!.id && p.avatar === people[i]!.avatar)
    if (same) return
    this.options = { ...this.options, people }
    this.draw()
  }

  setNotes(notes: number) {
    if (notes === (this.options.notes ?? 0)) return
    this.options = { ...this.options, notes }
    this.draw()
  }

  setPins(pins: Pin[]) {
    if (pins === this.options.pins) return
    this.options = { ...this.options, pins }
    this.draw()
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.events.clear()
    this.streetSprite.removeFromParent()
    this.street.destroy()
    this.streetTexture?.destroy(true)
    this.shadeTexture?.destroy(true)
    this.app.destroy({ removeView: true }, { children: true })
  }
}
