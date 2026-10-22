import { describe, expect, it } from 'vitest'
import { HOME_FOR_MS, isHome } from './presence'

describe('isHome', () => {
  const now = Date.parse('2026-10-22T20:00:00Z')
  const ago = (ms: number) => new Date(now - ms).toISOString()

  it('stays lit for a few minutes after the last check-in', () => {
    expect(isHome(ago(0), now)).toBe(true)
    expect(isHome(ago(90_000), now)).toBe(true)
    expect(isHome(ago(HOME_FOR_MS + 1), now)).toBe(false)
  })

  it('is dark for anyone who has never checked in', () => {
    expect(isHome(null, now)).toBe(false)
    expect(isHome('not a date', now)).toBe(false)
  })
})
