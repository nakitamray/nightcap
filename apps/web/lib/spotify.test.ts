import { describe, expect, it } from 'vitest'
import { seal, unseal } from './spotify'

describe('sealing spotify tokens', () => {
  it('gets the token back out with the same secret', () => {
    const sealed = seal('BQD-a-token', 'secret')
    expect(sealed.startsWith('v1:')).toBe(true)
    expect(sealed).not.toContain('BQD-a-token')
    expect(unseal(sealed, 'secret')).toBe('BQD-a-token')
  })

  it('never seals the same token the same way twice', () => {
    expect(seal('same', 'secret')).not.toBe(seal('same', 'secret'))
  })

  it('gives nothing back with a different secret', () => {
    expect(unseal(seal('token', 'secret'), 'another')).toBeNull()
  })

  it('notices tampering, and anything that was never sealed', () => {
    const sealed = seal('token', 'secret')
    const flipped = sealed.slice(0, -2) + (sealed.endsWith('A') ? 'BB' : 'AA')
    expect(unseal(flipped, 'secret')).toBeNull()
    expect(unseal('plain-text-token', 'secret')).toBeNull()
    expect(unseal('v1:', 'secret')).toBeNull()
  })
})
