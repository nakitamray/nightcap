import { People } from '../../layers/people'
import { Sky } from '../../layers/sky'
import { Skyline } from '../../layers/skyline'
import { CURB } from '../../layout'
import type { Theme } from '../types'
import { ParkedCars } from './cars'
import { House } from './house'
import { Neighbors } from './neighbors'
import { parisOutfits } from './people'
import { couple, Lampposts, morrisColumn, Pavement, PlaneTree } from './street'
import { EiffelTower } from './eiffel'

export const paris: Theme = {
  id: 'paris',
  build({ seed, lights }) {
    const sky = new Sky(seed)
    const skyline = new Skyline(seed + 1)
    const tower = new EiffelTower(seed + 11, 1915, 92, 660)
    const neighbors = new Neighbors(seed + 2, lights)
    const house = new House(seed + 3, lights)
    const lamps = new Lampposts(lights)
    const trees = [new PlaneTree(seed + 6, 220, 0.92), new PlaneTree(seed + 9, 2240, 0.96)]

    const people = new People(seed + 10, parisOutfits)
    const lovers = couple()
    lovers.position.set(1700, CURB - 12)
    lovers.scale.set(0.5)
    people.addStanding(lovers)

    return {
      house,
      backdrop: [sky, tower, skyline, neighbors],
      props: [morrisColumn(seed + 7), lamps],
      front: trees,
      ground: new Pavement(seed + 5),
      pools: lamps.pools,
      people,
      foreground: [new ParkedCars({ x: 700, y: CURB + 98 }, { x: 1850, y: CURB + 98 })],
      update(time, dt, pointerX, reducedMotion) {
        sky.update(time, dt)
        skyline.update(time, reducedMotion ? 0 : pointerX)
        tower.update(time, reducedMotion)
        neighbors.update(time, dt)
        lamps.update(time)
        if (!reducedMotion) for (const tree of trees) tree.update(time)
      },
    }
  },
}
