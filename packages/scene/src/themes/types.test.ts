import { describe, expect, it } from 'vitest'
import { isThemeId, THEME_IDS } from './types'

describe('theme ids', () => {
  it('has the four streets, once each, paris first', () => {
    expect(THEME_IDS).toEqual(['paris', 'new-york', 'venice', 'tokyo'])
    expect(new Set(THEME_IDS).size).toBe(THEME_IDS.length)
  })

  it('accepts real ids and nothing else', () => {
    for (const id of THEME_IDS) expect(isThemeId(id)).toBe(true)
    for (const bad of ['', 'london', 'Paris', 'new york', null, undefined, 3, {}])
      expect(isThemeId(bad)).toBe(false)
  })
})
