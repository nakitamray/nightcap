// Works out where everything goes in a room so nothing ever overlaps: the
// bed, nightstand and desk, which stretches of floor are free for furniture
// (yours first, then whatever the room comes with), and which bits of wall
// are left over for shelves, the neon sign and posters. Pure, so the editor
// can ask what still fits.

import type { Layout, Side } from './layout'
import { variantFor, windowSize, type Extra, type Variant } from './variants'

export type ZoneName = 'front' | 'mid' | 'back' | 'floor'

/** a stretch of floor along a side wall, `inset` out from the wall itself */
export interface Zone {
  wall: Side
  name: ZoneName
  z0: number
  z1: number
  inset: number
}

export interface Piece {
  kind: Extra
  zone: Zone
  /** added by the owner rather than part of the room */
  mine: boolean
}

/** a rectangle of side wall, in room units */
export interface WallSlot {
  wall: Side
  z0: number
  z1: number
  y0: number
  y1: number
}

export interface Span {
  x0: number
  x1: number
  z0: number
  z1: number
}

export interface Plan {
  variant: Variant
  half: number
  height: number
  pane: { half: number; top: number; reach: number }
  bed: Span
  nightstand: Span & { h: number }
  desk: { wall: Side; z0: number; z1: number }
  /** the low bookcase under the window, if the bed isn't there */
  lowShelf: Span | null
  pieces: Piece[]
  shelves: WallSlot[]
  posters: WallSlot[]
  neon: WallSlot | null
  /** floor still free once your own furniture is in */
  free: Zone[]
}

const SPANS: Record<Exclude<ZoneName, 'floor'>, [number, number]> = {
  front: [14, 114],
  mid: [128, 274],
  back: [290, 396],
}

/** how tall each thing stands (in a room `height` high) and where it may go */
export function fit(kind: Extra, height: number): { h: number; zones: ZoneName[] } {
  const tall = (h: number) => Math.min(h, height - 60)
  const table: Record<Extra, { h: number; zones: ZoneName[] }> = {
    bookcase: { h: tall(340), zones: ['back', 'front', 'mid'] },
    sofa: { h: 84, zones: ['mid'] },
    loveseat: { h: 80, zones: ['mid', 'front', 'back'] },
    armchair: { h: 118, zones: ['front', 'back', 'mid'] },
    lounger: { h: 76, zones: ['floor', 'front', 'back', 'mid'] },
    beanbag: { h: 50, zones: ['floor', 'front', 'back', 'mid'] },
    pouf: { h: 40, zones: ['floor', 'front', 'back', 'mid'] },
    dresser: { h: 112, zones: ['back', 'mid', 'front'] },
    piano: { h: 132, zones: ['mid', 'back'] },
    easel: { h: 200, zones: ['front'] },
    records: { h: 80, zones: ['back', 'front', 'mid'] },
    plantstand: { h: 124, zones: ['front', 'back', 'mid'] },
    tree: { h: tall(300), zones: ['front'] },
    ladder: { h: tall(262), zones: ['back', 'front', 'mid'] },
    trunk: { h: 52, zones: ['front', 'back', 'mid'] },
    floorlamp: { h: 150, zones: ['front', 'back'] },
    mirror: { h: tall(250), zones: ['front'] },
    monstera: { h: 170, zones: ['back', 'front', 'mid'] },
  }
  return table[kind]
}

export function zone(wall: Side, name: Exclude<ZoneName, 'floor'>, z1?: number): Zone {
  const [z0, end] = SPANS[name]
  return { wall, name, z0, z1: z1 ?? end, inset: 0 }
}

export function planRoom(layout: Layout, room: number): Plan {
  const base = variantFor(room)
  const { half, height } = base
  const win = windowSize(base)
  // everything downstream reads the window off the variant, so fit it here
  const variant = { ...base, paneHalf: win.paneHalf, paneTop: win.paneTop }
  const R = half

  // the bed and its nightstand, against the right wall or under the window
  const underWindow = layout.bed.spot === 'window'
  const bed: Span = underWindow
    ? { x0: -46, x1: R, z0: 274, z1: 400 }
    : { x0: R - 126, x1: R, z0: 166, z1: 400 }
  const nightstand = underWindow
    ? { x0: R - 46, x1: R - 4, z0: 226, z1: 268, h: 62 }
    : { x0: R - 176, x1: R - 132, z0: 354, z1: 396, h: 62 }
  // a desk on the right shares the wall with the nightstand, so it's shorter
  const desk = {
    wall: layout.desk.wall,
    z0: 128,
    z1: underWindow && layout.desk.wall === 'right' ? 216 : 274,
  }
  let lowShelf: Span | null = null
  if (!underWindow) {
    const x0 = -(win.paneHalf - 8)
    const x1 = Math.min(win.paneHalf - 8, nightstand.x0 - 8)
    if (x1 - x0 > 60) lowShelf = { x0, x1, z0: 364, z1: 400 }
  }

  // stretches of floor along the side walls nobody's using yet
  const free: Zone[] = [zone('left', 'back'), zone('right', 'front'), zone('left', 'front')]
  if (layout.desk.wall === 'right') free.push(zone('left', 'mid'))
  else if (underWindow) free.push(zone('right', 'mid', 216))
  // wide rooms have space out in the room for a beanbag or a big soft chair
  if (half >= 220) {
    for (const wall of ['left', 'right'] as Side[])
      free.push({ wall, name: 'floor', z0: 24, z1: 104, inset: 112 })
  }

  const pieces: Piece[] = []
  const place = (kind: Extra, mine: boolean) => {
    const zones = fit(kind, height).zones
    // the most natural spot first: the order the kind lists its zones in
    for (const name of zones) {
      const i = free.findIndex((z) => z.name === name)
      if (i < 0) continue
      pieces.push({ kind, zone: free[i]!, mine })
      free.splice(i, 1)
      return true
    }
    return false
  }
  for (const kind of layout.furniture) place(kind, true)
  const left = [...free]
  for (const kind of variant.extras) place(kind, false)

  // now the walls above it all, in bands that follow the ceiling
  const bands = {
    low: [150, Math.min(250, height - 190)] as const,
    shelf: [height - 168, height - 104] as const,
    high: [height - 88, height - 20] as const,
  }
  const reach = (wall: Side, name: ZoneName): number => {
    const piece = pieces.find((p) => p.zone.wall === wall && p.zone.name === name)
    if (piece) return fit(piece.kind, height).h
    if (wall === desk.wall && name === 'mid')
      return { table: 80, trestle: 84, hutch: 180, secretary: 236 }[variant.desk]
    const bedHere = underWindow
      ? wall === 'right' && name === 'back'
      : wall === 'right' && name !== 'front'
    if (bedHere) return layout.bed.style === 'canopy' ? Math.min(330, height - 60) : 124
    return 0
  }
  const wallZones = (['mid', 'back', 'front'] as const).flatMap((name) =>
    (['left', 'right'] as Side[]).map((wall) => zone(wall, name)),
  )
  const shelves: WallSlot[] = []
  const low: WallSlot[] = []
  const high: WallSlot[] = []
  for (const z of wallZones) {
    const h = reach(z.wall, z.name)
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
    if (bands.low[1] - bands.low[0] >= 60 && h < bands.low[0] - 20)
      low.push(...split(bands.low[0], bands.low[1]))
    if (h < bands.shelf[0] - 10 && shelves.length < 3)
      shelves.push({ wall: z.wall, z0: z.z0, z1: z.z1, y0: bands.shelf[0], y1: bands.shelf[1] })
    if (h < bands.high[0] - 10) high.push(...split(bands.high[0], bands.high[1]))
  }
  // the neon sign takes the first high spot on the right wall, if there is one
  const ni = high.findIndex((s) => s.wall === 'right')
  const neon = ni >= 0 ? high.splice(ni, 1)[0]! : null

  return {
    variant,
    half,
    height,
    pane: { half: win.paneHalf, top: win.paneTop, reach: win.reach },
    bed,
    nightstand,
    desk,
    lowShelf,
    pieces,
    shelves,
    posters: [...low, ...high],
    neon,
    free: left,
  }
}

/** whether there's still floor for one more of these */
export function canAdd(plan: Plan, kind: Extra) {
  const zones = fit(kind, plan.height).zones
  return plan.free.some((z) => zones.includes(z.name))
}
