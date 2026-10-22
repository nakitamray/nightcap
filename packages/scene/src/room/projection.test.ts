import { describe, expect, it } from 'vitest'
import { boxFaces, project, setRoomShape } from './projection'

describe('room projection', () => {
  it('puts the back wall in the middle, near the top in tall rooms', () => {
    setRoomShape(200, 440)
    expect(project([0, 170, 400])[0]).toBe(500)
    // the top of the back wall lands near the top of the picture
    expect(project([0, 440, 400])[1]).toBeCloseTo(40, 0)
    setRoomShape(200, 520)
    expect(project([0, 520, 400])[1]).toBeGreaterThan(0)
  })

  it('shows more ceiling in low rooms', () => {
    setRoomShape(240, 340)
    expect(project([0, 340, 400])[1]).toBeGreaterThan(100)
    setRoomShape(200, 440)
  })

  it('makes far things smaller', () => {
    expect(project([100, 170, 0])[0]).toBeGreaterThan(project([100, 170, 400])[0])
  })

  it('shows the inside face of a box against a wall', () => {
    expect(boxFaces({ x0: 100, x1: 200, y0: 0, y1: 50, z0: 100, z1: 200 }).side).not.toBeNull()
    expect(boxFaces({ x0: -50, x1: 50, y0: 0, y1: 50, z0: 100, z1: 200 }).side).toBeNull()
  })
})
