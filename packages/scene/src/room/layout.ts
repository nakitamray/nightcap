// What someone's room looks like: the bit that gets saved (memberships.layout).
// Every room starts from its own defaults (see variants.ts) and anything that
// comes back from the database goes through readLayout, so a half-written or
// old layout can't break the page.

import { variantFor, type Extra } from './variants'

export type Side = 'left' | 'right'
export type BedSpot = 'right' | 'window'
export type BedStyle = 'iron' | 'wood' | 'canopy' | 'brass' | 'platform'
export const BED_STYLES: BedStyle[] = ['iron', 'wood', 'canopy', 'brass', 'platform']
export type PaneShape = 'rect' | 'arch' | 'circle'
/** table lamps stand on the nightstand; the lantern hangs from the ceiling */
export type LampStyle = 'tiffany' | 'fringe' | 'scallop' | 'floral' | 'banker' | 'lantern'
export const LAMP_STYLES: LampStyle[] = [
  'tiffany',
  'fringe',
  'scallop',
  'floral',
  'banker',
  'lantern',
]
export type RugShape = 'none' | 'rect' | 'circle' | 'oval' | 'diamond'
export type NightstandStyle = 'drawers' | 'skirted' | 'suitcases'
export const NIGHTSTAND_STYLES: NightstandStyle[] = ['drawers', 'skirted', 'suitcases']

export type PetKind = 'none' | 'cat' | 'dog'
export const CAT_BREEDS = ['black', 'tabby', 'white', 'persian', 'grey'] as const
export const DOG_BREEDS = ['terrier', 'labradoodle', 'golden', 'shepherd'] as const
export type CatBreed = (typeof CAT_BREEDS)[number]
export type DogBreed = (typeof DOG_BREEDS)[number]
export type Pet =
  { kind: 'none' } | { kind: 'cat'; breed: CatBreed } | { kind: 'dog'; breed: DogBreed }

/** furniture you can add yourself, on top of what the room comes with */
export const ADDABLE: Extra[] = [
  'bookcase',
  'lounger',
  'beanbag',
  'loveseat',
  'armchair',
  'pouf',
  'dresser',
  'plantstand',
  'floorlamp',
  'records',
  'monstera',
]
export const MAX_FURNITURE = 5

export interface Layout {
  wall: string
  bed: {
    spot: BedSpot
    style: BedStyle
    frame: string
    sheets: string
    pillows: string
    blanket: string
  }
  nightstand: NightstandStyle
  window: { shape: PaneShape; curtains: boolean; curtainColor: string }
  /** poster designs, in the order they go up on the walls */
  posters: number[]
  /** furniture added on top of what the room comes with, placed first */
  furniture: Extra[]
  lamp: LampStyle
  rug: { shape: RugShape; color: string }
  desk: { wall: Side; color: string }
  /** colour of the strip round the ceiling, or null when it's off */
  led: string | null
  pet: Pet
}

export const POSTER_COUNT = 16
export const MAX_POSTERS = 10

/** how a room starts out, before its owner changes anything */
export function defaultLayout(room = 0): Layout {
  const v = variantFor(room).start
  return {
    wall: v.wall,
    bed: {
      spot: v.spot ?? 'right',
      style: v.bed,
      frame: v.frame,
      sheets: v.sheets,
      pillows: v.pillows,
      blanket: v.blanket,
    },
    nightstand: NIGHTSTAND_STYLES[room % NIGHTSTAND_STYLES.length]!,
    window: { shape: v.shape, curtains: true, curtainColor: v.curtains },
    posters: v.posters,
    furniture: [],
    lamp: v.lamp,
    rug: { shape: 'rect', color: v.rug },
    desk: { wall: v.deskWall ?? 'left', color: v.desk },
    led: v.led,
    pet: { kind: 'cat', breed: 'black' },
  }
}

export const DEFAULT_LAYOUT: Layout = defaultLayout(0)

const HEX = /^#[0-9a-f]{6}$/i

function pick<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback
}

function colour(value: unknown, fallback: string) {
  return typeof value === 'string' && HEX.test(value) ? value.toLowerCase() : fallback
}

function obj(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

/** turns whatever's saved into a layout we can draw, filling gaps with the defaults */
export function readLayout(raw: unknown, room = 0): Layout {
  const r = obj(raw)
  const d = defaultLayout(room)
  const bed = obj(r.bed)
  const win = obj(r.window)
  const rug = obj(r.rug)
  const desk = obj(r.desk)

  const layout: Layout = {
    wall: colour(r.wall, d.wall),
    bed: {
      spot: pick(bed.spot, ['right', 'window'], d.bed.spot),
      style: pick(bed.style, BED_STYLES, d.bed.style),
      frame: colour(bed.frame, d.bed.frame),
      sheets: colour(bed.sheets, d.bed.sheets),
      pillows: colour(bed.pillows, d.bed.pillows),
      blanket: colour(bed.blanket, d.bed.blanket),
    },
    nightstand: pick(r.nightstand, NIGHTSTAND_STYLES, d.nightstand),
    window: {
      shape: pick(win.shape, ['rect', 'arch', 'circle'], d.window.shape),
      curtains: typeof win.curtains === 'boolean' ? win.curtains : d.window.curtains,
      curtainColor: colour(win.curtainColor, d.window.curtainColor),
    },
    posters: readPosters(r, d.posters),
    furniture: readFurniture(r),
    lamp: pick(r.lamp, LAMP_STYLES, d.lamp),
    rug: {
      shape: pick(rug.shape, ['none', 'rect', 'circle', 'oval', 'diamond'], d.rug.shape),
      color: colour(rug.color, d.rug.color),
    },
    desk: {
      wall: pick(desk.wall, ['left', 'right'], d.desk.wall),
      color: colour(desk.color, d.desk.color),
    },
    led: r.led === null ? null : colour(r.led, d.led ?? '') || null,
    pet: readPet(r.pet, d.pet),
  }
  return settle(layout, room)
}

function readPosters(r: Record<string, unknown>, fallback: number[]) {
  const ok = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0
  if (Array.isArray(r.posters))
    return r.posters
      .filter(ok)
      .map((n) => n % POSTER_COUNT)
      .slice(0, MAX_POSTERS)
  // rooms saved before posters had a couple of framed pictures instead
  if (Array.isArray(r.frames))
    return r.frames
      .map((f) => obj(f).art)
      .filter(ok)
      .map((n) => n % POSTER_COUNT)
  return fallback
}

function readFurniture(r: Record<string, unknown>): Extra[] {
  if (Array.isArray(r.furniture)) {
    return r.furniture
      .filter((k): k is Extra => ADDABLE.includes(k as Extra))
      .slice(0, MAX_FURNITURE)
  }
  // rooms saved before furniture could only ask for extra bookcases
  const shelves = Number.isInteger(r.shelves) ? Math.max(0, Math.min(3, r.shelves as number)) : 0
  return Array.from({ length: shelves }, () => 'bookcase' as const)
}

function readPet(raw: unknown, fallback: Pet): Pet {
  const p = obj(raw)
  if (p.kind === 'none') return { kind: 'none' }
  if (p.kind === 'dog') return { kind: 'dog', breed: pick(p.breed, DOG_BREEDS, 'golden') }
  if (p.kind === 'cat') return { kind: 'cat', breed: pick(p.breed, CAT_BREEDS, 'black') }
  return fallback
}

/** the desk can only go on the right wall when the bed isn't there */
export function deskCanGoRight(layout: Layout) {
  return layout.bed.spot === 'window'
}

/** fixes up combinations that can't physically happen */
export function settle(layout: Layout, room = 0): Layout {
  let l = layout
  if (l.desk.wall === 'right' && !deskCanGoRight(l)) l = { ...l, desk: { ...l.desk, wall: 'left' } }
  // rooms with fairy lights don't get a strip as well
  if (variantFor(room).fairy && l.led !== null) l = { ...l, led: null }
  return l
}
