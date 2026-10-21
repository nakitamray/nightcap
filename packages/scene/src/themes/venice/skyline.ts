import { Container, Graphics, Sprite } from 'pixi.js'
import { WORLD } from '../../layout'
import { chance, createRng, range } from '../../rng'
import { glowTexture } from '../../textures'

const BASE = 760
const FAR = 0x0e0c18
const NEAR = 0x14101c

// Over the roofs: a bell tower with its belfry lit, the big domed church on
// the water, and a jumble of roofs and funnel chimneys in between.
export class VeniceSkyline extends Container {
  private far = new Container()
  private near = new Container()
  private bell!: Sprite

  constructor(seed: number) {
    super()
    const rng = createRng(seed)
    for (const [x, sx, sy, a, tint] of [
      [WORLD.width / 2, 15, 3.4, 0.45, 0xff4a1e],
      [470, 5, 2.4, 0.4, 0xff8a2a],
      [1990, 5, 2.4, 0.4, 0xff8a2a],
    ] as const) {
      const s = new Sprite(glowTexture())
      s.anchor.set(0.5)
      s.position.set(x, BASE - 200)
      s.scale.set(sx, sy)
      s.tint = tint
      s.alpha = a
      s.blendMode = 'add'
      this.addChild(s)
    }
    this.addChild(this.far, this.near)

    const far = new Graphics()
    let x = -500
    while (x < WORLD.width + 500) {
      const w = range(rng, 70, 160)
      const top = range(rng, 470, 600)
      far.rect(x, top, w, BASE - top).fill(FAR)
      // pitched tile roof and a chimney or two
      far.poly([x - 4, top, x + w / 2, top - range(rng, 14, 30), x + w + 4, top]).fill(FAR)
      if (chance(rng, 0.6)) {
        const cx = x + range(rng, 10, w - 10)
        far.rect(cx - 4, top - 34, 8, 30).fill(FAR)
        far.poly([cx - 4, top - 34, cx + 4, top - 34, cx + 10, top - 46, cx - 10, top - 46]).fill(FAR)
      }
      for (let wy = top + 14; wy < BASE - 10; wy += 16) {
        for (let wx = x + 8; wx < x + w - 8; wx += 14) {
          if (chance(rng, 0.1)) far.rect(wx, wy, 4, 7).fill({ color: 0xffb050, alpha: 0.7 })
        }
      }
      x += w
    }
    this.far.addChild(far)

    const near = new Graphics()
    this.campanile(near, 1990)
    this.salute(near, 470)
    this.near.addChild(near)
  }

  private campanile(g: Graphics, cx: number) {
    g.rect(cx - 34, 250, 68, BASE - 250).fill(NEAR)
    // pilaster strips down the brick shaft
    for (const px of [-28, -10, 8, 26]) g.rect(cx + px, 260, 3, BASE - 270).fill({ color: 0x241a24, alpha: 0.8 })
    // belfry with its arches lit from inside
    g.rect(cx - 40, 196, 80, 54).fill(NEAR)
    for (let i = 0; i < 4; i++) {
      const ax = cx - 32 + i * 17
      g.moveTo(ax, 244).lineTo(ax, 214).arc(ax + 6, 214, 6, Math.PI, 0).lineTo(ax + 12, 244).closePath().fill(0xffb050)
    }
    g.rect(cx - 44, 192, 88, 6).fill(NEAR)
    g.rect(cx - 34, 150, 68, 42).fill(NEAR)
    g.poly([cx - 36, 150, cx, 60, cx + 36, 150]).fill(NEAR)
    // the gold angel on top catches the light
    g.rect(cx - 1.5, 44, 3, 18).fill(0xd9a54a)
    g.circle(cx, 42, 3).fill(0xffd27a)
    const s = new Sprite(glowTexture())
    s.anchor.set(0.5)
    s.position.set(cx, 222)
    s.scale.set(0.9, 0.5)
    s.tint = 0xffa040
    s.alpha = 0.5
    s.blendMode = 'add'
    this.near.addChild(s)
    this.bell = s
  }

  private salute(g: Graphics, cx: number) {
    // octagonal base, drum, the big dome, a lantern on top
    g.rect(cx - 150, 470, 300, BASE - 470).fill(NEAR)
    g.poly([cx - 150, 470, cx, 430, cx + 150, 470]).fill(NEAR)
    g.rect(cx - 104, 380, 208, 90).fill(NEAR)
    // the volutes round the drum
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) g.circle(cx + side * (116 + i * 10), 470 - i * 18, 13 - i * 2).fill(NEAR)
    }
    g.moveTo(cx - 108, 384).bezierCurveTo(cx - 108, 270, cx + 108, 270, cx + 108, 384).closePath().fill(NEAR)
    g.rect(cx - 22, 274, 44, 30).fill(NEAR)
    g.moveTo(cx - 26, 278).bezierCurveTo(cx - 26, 240, cx + 26, 240, cx + 26, 278).closePath().fill(NEAR)
    g.rect(cx - 1.5, 222, 3, 26).fill(NEAR)
    // a row of lit windows round the drum
    for (let i = 0; i < 7; i++) {
      const wx = cx - 84 + i * 28
      g.moveTo(wx, 448).lineTo(wx, 416).arc(wx + 5, 416, 5, Math.PI, 0).lineTo(wx + 10, 448).closePath().fill({ color: 0xffb050, alpha: 0.75 })
    }
  }

  update(time: number, px: number) {
    this.far.x += (-px * 8 - this.far.x) * 0.05
    this.near.x += (-px * 14 - this.near.x) * 0.05
    this.bell.alpha = 0.45 + Math.sin(time * 0.9) * 0.06
  }
}
