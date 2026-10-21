import { newYork } from './new-york'
import { paris } from './paris'
import { tokyo } from './tokyo'
import type { Theme, ThemeId } from './types'
import { venice } from './venice'

export const themes: Record<ThemeId, Theme> = {
  paris,
  'new-york': newYork,
  venice,
  tokyo,
}

export { isThemeId, THEME_IDS } from './types'
export type { BuiltTheme, Theme, ThemeId } from './types'
