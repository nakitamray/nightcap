import { Container, Graphics, Sprite } from 'pixi.js'
import { CURB, GROUND, LAMPPOSTS, MORRIS_COLUMN, WORLD } from '../layout'
import { palette } from '../palette'
import { createRng, range } from '../rng'
import { coneTexture, glowTexture } from '../textures'

const STREET_BOTTOM = WORLD.height + 700

/** the ground: sidewalk, kerb and cobbled road. drawn once. */
export class Pavement extends Container {
  constructor(seed: number) {
    super()
    const rng = createRng(seed)
    const g = new Graphics()
    g.rect(-500, GROUND, WORLD.width + 1000, CURB - GROUND).fill(palette.sidewalk)
    for (let x = -500; x < WORLD.width + 500; x += 64) g.rect(x, GROUND, 2, CURB - GROUND).fill({ color: palette.ink, alpha: 0.5 })
    g.rect(-500, CURB - 6, WORLD.width + 1000, 6).fill(0x3a2a22)
    g.rect(-500, CURB, WORLD.width + 1000, STREET_BOTTOM - CURB).fill(palette.road)

    // cobbles, getting bigger toward the viewer
    let y = CURB + 6
    let row = 0
    while (y < STREET_BOTTOM) {
      const h = 9 + (y - CURB) * 0.06
      const w = h * 1.9
      let x = -500 + (row % 2 ? w / 2 : 0)
      while (x < WORLD.width + 500) {
        g.roundRect(x + 1.5, y + 1.5, w - 3, h - 3, h * 0.35).fill({ color: palette.cobble, alpha: range(rng, 0.6, 1) })
        x += w
      }
      y += h
      row++
    }
    // tram rails, because the reference had them and they look great wet
    for (const ry of [CURB + 70, CURB + 96]) g.rect(-500, ry, WORLD.width + 1000, 3).fill({ color: 0x4a3a32, alpha: 0.8 })
    this.addChild(g)
  }
}

/** Paris lamps: fluted cast-iron base, slim post, glass lantern on top. */
export class Lampposts extends Container {
  readonly pools = new Container()
  private lanterns: Sprite[] = []

  constructor(lights: Container) {
    super()
    const g = new Graphics()
    for (const { x, top } of LAMPPOSTS) {
      const ink = palette.ink
      // base
      g.poly([x - 18, GROUND + 26, x + 18, GROUND + 26, x + 12, GROUND - 40, x - 12, GROUND - 40]).fill(ink)
      for (const fx of [-6, 0, 6]) g.rect(x + fx - 0.75, GROUND - 36, 1.5, 58).fill({ color: 0x2a3048, alpha: 0.8 })
      g.rect(x - 15, GROUND - 46, 30, 6).rect(x - 10, GROUND - 90, 20, 44).fill(ink)
      g.circle(x, GROUND - 96, 9).fill(ink)
      // post with collars
      g.rect(x - 3.5, top + 50, 7, GROUND - 96 - (top + 50)).fill(ink)
      g.rect(x - 7, top + 140, 14, 5).rect(x - 8, top + 50, 16, 8).fill(ink)
      // ladder bar, every Paris lamp has one
      g.rect(x - 22, top + 70, 44, 4).fill(ink)
      g.circle(x - 22, top + 72, 3).circle(x + 22, top + 72, 3).fill(ink)
      // lantern: glass panes, flaring out to the cap
      g.poly([x - 9, top + 50, x + 9, top + 50, x + 17, top + 10, x - 17, top + 10]).fill(palette.lampWhite)
      g.moveTo(x, top + 50).lineTo(x, top + 10).stroke({ color: ink, width: 2 })
      g.poly([x - 9, top + 50, x + 9, top + 50, x + 17, top + 10, x - 17, top + 10]).stroke({ color: ink, width: 2.5 })
      g.poly([x - 22, top + 10, x + 22, top + 10, x + 10, top - 6, x - 10, top - 6]).fill(ink)
      g.circle(x, top - 10, 5).fill(ink)
      g.rect(x - 1.5, top - 24, 3, 14).fill(ink)

      const glow = new Sprite(glowTexture())
      glow.anchor.set(0.5)
      glow.position.set(x, top + 30)
      glow.scale.set(1.5)
      glow.tint = palette.lampWhite
      glow.blendMode = 'add'
      glow.alpha = 0.8
      const cone = new Sprite(coneTexture())
      cone.anchor.set(0.5, 0)
      cone.position.set(x, top + 40)
      cone.scale.set(1.3, (GROUND - top - 40) / 256)
      cone.tint = palette.lampWhite
      cone.alpha = 0.2
      cone.blendMode = 'add'
      lights.addChild(cone, glow)
      this.lanterns.push(glow)

      const pool = new Sprite(glowTexture())
      pool.anchor.set(0.5)
      pool.position.set(x, GROUND + 26)
      pool.scale.set(2.2, 0.5)
      pool.tint = palette.amber
      pool.blendMode = 'add'
      pool.alpha = 0.5
      this.pools.addChild(pool)
    }
    this.addChild(g)
  }

  update(time: number) {
    this.lanterns.forEach((l, i) => {
      l.alpha = 0.78 + Math.sin(time * 9 + i * 3) * 0.015 + Math.sin(time * 2.3 + i) * 0.03
    })
  }
}

/** the green advertising column with its little dome and posters */
export function morrisColumn(seed: number) {
  const rng = createRng(seed)
  const { x, width: w, top } = MORRIS_COLUMN
  const g = new Graphics()
  const left = x - w / 2
  g.rect(left - 6, GROUND - 6, w + 12, 30).fill(palette.morris)
  g.rect(left, top, w, GROUND - top).fill(palette.morris)
  // posters, faded and overlapping
  let py = top + 14
  while (py < GROUND - 30) {
    const ph = range(rng, 40, 70)
    const color = [0xd8c39a, 0xa83a22, 0xd99a3a, 0x3a4a7a][Math.floor(rng() * 4)] ?? 0xd8c39a
    g.rect(left + 4, py, w - 8, ph - 4).fill({ color, alpha: 0.75 })
    g.rect(left + 10, py + 8, w - 20, 5).rect(left + 10, py + 18, (w - 20) * 0.6, 3).fill({ color: palette.ink, alpha: 0.45 })
    py += ph
  }
  // shading so it reads as round
  g.rect(left, top, 10, GROUND - top).fill({ color: palette.ink, alpha: 0.35 })
  g.rect(left + w - 14, top, 14, GROUND - top).fill({ color: palette.ink, alpha: 0.45 })
  g.rect(left - 6, top - 14, w + 12, 14).fill(palette.morris)
  g.rect(left - 2, top - 30, w + 4, 16).fill(0x16301f)
  g.moveTo(left - 4, top - 30)
    .arc(x, top - 30, w / 2 + 4, Math.PI, 0)
    .fill(palette.morris)
  g.circle(x, top - 30 - w / 2 - 8, 6).fill(palette.morris)
  return g
}

/** a big plane tree on the left edge, mostly just dark leaves against the sky */
export class PlaneTree extends Container {
  private crown = new Container()

  constructor(seed: number) {
    super()
    const rng = createRng(seed)
    const trunk = new Graphics()
    trunk
      .poly([60, GROUND + 30, 100, GROUND + 30, 92, 600, 70, 600])
      .fill(0x0a0c14)
      .moveTo(82, 640)
      .bezierCurveTo(120, 560, 200, 520, 250, 470)
      .stroke({ color: 0x0a0c14, width: 10 })
      .moveTo(80, 620)
      .bezierCurveTo(40, 540, 0, 500, -60, 470)
      .stroke({ color: 0x0a0c14, width: 9 })
    this.addChild(trunk)
    const leaves = new Graphics()
    for (let i = 0; i < 70; i++) {
      const cx = range(rng, -220, 300)
      const cy = range(rng, 330, 640) + Math.abs(cx - 80) * 0.25
      leaves.circle(cx, cy, range(rng, 24, 60)).fill({ color: i % 3 ? 0x070a12 : 0x0b1020, alpha: 0.97 })
    }
    // ragged edge
    for (let i = 0; i < 120; i++) {
      leaves.circle(range(rng, -240, 330), range(rng, 300, 700), range(rng, 4, 10)).fill(0x070a12)
    }
    this.crown.addChild(leaves)
    this.crown.pivot.set(80, 640)
    this.crown.position.set(80, 640)
    this.addChild(this.crown)
  }

  update(time: number) {
    this.crown.rotation = Math.sin(time * 0.5) * 0.006 + Math.sin(time * 1.3) * 0.003
  }
}
