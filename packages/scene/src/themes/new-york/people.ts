import type { Outfit } from '../../layers/people'

// New York, seventies: big hair, leather, wide lapels, platform boots.
export const newYorkOutfits: Outfit[] = [
  // afro, brown leather jacket, tan flares
  { coat: 0x4a1e10, coatHem: -132, flare: 2, legs: 0x8a5a2a, bellBottoms: true, boots: null, hat: 'afro', hatColour: 0, longHair: false },
  // burnt-orange wrap dress, platform boots, long hair
  { coat: 0xc0501e, coatHem: -100, flare: 12, legs: 0x2a160e, bellBottoms: false, boots: 0x1a0e08, hat: 'none', hatColour: 0, longHair: true, dress: true },
  // three-piece suit, fedora, briefcase, on his way home late
  { coat: 0x3a2418, coatHem: -110, flare: 4, legs: 0x3a2418, bellBottoms: true, boots: null, hat: 'fedora', hatColour: 0x140c08, longHair: false, carry: 'briefcase' },
  // fur coat, headscarf, sunglasses
  { coat: 0x8a6a4a, coatHem: -60, flare: 18, legs: 0x140c0a, bellBottoms: false, boots: 0x140c0a, hat: 'scarf', hatColour: 0xb02418, longHair: false },
  // newsboy cap, denim jacket, a bag of records
  { coat: 0x2a3448, coatHem: -134, flare: 2, legs: 0x1e2838, bellBottoms: true, boots: null, hat: 'cap', hatColour: 0x3a2a1e, longHair: false, carry: 'bag' },
  // camel coat, red umbrella
  { coat: 0x9a6a32, coatHem: -70, flare: 12, legs: 0x1a120e, bellBottoms: false, boots: 0x140c08, hat: 'none', hatColour: 0, longHair: true, umbrella: 0xc0301e },
  // the second half of the crowd -- the upper west side at nine o'clock
  // turtleneck and a long skirt, bun, tote bag
  { coat: 0x6a2a3a, coatHem: -60, flare: 14, legs: 0x1a0e0a, bellBottoms: false, boots: 0x1a0e0a, hat: 'bun', hatColour: 0, longHair: false, dress: true, carry: 'bag' },
  // corduroy blazer, bucket hat
  { coat: 0x8a5a2a, coatHem: -128, flare: 2, legs: 0x3a2a1e, bellBottoms: true, boots: null, hat: 'bucket', hatColour: 0x2a3a5a, longHair: false },
  // green trench, beret
  { coat: 0x2a4a2a, coatHem: -74, flare: 12, legs: 0x1a120e, bellBottoms: false, boots: 0x140c08, hat: 'beret', hatColour: 0x8a1a14, longHair: true },
  // mustard suit, wide lapels, afro
  { coat: 0xc08a1c, coatHem: -126, flare: 2, legs: 0xc08a1c, bellBottoms: true, boots: null, hat: 'afro', hatColour: 0, longHair: false, carry: 'briefcase' },
  // red mini coat, white boots
  { coat: 0xb0201a, coatHem: -112, flare: 10, legs: 0x2a160e, bellBottoms: false, boots: 0xe8e0d0, hat: 'none', hatColour: 0, longHair: true },
  // navy peacoat, cap, groceries from the bodega
  { coat: 0x1e2a44, coatHem: -116, flare: 4, legs: 0x2a2a2e, bellBottoms: true, boots: null, hat: 'cap', hatColour: 0x1a1a1a, longHair: false, carry: 'bag' },
]
