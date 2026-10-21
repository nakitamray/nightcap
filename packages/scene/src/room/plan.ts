// Works out where everything goes in a room so nothing ever overlaps: which
// stretches of wall are free for the room's own furniture and any bookcases
// you add, and which bits of wall above them are left for shelves, the neon
// sign and your posters. Pure, so the editor can ask how much room is left.

import type { Layout, Side } from './layout'
import { variantFor, type Extra, type Variant } from './variants'

export type ZoneName = 'front' | 'mid' | 'back'

export interface Zone {
  wall: Side
  name: ZoneName
  z0: number
  z1: number
}

export interface Piece {
  kind: Extra
  zone: Zone
}

/** a rectangle of side wall, in room units */
export interface WallSlot {
  wall: Side
  z0: number
  z1: number
  y0: number
  y1: number
}

export interface Plan {
  variant: Variant
  pieces: Piece[]
  shelves: WallSlot[]
  posters: WallSlot[]
  neon: WallSlot | null
  /** how many bookcases there's floor space for */
  maxShelves: number
}

const SPANS: Record<ZoneName, [number, number]> = {
  front: [14, 114],
  mid: [128, 274],
  back: [290, 396],
}

/** the bands of wall above the furniture */
export const BANDS = {
  low: [150, 250],
  shelf: [272, 336],
  high: [352, 420],
} as const

/** how tall each thing stands, and where it's allowed to go */
const FIT: Record<Extra, { h: number; zones: ZoneName[] }> = {
  bookcase: { h: 340, zones: ['back', 'front', 'mid'] },
  sofa: { h: 84, zones: ['mid'] },
  armchair: { h: 90, zones: ['front', 'back', 'mid'] },
  piano: { h: 132, zones: ['mid', 'back'] },
  easel: { h: 200, zones: ['front'] },
  records: { h: 74, zones: ['back', 'front', 'mid'] },
  plantstand: { h: 124, zones: ['front', 'back', 'mid'] },
  tree: { h: 300, zones: ['front'] },
  ladder: { h: 262, zones: ['back', 'front', 'mid'] },
  trunk: { h: 52, zones: ['front', 'back', 'mid'] },
  floorlamp: { h: 150, zones: ['front', 'back'] },
  mirror: { h: 250, zones: ['front'] },
  monstera: { h: 170, zones: ['back', 'front', 'mid'] },
}

export function zone(wall: Side, name: ZoneName): Zone {
  const [z0, z1] = SPANS[name]
  return { wall, name, z0, z1 }
}

/** how high whatever's against this bit of wall reaches */
function heightOf(layout: Layout, variant: Variant, z: Zone, pieces: Piece[]) {
  const piece = pieces.find((p) => p.zone.wall === z.wall && p.zone.name === z.name)
  if (piece) return FIT[piece.kind].h
  if (z.wall === layout.desk.wall && z.name === 'mid') {
    return { table: 80, trestle: 84, hutch: 180, secretary: 236 }[variant.desk]
  }
  const bedHere =
    layout.bed.spot === 'right'
      ? z.wall === 'right' && z.name !== 'front'
      : z.wall === 'right' && z.name === 'back'
  if (bedHere) return layout.bed.style === 'canopy' ? 300 : 124
  return 0
}

export function planRoom(layout: Layout, room: number): Plan {
  const variant = variantFor(room)

  // stretches of floor along the side walls nobody's using yet
  const free: Zone[] = [zone('left', 'back'), zone('right', 'front'), zone('left', 'front')]
  if (layout.desk.wall === 'right') free.push(zone('left', 'mid'))
  else if (layout.bed.spot === 'window') free.push(zone('right', 'mid'))

  const pieces: Piece[] = []
  const place = (kind: Extra) => {
    const i = free.findIndex((z) => FIT[kind].zones.includes(z.name))
    if (i < 0) return false
    pieces.push({ kind, zone: free[i]! })
    free.splice(i, 1)
    return true
  }
  const bookcaseZones = free.filter((z) => FIT.bookcase.zones.includes(z.name)).length
  // bookcases you asked for go in first, then whatever the room comes with
  for (let i = 0; i < layout.shelves; i++) place('bookcase')
  for (const extra of variant.extras) place(extra)

  // now the walls above it all
  const order: Zone[] = [
    zone('left', 'mid'),
    zone('right', 'mid'),
    zone('left', 'back'),
    zone('right', 'back'),
    zone('left', 'front'),
    zone('right', 'front'),
  ]
  const shelves: WallSlot[] = []
  const low: WallSlot[] = []
  const high: WallSlot[] = []
  for (const z of order) {
    const h = heightOf(layout, variant, z, pieces)
    const split = (y0: number, y1: number) => {
      const n = z.z1 - z.z0 > 130 ? 2 : 1
      const step = (z.z1 - z.z0) / n
      return Array.from({ length: n }, (_, i): WallSlot => ({
        wall: z.wall,
        z0: z.z0 + step * i,
        z1: z.z0 + step * (i + 1),
        y0,
        y1,
      }))
    }
    if (h < BANDS.low[0] - 20) low.push(...split(BANDS.low[0], BANDS.low[1]))
    if (h < BANDS.shelf[0] - 10 && shelves.length < 3)
      shelves.push({ wall: z.wall, z0: z.z0, z1: z.z1, y0: BANDS.shelf[0], y1: BANDS.shelf[1] })
    if (h < BANDS.high[0] - 10) high.push(...split(BANDS.high[0], BANDS.high[1]))
  }
  // the neon sign takes the first high spot on the right wall, if there is one
  const ni = high.findIndex((s) => s.wall === 'right')
  const neon = ni >= 0 ? high.splice(ni, 1)[0]! : null

  return {
    variant,
    pieces,
    shelves,
    posters: [...low, ...high],
    neon,
    maxShelves: Math.min(3, bookcaseZones),
  }
}
