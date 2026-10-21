import { Container } from 'pixi.js'
import { People } from '../../layers/people'
import { Sky } from '../../layers/sky'
import { CURB, GROUND } from '../../layout'
import type { Theme } from '../types'
import {
  bacaroCrowd,
  festoons,
  fruitBarge,
  lionFlag,
  rialto,
  Vaporetto,
  vaporettoStop,
  WaterTaxi,
} from './bustle'
import { Canal, Gondola, mooringPoles } from './canal'
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

    // the canal is never empty: gondolas both ways, the water bus, a taxi tearing past
    const gondola = new Gondola(CURB + 62)
    const another = new Gondola(CURB + 30, { speed: -40, start: 2000, scale: 0.72 })
    const third = new Gondola(CURB + 44, { speed: 30, start: 1100, scale: 0.8 })
    const bus = new Vaporetto(CURB + 16, { speed: -22, start: 1400, scale: 0.52 })
    const taxi = new WaterTaxi(CURB + 92, { speed: 170, start: -400, scale: 0.72 })
    const poles = mooringPoles([640, 672, 1720, 1752], [0xb02418, 0x1e3a6a])
    const water = new Container()
    water.addChild(
      bus,
      another,
      third,
      fruitBarge(330, lights),
      vaporettoStop(1560, lights),
      gondola,
      poles,
      taxi,
    )
    const boats = [gondola, another, third]

    // the fondamenta: a crowd outside the bacaro, bulbs strung along the water
    const crowd = bacaroCrowd(830, 1030, lights)
    const strung = festoons([-60, 300, 700, 1080, 1320, 1700], GROUND - 150, lights)
    const flag = lionFlag(560, 470)

    return {
      house,
      backdrop: [sky, skyline, neighbors],
      props: [rialto(1860, 560, lights), flag.node],
      front: [],
      ground: canal,
      pools: new Container(),
      people,
      foreground: [crowd, strung.node, water],
      // the canal is a mirror on a still night
      reflection: 1.35,
      rain: 0,
      bloomThreshold: 0.4,
      update(time, dt, pointerX, reducedMotion) {
        sky.update(time, dt)
        skyline.update(time, reducedMotion ? 0 : pointerX)
        neighbors.update(time, dt)
        canal.update(time, dt)
        const d = reducedMotion ? dt * 0.3 : dt
        boats.forEach((b, i) => b.update(d, time + i * 2))
        bus.update(d, time)
        taxi.update(d, time)
        strung.update(time)
        flag.update(time)
      },
    }
  },
}
