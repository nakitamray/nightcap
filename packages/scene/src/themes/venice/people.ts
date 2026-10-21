import type { Outfit } from '../../layers/people'

// Venice, seventies, late: someone off the gondolas, a couple dressed for
// dinner, a woman in a red cape with a dog that rules the fondamenta.
export const veniceOutfits: Outfit[] = [
  // gondolier on his way home, straw hat, dark jacket
  { coat: 0x1a1a24, coatHem: -132, flare: 2, legs: 0x1a1a24, bellBottoms: false, boots: null, hat: 'fedora', hatColour: 0xc8a050, longHair: false },
  // red cape coat, headscarf, sunglasses, the poodle
  { coat: 0x9a1e14, coatHem: -50, flare: 22, legs: 0x140c0a, bellBottoms: false, boots: 0x140c0a, hat: 'scarf', hatColour: 0xd9a54a, longHair: false, poodle: true },
  // cream suit, flares
  { coat: 0xb8a080, coatHem: -110, flare: 4, legs: 0xb8a080, bellBottoms: true, boots: null, hat: 'none', hatColour: 0, longHair: false },
  // long burgundy dress, umbrella against the drizzle
  { coat: 0x5a1420, coatHem: -20, flare: 14, legs: 0x140c0a, bellBottoms: false, boots: 0x140c0a, hat: 'none', hatColour: 0, longHair: true, dress: true, umbrella: 0x1a3226 },
  // leather jacket, wide hat
  { coat: 0x4a1e10, coatHem: -132, flare: 2, legs: 0x3a2a22, bellBottoms: true, boots: null, hat: 'wide', hatColour: 0x2a140c, longHair: true },
]
