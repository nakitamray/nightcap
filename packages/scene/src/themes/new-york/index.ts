import { Container } from 'pixi.js'
import { People } from '../../layers/people'
import { Sky } from '../../layers/sky'
import { CURB } from '../../layout'
import type { Theme } from '../types'
import { House } from './house'
import { Neighbors } from './neighbors'
import { newYorkOutfits } from './people'
import { Manhattan } from './skyline'
import { checkerCab, CobraLamps, hydrant, PassingCab, Pavement } from './street'

export const newYork: Theme = {
  id: 'new-york',
  build({ seed, lights }) {
    // the city provides the glow; keep the sky's own low and the moon high
    const sky = new Sky(seed, { moon: { x: 720, y: 120, r: 54 }, glows: [], stars: 140 })
    const skyline = new Manhattan(seed + 1)
    const neighbors = new Neighbors(seed + 2, lights)
    const house = new House(seed + 3, lights)
    const lamps = new CobraLamps(lights, [640, 1660])
    const ground = new Pavement(seed + 5)

    const plug = hydrant()
    plug.position.set(1610, CURB - 8)
    const furniture = new Container()
    furniture.addChild(plug)

    const people = new People(seed + 10, newYorkOutfits)

    const parked = new Container()
    const left = checkerCab()
    left.position.set(700, CURB + 98)
    left.scale.set(-1, 1)
    const right = checkerCab()
    right.position.set(1860, CURB + 98)
    parked.addChild(left, right)
    const passing = new PassingCab(seed + 11, CURB + 112)

    return {
      house,
      backdrop: [sky, skyline, neighbors],
      props: [lamps],
      front: [],
      ground,
      pools: lamps.pools,
      people,
      foreground: [furniture, parked, passing],
      rain: 90,
      update(time, dt, pointerX, reducedMotion) {
        sky.update(time, dt)
        skyline.update(time, reducedMotion ? 0 : pointerX)
        neighbors.update(time, dt)
        lamps.update(time)
        ground.update(time, reducedMotion ? dt * 0.3 : dt)
        passing.update(reducedMotion ? 0 : dt)
      },
    }
  },
}

