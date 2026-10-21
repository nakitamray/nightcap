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
  // and everyone else out at nine o'clock
  { coat: 0x3a3a44, coatHem: -110, flare: 2, legs: 0x3a3a44, bellBottoms: false, boots: null, hat: 'none', hatColour: 0, longHair: false, carry: 'briefcase' },
  { coat: 0xe8dcc8, coatHem: -112, flare: 10, legs: 0x2a2a3a, bellBottoms: false, boots: 0x1a1a1a, hat: 'none', hatColour: 0, longHair: true, dress: true, carry: 'bag' },
  { coat: 0x5a2a6a, coatHem: -132, flare: 2, legs: 0x1e2838, bellBottoms: true, boots: null, hat: 'cap', hatColour: 0xc0301e, longHair: false },
  { coat: 0x1a3a5a, coatHem: -60, flare: 10, legs: 0x1a120e, bellBottoms: false, boots: 0x1a120e, hat: 'none', hatColour: 0, longHair: true, umbrella: 0x2a6ac0 },
  { coat: 0x8a6a2a, coatHem: -128, flare: 2, legs: 0x5a3a1e, bellBottoms: true, boots: null, hat: 'bucket', hatColour: 0x1a1a1a, longHair: false, carry: 'bag' },
  { coat: 0x101018, coatHem: -126, flare: 2, legs: 0x101018, bellBottoms: false, boots: null, hat: 'none', hatColour: 0, longHair: true, carry: 'bag' },
  { coat: 0xc04a6a, coatHem: -90, flare: 12, legs: 0x1a120e, bellBottoms: false, boots: 0xe8e0d0, hat: 'bun', hatColour: 0, longHair: false, dress: true },
  { coat: 0x2a4a3a, coatHem: -118, flare: 2, legs: 0x2a2a2e, bellBottoms: true, boots: null, hat: 'fedora', hatColour: 0x1a1a1a, longHair: false },
  { coat: 0x1e1e26, coatHem: -116, flare: 2, legs: 0x1e1e26, bellBottoms: false, boots: null, hat: 'none', hatColour: 0, longHair: false, umbrella: 0xe8e0d0 },
  { coat: 0xd0602a, coatHem: -134, flare: 2, legs: 0x2a3a5a, bellBottoms: true, boots: null, hat: 'afro', hatColour: 0, longHair: false },
  { coat: 0x6a1a14, coatHem: -70, flare: 14, legs: 0x140c0a, bellBottoms: false, boots: 0x140c0a, hat: 'scarf', hatColour: 0x2a2a3a, longHair: false, carry: 'bag' },
  { coat: 0x3a2a1e, coatHem: -112, flare: 4, legs: 0x3a2a1e, bellBottoms: true, boots: null, hat: 'cap', hatColour: 0x3a2a1e, longHair: false, carry: 'briefcase' },
]
