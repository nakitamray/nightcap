import { Container } from 'pixi.js'
import { People } from '../../layers/people'
import { Sky } from '../../layers/sky'
import { GROUND } from '../../layout'
import type { Theme } from '../types'
import { House } from './house'
import { Neighbors } from './neighbors'
import { tokyoOutfits } from './people'
import { TokyoSkyline } from './skyline'
import { bicycle, Lane, Wires } from './street'

export const tokyo: Theme = {
  id: 'tokyo',
  build({ seed, lights }) {
    const sky = new Sky(seed, { moon: { x: 520, y: 120, r: 60 }, glows: [], stars: 160 })
    const skyline = new TokyoSkyline(seed + 1)
    const neighbors = new Neighbors(seed + 2, lights)
    const house = new House(seed + 3, lights)
    const wires = new Wires(lights, [720, 1800])
    const people = new People(seed + 10, tokyoOutfits)

    const parked = new Container()
    const bike = bicycle()
    bike.position.set(880, GROUND + 18)
    parked.addChild(bike)

    return {
      house,
      backdrop: [sky, skyline, neighbors],
      props: [wires],
      front: [],
      ground: new Lane(seed + 5),
      pools: wires.pools,
      people,
      foreground: [parked],
      rain: 120,
      update(time, dt, pointerX, reducedMotion) {
        sky.update(time, dt)
        skyline.update(time, reducedMotion ? 0 : pointerX)
        neighbors.update(time, reducedMotion)
        wires.update(time)
      },
    }
  },
}

