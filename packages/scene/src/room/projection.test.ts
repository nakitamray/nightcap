import { describe, expect, it } from 'vitest'
import { boxFaces, project } from './projection'

describe('room projection', () => {
  it('puts the middle of the back wall in the middle of the picture', () => {
    expect(project([0, 170, 400])).toEqual([500, 480])
  })

  it('makes far things smaller', () => {
    expect(project([100, 170, 0])[0]).toBeGreaterThan(project([100, 170, 400])[0])
  })

  it('shows the inside face of a box against a wall', () => {
    expect(boxFaces({ x0: 100, x1: 200, y0: 0, y1: 50, z0: 100, z1: 200 }).side).not.toBeNull()
    expect(boxFaces({ x0: -50, x1: 50, y0: 0, y1: 50, z0: 100, z1: 200 }).side).toBeNull()
  })
})
