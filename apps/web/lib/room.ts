// The room's layout lives with the drawing code in @nightcap/scene; this
// adds the bits only the editor needs.
export {
  ART_COUNT,
  ART_NAMES,
  DEFAULT_LAYOUT,
  deskCanGoRight,
  LAMP_STYLES,
  MAX_FRAMES,
  readLayout,
  settle,
} from '@nightcap/scene/layout'
export type { LampStyle, RoomLayout as Layout } from '@nightcap/scene/layout'

// the swatches the editor offers: strong colours, the kind that glow at night
export const SWATCHES = {
  wall: [
    '#2f6b66',
    '#a8201a',
    '#1e3a6a',
    '#c88a1a',
    '#5a2a5a',
    '#3a5a3a',
    '#c2501e',
    '#1e2a44',
    '#d8b890',
  ],
  wood: ['#1e1a1c', '#4a2a1c', '#6a3a22', '#a86a3a', '#e8d5b0', '#2f4a3a', '#8e2416', '#d9a54a'],
  fabric: [
    '#f2e2bd',
    '#c8302a',
    '#e8603a',
    '#e8c25a',
    '#2a4a8a',
    '#2f6b66',
    '#5a2a5a',
    '#ff7a9a',
    '#3a7a3a',
    '#1e1a1c',
  ],
  rug: ['#c8302a', '#2a4a8a', '#2f6b66', '#c88a1a', '#5a2a5a', '#e8603a'],
  led: ['#ff3a6a', '#ff6a2a', '#b05aff', '#3ad8ff', '#5aff9a', '#ffd06a'],
}

export const LAMP_NAMES: Record<string, string> = {
  tiffany: 'tiffany',
  fringe: 'fringed',
  scallop: 'scalloped',
  floral: 'floral drum',
  banker: 'banker’s',
  lantern: 'paper lantern',
}
