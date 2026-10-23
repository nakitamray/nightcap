import {
  PHASES,
  WEATHERS,
  type Conditions,
  type Phase,
  type Weather,
} from '@nightcap/scene/conditions'

/** `?sky=dusk&weather=snow` on a dev room, to see a sky without waiting for it */
export function skyFromParams(sky?: string, weather?: string): Conditions | undefined {
  if (!PHASES.includes(sky as Phase)) return undefined
  return {
    phase: sky as Phase,
    ...(WEATHERS.includes(weather as Weather) ? { weather: weather as Weather } : {}),
  }
}
