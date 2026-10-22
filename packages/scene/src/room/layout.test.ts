import { describe, expect, it } from 'vitest'
import { defaultLayout, readLayout, settle } from './layout'

describe('readLayout', () => {
  it('gives the room its own starting layout for nothing', () => {
    expect(readLayout(null, 3)).toEqual(defaultLayout(3))
    expect(readLayout('junk', 7)).toEqual(defaultLayout(7))
    expect(defaultLayout(0)).not.toEqual(defaultLayout(1))
  })

  it('keeps good values and drops bad ones', () => {
    const l = readLayout({
      wall: '#AABBCC',
      bed: { spot: 'ceiling', sheets: '#112233', style: 'canopy' },
      lamp: 'disco',
    })
    expect(l.wall).toBe('#aabbcc')
    expect(l.bed.spot).toBe('right')
    expect(l.bed.style).toBe('canopy')
    expect(l.bed.sheets).toBe('#112233')
    expect(l.lamp).toBe(defaultLayout(0).lamp)
  })

  it('turns old framed pictures into posters', () => {
    expect(
      readLayout({
        frames: [
          { wall: 'left', art: 2 },
          { wall: 'right', art: 4 },
        ],
      }).posters,
    ).toEqual([2, 4])
  })

  it('turns old extra bookcases into furniture, and keeps only known pieces', () => {
    expect(readLayout({ shelves: 2 }).furniture).toEqual(['bookcase', 'bookcase'])
    expect(readLayout({ furniture: ['beanbag', 'spaceship', 'lounger'] }).furniture).toEqual([
      'beanbag',
      'lounger',
    ])
  })

  it('reads pets, falling back on a breed that exists', () => {
    expect(readLayout({ pet: { kind: 'dog', breed: 'shepherd' } }).pet).toEqual({
      kind: 'dog',
      breed: 'shepherd',
    })
    expect(readLayout({ pet: { kind: 'cat', breed: 'dragon' } }).pet).toEqual({
      kind: 'cat',
      breed: 'black',
    })
    expect(readLayout({ pet: { kind: 'none' } }).pet).toEqual({ kind: 'none' })
  })

  it('keeps the nightstand to one of the three styles', () => {
    expect(readLayout({ nightstand: 'skirted' }).nightstand).toBe('skirted')
    expect(['drawers', 'skirted', 'suitcases']).toContain(
      readLayout({ nightstand: 'throne' }).nightstand,
    )
  })

  it('never has fairy lights and a strip in the same room', () => {
    // room 0 has fairy lights, room 1 a strip
    expect(readLayout({ led: '#ff00ff' }, 0).led).toBeNull()
    expect(readLayout({ led: '#ff00ff' }, 1).led).toBe('#ff00ff')
  })

  it('moves the desk back if the bed is on the right wall', () => {
    expect(readLayout({ desk: { wall: 'right' } }).desk.wall).toBe('left')
    expect(readLayout({ bed: { spot: 'window' }, desk: { wall: 'right' } }).desk.wall).toBe('right')
    const l = defaultLayout(1)
    expect(
      settle(
        { ...l, bed: { ...l.bed, spot: 'right' }, desk: { wall: 'right', color: '#000000' } },
        1,
      ).desk.wall,
    ).toBe('left')
  })
})
