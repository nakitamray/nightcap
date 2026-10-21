import { Container, Graphics } from 'pixi.js'
import { GROUND, WORLD } from '../layout'
import { palette } from '../palette'
import { createRng, int, range } from '../rng'
import { BlinkingWindows, drawBuilding, randomRoof } from './buildings'

// Two bands of city behind the street. They drift a little against the
// pointer, which sells the depth more than you'd expect.
export class Skyline extends Container {
  private far = new Container()
  private near = new Container()
  private blinkers: BlinkingWindows

  constructor(seed: number) {
    super()
    const rng = createRng(seed)
    this.addChild(this.far, this.near)

    const farG = new Graphics()
    let x = -500
    while (x < WORLD.width + 500) {
      const width = range(rng, 70, 170)
      drawBuilding(
        farG,
        {
          x,
          width,
          top: range(rng, 430, 700),
          bottom: GROUND,
          color: palette.farCity,
          roof: randomRoof(rng),
          litChance: 0.06,
          windowSize: [5, 7],
          gap: [7, 10],
        },
        rng,
      )
      x += width + range(rng, -10, 20)
    }
    farG.alpha = 0.95
    this.far.addChild(farG)

    const nearG = new Graphics()
    const blinkRects: { x: number; y: number; w: number; h: number }[] = []
    x = -500
    while (x < WORLD.width + 500) {
      const width = range(rng, 110, 240)
      const lit = drawBuilding(
        nearG,
        {
          x,
          width,
          top: range(rng, 560, 800),
          bottom: GROUND,
          color: palette.nearCity,
          roof: randomRoof(rng),
          litChance: 0.09,
          windowSize: [7, 10],
          gap: [9, 12],
        },
        rng,
      )
      for (let i = 0; i < Math.min(lit.length, int(rng, 0, 2)); i++) {
        const r = lit[int(rng, 0, lit.length - 1)]
        if (r) blinkRects.push(r)
      }
      x += width + range(rng, 0, 30)
    }
    this.near.addChild(nearG)
    this.blinkers = new BlinkingWindows(blinkRects, rng)
    this.near.addChild(this.blinkers)
  }

  /** px is -1..1, where the pointer is across the screen */
  update(time: number, px: number) {
    this.far.x += (-px * 10 - this.far.x) * 0.05
    this.near.x += (-px * 22 - this.near.x) * 0.05
    this.blinkers.update(time)
  }
}
