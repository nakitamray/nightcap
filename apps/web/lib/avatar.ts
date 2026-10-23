// What people look like lives with the drawing code in @nightcap/scene; this
// adds the names the character maker shows.
export {
  ACCESSORIES,
  avatarFromSeed,
  BOTTOMS,
  CLOTH_COLOURS,
  DEFAULT_AVATAR,
  FACE_SHAPES,
  FACES,
  HAIR_COLOURS,
  HAIRSTYLES,
  MAX_ACCESSORIES,
  readAvatar,
  SKINS,
  TOPS,
} from '@nightcap/scene/layout'
export type { Accessory, Avatar } from '@nightcap/scene/layout'

export const NAMES: Record<string, string> = {
  // faces
  smile: 'smiley',
  sleepy: 'sleepy',
  grin: 'big grin',
  freckles: 'freckly',
  round: 'round',
  oval: 'oval',
  long: 'long',
  // hair
  short: 'short',
  bob: 'bob',
  curly: 'curly',
  bun: 'bun',
  afro: 'afro',
  braids: 'braids',
  buzz: 'buzzed',
  // clothes
  sweater: 'chunky sweater',
  tee: 't-shirt',
  cardigan: 'cardigan',
  hoodie: 'hoodie',
  jeans: 'jeans',
  skirt: 'skirt',
  trousers: 'trousers',
  shorts: 'shorts',
  // bits and bobs
  glasses: 'glasses',
  earrings: 'earrings',
  beanie: 'beanie',
  scarf: 'scarf',
  headphones: 'headphones',
  necklace: 'necklace',
}

/** 0xrrggbb to a css colour */
export function css(n: number) {
  return `#${n.toString(16).padStart(6, '0')}`
}
