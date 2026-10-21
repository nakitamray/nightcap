import { Container, Graphics, Sprite } from 'pixi.js'
import { CURB, GROUND, WORLD } from '../../layout'
import { palette } from '../../palette'
import { createRng, range } from '../../rng'
import { coneTexture, glowTexture } from '../../textures'

const STREET_BOTTOM = WORLD.height + 700

/** a narrow lane: asphalt right up to the buildings, a white edge line, a decorated manhole */
export class Lane extends Container {
  constructor(seed: number) {
    super()
    const rng = createRng(seed)
    const g = new Graphics()
    g.rect(-500, GROUND, WORLD.width + 1000, STREET_BOTTOM - GROUND).fill(0x0e0c0e)
    for (let i = 0; i < 60; i++) {
      g.rect(range(rng, -400, WORLD.width + 400), range(rng, GROUND + 4, GROUND + 300), range(rng, 20, 120), range(rng, 4, 16)).fill({
        color: 0x161416,
        alpha: 0.8,
      })
    }
    // the white line the lane has instead of a kerb
    g.rect(-500, CURB - 4, WORLD.width + 1000, 4).fill({ color: 0xd8d0c0, alpha: 0.55 })
    // a gutter grate along the buildings
    for (let x = -500; x < WORLD.width + 500; x += 8) g.rect(x, GROUND + 4, 4, 10).fill({ color: palette.ink, alpha: 0.6 })
    // fancy cast manhole cover
    g.ellipse(1060, CURB + 30, 40, 8).fill(0x2a2422)
    g.ellipse(1060, CURB + 30, 30, 5.5).stroke({ color: 0x4a403a, width: 2 })
    g.ellipse(1060, CURB + 30, 16, 3).stroke({ color: 0x4a403a, width: 1.5 })
    this.addChild(g)
  }
}

/**
 * Concrete telegraph poles with their crossbars and transformer cans, wires
 * drooping between them and off across the lane, a lamp on each.
 */
export class Wires extends Container {
  readonly pools = new Container()
  private lamps: Sprite[] = []

  constructor(lights: Container, xs: number[]) {
    super()
    const g = new Graphics()
    const top = 360
    for (const x of xs) {
      g.rect(x - 7, top, 14, GROUND + 26 - top).fill(0x4a4644)
      g.rect(x - 7, top, 3, GROUND + 26 - top).fill({ color: 0x6a6664, alpha: 0.6 })
      for (const [y, w] of [
        [top + 20, 90],
        [top + 60, 70],
      ] as const) {
        g.rect(x - w / 2, y, w, 6).fill(0x2a2826)
        for (let ix = x - w / 2 + 6; ix < x + w / 2; ix += 20) g.rect(ix, y - 8, 5, 8).fill(0xd8d0c0)
      }
      // transformer can
      g.roundRect(x + 10, top + 90, 30, 46, 4).fill(0x6a6a70)
      g.rect(x + 7, top + 100, 4, 2).rect(x + 7, top + 124, 4, 2).fill(0x2a2826)
      // the yellow-and-black guard at the bottom
      for (let sy = GROUND - 90; sy < GROUND + 20; sy += 16) g.poly([x - 8, sy, x + 8, sy - 8, x + 8, sy, x - 8, sy + 8]).fill(0xe0a018)
      // lamp on a short arm
      const ly = top + 190
      g.rect(x, ly, 46, 4).fill(0x2a2826)
      g.roundRect(x + 32, ly - 2, 30, 10, 3).fill(0x2a2826)
      g.rect(x + 36, ly + 8, 22, 3).fill(0xfff0c0)
      const lamp = new Sprite(glowTexture())
      lamp.anchor.set(0.5)
      lamp.position.set(x + 47, ly + 10)
      lamp.scale.set(0.9, 0.6)
      lamp.tint = 0xffd890
      lamp.blendMode = 'add'
      const cone = new Sprite(coneTexture())
      cone.anchor.set(0.5, 0)
      cone.position.set(x + 47, ly + 10)
      cone.scale.set(1.2, (GROUND - ly) / 256)
      cone.tint = 0xffc870
      cone.alpha = 0.22
      cone.blendMode = 'add'
      lights.addChild(cone, lamp)
      this.lamps.push(lamp)
      const pool = new Sprite(glowTexture())
      pool.anchor.set(0.5)
      pool.position.set(x + 47, GROUND + 24)
      pool.scale.set(2.6, 0.6)
      pool.tint = 0xffb050
      pool.alpha = 0.5
      pool.blendMode = 'add'
      this.pools.addChild(pool)
    }
    // the wires: every crossbar insulator strung to the next pole and off the edges
    const ends = [-600, ...xs, WORLD.width + 600]
    for (let i = 0; i < ends.length - 1; i++) {
      const a = ends[i]!
      const b = ends[i + 1]!
      for (const [dy, sag] of [
        [12, 40],
        [14, 52],
        [52, 34],
        [54, 46],
      ] as const) {
        g.moveTo(a, top + dy).quadraticCurveTo((a + b) / 2, top + dy + sag * 2, b, top + dy).stroke({ color: 0x0a0a0e, width: 1.6 })
      }
    }
    // and a couple sagging off to the buildings
    for (const x of xs) {
      g.moveTo(x, top + 60).quadraticCurveTo(x - 140, top + 160, x - 260, top + 120).stroke({ color: 0x0a0a0e, width: 1.4 })
      g.moveTo(x, top + 20).quadraticCurveTo(x + 160, top + 90, x + 300, top + 40).stroke({ color: 0x0a0a0e, width: 1.4 })
    }
    this.addChild(g)
  }

  update(time: number) {
    this.lamps.forEach((l, i) => (l.alpha = 0.85 + Math.sin(time * 8 + i * 5) * 0.02))
  }
}

/** a bicycle leaning on its stand, facing right, wheels on y = 0 */
export function bicycle() {
  const g = new Graphics()
  const c = { color: 0x2a2a30, width: 3 }
  g.circle(-40, -26, 24).stroke(c)
  g.circle(40, -26, 24).stroke(c)
  g.moveTo(-40, -26).lineTo(-6, -26).lineTo(18, -62).lineTo(-20, -62).lineTo(-40, -26).stroke(c)
  g.moveTo(-6, -26).lineTo(-20, -70).stroke(c)
  g.moveTo(18, -62).lineTo(40, -26).stroke(c)
  g.moveTo(18, -62).lineTo(14, -78).lineTo(30, -82).stroke(c)
  g.rect(-30, -74, 22, 5).fill(0x2a2a30)
  // basket on the front, as every mamachari has
  g.rect(30, -84, 30, 20).stroke({ color: 0x8a8a90, width: 2 })
  return g
}
