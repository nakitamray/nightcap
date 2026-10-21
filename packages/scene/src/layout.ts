// All scene geometry lives in "world" units. The renderer scales the world to
// fit the viewport, so nothing in here should know about pixels.

export const WORLD = { width: 2400, height: 1350 } as const

/** y of the sidewalk -- everything above this gets mirrored into the wet street */
export const GROUND = 1090
export const CURB = 1140
/** how much of the upper world the street reflects */
export const REFLECT_DEPTH = 560

export const MAX_ROOMS = 12
const COLS = 4
const ROWS = 3

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Haussmann rhythm: the top floor and the "noble" floor get one long balcony
 * across the whole front, the floor between gets a little iron rail per window.
 */
export type Balcony = 'continuous' | 'rail'

export interface WindowSlot extends Rect {
  index: number
  row: number
  col: number
  balcony: Balcony
}

export const HOUSE: Rect = { x: 830, y: 250, width: 740, height: GROUND - 250 }

const WINDOW_W = 86
const WINDOW_H = 150
export const FIRST_ROW_Y = 308
export const FLOOR_H = 180

export const GROUND_FLOOR: Rect = {
  x: HOUSE.x,
  y: FIRST_ROW_Y + FLOOR_H * ROWS - 8,
  width: HOUSE.width,
  height: GROUND - (FIRST_ROW_Y + FLOOR_H * ROWS - 8),
}

export const MARQUEE: Rect = { x: 1200 - 180, y: GROUND_FLOOR.y + 10, width: 360, height: 70 }

/** tall and narrow, the way Paris doors are */
export const DOOR: Rect = { x: 1200 - 38, y: GROUND - 152, width: 76, height: 152 }

/** the two little shops either side of the carriage door */
export const SHOPFRONTS: Rect[] = [
  { x: 858, y: 972, width: 150, height: 104 },
  { x: 1392, y: 972, width: 150, height: 104 },
]

// close enough to the house that their light lands on the stone
export const LAMPPOSTS = [
  { x: 690, top: 720 },
  { x: 1630, top: 720 },
] as const

export const MORRIS_COLUMN = { x: 360, width: 60, top: GROUND - 240 } as const

/** the café terrace, tucked up against our building */
export const CAFE = { x: 480, width: 270 } as const

export function bayCenter(col: number) {
  return HOUSE.x + (HOUSE.width * (col + 0.5)) / COLS
}

/** how a house lays out its twelve rooms; streets can make theirs taller or wider */
export interface WindowGrid {
  x: number
  width: number
  cols: number
  rows: number
  firstRowY: number
  floorH: number
  windowW: number
  windowH: number
}

export const PARIS_GRID: WindowGrid = {
  x: HOUSE.x,
  width: HOUSE.width,
  cols: COLS,
  rows: ROWS,
  firstRowY: FIRST_ROW_Y,
  floorH: FLOOR_H,
  windowW: WINDOW_W,
  windowH: WINDOW_H,
}

export function gridSlots(grid: WindowGrid): WindowSlot[] {
  if (grid.cols * grid.rows !== MAX_ROOMS) throw new Error(`a house has ${MAX_ROOMS} rooms, not ${grid.cols * grid.rows}`)
  const slots: WindowSlot[] = []
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const centre = grid.x + (grid.width * (col + 0.5)) / grid.cols
      slots.push({
        index: row * grid.cols + col,
        row,
        col,
        balcony: row === 1 ? 'rail' : 'continuous',
        x: centre - grid.windowW / 2,
        y: grid.firstRowY + row * grid.floorH,
        width: grid.windowW,
        height: grid.windowH,
      })
    }
  }
  return slots
}

export function windowSlots(): WindowSlot[] {
  return gridSlots(PARIS_GRID)
}

export interface Fit {
  scale: number
  x: number
  y: number
}

/** what the camera frames: the house from the chimneys down to the kerb */
export const FOCUS: Rect = { x: HOUSE.x - 150, y: 50, width: HOUSE.width + 300, height: 1170 }

/**
 * Scale the world so the focus box fills the screen, centred. Anything around
 * it (neighbours, sky, street) spills off the edges. Never show past the
 * bottom of the world.
 */
export function fitWorld(viewWidth: number, viewHeight: number): Fit {
  const scale = Math.min(viewHeight / FOCUS.height, viewWidth / FOCUS.width)
  const x = viewWidth / 2 - (FOCUS.x + FOCUS.width / 2) * scale
  const centred = viewHeight / 2 - (FOCUS.y + FOCUS.height / 2) * scale
  const y = Math.max(centred, viewHeight - WORLD.height * scale)
  return { scale, x, y }
}

export function intersects(a: Rect, b: Rect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}
