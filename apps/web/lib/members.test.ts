import { describe, expect, it } from 'vitest'
import { daysLeft, memberLine } from './members'

describe('memberLine', () => {
  it('says when you are on your own', () => {
    expect(memberLine(['nakita'], 'nakita')).toBe('just you so far')
  })

  it('names up to two others, then counts', () => {
    expect(memberLine(['nakita', 'jaren'], 'nakita')).toBe('you, jaren')
    expect(memberLine(['nakita', 'jaren', 'mithula'], 'nakita')).toBe('you, jaren, mithula')
    expect(memberLine(['nakita', 'jaren', 'mithula', 'a', 'b', 'c', 'd', 'e'], 'nakita')).toBe('you, jaren, mithula +5')
  })
})

describe('daysLeft', () => {
  it('counts down a week from when the house was made', () => {
    const made = '2026-10-20T12:00:00Z'
    expect(daysLeft(made, new Date('2026-10-20T13:00:00Z'))).toBe(7)
    expect(daysLeft(made, new Date('2026-10-25T12:00:00Z'))).toBe(2)
    expect(daysLeft(made, new Date('2026-11-01T12:00:00Z'))).toBe(0)
  })
})
