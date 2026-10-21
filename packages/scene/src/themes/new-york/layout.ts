import { GROUND, type Rect, type WindowGrid } from '../../layout'

// The Upper West Side row: our brownstone is narrow and tall -- three
// windows across, four floors of rooms over the parlor floor -- squeezed
// between two more brownstones with their own stoops.

export const NY_HOUSE: Rect = { x: 960, y: 118, width: 480, height: GROUND - 118 }

export const NY_GRID: WindowGrid = {
  x: NY_HOUSE.x,
  width: NY_HOUSE.width,
  cols: 3,
  rows: 4,
  firstRowY: 178,
  floorH: 150,
  windowW: 82,
  windowH: 116,
}

/** the parlor floor: front door at the top of the stoop, tall windows either side */
export const PARLOR = { top: 790, floor: 985 } as const

export const NY_DOOR: Rect = { x: 1200 - 36, y: 852, width: 72, height: PARLOR.floor - 852 }

export const NY_MARQUEE: Rect = { x: 1200 - 140, y: 770, width: 280, height: 56 }

/** the row, left to right. ours sits in the middle */
export const ROW = {
  bodega: { x: 40, width: 430, top: 420 },
  left: { x: 470, width: 490, top: 330 },
  right: { x: 1440, width: 470, top: 206 },
  prewar: { x: 1910, width: 700, top: 40 },
} as const

export const TREES = [
  { x: 140, scale: 0.72 },
  { x: 805, scale: 0.55 },
  { x: 1600, scale: 0.55 },
  { x: 1985, scale: 0.6 },
  { x: 2330, scale: 0.75 },
] as const
