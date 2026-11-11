import type { Container } from 'pixi.js'
import type { Conditions } from '../conditions'
import type { BaseHouse } from '../layers/house-base'
import type { Rect } from '../layout'
import type { People } from '../layers/people'

export const THEME_IDS = ['paris', 'new-york', 'venice', 'tokyo', 'san-diego'] as const
export type ThemeId = (typeof THEME_IDS)[number]

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value)
}

export interface ThemeContext {
  seed: number
  /** additive glows go here; this layer gets the bloom */
  lights: Container
  reducedMotion: boolean
}

/**
 * What a street hands back to the scene. Everything in `backdrop`, `house`,
 * `props` and `front` is above the ground line and gets mirrored into the
 * wet street (or canal); `ground` and below are not.
 */
export interface BuiltTheme {
  house: BaseHouse
  /** sky, distant city, neighbouring buildings -- back to front */
  backdrop: Container[]
  /** street furniture in front of the house that still reflects */
  props: Container[]
  /** in front of the lights layer, e.g. trees */
  front: Container[]
  /** pavement / road / water surface */
  ground: Container
  /** light pooled on the ground */
  pools: Container
  people: People
  /** cars, boats, anything sitting on the road or water */
  foreground: Container[]
  /** how strongly the street mirrors what's above it */
  reflection?: number
  /** raindrops; 0 for a dry night */
  rain?: number
  bloomThreshold?: number
  /** the hour this street is always seen at, when nobody says otherwise; night if left out */
  usual?: Conditions
  /** what the camera frames, if not the usual box round the house */
  focus?: Rect
  update(time: number, dt: number, pointerX: number, reducedMotion: boolean): void
}

export interface Theme {
  id: ThemeId
  build(ctx: ThemeContext): BuiltTheme
}
