import { describe, expect, it } from 'vitest'
import {
  cameHome,
  daysUntil,
  goesAt,
  goingSoon,
  houseNews,
  nudgeText,
  occasionLine,
} from './moments'

const NOW = Date.parse('2026-11-10T20:00:00Z')
const ago = (ms: number) => new Date(NOW - ms).toISOString()

describe('goesAt', () => {
  it('is a week after the house was made', () => {
    expect(goesAt('2026-11-01T12:00:00Z', null)).toBe('2026-11-08T12:00:00.000Z')
  })

  it('or later, if someone asked for more time', () => {
    expect(goesAt('2026-11-01T12:00:00Z', '2026-11-15T12:00:00Z')).toBe('2026-11-15T12:00:00.000Z')
  })
})

describe('daysUntil and goingSoon', () => {
  it('rounds up and stops at zero', () => {
    expect(daysUntil('2026-11-12T08:00:00Z', NOW)).toBe(2)
    expect(daysUntil('2026-11-01T08:00:00Z', NOW)).toBe(0)
  })

  it('nudges in the last two days only', () => {
    expect(goingSoon(null, NOW)).toBe(false)
    expect(goingSoon('2026-11-14T20:00:00Z', NOW)).toBe(false)
    expect(goingSoon('2026-11-12T08:00:00Z', NOW)).toBe(true)
  })
})

describe('cameHome', () => {
  it('is only when the light goes from off to on', () => {
    expect(cameHome(undefined, ago(0), NOW)).toBe(true)
    expect(cameHome(ago(10 * 60_000), ago(0), NOW)).toBe(true)
    // the minute-by-minute check-ins of someone already home don't count
    expect(cameHome(ago(60_000), ago(0), NOW)).toBe(false)
    expect(cameHome(undefined, ago(10 * 60_000), NOW)).toBe(false)
  })
})

describe('occasionLine', () => {
  it('fits the marquee', () => {
    expect(occasionLine('new-year', 0)).toBe('HAPPY NEW YEAR!')
    expect(occasionLine('birthday', 1)).toBe('ONE YEAR TODAY!')
    expect(occasionLine('birthday', 3)).toBe('3 YEARS TODAY!')
    expect(occasionLine('house-warming', 0)).toBe('HOUSE WARMING!')
  })
})

describe('nudgeText', () => {
  it('says what happened', () => {
    expect(nudgeText({ kind: 'note', from: 'jaren' })).toBe('jaren slipped a note under your door')
    expect(nudgeText({ kind: 'gift', from: 'jaren', gift: 'cake' })).toBe(
      'jaren left a cake on the step for you',
    )
    expect(nudgeText({ kind: 'home', who: 'mithula' })).toBe('mithula just got home')
    expect(nudgeText({ kind: 'moved-in', who: 'mithula' })).toBe('mithula moved in')
    expect(nudgeText({ kind: 'going', house: 'the flat', days: 1 })).toBe(
      'the flat goes tomorrow unless a friend moves in',
    )
    expect(nudgeText({ kind: 'going', house: 'the flat', days: 2 })).toBe(
      'the flat goes in 2 days unless a friend moves in',
    )
  })
})

describe('houseNews', () => {
  it('is nothing on a quiet night', () => {
    expect(houseNews({ notes: 0, gifts: 0, home: [] })).toBeNull()
  })

  it('lists what’s waiting and who’s in', () => {
    expect(houseNews({ notes: 1, gifts: 2, home: ['jaren'] })).toBe(
      "a note for you · 2 gifts for you on the step · jaren's home",
    )
    expect(houseNews({ notes: 3, gifts: 0, home: ['jaren', 'mithula'] })).toBe(
      '3 notes for you · jaren and mithula are home',
    )
    expect(houseNews({ notes: 0, gifts: 1, home: ['a', 'b', 'c'] })).toBe(
      'a gift for you on the step · 3 people home',
    )
  })
})
