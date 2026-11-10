import { describe, expect, it } from 'vitest'
import { houseAge, occasionFor, WARMING_MS } from './occasions'

const house = { createdAt: '2025-06-14T20:00:00Z', warmedAt: null }

describe('occasionFor', () => {
  it('is an ordinary night most nights', () => {
    expect(occasionFor(new Date('2026-03-03T22:00:00Z'), house, 'UTC')).toBeNull()
  })

  it('puts the lanterns up from six on new year’s eve', () => {
    expect(occasionFor(new Date('2026-12-31T17:59:00Z'), house, 'UTC')).toBeNull()
    expect(occasionFor(new Date('2026-12-31T18:00:00Z'), house, 'UTC')).toBe('new-year')
    expect(occasionFor(new Date('2027-01-01T23:30:00Z'), house, 'UTC')).toBe('new-year')
    expect(occasionFor(new Date('2027-01-02T00:30:00Z'), house, 'UTC')).toBeNull()
  })

  it('goes by your own clock', () => {
    // already new year's day in Tokyo, still the 31st afternoon in New York
    const at = new Date('2026-12-31T19:00:00Z')
    expect(occasionFor(at, house, 'Asia/Tokyo')).toBe('new-year')
    expect(occasionFor(at, house, 'America/New_York')).toBeNull()
  })

  it('has fireworks on the house’s birthday, but not the day it was made', () => {
    expect(occasionFor(new Date('2025-06-14T21:00:00Z'), house, 'UTC')).toBeNull()
    expect(occasionFor(new Date('2026-06-14T21:00:00Z'), house, 'UTC')).toBe('birthday')
    expect(occasionFor(new Date('2026-06-15T21:00:00Z'), house, 'UTC')).toBeNull()
  })

  it('gives leap day houses a birthday every year', () => {
    const leap = { createdAt: '2024-02-29T12:00:00Z', warmedAt: null }
    expect(occasionFor(new Date('2025-02-28T12:00:00Z'), leap, 'UTC')).toBe('birthday')
    expect(occasionFor(new Date('2028-02-29T12:00:00Z'), leap, 'UTC')).toBe('birthday')
    expect(occasionFor(new Date('2028-02-28T12:00:00Z'), leap, 'UTC')).toBeNull()
  })

  it('keeps the bunting up for three days after the second person moves in', () => {
    const warmed = { ...house, warmedAt: '2026-03-01T20:00:00Z' }
    const start = Date.parse(warmed.warmedAt)
    expect(occasionFor(new Date(start - 1000), warmed, 'UTC')).toBeNull()
    expect(occasionFor(new Date(start + 1000), warmed, 'UTC')).toBe('house-warming')
    expect(occasionFor(new Date(start + WARMING_MS - 1000), warmed, 'UTC')).toBe('house-warming')
    expect(occasionFor(new Date(start + WARMING_MS), warmed, 'UTC')).toBeNull()
  })

  it('lets new year win, then birthdays', () => {
    const busy = { createdAt: '2025-01-01T10:00:00Z', warmedAt: '2026-01-01T09:00:00Z' }
    expect(occasionFor(new Date('2026-01-01T12:00:00Z'), busy, 'UTC')).toBe('new-year')
    const june = { createdAt: '2025-06-14T10:00:00Z', warmedAt: '2026-06-14T09:00:00Z' }
    expect(occasionFor(new Date('2026-06-14T12:00:00Z'), june, 'UTC')).toBe('birthday')
  })

  it('falls back to UTC for a time zone it doesn’t know', () => {
    expect(occasionFor(new Date('2027-01-01T12:00:00Z'), house, 'Not/AZone')).toBe('new-year')
  })
})

describe('houseAge', () => {
  it('counts the years', () => {
    expect(houseAge(new Date('2027-06-14T12:00:00Z'), house.createdAt, 'UTC')).toBe(2)
  })
})
