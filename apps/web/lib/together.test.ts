import { describe, expect, it } from 'vitest'
import { roomPlace, stillPlaying, whereabouts, whoIsIn } from './together'

const now = Date.parse('2026-10-23T21:00:00Z')
const ago = (ms: number) => new Date(now - ms).toISOString()

describe('whoIsIn', () => {
  it('finds people in a place who checked in lately', () => {
    const seen = {
      a: { at: ago(10_000), place: 'lounge' },
      b: { at: ago(10_000), place: 'room:3' },
      c: { at: ago(60 * 60_000), place: 'lounge' },
    }
    expect(whoIsIn(seen, 'lounge', now)).toEqual(['a'])
    expect(whoIsIn(seen, roomPlace(3), now)).toEqual(['b'])
  })
})

describe('stillPlaying', () => {
  it('lets an old song go', () => {
    expect(stillPlaying(ago(60_000), now)).toBe(true)
    expect(stillPlaying(ago(20 * 60_000), now)).toBe(false)
    expect(stillPlaying(null, now)).toBe(false)
  })
})

describe('whereabouts', () => {
  const names = ['Ellie', 'Mars', null]
  it('says where in the house someone is', () => {
    expect(whereabouts('street', 0, names)).toBeNull()
    expect(whereabouts('lounge', 0, names)).toBe('in the living room')
    expect(whereabouts('room:0', 0, names)).toBe('in their room')
    expect(whereabouts('room:1', 0, names)).toBe('visiting Mars')
    expect(whereabouts('room:2', 0, names)).toBe('wandering the halls')
  })
})
