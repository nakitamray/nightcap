// What someone's room looks like. Everyone moves into the same room and
// changes it from there; this is the bit that gets saved (memberships.layout).
// Anything that comes back from the database goes through readLayout so a
// half-written or old layout can't break the page.

export type Side = 'left' | 'right'
export type BedSpot = 'right' | 'window'
export type BedStyle = 'iron' | 'wood'
export type PaneShape = 'rect' | 'arch' | 'circle'
/** table lamps sit on the desk; the lantern hangs from the ceiling */
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

export interface Frame {
  wall: Side
  /** which little picture is in it */
  art: number
}

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
  window: { shape: PaneShape; curtains: boolean; curtainColor: string }
  frames: Frame[]
  lamp: LampStyle
  rug: { shape: RugShape; color: string }
  desk: { wall: Side; color: string }
  /** colour of the strip round the ceiling, or null when it's off */
  led: string | null
}

export const ART_COUNT = 6
export const MAX_FRAMES = 2

export const DEFAULT_LAYOUT: Layout = {
  wall: '#2f6b66',
  bed: {
    spot: 'right',
    style: 'iron',
    frame: '#1e1a1c',
    sheets: '#f2e2bd',
    pillows: '#e8603a',
    blanket: '#c8302a',
  },
  window: { shape: 'arch', curtains: true, curtainColor: '#c8302a' },
  frames: [{ wall: 'left', art: 0 }],
  lamp: 'tiffany',
  rug: { shape: 'rect', color: '#c8302a' },
  desk: { wall: 'left', color: '#6a3a22' },
  led: null,
}

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
export function readLayout(raw: unknown): Layout {
  const r = obj(raw)
  const d = DEFAULT_LAYOUT
  const bed = obj(r.bed)
  const win = obj(r.window)
  const rug = obj(r.rug)
  const desk = obj(r.desk)

  const layout: Layout = {
    wall: colour(r.wall, d.wall),
    bed: {
      spot: pick(bed.spot, ['right', 'window'], d.bed.spot),
      style: pick(bed.style, ['iron', 'wood'], d.bed.style),
      frame: colour(bed.frame, d.bed.frame),
      sheets: colour(bed.sheets, d.bed.sheets),
      pillows: colour(bed.pillows, d.bed.pillows),
      blanket: colour(bed.blanket, d.bed.blanket),
    },
    window: {
      shape: pick(win.shape, ['rect', 'arch', 'circle'], d.window.shape),
      curtains: typeof win.curtains === 'boolean' ? win.curtains : d.window.curtains,
      curtainColor: colour(win.curtainColor, d.window.curtainColor),
    },
    frames: Array.isArray(r.frames)
      ? r.frames
          .map(obj)
          .map((f) => ({
            wall: pick(f.wall, ['left', 'right'], 'left'),
            art:
              Number.isInteger(f.art) && (f.art as number) >= 0 ? (f.art as number) % ART_COUNT : 0,
          }))
          .slice(0, MAX_FRAMES)
      : d.frames,
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
  }
  return settle(layout)
}

/** the desk can only go on the right wall when the bed isn't there */
export function deskCanGoRight(layout: Layout) {
  return layout.bed.spot === 'window'
}

/** fixes up combinations that can't physically happen */
export function settle(layout: Layout): Layout {
  if (layout.desk.wall === 'right' && !deskCanGoRight(layout)) {
    return { ...layout, desk: { ...layout.desk, wall: 'left' } }
  }
  return layout
}
