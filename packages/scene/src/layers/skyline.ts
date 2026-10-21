import { Container, Graphics, Sprite } from 'pixi.js'
import { GROUND, WORLD } from '../layout'
import { palette } from '../palette'
import { createRng, int, range } from '../rng'
import { glowTexture } from '../textures'
import { BlinkingWindows, drawBuilding, randomRoof } from './buildings'

// Two bands of city behind the street. They drift a little against the
// pointer, which sells the depth more than you'd expect.
export class Skyline extends Container {
  private far = new Container()
  private near = new Container()
  private blinkers: BlinkingWindows
  private beacon!: Sprite

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
    this.far.addChild(this.eiffel(2230, 130, 560), farG)

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

  // way off in the distance, behind everything, with its beacon going round
  private eiffel(cx: number, tip: number, foot: number) {
    const tower = new Container()
    const g = new Graphics()
    const c = 0x1c2a5c
    const h = foot - tip
    const at = (t: number) => {
      // the curve of the legs: wide at the bottom, pinching quickly
      const half = 5 + 130 * Math.pow(1 - t, 2.2)
      return { y: foot - t * h, half }
    }
    const pts: number[] = []
    for (let i = 0; i <= 20; i++) {
      const { y, half } = at(i / 20)
      pts.push(cx - half, y)
    }
    for (let i = 20; i >= 0; i--) {
      const { y, half } = at(i / 20)
      pts.push(cx + half, y)
    }
    g.poly(pts).fill(c)
    // the base is hidden behind the rooftops anyway; just the platforms
    for (const t of [0.42, 0.72]) {
      const { y, half } = at(t)
      g.rect(cx - half - 8, y - 6, (half + 8) * 2, 8).fill(c)
    }
    g.rect(cx - 1.5, tip - 30, 3, 30).fill(c)
    tower.addChild(g)

    const beacon = new Sprite(glowTexture())
    beacon.anchor.set(0.5)
    beacon.position.set(cx, tip - 28)
    beacon.scale.set(0.25)
    beacon.tint = 0xffe6b0
    beacon.blendMode = 'add'
    tower.addChild(beacon)
    this.beacon = beacon
    return tower
  }

  /** px is -1..1, where the pointer is across the screen */
  update(time: number, px: number) {
    this.far.x += (-px * 10 - this.far.x) * 0.05
    this.near.x += (-px * 22 - this.near.x) * 0.05
    this.blinkers.update(time)
    this.beacon.alpha = 0.55 + Math.sin(time * 2.4) * 0.35
  }
}
