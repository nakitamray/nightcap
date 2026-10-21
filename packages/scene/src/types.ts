import type { ThemeId } from './themes/types'

export type Curtains = 'open' | 'drawn'

export interface Resident {
  id: string
  name: string
  home: boolean
  curtains: Curtains
}

/** what's on each window, in facade order. null = nobody has claimed it yet */
export type Rooms = (Resident | null)[]

export interface WindowEvent {
  index: number
  resident: Resident | null
  /** window bounds in screen pixels, for positioning html on top of the canvas */
  bounds: { x: number; y: number; width: number; height: number }
}

export interface SceneEvents extends Record<string, unknown> {
  'window:hover': WindowEvent | null
  'window:click': WindowEvent
  ready: undefined
}

export interface SceneOptions {
  rooms: Rooms
  marquee: string[]
  /** which street the house is on; paris if not given */
  theme?: ThemeId
  seed?: number
  reducedMotion?: boolean
}
