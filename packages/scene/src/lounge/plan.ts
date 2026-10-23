// The living room: one big shared room per house, the same bones in every
// city (a long sofa, armchairs, floor cushions, a counter with stools, books
// and the telly up one wall) but its own look in each, and its own mix in
// every house, picked from the house id. Pure, so it can be tested and so a
// house's living room never changes between visits.

import type { Pose } from '../characters/draw'
import { createRng, hashString, pick, range, type Rng } from '../rng'
import type { ThemeId } from '../themes/types'

export type LoungeFloor = 'herringbone' | 'planks' | 'terrazzo' | 'boards'
export type RugPattern = 'persian' | 'checker' | 'round' | 'stripes' | 'kilim' | 'tatami'
export type CoffeeTable = 'glass' | 'wood' | 'marble'
export type FloorLampKind = 'arc' | 'tripod' | 'shade' | 'globe'
export type TreeKind = 'fig' | 'olive' | 'palm' | 'monstera'
export type ChairStyle = 'club' | 'wingback' | 'tulip'

/** a pane of glass in the back wall */
export interface Pane {
  x0: number
  x1: number
  y0: number
  y1: number
  arch: boolean
}

export interface Rug {
  pattern: RugPattern
  cx: number
  cz: number
  rx: number
  rz: number
  colour: number
  second: number
}

/** somewhere to sit, and where that person's pet settles */
export interface Seat {
  x: number
  y: number
  z: number
  pose: Pose
  turn: -1 | 0 | 1
  /** what it is, for drawing order: sofa seats are drawn with the sofa and so on */
  on: 'sofa' | 'armchair' | 'stool' | 'cushion' | 'beanbag' | 'pouf'
  pet: readonly [number, number, number]
}

export interface LoungePlan {
  theme: ThemeId
  half: number
  height: number
  /** which side wall the books and the telly go on: -1 left, 1 right */
  books: -1 | 1
  floor: LoungeFloor
  wall: number
  trim: number
  wood: number
  sofa: number
  chairs: [number, number]
  accent: number
  panes: Pane[]
  /** how far back the long sofa stands (its front edge) */
  sofaZ: number
  coffee: CoffeeTable
  chairStyle: ChairStyle
  /** the little round table with a lamp on it */
  sideTable: { x: number; z: number }
  rugs: Rug[]
  /** floor lamps: kind and where, in floor-plan x/z */
  floorLamps: { kind: FloorLampKind; x: number; z: number }[]
  /** trees and big plants on the floor */
  trees: { kind: TreeKind; x: number; z: number; size: number }[]
  /** pots hanging from the ceiling */
  hanging: { x: number; z: number; drop: number }[]
  seats: Seat[]
  /** a neon sign over the counter, in the cities that go in for that */
  neon: string | null
  posters: number[]
}

interface City {
  half: number
  height: number
  floor: LoungeFloor
  walls: number[]
  trims: number[]
  woods: number[]
  sofas: number[]
  chairs: number[]
  accents: number[]
  rugs: RugPattern[]
  /** the sofa backs onto the window, or stands out in the room (Paris has a fireplace there) */
  sofa: 'back' | 'mid'
  panes: (rng: Rng, half: number, height: number) => Pane[]
  trees: TreeKind[]
  neon: string[]
}

const CITIES: Record<ThemeId, City> = {
  paris: {
    half: 300,
    height: 600,
    floor: 'herringbone',
    walls: [0xd8c8a8, 0x8aa08a, 0xc89a7a, 0x9ab0b8, 0xe0c0b0],
    trims: [0xf2e8d4],
    woods: [0x6a3a22, 0x8a5a3a, 0x4a2a1c],
    sofas: [0x2a4a6a, 0xc8642e, 0x5a2a3a, 0x3a5a4a, 0xd8b890],
    chairs: [0xc8302a, 0xe8c25a, 0x2f6b66, 0xd89aa0, 0x6a3a5a],
    accents: [0xe8c25a, 0xc8302a, 0xf2e2bd],
    rugs: ['persian', 'kilim', 'round', 'checker'],
    sofa: 'mid',
    // two tall french windows either side of the fireplace
    panes: (_rng, half, height) => {
      const w = Math.min(130, half * 0.42)
      const top = height - 120
      return [
        { x0: -half + 60, x1: -half + 60 + w, y0: 20, y1: top, arch: true },
        { x0: half - 60 - w, x1: half - 60, y0: 20, y1: top, arch: true },
      ]
    },
    trees: ['fig', 'olive', 'palm'],
    neon: [],
  },
  'new-york': {
    half: 320,
    height: 620,
    floor: 'planks',
    walls: [0x8a3a26, 0x9a4a2e, 0x7a3424],
    trims: [0x2a2624, 0x3a3634],
    woods: [0x6a4026, 0x3a2418, 0xa86a3a],
    sofas: [0x6a5a4a, 0x2f4a5a, 0xa8642e, 0x4a4a52, 0x8a3a2a],
    chairs: [0xf2e2bd, 0x2f6b66, 0xe8c25a, 0xc8302a],
    accents: [0xe8603a, 0xe8c25a, 0x2a4a8a],
    rugs: ['checker', 'kilim', 'stripes', 'persian'],
    sofa: 'back',
    // one big steel window, floor to ceiling, the skyline right there
    panes: (_rng, half, height) => [{ x0: -half + 50, x1: half - 50, y0: 18, y1: height - 40, arch: false }],
    trees: ['fig', 'monstera', 'palm'],
    neon: ['OPEN', 'LATE', 'HI'],
  },
  venice: {
    half: 300,
    height: 600,
    floor: 'terrazzo',
    walls: [0x8a2a2a, 0x2a4a4a, 0xc88a4a, 0x5a2a4a, 0xd8a890],
    trims: [0xe8d0a0, 0xd9a54a],
    woods: [0x4a2a1c, 0x6a3a22],
    sofas: [0x7a1a3a, 0x1e4a4a, 0x8a5a1a, 0x2a2a5a],
    chairs: [0xe8c25a, 0xc8642e, 0x2f6b66, 0xd89aa0],
    accents: [0xd9a54a, 0x2f8a8a, 0xc8302a],
    rugs: ['persian', 'kilim', 'round', 'persian'],
    sofa: 'back',
    // three pointed arches onto the canal
    panes: (_rng, half, height) => {
      const w = (half * 2 - 160) / 3
      const top = height - 110
      return [0, 1, 2].map((i) => ({
        x0: -half + 50 + i * (w + 30),
        x1: -half + 50 + i * (w + 30) + w,
        y0: 30,
        y1: top,
        arch: true,
      }))
    },
    trees: ['palm', 'olive', 'fig'],
    neon: [],
  },
  tokyo: {
    half: 310,
    height: 580,
    floor: 'boards',
    walls: [0xe8dcc0, 0x3a3a48, 0xc8b898, 0x5a4a5a],
    trims: [0x2a2420, 0x6a4a2a],
    woods: [0xb8864a, 0x8a5a2e, 0x3a2418],
    sofas: [0x8a8a7a, 0x2a3a5a, 0xc8642e, 0x5a6a4a],
    chairs: [0xe8c25a, 0xff7a9a, 0x2f6b66, 0xf2e2bd],
    accents: [0xff3a6a, 0x3ad8ff, 0xe8c25a],
    rugs: ['tatami', 'checker', 'stripes', 'round'],
    sofa: 'back',
    // a wide window with thin frames, neon towers beyond
    panes: (_rng, half, height) => [{ x0: -half + 40, x1: half - 40, y0: 40, y1: height - 60, arch: false }],
    trees: ['monstera', 'fig', 'palm'],
    neon: ['NIGHTCAP', 'RAMEN', 'KISSA'],
  },
}

const RUG_COLOURS = [0xc8302a, 0x2a4a8a, 0x2f6b66, 0xc88a1a, 0x5a2a5a, 0xe8603a, 0x1e1a1c, 0x8a5a3a]

/** where everything goes in this house's living room */
export function planLounge(theme: ThemeId, seed: string): LoungePlan {
  const city = CITIES[theme]
  const rng = createRng(hashString(`lounge:${theme}:${seed}`))
  const { half, height } = city
  const books: -1 | 1 = rng() < 0.5 ? -1 : 1
  const counter = -books
  const sofaZ = city.sofa === 'back' ? 300 : 210
  const coffeeZ = sofaZ - 70

  // rugs, layered: a big one under the sofa and table, one out front under
  // the floor cushions, and one more somewhere for good measure
  const rugColour = () => pick(rng, RUG_COLOURS)
  const rugs: Rug[] = [
    {
      pattern: pick(rng, city.rugs),
      cx: range(rng, -20, 20),
      cz: coffeeZ + 30,
      rx: range(rng, 170, 210),
      rz: 90,
      colour: rugColour(),
      second: 0xf2e2bd,
    },
    {
      pattern: theme === 'tokyo' ? 'tatami' : pick(rng, ['checker', 'stripes', 'round'] as const),
      cx: books * range(rng, 40, 80),
      cz: 70,
      rx: range(rng, 110, 140),
      rz: 55,
      colour: theme === 'tokyo' ? 0xc8b878 : 0x1e1a1c,
      second: theme === 'tokyo' ? 0x9a8a48 : 0xf2e8d4,
    },
    {
      pattern: 'round',
      cx: counter * (half - 150),
      cz: 150,
      rx: 62,
      rz: 40,
      colour: rugColour(),
      second: 0xe8c25a,
    },
  ]

  const lampKinds: FloorLampKind[] = ['arc', 'tripod', 'shade', 'globe']
  const lampA = pick(rng, lampKinds)
  const lampB = pick(rng, lampKinds.filter((k) => k !== lampA))
  const chairZ = city.sofa === 'back' ? 196 : 150
  const floorLamps = [
    // one at the end of the sofa, one just behind an armchair
    { kind: lampA, x: books * 184, z: sofaZ + 46 },
    { kind: lampB, x: counter * 166, z: chairZ + 46 },
  ]

  // a tree by the window in the far corner, another between the bar cart and the counter
  const tree = () => pick(rng, city.trees)
  const trees = [
    { kind: tree(), x: books * (half - 84), z: 368, size: range(rng, 1, 1.2) },
    { kind: tree(), x: counter * (half - 38), z: 214, size: range(rng, 0.8, 1) },
  ]
  // pots hanging off hooks, out towards the side walls so the window stays clear
  const hanging = Array.from({ length: 2 + Math.floor(rng() * 2) }, (_, i) => ({
    x: (i % 2 ? 1 : -1) * range(rng, half - 120, half - 70),
    z: range(rng, 140, 320),
    drop: range(rng, 110, 200),
  }))

  const sofaSeat = 44
  const seats: Seat[] = []
  const add = (s: Omit<Seat, 'pet'>, pet: readonly [number, number, number]) => seats.push({ ...s, pet })
  // the long sofa, middle seats first
  for (const x of [-36, 36, -108, 108])
    add(
      { x, y: sofaSeat, z: sofaZ + 26, pose: 'sit', turn: x < -60 ? 1 : x > 60 ? -1 : 0, on: 'sofa' },
      [x + (x < 0 ? -18 : 18), 0, sofaZ - 16],
    )
  // armchairs either side, turned in
  for (const side of [-1, 1] as const)
    add(
      { x: side * 214, y: 46, z: chairZ, pose: 'sit', turn: side === -1 ? 1 : -1, on: 'armchair' },
      [side * 168, 0, chairZ - 34],
    )
  // floor cushions out front
  for (const x of [-140, -46, 52])
    add({ x, y: 8, z: 72, pose: 'floor', turn: 0, on: 'cushion' }, [x + 34, 0, 58])
  // stools at the counter
  for (const z of [300, 356])
    add(
      { x: counter * (half - 104), y: 80, z, pose: 'sit', turn: counter === 1 ? -1 : 1, on: 'stool' },
      [counter * (half - 140), 0, z - 22],
    )
  add({ x: 150, y: 20, z: 84, pose: 'floor', turn: -1, on: 'beanbag' }, [196, 0, 62])
  add({ x: -books * 118, y: 34, z: 150, pose: 'sit', turn: books === 1 ? -1 : 1, on: 'pouf' }, [
    -books * 150,
    0,
    128,
  ])

  const posters = Array.from({ length: 4 }, () => Math.floor(rng() * 16))
  return {
    theme,
    half,
    height,
    books,
    floor: city.floor,
    wall: pick(rng, city.walls),
    trim: pick(rng, city.trims),
    wood: pick(rng, city.woods),
    sofa: pick(rng, city.sofas),
    chairs: [pick(rng, city.chairs), pick(rng, city.chairs)],
    accent: pick(rng, city.accents),
    panes: city.panes(rng, half, height),
    sofaZ,
    coffee: pick(rng, ['glass', 'wood', 'marble'] as const),
    chairStyle: pick(rng, ['club', 'wingback', 'tulip'] as const),
    sideTable: city.sofa === 'back' ? { x: books * 205, z: 254 } : { x: books * 124, z: 182 },
    rugs,
    floorLamps,
    trees,
    hanging,
    seats,
    neon: city.neon.length && rng() < 0.7 ? pick(rng, city.neon) : null,
    posters,
  }
}

/** which seat each person gets: always the same order, so nobody swaps places on a refresh */
export function seatFor(plan: LoungePlan, index: number): Seat | null {
  return plan.seats[index] ?? null
}
