// What someone looks like: picked when they make their account, saved as
// json on their profile (profiles.avatar). Like a room layout, anything read
// back goes through readAvatar so an old or hand-edited one can't break a page.

export const SKINS = [
  0x3a2216, 0x553220, 0x6e4224, 0x8a5430, 0xa06c40, 0xb8825a, 0xcc9a70, 0xdcb08a, 0xe8c4a0, 0xf0d4b8,
] as const

export const HAIR_COLOURS = [
  0x140a06, 0x2e1a0e, 0x4a2a14, 0x7a4220, 0xa8642e, 0xd8a050, 0xe8d0a0, 0x8a8480, 0xc84a3a, 0x5a3a8a,
] as const

// strong colours for clothes, the same kind the rooms use
export const CLOTH_COLOURS = [
  0xc8302a, 0xe8603a, 0xe8c25a, 0x2a4a8a, 0x2f6b66, 0x5a2a5a, 0xff7a9a, 0x3a7a3a, 0x1e1a1c,
  0xf2e2bd, 0x6a3a22, 0x8aa8c8,
] as const

export const FACES = ['smile', 'sleepy', 'grin', 'freckles'] as const
export const FACE_SHAPES = ['round', 'oval', 'long'] as const
export const HAIRSTYLES = ['short', 'bob', 'long', 'curly', 'bun', 'afro', 'braids', 'buzz'] as const
export const TOPS = ['sweater', 'tee', 'cardigan', 'hoodie'] as const
export const BOTTOMS = ['jeans', 'skirt', 'trousers', 'shorts'] as const
export const ACCESSORIES = ['glasses', 'earrings', 'beanie', 'scarf', 'headphones', 'necklace'] as const
export const MAX_ACCESSORIES = 3

export type Face = (typeof FACES)[number]
export type FaceShape = (typeof FACE_SHAPES)[number]
export type Hairstyle = (typeof HAIRSTYLES)[number]
export type Top = (typeof TOPS)[number]
export type Bottom = (typeof BOTTOMS)[number]
export type Accessory = (typeof ACCESSORIES)[number]

export interface Avatar {
  /** index into SKINS */
  skin: number
  face: Face
  faceShape: FaceShape
  hair: Hairstyle
  /** index into HAIR_COLOURS */
  hairColour: number
  top: Top
  /** index into CLOTH_COLOURS */
  topColour: number
  bottom: Bottom
  bottomColour: number
  accessories: Accessory[]
}

export const DEFAULT_AVATAR: Avatar = {
  skin: 5,
  face: 'smile',
  faceShape: 'round',
  hair: 'bob',
  hairColour: 1,
  top: 'sweater',
  topColour: 0,
  bottom: 'jeans',
  bottomColour: 3,
  accessories: [],
}

function obj(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function pick<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback
}

function index(value: unknown, length: number, fallback: number) {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) < length
    ? (value as number)
    : fallback
}

/** turns whatever's saved into someone we can draw */
export function readAvatar(raw: unknown): Avatar {
  const r = obj(raw)
  const d = DEFAULT_AVATAR
  const accessories = Array.isArray(r.accessories)
    ? [...new Set(r.accessories.filter((a): a is Accessory => ACCESSORIES.includes(a as Accessory)))]
    : []
  return {
    skin: index(r.skin, SKINS.length, d.skin),
    face: pick(r.face, FACES, d.face),
    faceShape: pick(r.faceShape, FACE_SHAPES, d.faceShape),
    hair: pick(r.hair, HAIRSTYLES, d.hair),
    hairColour: index(r.hairColour, HAIR_COLOURS.length, d.hairColour),
    top: pick(r.top, TOPS, d.top),
    topColour: index(r.topColour, CLOTH_COLOURS.length, d.topColour),
    bottom: pick(r.bottom, BOTTOMS, d.bottom),
    bottomColour: index(r.bottomColour, CLOTH_COLOURS.length, d.bottomColour),
    accessories: accessories.slice(0, MAX_ACCESSORIES),
  }
}

/** a made-up person, for the demo house: the same seed always gives the same one */
export function avatarFromSeed(seed: string): Avatar {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  const n = (k: number) => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0
    return h % k
  }
  return {
    skin: n(SKINS.length),
    face: FACES[n(FACES.length)]!,
    faceShape: FACE_SHAPES[n(FACE_SHAPES.length)]!,
    hair: HAIRSTYLES[n(HAIRSTYLES.length)]!,
    hairColour: n(HAIR_COLOURS.length - 2),
    top: TOPS[n(TOPS.length)]!,
    topColour: n(CLOTH_COLOURS.length),
    bottom: BOTTOMS[n(BOTTOMS.length)]!,
    bottomColour: n(CLOTH_COLOURS.length),
    accessories: n(3) === 0 ? [ACCESSORIES[n(ACCESSORIES.length)]!] : [],
  }
}
