import { Application, type PointData } from 'pixi.js'
import { Emitter } from './emitter'
import { PaperFilter } from './filters/PaperFilter'
import { loadDisplayFont } from './fonts'
import { fitWorld } from './layout'
import type { BaseHouse } from './layers/house-base'
import type { RoomWindow } from './layers/window'
import { palette } from './palette'
import { StreetWorld } from './street-world'
import type { Rooms, SceneEvents, SceneOptions, WindowEvent } from './types'

const DEFAULT_SEED = 1931

export class StreetScene {
  readonly events = new Emitter<SceneEvents>()

  private world!: StreetWorld
  private house!: BaseHouse
  private paper = new PaperFilter()

  private time = 0
  private pointerX = 0
  private frameMs = 16
  private degraded = false
  private destroyed = false
  private rooms: Rooms = []
  private hovered: RoomWindow | null = null

  private constructor(
    private app: Application,
    private options: SceneOptions,
  ) {}

  static async create(host: HTMLElement, options: SceneOptions) {
    const app = new Application()
    await app.init({
      resizeTo: host,
      preference: 'webgl',
      antialias: true,
      autoDensity: true,
      // past 1.5x the extra pixels cost a lot of filter work for little gain
      resolution: Math.min(window.devicePixelRatio || 1, 1.5),
      background: palette.skyTop,
    })
    // text in the scene is drawn to canvas, so the font has to be there first
    await loadDisplayFont()
    const scene = new StreetScene(app, options)
    scene.build()
    host.appendChild(app.canvas)
    scene.events.emit('ready', undefined)
    return scene
  }

  private build() {
    const { app, options } = this
    this.world = new StreetWorld({
      theme: options.theme ?? 'paris',
      seed: options.seed ?? DEFAULT_SEED,
      reducedMotion: options.reducedMotion ?? false,
    })
    this.house = this.world.house

    app.stage.addChild(this.world)

    app.stage.filters = [this.paper]
    app.stage.filterArea = app.screen
    app.stage.eventMode = 'static'
    app.stage.hitArea = app.screen
    // Windows are hit-tested by hand in world space instead of with pixi's
    // own events: the reflection pass re-renders `upper` with a different
    // transform every other frame, which leaves pixi's cached transforms
    // pointing at the wrong place when it hit-tests.
    app.stage.on('pointermove', (e) => {
      this.pointerX = (e.global.x / app.screen.width) * 2 - 1
      this.hover(this.windowAt(e.global))
    })
    app.stage.on('pointertap', (e) => {
      const w = this.windowAt(e.global)
      if (w) this.events.emit('window:click', this.windowEvent(w))
    })
    app.canvas.addEventListener('pointerleave', () => this.hover(null))

    this.house.marquee.setLines(options.marquee)
    this.setRooms(options.rooms)

    this.layout(app.screen.width, app.screen.height)
    app.renderer.on('resize', (w: number, h: number) => this.layout(w, h))
    app.ticker.add((ticker) => this.tick(ticker.deltaMS))
  }

  private windowAt(global: PointData) {
    const p = this.world.toLocal(global)
    return this.house.windowAt(p.x, p.y) ?? null
  }

  private hover(w: RoomWindow | null) {
    if (w === this.hovered) return
    this.hovered?.setHovered(false)
    this.hovered = w
    w?.setHovered(true)
    this.app.canvas.style.cursor = w ? 'pointer' : ''
    this.events.emit('window:hover', w ? this.windowEvent(w) : null)
  }

  private windowEvent(w: RoomWindow): WindowEvent {
    const { slot } = w
    const topLeft = this.world.toGlobal({ x: slot.x, y: slot.y })
    const s = this.world.scale.x
    return {
      index: slot.index,
      resident: w.resident,
      bounds: { x: topLeft.x, y: topLeft.y, width: slot.width * s, height: slot.height * s },
    }
  }

  private layout(width: number, height: number) {
    const fit = fitWorld(width, height)
    this.world.scale.set(fit.scale)
    this.world.position.set(fit.x, fit.y)
    this.paper.setScreen(width, height)
    // rain has to start above whatever slice of sky is showing
    this.world.setRainTop(-fit.y / fit.scale - 100)
  }

  private tick(deltaMs: number) {
    if (this.destroyed) return
    const dt = Math.min(deltaMs, 50) / 1000
    this.time += dt
    const t = this.time
    const reduced = this.options.reducedMotion ?? false

    this.world.update(this.app.renderer, t, dt, this.pointerX, reduced)
    this.paper.time = t

    this.watchPerformance(deltaMs)
  }

  /** if the machine is struggling, drop the expensive bits rather than stutter */
  private watchPerformance(deltaMs: number) {
    this.frameMs += (deltaMs - this.frameMs) * 0.02
    if (this.degraded || this.time < 4 || this.frameMs < 28) return
    this.degraded = true
    this.world.degrade()
  }

  setRooms(rooms: Rooms) {
    this.rooms = rooms
    this.house.setRooms(rooms)
  }

  setLit(index: number, home: boolean) {
    const room = this.rooms[index]
    if (!room) return
    const next = [...this.rooms]
    next[index] = { ...room, home }
    this.setRooms(next)
  }

  setMarquee(lines: string[]) {
    this.house.marquee.setLines(lines)
  }

  setReducedMotion(reduced: boolean) {
    this.options = { ...this.options, reducedMotion: reduced }
  }

  get canvas() {
    return this.app.canvas
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.events.clear()
    this.app.destroy({ removeView: true }, { children: true })
  }
}
