import type { Outfit } from '../../layers/people'

// Tokyo in the seventies: a kimono and a paper umbrella, a salaryman heading
// home, students in flares and round glasses, a mini dress, a school uniform.
export const tokyoOutfits: Outfit[] = [
  // kimono with an obi, hair up, red paper umbrella
  { coat: 0x2a1a3a, coatHem: -6, flare: 4, legs: 0xe8dcc8, bellBottoms: false, boots: null, hat: 'bun', hatColour: 0xd9a54a, longHair: false, dress: true, belt: 0xc0301e, umbrella: 0xc8261a },
  // salaryman, dark suit, briefcase
  { coat: 0x1e1e26, coatHem: -116, flare: 2, legs: 0x1e1e26, bellBottoms: false, boots: null, hat: 'none', hatColour: 0, longHair: false, carry: 'briefcase' },
  // long hair, round glasses, bucket hat, flares
  { coat: 0x7a4a1e, coatHem: -134, flare: 2, legs: 0x2a3a5a, bellBottoms: true, boots: null, hat: 'bucket', hatColour: 0x3a2a1e, longHair: true },
  // mustard mini dress, white boots
  { coat: 0xd09a20, coatHem: -116, flare: 10, legs: 0x2a160e, bellBottoms: false, boots: 0xe8e0d0, hat: 'none', hatColour: 0, longHair: true, dress: true },
  // school uniform, peaked cap, satchel
  { coat: 0x101018, coatHem: -126, flare: 2, legs: 0x101018, bellBottoms: false, boots: null, hat: 'cap', hatColour: 0x101018, longHair: false, carry: 'bag' },
  // red coat, headscarf and sunglasses
  { coat: 0x9a1e14, coatHem: -70, flare: 14, legs: 0x140c0a, bellBottoms: false, boots: 0x140c0a, hat: 'scarf', hatColour: 0xf2e2bd, longHair: false },
]
