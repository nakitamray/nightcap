import { describe, expect, it } from 'vitest'
import {
  ACCESSORIES,
  avatarFromSeed,
  BOTTOMS,
  DEFAULT_AVATAR,
  FACE_SHAPES,
  FACES,
  HAIRSTYLES,
  MAX_ACCESSORIES,
  readAvatar,
  TOPS,
  type Avatar,
} from './avatar'
import { drawCharacter, type Pose } from './draw'

const POSES: Pose[] = ['stand', 'sit', 'floor']

describe('drawCharacter', () => {
  it('draws every option in every pose', () => {
    const tries: Partial<Avatar>[] = [
      ...HAIRSTYLES.map((hair) => ({ hair })),
      ...TOPS.map((top) => ({ top })),
      ...BOTTOMS.map((bottom) => ({ bottom })),
      ...FACES.map((face) => ({ face })),
      ...FACE_SHAPES.map((faceShape) => ({ faceShape })),
      ...ACCESSORIES.map((a) => ({ accessories: [a] })),
      { accessories: ['beanie', 'headphones', 'glasses'] },
    ]
    for (const t of tries)
      for (const pose of POSES)
        for (const turn of [-1, 0, 1] as const) {
          const c = drawCharacter({ ...DEFAULT_AVATAR, ...t }, { pose, turn })
          expect(c.children.length).toBeGreaterThan(0)
          c.destroy({ children: true })
        }
  })

  it('stands as tall as the people on the street, feet at the origin', () => {
    const b = drawCharacter(DEFAULT_AVATAR).getLocalBounds()
    expect(b.maxY).toBeGreaterThan(-2)
    expect(b.maxY).toBeLessThan(6)
    expect(b.minY).toBeLessThan(-260)
    expect(b.minY).toBeGreaterThan(-300)
  })

  it('sits with its feet 80 below the seat', () => {
    const b = drawCharacter(DEFAULT_AVATAR, { pose: 'sit' }).getLocalBounds()
    expect(b.maxY).toBeGreaterThan(78)
    expect(b.maxY).toBeLessThan(92)
  })

  it('breathes once it has something to tick it', () => {
    const ticks: ((t: number) => void)[] = []
    drawCharacter(DEFAULT_AVATAR, { animate: (t) => ticks.push(t) })
    expect(ticks).toHaveLength(1)
    expect(() => ticks[0]!(1.3)).not.toThrow()
  })
})

describe('readAvatar', () => {
  it('fills in whatever is missing', () => {
    expect(readAvatar(null)).toEqual(DEFAULT_AVATAR)
    expect(readAvatar({ hair: 'afro' }).hair).toBe('afro')
  })

  it('throws out anything it does not know', () => {
    const a = readAvatar({
      skin: 99,
      hair: 'mohawk',
      top: 1,
      topColour: -1,
      accessories: ['glasses', 'crown', 'glasses', 'scarf', 'beanie', 'earrings'],
    })
    expect(a.skin).toBe(DEFAULT_AVATAR.skin)
    expect(a.hair).toBe(DEFAULT_AVATAR.hair)
    expect(a.top).toBe(DEFAULT_AVATAR.top)
    expect(a.topColour).toBe(DEFAULT_AVATAR.topColour)
    expect(a.accessories).toEqual(['glasses', 'scarf', 'beanie'])
    expect(a.accessories.length).toBeLessThanOrEqual(MAX_ACCESSORIES)
  })

  it('keeps a made-up person the same every time', () => {
    expect(avatarFromSeed('ellie')).toEqual(avatarFromSeed('ellie'))
    expect(readAvatar(avatarFromSeed('ellie'))).toEqual(avatarFromSeed('ellie'))
  })
})
