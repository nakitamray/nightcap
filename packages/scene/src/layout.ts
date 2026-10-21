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

export const MARQUEE: Rect = { x: 1200 - 180, y: GROUND_FLOOR.y + 16, width: 360, height: 88 }

export const DOOR: Rect = { x: 1200 - 54, y: GROUND - 126, width: 108, height: 126 }

/** the two little shops either side of the carriage door */
export const SHOPFRONTS: Rect[] = [
  { x: 858, y: 972, width: 150, height: 104 },
  { x: 1392, y: 972, width: 150, height: 104 },
]

export const LAMPPOSTS = [
  { x: 690, top: 730 },
  { x: 1720, top: 730 },
] as const

export const MORRIS_COLUMN = { x: 568, width: 60, top: GROUND - 240 } as const

export function bayCenter(col: number) {
  return HOUSE.x + (HOUSE.width * (col + 0.5)) / COLS
}

export function windowSlots(): WindowSlot[] {
  const slots: WindowSlot[] = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      slots.push({
        index: row * COLS + col,
        row,
        col,
        balcony: row === 1 ? 'rail' : 'continuous',
        x: bayCenter(col) - WINDOW_W / 2,
        y: FIRST_ROW_Y + row * FLOOR_H,
        width: WINDOW_W,
        height: WINDOW_H,
      })
    }
  }
  return slots
}

export interface Fit {
  scale: number
  x: number
  y: number
}

/**
 * Scale the world so the house always fits. On wide screens we fit to height
 * and let the sides spill; on narrow ones we fit to the house plus some
 * breathing room and let the sky/street extend instead.
 */
export function fitWorld(viewWidth: number, viewHeight: number): Fit {
  const safeWidth = HOUSE.width + 520
  const scale = Math.min(viewHeight / WORLD.height, viewWidth / safeWidth)
  const x = viewWidth / 2 - (WORLD.width / 2) * scale
  // anchor the street to the bottom of the screen
  const y = viewHeight - WORLD.height * scale
  return { scale, x, y }
}

export function intersects(a: Rect, b: Rect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}
