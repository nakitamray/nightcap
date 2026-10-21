// What someone's room looks like. Everyone moves into the same room and
// changes it from there; this is the bit that gets saved (memberships.layout).
// Anything that comes back from the database goes through readLayout so a
// half-written or old layout can't break the page.

export type Side = 'left' | 'right'
export type BedSpot = 'right' | 'window'
export type PaneShape = 'rect' | 'arch' | 'circle'
export type LampStyle = 'desk' | 'arc' | 'lantern' | 'mushroom'
export type RugShape = 'none' | 'rect' | 'circle' | 'oval' | 'diamond'

export interface Frame {
  wall: Side
  /** which little picture is in it */
  art: number
}

export interface Layout {
  wall: string
  bed: { spot: BedSpot; frame: string; sheets: string; pillows: string; blanket: string }
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
  wall: '#c9a27e',
  bed: {
    spot: 'right',
    frame: '#5a3a28',
    sheets: '#efe3cc',
    pillows: '#f6efe2',
    blanket: '#a8432e',
  },
  window: { shape: 'rect', curtains: true, curtainColor: '#7a2a24' },
  frames: [{ wall: 'left', art: 0 }],
  lamp: 'desk',
  rug: { shape: 'oval', color: '#8a5a3a' },
  desk: { wall: 'left', color: '#6a4630' },
  led: null,
}

// the swatches the editor offers. warm on purpose, with a few cooler ones
export const SWATCHES = {
  wall: ['#c9a27e', '#e3cfa8', '#b8735a', '#8a4a3a', '#6f7a5a', '#4a5a6a', '#d9b3a3', '#3a2a3a'],
  wood: ['#5a3a28', '#8a5a3a', '#2e2420', '#c8a07a', '#efe3cc', '#3a4a3a', '#7a2a24'],
  fabric: [
    '#efe3cc',
    '#f6efe2',
    '#a8432e',
    '#d98a3a',
    '#e6b8a2',
    '#5a6a8a',
    '#4a6a4a',
    '#7a2a24',
    '#2e3a5a',
    '#e8c25a',
  ],
  rug: ['#8a5a3a', '#a8432e', '#3a4a6a', '#5a6a3a', '#c8a07a', '#6a2a3a'],
  led: ['#ff6a3a', '#ff3a8a', '#9a5aff', '#3ac8ff', '#5aff9a', '#ffd06a'],
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
    lamp: pick(r.lamp, ['desk', 'arc', 'lantern', 'mushroom'], d.lamp),
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
