// Twelve rooms, twelve personalities. Every room in a house has the same bones
// (window, bed, desk, record, map) but its own furniture, shelving, window,
// ceiling, floor, plants and starting colours. Which one you get depends on
// which window you claimed.

export type Glazing = 'grid' | 'sash' | 'casement' | 'french' | 'picture'
export type Ceiling = 'beams' | 'fan' | 'plain'
export type Floor = 'planks' | 'dark' | 'tiles' | 'herringbone'
export type WallShelf = 'floating' | 'niches' | 'ledge' | 'cubes'
export type DeskStyle = 'table' | 'secretary' | 'trestle' | 'hutch'
export type PlantKind = 'pothos' | 'fern' | 'cactus' | 'snake' | 'palm' | 'flowers'

/** free-standing things a room comes with, in the order it wants them placed */
export type Extra =
  | 'bookcase'
  | 'sofa'
  | 'armchair'
  | 'piano'
  | 'easel'
  | 'records'
  | 'plantstand'
  | 'tree'
  | 'ladder'
  | 'trunk'
  | 'floorlamp'
  | 'mirror'
  | 'monstera'
  | 'lounger'
  | 'beanbag'
  | 'loveseat'
  | 'pouf'
  | 'dresser'

export interface Variant {
  name: string
  /** half the room's width, and how high its ceiling is */
  half: number
  height: number
  glazing: Glazing
  /** half the window's width and its top edge, in room units */
  paneHalf: number
  paneTop: number
  ceiling: Ceiling
  floor: Floor
  /** fairy lights instead of an led strip */
  fairy: boolean
  shelf: WallShelf
  desk: DeskStyle
  extras: Extra[]
  plants: PlantKind[]
  /** colours to start with, before you change anything */
  start: {
    wall: string
    bed: 'iron' | 'wood' | 'canopy' | 'brass' | 'platform'
    /** where the bed starts; rooms with a sofa put it under the window to make space */
    spot?: 'right' | 'window'
    deskWall?: 'left' | 'right'
    frame: string
    sheets: string
    pillows: string
    blanket: string
    curtains: string
    rug: string
    desk: string
    posters: number[]
    lamp: 'tiffany' | 'fringe' | 'scallop' | 'floral' | 'banker' | 'lantern'
    shape: 'rect' | 'arch' | 'circle'
    led: string | null
  }
}

export const VARIANTS: Variant[] = [
  {
    name: 'the attic library',
    half: 165,
    height: 510,
    glazing: 'sash',
    paneHalf: 108,
    paneTop: 370,
    ceiling: 'beams',
    floor: 'dark',
    fairy: true,
    shelf: 'ledge',
    desk: 'secretary',
    extras: ['bookcase', 'bookcase', 'armchair', 'bookcase'],
    plants: ['pothos', 'fern'],
    start: {
      wall: '#2a3a6a',
      bed: 'wood',
      frame: '#5a3420',
      sheets: '#e8e0d0',
      pillows: '#f2e2bd',
      blanket: '#3a4a7a',
      curtains: '#c8a070',
      rug: '#a8301e',
      desk: '#6a3a22',
      posters: [7, 2, 9, 12],
      lamp: 'banker',
      shape: 'rect',
      led: null,
    },
  },
  {
    name: 'the lounge',
    half: 245,
    height: 370,
    glazing: 'french',
    paneHalf: 88,
    paneTop: 390,
    ceiling: 'fan',
    floor: 'herringbone',
    fairy: false,
    shelf: 'floating',
    desk: 'table',
    extras: ['sofa', 'tree', 'armchair'],
    plants: ['palm', 'pothos'],
    start: {
      spot: 'window',
      wall: '#c8b8a0',
      bed: 'brass',
      frame: '#c8963a',
      sheets: '#f6efe2',
      pillows: '#e89a6a',
      blanket: '#d86a3a',
      curtains: '#f2e8d8',
      rug: '#2f6b66',
      desk: '#8a5a3a',
      posters: [0, 4, 11],
      lamp: 'scallop',
      shape: 'arch',
      led: '#ffb06a',
    },
  },
  {
    name: 'the studio',
    half: 225,
    height: 470,
    glazing: 'grid',
    paneHalf: 114,
    paneTop: 380,
    ceiling: 'plain',
    floor: 'planks',
    fairy: false,
    shelf: 'cubes',
    desk: 'trestle',
    extras: ['easel', 'ladder', 'plantstand'],
    plants: ['snake', 'cactus'],
    start: {
      wall: '#d8d0c0',
      bed: 'platform',
      frame: '#a86a3a',
      sheets: '#f2f0ea',
      pillows: '#2a4a8a',
      blanket: '#e8c25a',
      curtains: '#e8e0d0',
      rug: '#e8603a',
      desk: '#c8a070',
      posters: [5, 1, 13, 3],
      lamp: 'banker',
      shape: 'rect',
      led: '#b05aff',
    },
  },
  {
    name: 'the greenhouse',
    half: 200,
    height: 500,
    glazing: 'picture',
    paneHalf: 114,
    paneTop: 384,
    ceiling: 'beams',
    floor: 'tiles',
    fairy: true,
    shelf: 'floating',
    desk: 'hutch',
    extras: ['monstera', 'plantstand', 'tree', 'monstera'],
    plants: ['fern', 'pothos', 'flowers', 'palm'],
    start: {
      wall: '#8aa08a',
      bed: 'iron',
      frame: '#2a2a28',
      sheets: '#f2eee2',
      pillows: '#e8b8a0',
      blanket: '#f2e2bd',
      curtains: '#f2eee2',
      rug: '#c8a070',
      desk: '#a86a3a',
      posters: [10, 14],
      lamp: 'floral',
      shape: 'arch',
      led: null,
    },
  },
  {
    name: 'the record room',
    half: 235,
    height: 350,
    glazing: 'casement',
    paneHalf: 100,
    paneTop: 370,
    ceiling: 'plain',
    floor: 'dark',
    fairy: false,
    shelf: 'cubes',
    desk: 'table',
    extras: ['records', 'armchair', 'floorlamp'],
    plants: ['snake', 'pothos'],
    start: {
      wall: '#5a2a3a',
      bed: 'wood',
      frame: '#3a2418',
      sheets: '#e8dcc8',
      pillows: '#c8302a',
      blanket: '#e8a040',
      curtains: '#7a2a24',
      rug: '#2a3a5a',
      desk: '#4a2a1c',
      posters: [6, 8, 15, 5],
      lamp: 'fringe',
      shape: 'rect',
      led: '#ff3a6a',
    },
  },
  {
    name: 'the canopy room',
    half: 190,
    height: 480,
    glazing: 'french',
    paneHalf: 88,
    paneTop: 390,
    ceiling: 'fan',
    floor: 'tiles',
    fairy: true,
    shelf: 'niches',
    desk: 'secretary',
    extras: ['trunk', 'plantstand', 'mirror'],
    plants: ['palm', 'flowers'],
    start: {
      wall: '#5a6a8a',
      bed: 'canopy',
      frame: '#2a1a14',
      sheets: '#f6f0e6',
      pillows: '#c86a5a',
      blanket: '#e8d8c0',
      curtains: '#f2ece0',
      rug: '#c8501e',
      desk: '#5a3420',
      posters: [11, 2],
      lamp: 'floral',
      shape: 'rect',
      led: null,
    },
  },
  {
    name: 'the reading nook',
    half: 160,
    height: 420,
    glazing: 'sash',
    paneHalf: 104,
    paneTop: 376,
    ceiling: 'beams',
    floor: 'planks',
    fairy: true,
    shelf: 'ledge',
    desk: 'hutch',
    extras: ['bookcase', 'armchair', 'floorlamp', 'bookcase'],
    plants: ['pothos', 'fern'],
    start: {
      wall: '#e0cdb0',
      bed: 'iron',
      frame: '#1e1a1c',
      sheets: '#f2e2bd',
      pillows: '#8aa0b8',
      blanket: '#3a5a7a',
      curtains: '#b8564a',
      rug: '#a8301e',
      desk: '#6a3a22',
      posters: [9, 12, 0],
      lamp: 'tiffany',
      shape: 'arch',
      led: null,
    },
  },
  {
    name: 'the piano room',
    half: 240,
    height: 440,
    glazing: 'casement',
    paneHalf: 104,
    paneTop: 386,
    ceiling: 'plain',
    floor: 'herringbone',
    fairy: false,
    shelf: 'floating',
    desk: 'table',
    extras: ['piano', 'tree', 'armchair'],
    plants: ['fern', 'flowers'],
    start: {
      spot: 'window',
      deskWall: 'right',
      wall: '#2f6b66',
      bed: 'iron',
      frame: '#1e1a1c',
      sheets: '#f2e2bd',
      pillows: '#e8603a',
      blanket: '#c8302a',
      curtains: '#c8302a',
      rug: '#c8302a',
      desk: '#6a3a22',
      posters: [3, 6, 4],
      lamp: 'tiffany',
      shape: 'arch',
      led: '#ffd06a',
    },
  },
  {
    name: 'the den',
    half: 250,
    height: 340,
    glazing: 'grid',
    paneHalf: 110,
    paneTop: 376,
    ceiling: 'fan',
    floor: 'planks',
    fairy: false,
    shelf: 'ledge',
    desk: 'trestle',
    extras: ['sofa', 'trunk', 'monstera'],
    plants: ['snake', 'pothos', 'cactus'],
    start: {
      spot: 'window',
      wall: '#8a4a32',
      bed: 'platform',
      frame: '#4a2a1c',
      sheets: '#e8dcc8',
      pillows: '#2f6b66',
      blanket: '#e8c25a',
      curtains: '#d8b890',
      rug: '#2a4a8a',
      desk: '#8a5a3a',
      posters: [8, 15, 13, 1],
      lamp: 'lantern',
      shape: 'rect',
      led: '#3ad8ff',
    },
  },
  {
    name: 'the botanist',
    half: 172,
    height: 500,
    glazing: 'picture',
    paneHalf: 110,
    paneTop: 380,
    ceiling: 'beams',
    floor: 'tiles',
    fairy: true,
    shelf: 'cubes',
    desk: 'hutch',
    extras: ['plantstand', 'ladder', 'monstera', 'tree'],
    plants: ['fern', 'cactus', 'flowers', 'pothos'],
    start: {
      wall: '#e8d8c8',
      bed: 'brass',
      frame: '#c8963a',
      sheets: '#f6f0e6',
      pillows: '#8aa08a',
      blanket: '#5a7a5a',
      curtains: '#e8e0d0',
      rug: '#c88a1a',
      desk: '#a86a3a',
      posters: [10, 14, 7],
      lamp: 'scallop',
      shape: 'circle',
      led: null,
    },
  },
  {
    name: 'the writer’s room',
    half: 168,
    height: 460,
    glazing: 'casement',
    paneHalf: 100,
    paneTop: 372,
    ceiling: 'plain',
    floor: 'dark',
    fairy: false,
    shelf: 'niches',
    desk: 'secretary',
    extras: ['bookcase', 'floorlamp', 'trunk'],
    plants: ['fern', 'snake'],
    start: {
      wall: '#3a4a3a',
      bed: 'wood',
      frame: '#3a2418',
      sheets: '#efe6d4',
      pillows: '#c8a070',
      blanket: '#8e2416',
      curtains: '#d8c8a0',
      rug: '#7a2a24',
      desk: '#4a2a1c',
      posters: [12, 9, 2],
      lamp: 'banker',
      shape: 'rect',
      led: '#ffb06a',
    },
  },
  {
    name: 'the loft',
    half: 232,
    height: 520,
    glazing: 'grid',
    paneHalf: 116,
    paneTop: 390,
    ceiling: 'beams',
    floor: 'herringbone',
    fairy: true,
    shelf: 'floating',
    desk: 'table',
    extras: ['ladder', 'armchair', 'monstera'],
    plants: ['pothos', 'palm', 'cactus'],
    start: {
      wall: '#c8a8a0',
      bed: 'canopy',
      frame: '#1e1a1c',
      sheets: '#f6efe2',
      pillows: '#d8a090',
      blanket: '#7a5a8a',
      curtains: '#f2e8e0',
      rug: '#5a3a5a',
      desk: '#6a3a22',
      posters: [4, 11, 5, 0],
      lamp: 'fringe',
      shape: 'arch',
      led: null,
    },
  },
]

/**
 * The window's actual size in a given room: never so wide there's no wall
 * left for the record and the map, never up into the ceiling.
 */
export function windowSize(v: Variant) {
  const reachExtra = v.glazing === 'french' ? 42 : 28
  const paneHalf = Math.min(v.paneHalf, v.half - reachExtra - 46)
  return { paneHalf, paneTop: Math.min(v.paneTop, v.height - 60), reach: paneHalf + reachExtra }
}

export function variantFor(room: number) {
  return VARIANTS[((room % VARIANTS.length) + VARIANTS.length) % VARIANTS.length]!
}
