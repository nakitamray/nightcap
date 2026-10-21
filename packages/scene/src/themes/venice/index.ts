import { Container } from 'pixi.js'
import { People } from '../../layers/people'
import { Sky } from '../../layers/sky'
import { CURB } from '../../layout'
import type { Theme } from '../types'
import { bridge, Canal, Gondola, mooringPoles } from './canal'
import { House } from './house'
import { Neighbors } from './neighbors'
import { veniceOutfits } from './people'
import { VeniceSkyline } from './skyline'

export const venice: Theme = {
  id: 'venice',
  build({ seed, lights }) {
    const sky = new Sky(seed, { moon: { x: 1700, y: 120, r: 62 }, glows: [], stars: 260 })
    const skyline = new VeniceSkyline(seed + 1)
    const neighbors = new Neighbors(seed + 2, lights)
    const house = new House(seed + 3, lights)
    const canal = new Canal(seed + 5)
    const people = new People(seed + 10, veniceOutfits)

    const gondola = new Gondola(CURB + 62)
    const poles = mooringPoles([640, 672, 1720, 1752], [0xb02418, 0x1e3a6a])
    const water = new Container()
    water.addChild(gondola, poles)

    return {
      house,
      backdrop: [sky, skyline, neighbors],
      props: [bridge(1900, 420)],
      front: [],
      ground: canal,
      pools: new Container(),
      people,
      foreground: [water],
      // the canal is a mirror on a still night
      reflection: 1.35,
      rain: 0,
      bloomThreshold: 0.4,
      update(time, dt, pointerX, reducedMotion) {
        sky.update(time, dt)
        skyline.update(time, reducedMotion ? 0 : pointerX)
        neighbors.update(time, dt)
        canal.update(time, dt)
        gondola.update(reducedMotion ? dt * 0.3 : dt, time)
      },
    }
  },
}
