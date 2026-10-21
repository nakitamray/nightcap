import { AdvancedBloomFilter } from 'pixi-filters'
import { Application, Container, type PointData } from 'pixi.js'
import { Emitter } from './emitter'
import { PaperFilter } from './filters/PaperFilter'
import { loadDisplayFont } from './fonts'
import { CURB, fitWorld } from './layout'
import { House } from './layers/house'
import { Neighbors } from './layers/neighbors'
import { ParkedCars } from './layers/cars'
import { People } from './layers/people'
import { Rain } from './layers/rain'
import { Reflection } from './layers/reflection'
import { Sky } from './layers/sky'
import { Skyline } from './layers/skyline'
import { couple, Lampposts, morrisColumn, Pavement, PlaneTree } from './layers/street'
import type { RoomWindow } from './layers/window'
import { palette } from './palette'
import type { Rooms, SceneEvents, SceneOptions, WindowEvent } from './types'

const DEFAULT_SEED = 1931

export class StreetScene {
  readonly events = new Emitter<SceneEvents>()

  private world = new Container()
  private upper = new Container()
  private lights = new Container()
  private sky!: Sky
  private skyline!: Skyline
  private neighbors!: Neighbors
  private house!: House
  private lamps!: Lampposts
  private trees: PlaneTree[] = []
  private people!: People
  private rain!: Rain
  private reflection!: Reflection
  private paper = new PaperFilter()
  private bloom: AdvancedBloomFilter | null = null

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
      resolution: Math.min(window.devicePixelRatio || 1, 2),
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
    const seed = options.seed ?? DEFAULT_SEED
    const reduced = options.reducedMotion ?? false

    this.sky = new Sky(seed)
    this.skyline = new Skyline(seed + 1)
    this.neighbors = new Neighbors(seed + 2, this.lights)
    this.house = new House(seed + 3, this.lights)
    this.lamps = new Lampposts(this.lights)
    this.trees = [new PlaneTree(seed + 6, 220, 0.92), new PlaneTree(seed + 9, 2240, 0.96)]
    this.upper.addChild(
      this.sky,
      this.skyline,
      this.neighbors,
      this.house,
      morrisColumn(seed + 7),
      this.lamps,
      this.lights,
      ...this.trees,
    )

    this.bloom = new AdvancedBloomFilter({ threshold: 0.42, bloomScale: 0.8, brightness: 1, blur: 5, quality: 4 })
    this.lights.filters = [this.bloom]

    this.reflection = new Reflection(this.upper)
    this.rain = new Rain(seed + 4, reduced ? 50 : 160)

    // people and cars are on the pavement and road, below the line the
    // reflection mirrors around, so they live outside `upper`
    this.people = new People(seed + 10)
    const lovers = couple()
    lovers.position.set(1700, CURB - 12)
    lovers.scale.set(0.62)
    this.people.addStanding(lovers)
    const cars = new ParkedCars({ x: 700, y: CURB + 98 }, { x: 1850, y: CURB + 98 })

    this.world.addChild(
      this.upper,
      new Pavement(seed + 5),
      this.reflection,
      this.lamps.pools,
      this.people,
      cars,
      this.rain,
    )
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
    this.rain.setTop(-fit.y / fit.scale - 100)
  }

  private tick(deltaMs: number) {
    if (this.destroyed) return
    const dt = Math.min(deltaMs, 50) / 1000
    this.time += dt
    const t = this.time
    const reduced = this.options.reducedMotion ?? false

    this.sky.update(t, dt)
    this.skyline.update(t, reduced ? 0 : this.pointerX)
    this.neighbors.update(t, dt)
    this.house.update(t, dt, reduced)
    this.lamps.update(t)
    if (!reduced) for (const tree of this.trees) tree.update(t)
    this.people.update(dt, reduced)
    this.rain.update(reduced ? dt * 0.4 : dt)
    this.paper.time = t
    this.reflection.update(this.app.renderer, t)

    this.watchPerformance(deltaMs)
  }

  /** if the machine is struggling, drop the expensive bits rather than stutter */
  private watchPerformance(deltaMs: number) {
    this.frameMs += (deltaMs - this.frameMs) * 0.02
    if (this.degraded || this.time < 4 || this.frameMs < 28) return
    this.degraded = true
    this.lights.filters = []
    this.reflection.every = 4
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
    this.reflection.destroy()
    this.app.destroy({ removeView: true }, { children: true })
  }
}
