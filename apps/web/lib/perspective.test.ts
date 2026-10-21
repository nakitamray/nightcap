import { describe, expect, it } from 'vitest'
import { boxFaces, project, shade } from './perspective'

describe('perspective', () => {
  it('puts the middle of the back wall in the middle of the picture', () => {
    expect(project([0, 150, 400])).toEqual([500, 300])
  })

  it('makes far things smaller', () => {
    const near = project([100, 150, 0])[0] - 500
    const far = project([100, 150, 400])[0] - 500
    expect(near).toBeGreaterThan(far)
  })

  it('shows the inside face of a box against a wall', () => {
    expect(boxFaces({ x0: 100, x1: 200, y0: 0, y1: 50, z0: 100, z1: 200 }).side).not.toBeNull()
    expect(boxFaces({ x0: -50, x1: 50, y0: 0, y1: 50, z0: 100, z1: 200 }).side).toBeNull()
  })

  it('shades colours', () => {
    expect(shade('#808080', -0.5)).toBe('#404040')
    expect(shade('#000000', 1)).toBe('#ffffff')
  })
})
