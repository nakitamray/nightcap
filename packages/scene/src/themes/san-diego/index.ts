import { Container } from 'pixi.js'
import { People } from '../../layers/people'
import { Sky } from '../../layers/sky'
import { CURB } from '../../layout'
import { CobraLamps } from '../new-york/street'
import type { Theme } from '../types'
import { Coast, MIRROR } from './coast'
import { House } from './house'
import { LAMPS, PALMS, SD_FOCUS } from './layout'
import { Neighbors } from './neighbors'
import { sanDiegoOutfits } from './people'
import { Palm, Road, surfBus, Trolley } from './street'

const MOON = { x: 400, y: 170, r: 66 }

export const sanDiego: Theme = {
  id: 'san-diego',
  build({ seed, lights }) {
    // the moon hangs out over the water, where the street runs off the cliff
    const sky = new Sky(seed, { moon: MOON, glows: [], stars: 280 })
    const coast = new Coast(seed + 1, MIRROR - MOON.x)
    const neighbors = new Neighbors(seed + 2, lights)
    const house = new House(seed + 3, lights)
    const lamps = new CobraLamps(lights, [...LAMPS])
    const palms = PALMS.map((p, i) => new Palm(seed + 20 + i, p.x, p.top, p.lean))
    const people = new People(seed + 10, sanDiegoOutfits)

    const parked = new Container()
    const bus = surfBus()
    bus.position.set(2120, CURB + 98)
    parked.addChild(bus)
    const trolley = new Trolley(seed + 11, CURB + 150)

    return {
      house,
      backdrop: [sky, coast, neighbors],
      props: [lamps],
      front: palms,
      ground: new Road(seed + 5),
      pools: lamps.pools,
      people,
      foreground: [parked, trolley],
      // it doesn't rain here; the road just shines a little under the lamps
      reflection: 0.45,
      rain: 0,
      focus: SD_FOCUS,
      update(time, dt, pointerX, reducedMotion) {
        sky.update(time, dt)
        coast.update(time, dt, reducedMotion ? 0 : pointerX, reducedMotion)
        neighbors.update(time, reducedMotion)
        lamps.update(time)
        trolley.update(reducedMotion ? 0 : dt)
        if (!reducedMotion) for (const p of palms) p.update(time)
      },
    }
  },
}
