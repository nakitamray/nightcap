import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { DISPLAY_FONT } from '../fonts'
import { DOOR, FLOOR_H, GROUND, GROUND_FLOOR, HOUSE, MAX_ROOMS, SHOPFRONTS, windowSlots, type Rect } from '../layout'
import { palette } from '../palette'
import { chance, createRng, int, pick, range, type Rng } from '../rng'
import { glowTexture } from '../textures'
import type { Rooms } from '../types'
import { balconySlab, ironRail } from './ironwork'
import { Marquee } from './marquee'
import { RoomWindow } from './window'

const CORNICE_Y = HOUSE.y
const ROOF_TOP = 140

// A Haussmann block: limestone, a zinc mansard with dormers, iron balconies,
// a carriage door, and two little shops at street level.
export class House extends Container {
  readonly windows: RoomWindow[]
  readonly marquee: Marquee
  private doorGlow: Sprite
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

    this.windows = windowSlots().map((slot) => new RoomWindow(slot, lights))
    this.addChild(...this.windows)

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
      if (w.slot.balcony === 'rail') balconySlab(w.slot.x - 14, w.slot.y + w.slot.height + 4, w.slot.width + 28, balconies)
    }
    // geraniums on the top balcony, because someone always has them
    for (const w of this.windows) {
      if (w.slot.row === 0 && chance(rng, 0.5)) this.flowerPots(balconies, w.slot.x + range(rng, -6, w.slot.width - 30), w.slot.y + w.slot.height + 2, rng)
    }
    this.addChild(balconies)

    this.addShopSigns()
    this.addStreetNumber()

    this.marquee = new Marquee(lights)
    this.addChild(this.marquee)

    this.doorGlow = new Sprite(glowTexture())
    this.doorGlow.anchor.set(0.5)
    this.doorGlow.position.set(DOOR.x + DOOR.width / 2, DOOR.y + 20)
    this.doorGlow.scale.set(1.2, 0.6)
    this.doorGlow.tint = palette.amber
    this.doorGlow.alpha = 0.4
    this.doorGlow.blendMode = 'add'
    lights.addChild(this.doorGlow)
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
    g.poly([x - 4, CORNICE_Y, x + w + 4, CORNICE_Y, x + w - 22, brisisTop, x + 22, brisisTop]).fill(palette.zinc)
    g.poly([x + 22, brisisTop, x + w - 22, brisisTop, x + w - 60, ROOF_TOP, x + 60, ROOF_TOP]).fill(palette.zincDark)
    // standing seams
    for (let sx = x + 8; sx < x + w; sx += 16) {
      const t = (sx - x) / w
      const topX = x + 22 + t * (w - 44)
      g.moveTo(sx, CORNICE_Y).lineTo(topX, brisisTop).stroke({ color: palette.zincDark, width: 1.5 })
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
      g.rect(cx - 1, top + 10, 2, CORNICE_Y - top - 18).rect(cx - 15, top + 34, 30, 2).fill(palette.ink)
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
          g.rect(bx + 1.5, by + 1.5, 70, course - 1.5).fill({ color: tone, alpha: range(rng, 0.12, 0.3) })
        }
      }
    }
    // decades of rain under every sill
    for (const slot of windowSlots()) {
      for (let i = 0; i < 3; i++) {
        g.rect(slot.x + range(rng, 0, slot.width), slot.y + slot.height + 14, range(rng, 2, 6), range(rng, 20, 60)).fill({
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
    g.rect(x, y, 16, bottom - y).rect(x + w - 16, y, 16, bottom - y).fill({ color: palette.stoneLight, alpha: 0.5 })
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
    for (let gy = y + 30; gy < GROUND; gy += 24) g.rect(x, gy, w, 3).fill({ color: palette.ink, alpha: 0.5 })
    g.rect(x - 8, y - 4, w + 16, 12).fill(palette.stoneLight)

    for (const [i, shop] of SHOPFRONTS.entries()) this.drawShop(g, shop, i, rng)

    // carriage door: painted wood, carved panels, iron fanlight
    const d = DOOR
    g.rect(d.x - 14, d.y - 14, d.width + 28, d.height + 14).fill(palette.stoneLight)
    g.rect(d.x, d.y, d.width, d.height).fill(0x123026)
    g.rect(d.x, d.y, d.width, 30).fill(0xe0954a)
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI + (i / 6) * Math.PI
      g.moveTo(d.x + d.width / 2, d.y + 30)
        .lineTo(d.x + d.width / 2 + Math.cos(a) * (d.width / 2), d.y + 30 + Math.sin(a) * 30)
        .stroke({ color: palette.ink, width: 2 })
    }
    g.rect(d.x, d.y + 28, d.width, 4).fill(palette.ink)
    g.rect(d.x + d.width / 2 - 1.5, d.y + 30, 3, d.height - 30).fill(palette.ink)
    for (const px of [d.x + 8, d.x + d.width / 2 + 8]) {
      g.rect(px, d.y + 40, d.width / 2 - 16, 34).stroke({ color: 0x2c5a48, width: 2 })
      g.rect(px, d.y + 82, d.width / 2 - 16, 34).stroke({ color: 0x2c5a48, width: 2 })
    }
    g.circle(d.x + d.width / 2, d.y + 78, 5).fill(palette.gold)
    g.rect(d.x - 20, GROUND - 8, d.width + 40, 8).fill(palette.stone)
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
          g.moveTo(bx, y + h - 44).lineTo(sx, sy).stroke({ color: palette.ink, width: 1.5 })
          g.circle(sx, sy, range(rng, 3, 5)).fill(palette.ink)
        }
      }
    }
    g.rect(x + w / 2 - 1.5, y, 3, h - 20).fill(palette.oxblood)
  }

  private addShopSigns() {
    const names = ['LIVRES', 'FLEURS']
    SHOPFRONTS.forEach((shop, i) => {
      const t = new Text({
        text: names[i] ?? '',
        style: { fontFamily: DISPLAY_FONT, fontSize: 17, fill: palette.gold, letterSpacing: 3 },
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
      style: { fontFamily: DISPLAY_FONT, fontSize: 15, fill: 0xf2efe6 },
      resolution: 3,
    })
    n.anchor.set(0.5)
    n.position.set(px + 18, py + 13.5)
    this.addChild(plate, n)
  }

  private flowerPots(g: Graphics, x: number, y: number, rng: Rng) {
    for (let i = 0; i < 2; i++) {
      const px = x + i * 16
      g.poly([px, y - 14, px + 12, y - 14, px + 10, y, px + 2, y]).fill(palette.terracotta)
      for (let l = 0; l < 4; l++) g.circle(px + 6 + range(rng, -6, 6), y - 18 - range(rng, 0, 8), 4).fill(0x1d2a1a)
      for (let f = 0; f < 3; f++) g.circle(px + 6 + range(rng, -6, 6), y - 20 - range(rng, 0, 9), 2.5).fill(palette.red)
    }
  }

  setRooms(rooms: Rooms) {
    for (let i = 0; i < MAX_ROOMS; i++) {
      const w = this.windows[i]
      if (!w) continue
      const next = rooms[i] ?? null
      const prev = w.resident
      if (!prev || !next || prev.id !== next.id) {
        w.setResident(next)
      } else {
        w.resident = next
        w.setLit(next.home)
        w.setCurtains(next.curtains)
      }
    }
  }

  /** world-space hit test; see the note in scene.ts about why this isn't pixi's */
  windowAt(x: number, y: number) {
    return this.windows.find(({ slot }) => x >= slot.x - 12 && x <= slot.x + slot.width + 12 && y >= slot.y - 20 && y <= slot.y + slot.height + 10)
  }

  update(time: number, dt: number, reducedMotion: boolean) {
    for (const w of this.windows) w.update(time, dt, reducedMotion)
    this.marquee.update(time, dt, reducedMotion)
    this.doorGlow.alpha = 0.38 + Math.sin(time * 0.7) * 0.02
    this.dormerGlows.forEach((g, i) => (g.alpha = 0.42 + Math.sin(time * 1.1 + i * 2) * 0.03))
  }
}
