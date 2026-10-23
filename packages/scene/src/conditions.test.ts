import { describe, expect, it } from 'vitest'
import { phaseAt } from './conditions'

describe('phaseAt', () => {
  it('walks through the day', () => {
    expect(phaseAt(2)).toBe('night')
    expect(phaseAt(6)).toBe('dawn')
    expect(phaseAt(9)).toBe('morning')
    expect(phaseAt(12.5)).toBe('midday')
    expect(phaseAt(16)).toBe('afternoon')
    expect(phaseAt(19)).toBe('dusk')
    expect(phaseAt(23)).toBe('night')
  })

  it('wraps round midnight', () => {
    expect(phaseAt(24 + 9)).toBe('morning')
    expect(phaseAt(-1)).toBe('night')
  })
})
