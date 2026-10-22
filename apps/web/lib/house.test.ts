import { THEME_IDS } from '@nightcap/scene'
import { describe, expect, it } from 'vitest'
import { demoMarquee, marqueeFor, roomIndex } from './house'

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
})

describe('roomIndex', () => {
  it('reads the twelve rooms out of a url', () => {
    expect(roomIndex('0')).toBe(0)
    expect(roomIndex('11')).toBe(11)
  })

  it('turns away anything else', () => {
    for (const bad of ['12', '-1', '1.5', 'abc', '', ' 3', '1e1']) expect(roomIndex(bad)).toBeNull()
  })
})
