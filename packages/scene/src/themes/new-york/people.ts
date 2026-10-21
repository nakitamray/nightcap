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
]
