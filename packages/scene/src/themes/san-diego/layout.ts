import { GROUND, type Rect, type WindowSlot } from '../../layout'

// A house rather than a building: three storeys in the middle under a front
// gable, and a two-storey wing either side -- the garage with a room over it
// on the left, a roof terrace on the right. Everything is lower and wider
// than the other streets, so the rooms aren't on a neat grid.

/** the top of each storey, ground floor first */
export const LEVELS = { ground: 820, second: 610, third: 400 } as const

export const CORE: Rect = { x: 1000, y: LEVELS.third, width: 400, height: GROUND - LEVELS.third }
export const GARAGE_WING: Rect = {
  x: 740,
  y: LEVELS.second,
  width: 260,
  height: GROUND - LEVELS.second,
}
export const TERRACE_WING: Rect = {
  x: 1400,
  y: LEVELS.second,
  width: 260,
  height: GROUND - LEVELS.second,
}

/** the whole front, wing to wing */
export const SD_HOUSE: Rect = {
  x: GARAGE_WING.x,
  y: LEVELS.third,
  width: TERRACE_WING.x + TERRACE_WING.width - GARAGE_WING.x,
  height: GROUND - LEVELS.third,
}

export const PEAK = { x: CORE.x + CORE.width / 2, y: 286 } as const

const WINDOW_W = 84
const WINDOW_H = 130
/** how far below the top of its storey a window starts */
const HEAD = 40

/** where the windows are on each storey, by their centres, top floor first */
const ROWS: { top: number; head?: number; centres: number[] }[] = [
  { top: LEVELS.third, centres: [1110, 1290] },
  { top: LEVELS.second, centres: [815, 925, 1080, 1200, 1320, 1475, 1585] },
  // the ground floor is taller, and its windows sit under the sign
  { top: LEVELS.ground, head: 100, centres: [1065, 1335, 1530] },
]

export function sdSlots(): WindowSlot[] {
  const slots: WindowSlot[] = []
  ROWS.forEach((r, row) => {
    r.centres.forEach((centre, col) => {
      slots.push({
        index: slots.length,
        row,
        col,
        balcony: 'rail',
        x: centre - WINDOW_W / 2,
        y: r.top + (r.head ?? HEAD),
        width: WINDOW_W,
        height: WINDOW_H,
      })
    })
  })
  return slots
}

export const SD_DOOR: Rect = { x: PEAK.x - 38, y: GROUND - 152, width: 76, height: 152 }

/** the sign hangs under the balcony, over the front door */
export const SD_MARQUEE: Rect = { x: PEAK.x - 150, y: LEVELS.ground + 14, width: 300, height: 56 }

export const GARAGE_DOOR: Rect = { x: 772, y: 908, width: 196, height: GROUND - 908 }

/** fan palms along the kerb; the tall skinny ones every street here has */
export const PALMS = [
  { x: 150, top: 240, lean: -0.04 },
  { x: 731, top: 130, lean: -0.02 },
  { x: 1716, top: 200, lean: 0.03 },
  { x: 2310, top: 120, lean: 0.04 },
] as const

export const LAMPS = [20] as const

/** the camera takes in the shops on one side of the house and the bluff on the other */
export const SD_FOCUS: Rect = { x: 600, y: 50, width: 1280, height: 1170 }
