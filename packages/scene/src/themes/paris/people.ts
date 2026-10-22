import type { Outfit } from '../../layers/people'

// Paris in the seventies: trench coats, flares, berets, a mini dress and knee
// boots, a poodle.
export const parisOutfits: Outfit[] = [
  // camel trench, belted, big floppy hat
  {
    coat: 0x9a6a32,
    coatHem: -70,
    flare: 14,
    legs: 0x1a120e,
    bellBottoms: false,
    boots: 0x140c08,
    hat: 'wide',
    hatColour: 0x3a140c,
    longHair: true,
  },
  // leather jacket, turtleneck, tan flares, a baguette under the arm
  {
    coat: 0x4a1e10,
    coatHem: -132,
    flare: 2,
    legs: 0x8a5a2a,
    bellBottoms: true,
    boots: null,
    hat: 'none',
    hatColour: 0,
    longHair: false,
    carry: 'baguette',
  },
  // mustard mini dress, knee boots, red umbrella
  {
    coat: 0xc08a1c,
    coatHem: -118,
    flare: 10,
    legs: 0x2a160e,
    bellBottoms: false,
    boots: 0x0e0806,
    hat: 'none',
    hatColour: 0,
    longHair: true,
    dress: true,
    umbrella: 0xc0301e,
  },
  // long dark coat, beret, red scarf, flares
  {
    coat: 0x24202a,
    coatHem: -80,
    flare: 6,
    legs: 0x3a2a22,
    bellBottoms: true,
    boots: null,
    hat: 'beret',
    hatColour: 0x0e0a0a,
    longHair: false,
    scarf: 0xb02418,
  },
  // red maxi coat with a fur collar, headscarf, and the dog
  {
    coat: 0x8a1a14,
    coatHem: -40,
    flare: 16,
    legs: 0x140c0a,
    bellBottoms: false,
    boots: 0x140c0a,
    hat: 'scarf',
    hatColour: 0xd8a040,
    longHair: false,
    poodle: true,
  },
  // fedora, wide lapels, flares
  {
    coat: 0x5a3a1e,
    coatHem: -110,
    flare: 4,
    legs: 0x2e2018,
    bellBottoms: true,
    boots: null,
    hat: 'fedora',
    hatColour: 0x1a100c,
    longHair: false,
  },
]
