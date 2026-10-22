import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { DISPLAY_FONT, SIGN_FONT } from '../../fonts'
import {
  DOOR,
  FLOOR_H,
  GROUND,
  GROUND_FLOOR,
  HOUSE,
  SHOPFRONTS,
  windowSlots,
  type Rect,
} from '../../layout'
import { palette } from '../../palette'
import { chance, createRng, int, pick, range, type Rng } from '../../rng'
import { dotTexture, glowTexture } from '../../textures'
import { balconySlab, ironRail } from '../../layers/ironwork'
import { BaseHouse } from '../../layers/house-base'
import { parisWindow } from './window'

const CORNICE_Y = HOUSE.y
const ROOF_TOP = 140

// A Haussmann block: limestone, a zinc mansard with dormers, iron balconies,
// a carriage door, and two little shops at street level.
export class House extends BaseHouse {
  private doorGlow: Sprite
  private neon: { text: Text; glow: Sprite }
  private dormerGlows: Sprite[] = []

  constructor(seed: number, lights: Container) {
    super()
    const rng = createRng(seed)

    const shell = new Graphics()
    this.drawRoof(shell, rng, lights)
    this.drawStone(shell, rng)
    this.drawCornice(shell)
    this.drawGroundFloor(shell, rng)
    this.addChild(shell)
    this.addChild(ivy(rng))

    this.addWindows(lights, parisWindow)

    // continuous balconies go in front of the windows
    const balconies = new Graphics()
    for (const row of [0, 2]) {
      const slot = this.windows[row * 4]?.slot
      if (!slot) continue
      const y = slot.y + slot.height + 2
      balconySlab(HOUSE.x - 8, y, HOUSE.width + 16, balconies)
      ironRail(HOUSE.x - 4, y - 40, HOUSE.width + 8, 40, balconies)
    }
    for (const w of this.windows) {
      if (w.slot.balcony === 'rail')
        balconySlab(w.slot.x - 14, w.slot.y + w.slot.height + 4, w.slot.width + 28, balconies)
    }
    // geraniums on the top balcony, because someone always has them
    for (const w of this.windows) {
      if (w.slot.row === 0 && chance(rng, 0.5))
        this.flowerPots(
          balconies,
          w.slot.x + range(rng, -6, w.slot.width - 30),
          w.slot.y + w.slot.height + 2,
          rng,
        )
    }
    this.addChild(balconies)
    this.addChild(this.festoon(lights, this.windows[8]!.slot.y - 8, 28))

    this.addShopSigns()
    this.addStreetNumber()

    this.addMarquee(lights)
    this.neon = this.neonSign(lights, HOUSE.x - 22, 600, 'LIVRES')

    this.doorGlow = new Sprite(glowTexture())
    this.doorGlow.anchor.set(0.5)
    this.doorGlow.position.set(DOOR.x + DOOR.width / 4, DOOR.y + 90)
    this.doorGlow.scale.set(0.8, 1.3)
    this.doorGlow.tint = palette.amber
    this.doorGlow.alpha = 0.4
    this.doorGlow.blendMode = 'add'
    lights.addChild(this.doorGlow)
    // shop and lamp light washing up the stone from below
    for (let ux = HOUSE.x + 40; ux < HOUSE.x + HOUSE.width; ux += 130) {
      const up = new Sprite(glowTexture())
      up.anchor.set(0.5)
      up.position.set(ux, GROUND_FLOOR.y - 30)
      up.scale.set(2.2, 2.8)
      up.tint = palette.amberDeep
      up.alpha = 0.16
      up.blendMode = 'add'
      lights.addChild(up)
    }
    for (const shop of SHOPFRONTS) {
      const g = new Sprite(glowTexture())
      g.anchor.set(0.5)
      g.position.set(shop.x + shop.width / 2, shop.y + shop.height / 2)
      g.scale.set((shop.width * 2.2) / 256, (shop.height * 1.8) / 256)
      g.tint = palette.amber
      g.alpha = 0.3
      g.blendMode = 'add'
      lights.addChild(g)
    }
  }

  private drawRoof(g: Graphics, rng: Rng, lights: Container) {
    const { x, width: w } = HOUSE
    // chimney stacks first so the roof overlaps their feet
    for (const cx of [x + 46, x + w - 86]) {
      g.rect(cx, ROOF_TOP - 60, 40, 90).fill(palette.stoneDark)
      g.rect(cx - 4, ROOF_TOP - 66, 48, 8).fill(palette.stone)
      for (let p = 0; p < 4; p++) {
        const px = cx + 3 + p * 9
        const ph = range(rng, 14, 22)
        g.rect(px, ROOF_TOP - 66 - ph, 7, ph).fill(palette.terracotta)
        g.rect(px - 1, ROOF_TOP - 66 - ph, 9, 3).fill(0xa35a3a)
      }
    }
    // mansard: steep lower slope, then the shallow top
    const brisisTop = ROOF_TOP + 14
    g.poly([x - 4, CORNICE_Y, x + w + 4, CORNICE_Y, x + w - 22, brisisTop, x + 22, brisisTop]).fill(
      palette.zinc,
    )
    g.poly([x + 22, brisisTop, x + w - 22, brisisTop, x + w - 60, ROOF_TOP, x + 60, ROOF_TOP]).fill(
      palette.zincDark,
    )
    // standing seams
    for (let sx = x + 8; sx < x + w; sx += 16) {
      const t = (sx - x) / w
      const topX = x + 22 + t * (w - 44)
      g.moveTo(sx, CORNICE_Y)
        .lineTo(topX, brisisTop)
        .stroke({ color: palette.zincDark, width: 1.5 })
    }
    g.rect(x + 22, brisisTop - 2, w - 44, 3).fill({ color: 0xa8b0c8, alpha: 0.25 })

    // dormers, one per bay. a couple of attic lights left on
    for (let col = 0; col < 4; col++) {
      const cx = x + (w * (col + 0.5)) / 4
      const dw = 58
      const top = brisisTop + 6
      g.rect(cx - dw / 2, top, dw, CORNICE_Y - top).fill(palette.stoneLight)
      g.moveTo(cx - dw / 2 - 6, top + 4)
        .arc(cx, top + 4, dw / 2 + 6, Math.PI, 0)
        .fill(palette.stoneLight)
      g.moveTo(cx - dw / 2 + 2, top + 4)
        .arc(cx, top + 4, dw / 2 - 2, Math.PI, 0)
        .fill(palette.stone)
      const lit = chance(rng, 0.45)
      g.rect(cx - 15, top + 10, 30, CORNICE_Y - top - 18).fill(lit ? 0xd88a3a : 0x10131e)
      g.rect(cx - 1, top + 10, 2, CORNICE_Y - top - 18)
        .rect(cx - 15, top + 34, 30, 2)
        .fill(palette.ink)
      if (lit) {
        const glow = new Sprite(glowTexture())
        glow.anchor.set(0.5)
        glow.position.set(cx, top + 40)
        glow.scale.set(0.5, 0.6)
        glow.tint = palette.amberDeep
        glow.alpha = 0.45
        glow.blendMode = 'add'
        lights.addChild(glow)
        this.dormerGlows.push(glow)
      }
    }
  }

  private drawStone(g: Graphics, rng: Rng) {
    const { x, y, width: w } = HOUSE
    const bottom = GROUND_FLOOR.y
    g.rect(x, y, w, bottom - y).fill(palette.stone)
    // ashlar: long blocks, joints offset every other course
    const course = 24
    for (let by = y; by < bottom; by += course) {
      const odd = ((by - y) / course) % 2
      g.rect(x, by, w, 1.5).fill({ color: palette.stoneJoint, alpha: 0.7 })
      for (let bx = x + (odd ? 36 : 0); bx < x + w; bx += 72) {
        g.rect(bx, by, 1.5, course).fill({ color: palette.stoneJoint, alpha: 0.5 })
        if (chance(rng, 0.25)) {
          const tone = pick(rng, [palette.stoneLight, palette.stoneJoint, 0xa48f70])
          g.rect(bx + 1.5, by + 1.5, 70, course - 1.5).fill({
            color: tone,
            alpha: range(rng, 0.12, 0.3),
          })
        }
      }
    }
    // decades of rain under every sill
    for (const slot of windowSlots()) {
      for (let i = 0; i < 3; i++) {
        g.rect(
          slot.x + range(rng, 0, slot.width),
          slot.y + slot.height + 14,
          range(rng, 2, 6),
          range(rng, 20, 60),
        ).fill({
          color: palette.stoneDark,
          alpha: range(rng, 0.12, 0.25),
        })
      }
    }
    // string courses between floors
    for (let row = 0; row < 3; row++) {
      const sy = 308 + row * FLOOR_H + 166
      g.rect(x, sy, w, 6).fill(palette.stoneLight)
      g.rect(x, sy + 6, w, 2).fill({ color: palette.ink, alpha: 0.3 })
    }
    // shallow pilasters at the ends
    g.rect(x, y, 16, bottom - y)
      .rect(x + w - 16, y, 16, bottom - y)
      .fill({ color: palette.stoneLight, alpha: 0.5 })
  }

  private drawCornice(g: Graphics) {
    const { x, y, width: w } = HOUSE
    g.rect(x - 18, y - 10, w + 36, 16).fill(palette.stoneLight)
    g.rect(x - 12, y + 6, w + 24, 8).fill(palette.stone)
    g.rect(x - 12, y + 14, w + 24, 3).fill({ color: palette.ink, alpha: 0.35 })
    // modillions
    for (let mx = x - 6; mx < x + w + 6; mx += 22) {
      g.rect(mx, y + 14, 9, 12).fill(palette.stoneLight)
      g.rect(mx, y + 24, 9, 3).fill({ color: palette.ink, alpha: 0.3 })
    }
  }

  private drawGroundFloor(g: Graphics, rng: Rng) {
    const { x, y, width: w } = GROUND_FLOOR
    g.rect(x, y + 6, w, GROUND - y - 6).fill(palette.stoneDark)
    // bossage: deep horizontal grooves
    for (let gy = y + 30; gy < GROUND; gy += 24)
      g.rect(x, gy, w, 3).fill({ color: palette.ink, alpha: 0.5 })
    g.rect(x - 8, y - 4, w + 16, 12).fill(palette.stoneLight)

    for (const [i, shop] of SHOPFRONTS.entries()) this.drawShop(g, shop, i, rng)

    this.drawDoor(g)
  }

  /**
   * Tall green double door with an iron fanlight. The left leaf stands open,
   * the hallway's lit, and someone's stopped in the doorway.
   */
  private drawDoor(g: Graphics) {
    const d = DOOR
    const half = d.width / 2
    const fan = 26
    g.rect(d.x - 12, d.y - 12, d.width + 24, d.height + 12).fill(palette.stoneLight)
    g.rect(d.x - 12, d.y - 12, d.width + 24, d.height + 12).stroke({
      color: palette.ink,
      width: 1.5,
      alpha: 0.7,
    })
    // fanlight
    g.rect(d.x, d.y, d.width, fan).fill(0xf0a050)
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI + (i / 6) * Math.PI
      g.moveTo(d.x + half, d.y + fan)
        .lineTo(d.x + half + Math.cos(a) * half, d.y + fan + Math.sin(a) * fan)
        .stroke({ color: palette.ink, width: 1.5 })
    }
    g.rect(d.x, d.y + fan - 2, d.width, 4).fill(palette.ink)

    // the lit hallway behind the open leaf
    const top = d.y + fan + 2
    const h = d.height - fan - 2
    g.rect(d.x, top, half, h).fill(0xd8642a)
    g.rect(d.x + 4, top + 6, half - 8, h - 6).fill(0xf59a48)
    // a figure in a long coat and hat, backlit
    const fx = d.x + half / 2
    const fy = GROUND - 2
    g.poly([
      fx - 7,
      fy,
      fx + 7,
      fy,
      fx + 9,
      fy - 70,
      fx + 6,
      fy - 92,
      fx - 6,
      fy - 92,
      fx - 9,
      fy - 70,
    ]).fill(palette.ink)
    g.circle(fx, fy - 100, 6).fill(palette.ink)
    g.ellipse(fx, fy - 105, 11, 2.5)
      .rect(fx - 5, fy - 113, 10, 8)
      .fill(palette.ink)
    // the open leaf, seen edge-on against the jamb
    g.poly([d.x, top, d.x + 9, top + 5, d.x + 9, top + h - 2, d.x, top + h]).fill(0x0e2a20)

    // the closed leaf
    g.rect(d.x + half, top, half, h).fill(0x123026)
    g.rect(d.x + half + 6, top + 8, half - 12, h * 0.42).stroke({ color: 0x2c5a48, width: 2 })
    g.rect(d.x + half + 6, top + 16 + h * 0.42, half - 12, h * 0.42).stroke({
      color: 0x2c5a48,
      width: 2,
    })
    g.circle(d.x + half + 6, top + h * 0.5, 3).fill(palette.gold)
    g.rect(d.x + half - 1.5, top, 3, h).fill(palette.ink)

    g.rect(d.x - 18, GROUND - 7, d.width + 36, 7).fill(palette.stone)
  }

  private drawShop(g: Graphics, shop: Rect, i: number, rng: Rng) {
    const { x, y, width: w, height: h } = shop
    // painted wooden shopfront with a fascia board on top
    g.rect(x - 12, y - 30, w + 24, h + 30).fill(palette.oxblood)
    g.rect(x - 12, y - 30, w + 24, 22).fill(0x3a0d0b)
    g.rect(x - 12, y - 30, w + 24, 22).stroke({ color: palette.gold, width: 1.5 })
    g.rect(x, y, w, h - 20).fill(0x9a5420)
    g.rect(x, y, w, h - 20).fill({ color: palette.amber, alpha: 0.35 })
    g.rect(x, y + h - 20, w, 20).fill(0x2a0a08)
    // what's in the window
    if (i === 0) {
      // bookshop: shelves of spines
      for (let s = 0; s < 3; s++) {
        const sy = y + 26 + s * 24
        g.rect(x + 6, sy, w - 12, 2).fill(palette.ink)
        let bx = x + 8
        while (bx < x + w - 10) {
          const bw = range(rng, 3, 6)
          const bh = range(rng, 12, 20)
          g.rect(bx, sy - bh, bw, bh).fill({ color: palette.ink, alpha: range(rng, 0.6, 0.95) })
          bx += bw + range(rng, 0.5, 2)
        }
      }
    } else {
      // florist: buckets with stems
      for (let b = 0; b < 5; b++) {
        const bx = x + 14 + b * ((w - 28) / 4)
        g.rect(bx - 8, y + h - 44, 16, 22).fill(palette.ink)
        for (let s = 0; s < 4; s++) {
          const sx = bx + range(rng, -8, 8)
          const sy = y + h - 44 - int(rng, 14, 36)
          g.moveTo(bx, y + h - 44)
            .lineTo(sx, sy)
            .stroke({ color: palette.ink, width: 1.5 })
          g.circle(sx, sy, range(rng, 3, 5)).fill(palette.ink)
        }
      }
    }
    g.rect(x + w / 2 - 1.5, y, 3, h - 20).fill(palette.oxblood)
  }

  private addShopSigns() {
    const names = ['LIBRAIRIE', 'FLEURS']
    SHOPFRONTS.forEach((shop, i) => {
      const t = new Text({
        text: names[i] ?? '',
        style: { fontFamily: SIGN_FONT, fontSize: 17, fill: palette.gold, letterSpacing: 2 },
        resolution: 2,
      })
      t.anchor.set(0.5)
      t.position.set(shop.x + shop.width / 2, shop.y - 19)
      this.addChild(t)
    })
  }

  private addStreetNumber() {
    // the blue enamel plate every door in Paris has
    const px = DOOR.x + DOOR.width + 26
    const py = DOOR.y + 14
    const plate = new Graphics()
      .roundRect(px, py, 36, 26, 3)
      .fill(0x1f3f8f)
      .roundRect(px + 2.5, py + 2.5, 31, 21, 2)
      .stroke({ color: 0xe8e4d8, width: 1.5 })
      .roundRect(px, py, 36, 26, 3)
      .stroke({ color: 0x2c6a4e, width: 1.5 })
    const n = new Text({
      text: '14',
      style: { fontFamily: SIGN_FONT, fontSize: 15, fill: 0xf2efe6 },
      resolution: 3,
    })
    n.anchor.set(0.5)
    n.position.set(px + 18, py + 13.5)
    this.addChild(plate, n)
  }

  /** vertical red neon hanging off the corner, over the bookshop */
  private neonSign(lights: Container, x: number, y: number, word: string) {
    const letters = word.split('').join('\n')
    const lineH = 33
    const h = word.length * lineH + 22
    const bracket = new Graphics()
      .rect(x + 18, y - 16, 8, 16)
      .rect(x + 18, y - 18, 40, 5)
      .fill(palette.ink)
      .roundRect(x, y, 44, h, 6)
      .fill(0x1a0806)
      .roundRect(x + 3, y + 3, 38, h - 6, 4)
      .stroke({ color: 0xff3b2a, width: 2 })
    const text = new Text({
      text: letters,
      style: {
        fontFamily: DISPLAY_FONT,
        fontSize: 28,
        lineHeight: lineH,
        align: 'center',
        fill: 0xff4a32,
      },
      resolution: 2,
    })
    text.anchor.set(0.5)
    text.position.set(x + 22, y + h / 2)
    const glow = new Sprite(glowTexture())
    glow.anchor.set(0.5)
    glow.position.set(x + 22, y + h / 2)
    glow.scale.set(1.2, (h * 2.4) / 256)
    glow.tint = 0xff2a1a
    glow.alpha = 0.6
    glow.blendMode = 'add'
    this.addChild(bracket, text)
    lights.addChild(glow)
    return { text, glow }
  }

  private flowerPots(g: Graphics, x: number, y: number, rng: Rng) {
    for (let i = 0; i < 2; i++) {
      const px = x + i * 16
      g.poly([px, y - 14, px + 12, y - 14, px + 10, y, px + 2, y]).fill(palette.terracotta)
      for (let l = 0; l < 4; l++)
        g.circle(px + 6 + range(rng, -6, 6), y - 18 - range(rng, 0, 8), 4).fill(0x1d2a1a)
      for (let f = 0; f < 3; f++)
        g.circle(px + 6 + range(rng, -6, 6), y - 20 - range(rng, 0, 9), 2.5).fill(palette.red)
    }
  }

  /** a string of bulbs looping between the bays, like there's always a party upstairs */
  private festoon(lights: Container, y: number, sag: number) {
    const c = new Container()
    const wire = new Graphics()
    const bays = 4
    const bayW = HOUSE.width / bays
    for (let i = 0; i < bays; i++) {
      const x0 = HOUSE.x + i * bayW
      wire.moveTo(x0, y).quadraticCurveTo(x0 + bayW / 2, y + sag * 2, x0 + bayW, y)
      for (let t = 0.06; t < 1; t += 0.11) {
        // a point on the same curve
        const bx = x0 + bayW * t
        const by = y + sag * 4 * t * (1 - t) + 4
        const bulb = new Sprite(dotTexture())
        bulb.anchor.set(0.5)
        bulb.position.set(bx, by)
        bulb.scale.set(0.1)
        bulb.tint = 0xffdc8a
        c.addChild(bulb)
        const glow = new Sprite(glowTexture())
        glow.anchor.set(0.5)
        glow.position.set(bx, by)
        glow.scale.set(0.2)
        glow.tint = 0xffb84a
        glow.alpha = 0.6
        glow.blendMode = 'add'
        lights.addChild(glow)
      }
    }
    wire.stroke({ color: palette.ink, width: 1.5 })
    c.addChildAt(wire, 0)
    return c
  }

  override update(time: number, dt: number, reducedMotion: boolean) {
    super.update(time, dt, reducedMotion)
    // one tube is going, so every so often it stutters
    const stutter = !reducedMotion && time % 7 > 6.5 && Math.sin(time * 70) > 0.2
    this.neon.text.alpha = stutter ? 0.4 : 1
    this.neon.glow.alpha = stutter ? 0.2 : 0.58 + Math.sin(time * 3) * 0.03
    this.doorGlow.alpha = 0.38 + Math.sin(time * 0.7) * 0.02
    this.dormerGlows.forEach((g, i) => (g.alpha = 0.42 + Math.sin(time * 1.1 + i * 2) * 0.03))
  }
}

/**
 * Ivy creeping up from the pavement at both corners and along the ground
 * floor. Each vine is a random walk upward that throws off leaves (and the
 * odd side shoot) as it climbs.
 */
function ivy(rng: Rng) {
  const g = new Graphics()
  const greens = [0x16260f, 0x1d3214, 0x24401a, 0x2c4c1e]
  const lit = [0x5a6a1e, 0x6e7a26]
  const grow = (x: number, y: number, steps: number, drift: number, depth = 0) => {
    for (let i = 0; i < steps; i++) {
      x += range(rng, -4, 4) + drift
      y -= range(rng, 4, 8)
      x = Math.max(HOUSE.x - 6, Math.min(HOUSE.x + HOUSE.width + 6, x))
      g.circle(x, y, 1.2).fill(0x1a1a0c)
      for (let l = 0; l < 3; l++) {
        const lx = x + range(rng, -11, 11)
        const ly = y + range(rng, -6, 6)
        // leaves low down catch the lamps and shop light
        const colour =
          y > GROUND_FLOOR.y - 60 && chance(rng, 0.3) ? pick(rng, lit) : pick(rng, greens)
        g.ellipse(lx, ly, range(rng, 3.5, 6.5), range(rng, 2.5, 4.5)).fill({
          color: colour,
          alpha: 0.95,
        })
      }
      if (depth < 2 && chance(rng, 0.05))
        grow(x, y, int(rng, 10, 26), range(rng, -2.5, 2.5), depth + 1)
    }
  }
  for (const x of [HOUSE.x + 6, HOUSE.x + 22]) grow(x, GROUND, int(rng, 85, 110), 0.6)
  for (const x of [HOUSE.x + HOUSE.width - 8, HOUSE.x + HOUSE.width - 24])
    grow(x, GROUND, int(rng, 60, 80), -0.6)
  // a little around the shopfronts and over the door
  for (const shop of SHOPFRONTS) grow(shop.x - 8, GROUND, 24, 0.2)
  grow(DOOR.x - 14, GROUND, 30, 1.1)
  return g
}
