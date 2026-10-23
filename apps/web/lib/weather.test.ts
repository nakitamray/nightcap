import { describe, expect, it } from 'vitest'
import { conditionsFor, localHour, localTime, weatherFromCode } from './weather'

describe('weatherFromCode', () => {
  it('folds the wmo codes into what the street can draw', () => {
    expect(weatherFromCode(0)).toBe('clear')
    expect(weatherFromCode(1)).toBe('clear')
    expect(weatherFromCode(2)).toBe('cloudy')
    expect(weatherFromCode(3)).toBe('cloudy')
    expect(weatherFromCode(45)).toBe('fog')
    expect(weatherFromCode(48)).toBe('fog')
    expect(weatherFromCode(51)).toBe('rain')
    expect(weatherFromCode(67)).toBe('rain')
    expect(weatherFromCode(81)).toBe('rain')
    expect(weatherFromCode(71)).toBe('snow')
    expect(weatherFromCode(86)).toBe('snow')
    expect(weatherFromCode(95)).toBe('storm')
    expect(weatherFromCode(99)).toBe('storm')
  })
})

describe('local time', () => {
  const noonUtc = new Date('2026-10-22T12:00:00Z')

  it('reads the hour in their time zone', () => {
    expect(localHour('UTC', noonUtc)).toBe(12)
    expect(localHour('Asia/Tokyo', noonUtc)).toBe(21)
    expect(localHour('America/Chicago', noonUtc)).toBe(7)
    expect(localHour('Asia/Kolkata', noonUtc)).toBe(17.5)
  })

  it('says it the way people do', () => {
    expect(localTime('Asia/Tokyo', noonUtc)).toBe('9:00 pm')
  })

  it('turns it into a sky', () => {
    expect(conditionsFor('Asia/Tokyo', 'rain', noonUtc)).toEqual({
      phase: 'night',
      weather: 'rain',
    })
    expect(conditionsFor('Europe/Paris', null, noonUtc)).toEqual({ phase: 'midday' })
  })

  it('copes with a time zone it has never heard of', () => {
    expect(typeof localHour('Nowhere/Special', noonUtc)).toBe('number')
  })
})
