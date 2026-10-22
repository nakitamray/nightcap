import { Container, Graphics } from 'pixi.js'
import type { Rng } from '../rng'
import type { ThemeId } from '../themes/types'
import type { Layout } from './layout'
import type { Plan } from './plan'
import { project, scaleAt, type P3 } from './projection'

/** the things in a room you can click on to change */
export type Thing =
  | 'bed'
  | 'nightstand'
  | 'wall'
  | 'window'
  | 'posters'
  | 'furniture'
  | 'lamp'
  | 'rug'
  | 'desk'
  | 'led'
  | 'vinyl'
  | 'map'
  | 'pet'

/** a pool of light, for the night-time shading pass (view units) */
export interface Light {
  x: number
  y: number
  r: number
  /** 0..1, how much darkness it cuts through */
  k: number
}

export interface Pin {
  lat: number
  lon: number
  name: string
  me?: boolean
}

/** everything the drawing code needs, handed down from the scene */
export class Ctx {
  readonly hits: [Thing, Graphics][] = []
  readonly pools: Light[] = []
  readonly anim: ((t: number, dt: number) => void)[] = []
  /** containers that brighten when you hover what they belong to */
  readonly groups = new Map<Thing, Container[]>()
  /** layers that change every frame; everything else gets cached as a picture */
  readonly moving = new Set<Container>()

  constructor(
    readonly layout: Layout,
    readonly plan: Plan,
    readonly theme: ThemeId,
    readonly rng: Rng,
    readonly back: Container,
    readonly lights: Container,
    readonly playing: boolean,
    readonly pins: Pin[],
  ) {}

  /** a fresh layer on top of everything drawn so far */
  layer(thing?: Thing) {
    const g = new Graphics()
    this.back.addChild(g)
    if (thing) this.own(thing, g)
    return g
  }

  container(thing?: Thing) {
    const c = new Container()
    this.back.addChild(c)
    if (thing) this.own(thing, c)
    return c
  }

  /** marks a layer as animated, so it's never baked into a cached picture */
  live<T extends Container>(c: T) {
    this.moving.add(c)
    return c
  }

  own(thing: Thing, c: Container) {
    const list = this.groups.get(thing) ?? []
    list.push(c)
    this.groups.set(thing, list)
  }

  /** register a click target, later ones win */
  hit(thing: Thing, shape: (g: Graphics) => void) {
    const g = new Graphics()
    shape(g)
    g.fill(0xffffff)
    this.hits.push([thing, g])
  }

  pool(at: P3, r: number, k: number) {
    const [x, y] = project(at)
    this.pools.push({ x, y, r: r * scaleAt(at[2]), k })
  }
}

/** screen position and size for little flat objects standing at a point */
export function at(p: P3) {
  const [x, y] = project(p)
  return { x, y, s: scaleAt(p[2]) }
}
