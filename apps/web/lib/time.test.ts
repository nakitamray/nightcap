import { describe, expect, it } from 'vitest'
import { localTime, partOfDay } from './time'

const noonUtc = new Date('2026-10-20T12:00:00Z')

describe('localTime', () => {
  it('formats in the given zone', () => {
    expect(localTime('Europe/London', noonUtc)).toBe('1:00 pm')
    expect(localTime('America/Chicago', noonUtc)).toBe('7:00 am')
  })
})

describe('partOfDay', () => {
  it('buckets the hour', () => {
    expect(partOfDay('Pacific/Honolulu', noonUtc)).toBe('small hours')
    expect(partOfDay('America/New_York', noonUtc)).toBe('morning')
    expect(partOfDay('Asia/Tokyo', noonUtc)).toBe('night')
  })
})
