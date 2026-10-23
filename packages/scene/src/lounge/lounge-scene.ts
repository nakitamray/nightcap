import { AdvancedBloomFilter } from 'pixi-filters'
import {
  Application,
  Container,
  Matrix,
  RenderTexture,
  Sprite,
  Texture,
  type PointData,
} from 'pixi.js'
import type { Guest } from '../characters/guest'
import type { Conditions } from '../conditions'
import { Emitter } from '../emitter'
import { PaperFilter } from '../filters/PaperFilter'
import { loadDisplayFont } from '../fonts'
import { WORLD } from '../layout'
import { createRng, hashString } from '../rng'
import { Ctx, type Light } from '../room/context'
import { defaultLayout } from '../room/layout'
import { planRoom } from '../room/plan'
import { setRoomShape, VIEW } from '../room/projection'
import { VIEWS } from '../room/window'
import { StreetWorld } from '../street-world'
import type { ThemeId } from '../themes/types'
import { nameTag, seatGuest, seatPet, type Placed } from './guests'
import { ceilingLights, floorLamp } from './lamps'
import {
  armchair,
  barCart,
  beanbag,
  bookshelf,
  clutter,
  coffeeTable,
  counter,
  fireplace,
  floorCushion,
  gallery,
  hangingPlant,
  mediaWall,
  metalShelf,
  pouf,
  sideTable,
  sofa,
  stool,
  tree,
} from './pieces'
import { planLounge, type LoungePlan, type Seat } from './plan'
import { drawRug } from './rugs'
import { drawShell, drawWindows, glassBounds } from './shell'

export interface LoungeOptions {
  theme: ThemeId
  /** the house id: every house's living room is its own */
  seed: string
  /** whoever's in here right now, in the order they get seats */
  people: Guest[]
  reducedMotion?: boolean
  /** the weather and time outside, if not the usual night */
  conditions?: Conditions
}

export interface LoungeEvents extends Record<string, unknown> {
  /** someone was clicked: their id */
  pick: string
  hover: string | null
}

const SHADE = { x: -700, y: -500, width: 2400, height: 1900 }
const MAX_CACHE = 2600

/**
 * The house's living room: the same flat colour, ink, bloom and paper as
 * everywhere else, the city live through a wall of glass, and everyone who's
 * in sat about on the sofas and cushions with their pets.
 */
export class LoungeScene {
  readonly events = new Emitter<LoungeEvents>()
  private view = new Container()
  private content: Container | null = null
  private runs: Container[] = []
  private tags = new Container()
  private street: StreetWorld
  private streetTexture: RenderTexture | null = null
  private streetSprite = new Sprite()
  private streetMatrix = new Matrix()
  private ctx: Ctx | null = null
  private plan: LoungePlan
  private placed: Placed[] = []
  private paper = new PaperFilter()
  private hovered: string | null = null
  private time = 0
  private frame = 0
  private destroyed = false
  private shadeTexture: Texture | null = null

  private constructor(
    private app: Application,
    private options: LoungeOptions,
  ) {
    this.plan = planLounge(options.theme, options.seed)
    this.street = new StreetWorld({
      theme: options.theme,
      seed: 1931,
      reducedMotion: options.reducedMotion ?? false,
    })
    this.street.lowDetail()
    this.applyConditions()
  }

  static async create(host: HTMLElement, options: LoungeOptions) {
    const app = new Application()
    await app.init({
      resizeTo: host,
      preference: 'webgl',
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 1.5),
      background: 0x07080d,
    })
    await loadDisplayFont()
    const scene = new LoungeScene(app, options)
    scene.build()
    host.appendChild(app.canvas)
    return scene
  }

  private build() {
    const { app } = this
    app.stage.addChild(this.view)
    this.view.addChild(this.tags)
    app.stage.filters = [this.paper]
    app.stage.filterArea = app.screen
    app.stage.eventMode = 'static'
    app.stage.hitArea = app.screen
    app.stage.on('pointermove', (e) => this.hover(this.guestAt(e.global)))
    app.stage.on('pointertap', (e) => {
      const id = this.guestAt(e.global)
      if (id) this.events.emit('pick', id)
    })
    app.canvas.addEventListener('pointerleave', () => this.hover(null))
    this.layout(app.screen.width, app.screen.height)
    app.renderer.on('resize', (w: number, h: number) => this.layout(w, h))
    app.ticker.add((t) => this.tick(t.deltaMS))
  }

  /** the street world may know about weather and daylight; pass it on if so */
  private applyConditions() {
    const c = this.options.conditions
    const street = this.street as unknown as { setConditions?: (c: Conditions) => void }
    if (c && street.setConditions) street.setConditions(c)
  }

  private draw() {
    this.streetSprite.removeFromParent()
    this.content?.destroy({ children: true })
    this.runs = []
    this.placed = []

    const plan = this.plan
    setRoomShape(plan.half, plan.height)
    const back = new Container()
    const lights = new Container()
    lights.filters = [
      new AdvancedBloomFilter({ threshold: 0.25, bloomScale: 1.1, brightness: 1, blur: 6, quality: 3 }),
    ]
    // the drawing helpers are shared with the bedrooms, which hand them a
    // room layout; the living room doesn't use it, so any will do
    const layout = defaultLayout(0)
    const ctx = (this.ctx = new Ctx(
      layout,
      planRoom(layout, 0),
      plan.theme,
      createRng(hashString(`lounge-clutter:${this.options.seed}`)),
      back,
      lights,
      false,
      [],
    ))

    this.fitStreet()
    drawShell(ctx, plan)
    drawWindows(ctx, plan, this.streetSprite)
    gallery(ctx, plan)
    if (plan.theme === 'paris') fireplace(ctx, plan)
    for (const rug of plan.rugs) drawRug(ctx, rug)

    // who sits where: seats fill in order, so nobody moves when someone arrives
    const people = this.options.people.slice(0, plan.seats.length)
    const sitting = new Map<Seat, Guest>()
    people.forEach((g, i) => sitting.set(plan.seats[i]!, g))
    const occupy = (seat: Seat) => {
      const guest = sitting.get(seat)
      if (guest) this.placed.push(seatGuest(ctx, seat, guest))
    }

    // everything else back to front by how far forward it comes
    const items: [number, () => void][] = [
      [plan.trees[0]!.z - 30, () => tree(ctx, plan.trees[0]!.kind, plan.trees[0]!.x, plan.trees[0]!.z, plan.trees[0]!.size)],
      [282, () => bookshelf(ctx, plan)],
      [250, () => counter(ctx, plan)],
      [plan.floorLamps[0]!.z - 10, () => floorLamp(ctx, plan.floorLamps[0]!.kind, plan.floorLamps[0]!.x, plan.floorLamps[0]!.z, -plan.books)],
      [206, () => metalShelf(ctx, plan)],
      [plan.trees[1]!.z - 30, () => tree(ctx, plan.trees[1]!.kind, plan.trees[1]!.x, plan.trees[1]!.z, plan.trees[1]!.size)],
      [plan.floorLamps[1]!.z - 10, () => floorLamp(ctx, plan.floorLamps[1]!.kind, plan.floorLamps[1]!.x, plan.floorLamps[1]!.z, plan.books)],
      [
        plan.sofaZ,
        () => {
          sofa(ctx, plan)
          plan.seats.filter((s) => s.on === 'sofa').forEach(occupy)
        },
      ],
      [plan.sofaZ - 22, () => clutter(ctx, plan)],
      [plan.sideTable.z - 18, () => sideTable(ctx, plan)],
      [plan.sofaZ - 70 - 26, () => coffeeTable(ctx, plan)],
      [100, () => mediaWall(ctx, plan)],
      [108, () => barCart(ctx, plan)],
    ]
    let chair = 0
    let cushions = 0
    for (const seat of plan.seats) {
      const front = seat.z - 30
      switch (seat.on) {
        case 'armchair': {
          const colour = plan.chairs[chair++ % 2]!
          items.push([front, () => (armchair(ctx, plan, seat, colour), occupy(seat))])
          break
        }
        case 'stool':
          items.push([seat.z - 14, () => (stool(ctx, seat, plan.theme === 'new-york' ? 0x2a2624 : 0xd9a54a), occupy(seat))])
          break
        case 'cushion': {
          const i = cushions++
          items.push([front, () => (floorCushion(ctx, plan, seat, i), occupy(seat))])
          break
        }
        case 'beanbag':
          items.push([front, () => (beanbag(ctx, seat, plan.chairs[1]), occupy(seat))])
          break
        case 'pouf':
          items.push([front, () => (pouf(ctx, seat, plan.accent), occupy(seat))])
          break
      }
      const guest = sitting.get(seat)
      if (guest?.pet && guest.pet.kind !== 'none') items.push([seat.pet[2] - 12, () => seatPet(ctx, seat, guest)])
    }
    items.sort((a, b) => b[0] - a[0])
    for (const [, draw] of items) draw()

    plan.hanging.forEach((h, i) => hangingPlant(ctx, h.x, h.z, h.drop, i))
    ceilingLights(ctx, plan)

    const night = new Sprite(this.shading(ctx.pools))
    night.position.set(SHADE.x, SHADE.y)
    night.width = SHADE.width
    night.height = SHADE.height
    night.blendMode = 'multiply'

    const content = (this.content = new Container())
    content.addChild(this.bake(back, ctx), night, lights)
    this.view.addChildAt(content, 0)
    this.drawTags()
    this.cacheRuns()
  }

  /** same trick as the bedrooms: everything still goes into cached pictures */
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

  private cacheRuns() {
    const res = this.app.renderer.resolution
    for (const run of this.runs) {
      run.cacheAsTexture(false)
      const b = run.getBounds()
      if (b.width * res < MAX_CACHE && b.height * res < MAX_CACHE)
        run.cacheAsTexture({ resolution: res, antialias: true })
    }
  }

  /** the window is one big texture behind all the panes */
  private fitStreet() {
    const k = this.view.scale.x || 1
    const box = glassBounds(this.plan)
    const width = Math.max(8, Math.ceil(box.w * k))
    const height = Math.max(8, Math.ceil(box.h * k))
    if (!this.streetTexture || this.streetTexture.width !== width || this.streetTexture.height !== height) {
      this.streetTexture?.destroy(true)
      this.streetTexture = RenderTexture.create({ width, height, resolution: this.app.renderer.resolution })
      this.streetSprite.texture = this.streetTexture
    }
    const view = VIEWS[this.options.theme]
    const scale = Math.max(box.h / view.h, box.w / (view.h * 1.2))
    const halfW = box.w / scale / 2
    const cx = Math.min(Math.max(view.cx, halfW), WORLD.width - halfW)
    const x = box.w / 2 - cx * scale
    const y = box.h / 2 - view.cy * scale
    this.streetMatrix.set(scale * k, 0, 0, scale * k, x * k, y * k)
    this.street.setRainTop(view.cy - box.h / scale / 2 - 100)
  }

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

  /** your own tag is always up; everyone else's shows when you point at them */
  private drawTags() {
    this.tags.removeChildren().forEach((c) => c.destroy({ children: true }))
    for (const p of this.placed) {
      if (!p.guest.me && p.guest.id !== this.hovered) continue
      this.tags.addChild(nameTag(p.guest.name, p.tagX, p.tagY, !!p.guest.me))
    }
  }

  private guestAt(global: PointData): string | null {
    const p = this.view.toLocal(global)
    // nearer people are drawn later, so check them first
    for (let i = this.placed.length - 1; i >= 0; i--) {
      const g = this.placed[i]!
      if (p.x >= g.x && p.x <= g.x + g.w && p.y >= g.y && p.y <= g.y + g.h) return g.guest.id
    }
    return null
  }

  private hover(id: string | null) {
    if (id === this.hovered) return
    this.hovered = id
    this.drawTags()
    this.app.canvas.style.cursor = id ? 'pointer' : ''
    this.events.emit('hover', id)
  }

  private layout(width: number, height: number) {
    const scale = Math.min(width / VIEW.width, height / VIEW.height)
    this.view.scale.set(scale)
    this.view.position.set((width - VIEW.width * scale) / 2, (height - VIEW.height * scale) / 2)
    this.paper.setScreen(width, height)
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

  /** someone came in or left; the room redraws with everyone in their seats */
  setPeople(people: Guest[]) {
    if (people === this.options.people) return
    this.options = { ...this.options, people }
    this.draw()
  }

  setConditions(conditions: Conditions) {
    this.options = { ...this.options, conditions }
    this.applyConditions()
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
