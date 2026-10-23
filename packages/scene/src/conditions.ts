// What it's like outside: the time of day and the weather. The street is a
// night street unless told otherwise; a room shows the sky where its owner
// actually is, at their time.

export const PHASES = ['dawn', 'morning', 'midday', 'afternoon', 'dusk', 'night'] as const
export type Phase = (typeof PHASES)[number]

export const WEATHERS = ['clear', 'cloudy', 'rain', 'storm', 'snow', 'fog'] as const
export type Weather = (typeof WEATHERS)[number]

export interface Conditions {
  phase: Phase
  /** left out, each city keeps its own usual night (Paris drizzles, say) */
  weather?: Weather
}

export const NIGHT: Conditions = { phase: 'night' }

/** which part of the day an hour (0-24, fractions fine) falls in */
export function phaseAt(hour: number): Phase {
  const h = ((hour % 24) + 24) % 24
  if (h < 5) return 'night'
  if (h < 7) return 'dawn'
  if (h < 11) return 'morning'
  if (h < 15) return 'midday'
  if (h < 18) return 'afternoon'
  if (h < 20.5) return 'dusk'
  return 'night'
}
