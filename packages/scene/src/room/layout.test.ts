import { describe, expect, it } from 'vitest'
import { DEFAULT_LAYOUT, readLayout, settle } from './layout'

describe('readLayout', () => {
  it('gives the default room for nothing', () => {
    expect(readLayout(null)).toEqual(DEFAULT_LAYOUT)
    expect(readLayout({})).toEqual(DEFAULT_LAYOUT)
    expect(readLayout('junk')).toEqual(DEFAULT_LAYOUT)
  })

  it('keeps good values and drops bad ones', () => {
    const l = readLayout({
      wall: '#AABBCC',
      bed: { spot: 'ceiling', sheets: '#112233' },
      lamp: 'disco',
    })
    expect(l.wall).toBe('#aabbcc')
    expect(l.bed.spot).toBe('right')
    expect(l.bed.sheets).toBe('#112233')
    expect(l.lamp).toBe(DEFAULT_LAYOUT.lamp)
  })

  it('only hangs two frames', () => {
    const frames = [0, 1, 2, 3].map((art) => ({ wall: 'right', art }))
    expect(readLayout({ frames })).toMatchObject({ frames: [{ art: 0 }, { art: 1 }] })
  })

  it('lets the strip be off', () => {
    expect(readLayout({ led: null }).led).toBeNull()
    expect(readLayout({ led: '#ff00ff' }).led).toBe('#ff00ff')
    expect(readLayout({ led: 'red' }).led).toBeNull()
  })

  it('moves the desk back if the bed is on the right wall', () => {
    expect(readLayout({ desk: { wall: 'right' } }).desk.wall).toBe('left')
    expect(readLayout({ bed: { spot: 'window' }, desk: { wall: 'right' } }).desk.wall).toBe('right')
    expect(
      settle({ ...DEFAULT_LAYOUT, desk: { ...DEFAULT_LAYOUT.desk, wall: 'right' } }).desk.wall,
    ).toBe('left')
  })
})
