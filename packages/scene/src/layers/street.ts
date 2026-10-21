import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { SIGN_FONT } from '../fonts'
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
      g.poly([x - 9, top + 50, x + 9, top + 50, x + 17, top + 10, x - 17, top + 10]).fill(0xffe08a)
      g.moveTo(x, top + 50).lineTo(x, top + 10).stroke({ color: ink, width: 2 })
      g.poly([x - 9, top + 50, x + 9, top + 50, x + 17, top + 10, x - 17, top + 10]).stroke({ color: ink, width: 2.5 })
      g.poly([x - 22, top + 10, x + 22, top + 10, x + 10, top - 6, x - 10, top - 6]).fill(ink)
      g.circle(x, top - 10, 5).fill(ink)
      g.rect(x - 1.5, top - 24, 3, 14).fill(ink)

      const glow = new Sprite(glowTexture())
      glow.anchor.set(0.5)
      glow.position.set(x, top + 30)
      glow.scale.set(0.9)
      glow.tint = palette.sodium
      glow.blendMode = 'add'
      glow.alpha = 0.9
      // big soft orange halo, and the light it throws on the wall behind
      const halo = new Sprite(glowTexture())
      halo.anchor.set(0.5)
      halo.position.set(x, top + 30)
      halo.scale.set(3.2)
      halo.tint = 0xff7a22
      halo.alpha = 0.2
      halo.blendMode = 'add'
      const wash = new Sprite(glowTexture())
      wash.anchor.set(0.5)
      wash.position.set(x, top + 200)
      wash.scale.set(3, 4)
      wash.tint = 0xff8a30
      wash.alpha = 0.12
      wash.blendMode = 'add'
      const cone = new Sprite(coneTexture())
      cone.anchor.set(0.5, 0)
      cone.position.set(x, top + 40)
      cone.scale.set(1.4, (GROUND - top - 40) / 256)
      cone.tint = palette.sodium
      cone.alpha = 0.26
      cone.blendMode = 'add'
      lights.addChild(wash, halo, cone, glow)
      this.lanterns.push(glow)

      const pool = new Sprite(glowTexture())
      pool.anchor.set(0.5)
      pool.position.set(x, GROUND + 26)
      pool.scale.set(2.8, 0.6)
      pool.tint = 0xffa63a
      pool.blendMode = 'add'
      pool.alpha = 0.6
      this.pools.addChild(pool)
    }
    this.addChild(g)

    // street name on the first post
    const first = LAMPPOSTS[0]
    const px = first.x
    const py = first.top + 180
    const plate = new Graphics()
      .rect(px - 3, py - 6, 6, 6)
      .fill(palette.ink)
      .roundRect(px - 52, py, 104, 44, 4)
      .fill(0x1a0d0a)
      .roundRect(px - 49, py + 3, 98, 38, 3)
      .stroke({ color: 0xe8d2a8, width: 1.5 })
    const name = new Text({
      text: 'RUE DE\nLA LUNE',
      style: { fontFamily: SIGN_FONT, fontSize: 14, lineHeight: 16, align: 'center', fill: 0xf2dfb6 },
      resolution: 3,
    })
    name.anchor.set(0.5)
    name.position.set(px, py + 22)
    this.addChild(plate, name)
  }

  update(time: number) {
    this.lanterns.forEach((l, i) => {
      l.alpha = 0.7 + Math.sin(time * 9 + i * 3) * 0.015 + Math.sin(time * 2.3 + i) * 0.03
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

/** a plane tree on the pavement, trunk base at (x, ground). crown sways a little. */
export class PlaneTree extends Container {
  private crown = new Container()
  private phase: number

  constructor(seed: number, x: number, scale = 1) {
    super()
    const rng = createRng(seed)
    this.phase = rng() * 10
    const bark = 0x120c0a
    const trunk = new Graphics()
      .poly([-20, 0, 20, 0, 12, -420, -10, -420])
      .fill(bark)
      // the mottled patches plane trees have
      .ellipse(-4, -120, 6, 14)
      .ellipse(5, -220, 5, 10)
      .ellipse(-3, -300, 4, 9)
      .fill({ color: 0x3a2a1c, alpha: 0.7 })
      .moveTo(2, -390)
      .bezierCurveTo(40, -470, 120, -520, 180, -560)
      .stroke({ color: bark, width: 11 })
      .moveTo(0, -370)
      .bezierCurveTo(-40, -460, -100, -510, -160, -560)
      .stroke({ color: bark, width: 10 })
    this.addChild(trunk)

    const leaves = new Graphics()
    for (let i = 0; i < 80; i++) {
      const cx = range(rng, -270, 270)
      const cy = range(rng, -820, -480) + Math.abs(cx) * 0.3
      leaves.circle(cx, cy, range(rng, 26, 62)).fill({ color: i % 3 ? 0x0b1209 : 0x111a0d, alpha: 0.97 })
    }
    // the underside of the canopy catches the lamplight
    for (let i = 0; i < 60; i++) {
      const cx = range(rng, -230, 230)
      leaves.circle(cx, range(rng, -540, -460) + Math.abs(cx) * 0.25, range(rng, 18, 34)).fill({
        color: i % 2 ? 0x2a2a0e : 0x1e220c,
        alpha: 0.55,
      })
    }
    for (let i = 0; i < 140; i++) {
      leaves.circle(range(rng, -300, 300), range(rng, -880, -440), range(rng, 4, 10)).fill(0x0b1209)
    }
    this.crown.addChild(leaves)
    this.crown.pivot.set(0, -420)
    this.crown.position.set(0, -420)
    this.addChild(this.crown)
    this.position.set(x, GROUND + 30)
    this.scale.set(scale)
  }

  update(time: number) {
    this.crown.rotation = Math.sin(time * 0.5 + this.phase) * 0.006 + Math.sin(time * 1.3 + this.phase) * 0.003
  }
}

/** two people under one red umbrella, feet at the origin */
export function couple() {
  const g = new Graphics()
  const ink = palette.ink
  // him
  g.circle(-14, -176, 11).fill(ink)
  g.poly([-26, -164, -4, -164, 0, -60, -6, 0, -14, 0, -18, -60, -30, -70]).fill(ink)
  // her, leaning in, red dress
  g.circle(12, -170, 10).fill(ink)
  g.poly([2, -160, 20, -158, 26, -96, 34, 0, -4, 0, 4, -96]).fill(0xb3261a)
  g.poly([2, -160, 20, -158, 18, -120, 4, -120]).fill(ink)
  // umbrella
  g.rect(-2, -250, 3, 100).fill(ink)
  g.moveTo(-70, -228)
    .bezierCurveTo(-60, -290, 60, -290, 70, -228)
    .lineTo(46, -236)
    .lineTo(24, -226)
    .lineTo(0, -236)
    .lineTo(-24, -226)
    .lineTo(-46, -236)
    .closePath()
    .fill(0xc0301e)
  g.circle(0, -282, 3).fill(ink)
  return g
}
