// same list as packages/scene/src/themes/types.ts and the check constraint on
// houses.theme. kept separate so server pages don't import the whole renderer.
export const THEMES = ['paris', 'new-york', 'venice', 'tokyo'] as const
export type Theme = (typeof THEMES)[number]

export const THEME_NAMES: Record<Theme, string> = {
  paris: 'Paris',
  'new-york': 'New York',
  venice: 'Venice',
  tokyo: 'Tokyo',
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}
