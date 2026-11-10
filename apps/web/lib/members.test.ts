import { describe, expect, it } from 'vitest'
import { memberLine } from './members'

describe('memberLine', () => {
  it('says when you are on your own', () => {
    expect(memberLine(['nakita'], 'nakita')).toBe('just you so far')
  })

  it('names up to two others, then counts', () => {
    expect(memberLine(['nakita', 'jaren'], 'nakita')).toBe('you, jaren')
    expect(memberLine(['nakita', 'jaren', 'mithula'], 'nakita')).toBe('you, jaren, mithula')
    expect(memberLine(['nakita', 'jaren', 'mithula', 'a', 'b', 'c', 'd', 'e'], 'nakita')).toBe(
      'you, jaren, mithula +5',
    )
  })
})
