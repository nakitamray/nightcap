import type { Outfit } from '../../layers/people'

// A warm night by the beach: boardshorts and hoodies, somebody still in a
// wetsuit carrying a board home, sundresses, flannel, a few people who came
// straight from work.
const base = {
  flare: 2,
  bellBottoms: false,
  boots: null,
  hat: 'none',
  hatColour: 0,
  longHair: false,
} satisfies Partial<Outfit>

export const sanDiegoOutfits: Outfit[] = [
  // hoodie and boardshorts, board under the arm
  { ...base, coat: 0x8a8a84, coatHem: -124, legs: 0x2a6a7a, shorts: true, carry: 'board' },
  // sundress, hair down
  { ...base, coat: 0xd8a02a, coatHem: -84, flare: 14, legs: 0x8a5430, longHair: true, dress: true },
  // tee, shorts and a trucker cap
  {
    ...base,
    coat: 0xe8e0d0,
    coatHem: -130,
    legs: 0x5a4a32,
    shorts: true,
    hat: 'cap',
    hatColour: 0x2a4a6a,
  },
  // still in the wetsuit, hair wet
  {
    ...base,
    coat: 0x101418,
    coatHem: -128,
    legs: 0x101418,
    longHair: true,
    carry: 'board',
    hatColour: 0x2a8a9a,
  },
  // flannel and jeans, beanie
  { ...base, coat: 0x8a2a1e, coatHem: -118, legs: 0x2a3a5a, hat: 'beret', hatColour: 0x2a2a2e },
  // aloha shirt, came out for tacos
  { ...base, coat: 0x2a7a6a, coatHem: -126, legs: 0xd8c8a0, shorts: true, carry: 'bag' },
  // long skirt and a denim jacket
  { ...base, coat: 0x3a5a8a, coatHem: -60, flare: 12, legs: 0x1a120e, longHair: true },
  // bucket hat and round glasses
  {
    ...base,
    coat: 0xc8642e,
    coatHem: -130,
    legs: 0x3a3a34,
    shorts: true,
    hat: 'bucket',
    hatColour: 0xe8e0d0,
  },
  // navy sweatshirt, off the base for the evening
  { ...base, coat: 0x1a2a4a, coatHem: -122, legs: 0x2a2a2e },
  // white dress, wide hat left over from the afternoon
  {
    ...base,
    coat: 0xe8e0d0,
    coatHem: -96,
    flare: 12,
    legs: 0x9c6a3a,
    hat: 'wide',
    hatColour: 0xc8a86a,
    longHair: true,
    dress: true,
  },
  // out for a run
  {
    ...base,
    coat: 0xe8603a,
    coatHem: -136,
    legs: 0x1a1a1e,
    shorts: true,
    hat: 'cap',
    hatColour: 0x1a1a1e,
  },
  // poncho hoodie, another board
  {
    ...base,
    coat: 0x6a4a2a,
    coatHem: -108,
    flare: 6,
    legs: 0x3a5a4a,
    shorts: true,
    hat: 'afro',
    carry: 'board',
    hatColour: 0xd8a02a,
  },
  // office clothes, jacket over the arm long ago
  { ...base, coat: 0xa8b8c8, coatHem: -124, legs: 0x2a2a34, carry: 'briefcase' },
  // pink mini dress, white boots
  {
    ...base,
    coat: 0xd85a8a,
    coatHem: -112,
    flare: 10,
    legs: 0x8a5430,
    boots: 0xe8e0d0,
    hat: 'bun',
    hatColour: 0xd9a54a,
    dress: true,
  },
]
