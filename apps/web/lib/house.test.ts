import { THEME_IDS } from '@nightcap/scene'
import { describe, expect, it } from 'vitest'
import { demoMarquee, marqueeFor, themeNames } from './house'

describe('marqueeFor', () => {
  it('gives every street a calendar under the house name', () => {
    for (const id of THEME_IDS) {
      const lines = marqueeFor(id)
      expect(lines[0]).toBe('NIGHTCAP')
      expect(lines.length).toBeGreaterThan(1)
    }
  })

  it('keeps paris as it was', () => {
    expect(marqueeFor('paris')).toBe(demoMarquee)
  })

  it('names every street for the picker', () => {
    for (const id of THEME_IDS) expect(themeNames[id]).toBeTruthy()
  })
})
