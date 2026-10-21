import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { SIGN_FONT } from '../../fonts'
import { BaseHouse } from '../../layers/house-base'
import { glow } from '../../layers/neon'
import { GROUND, gridSlots } from '../../layout'
import { palette } from '../../palette'
import { createRng, range, type Rng } from '../../rng'
import { areaway, stoop, windowExtras } from './details'
import { NY_DOOR, NY_GRID, NY_HOUSE, NY_MARQUEE, PARLOR } from './layout'
import { ny } from './parts'
import { nyWindow } from './window'

const INK = palette.ink
const LINE = { color: INK, width: 1.5, alpha: 0.7 }

// Our brownstone: tall and narrow, four floors of rooms over a parlor floor,
// a bracketed cornice, a high stoop with iron rails, and every window with
// somebody's stuff in it.
export class House extends BaseHouse {
  private signs = new Container()
  private bulbs = new Container()
  private doorGlow: Sprite

  constructor(seed: number, lights: Container) {
    super()
    const rng = createRng(seed)

    const shell = new Graphics()
    this.drawFacade(shell, rng)
    this.drawCornice(shell)
    this.drawParlor(shell, lights)
    this.drawGarden(shell, lights)
    this.addChild(shell, this.signs)

    this.addWindows(lights, nyWindow, gridSlots(NY_GRID))

    // everyone's window is a bit different
    const extras = new Graphics()
    const kinds = ['ac', 'box', 'fairy', 'plants', 'ac', 'flag', 'box', 'none', 'fairy', 'ac', 'plants', 'box'] as const
    this.windows.forEach((w, i) => {
      const { x, y, width, height } = w.slot
      windowExtras(extras, lights, this.bulbs, rng, x, y, width, height, kinds[i % kinds.length])
    })
    this.addChild(extras, this.bulbs)

    const steps = new Graphics()
    stoop(steps, NY_DOOR.x + NY_DOOR.width / 2, PARLOR.floor, NY_DOOR.width)
    areaway(steps, NY_HOUSE.x + 6, 160)
    areaway(steps, NY_HOUSE.x + NY_HOUSE.width - 166, 160)
    this.addChild(steps)

    this.addMarquee(lights, { board: 0x7a1810, face: 0x3e0c08, trim: 0xd9a54a, fan: false }, NY_MARQUEE)

    this.doorGlow = glow(lights, NY_DOOR.x + NY_DOOR.width / 2, NY_DOOR.y + 60, 0.8, 1.2, palette.amber, 0.45)
    for (let ux = NY_HOUSE.x + 40; ux < NY_HOUSE.x + NY_HOUSE.width; ux += 110) {
      glow(lights, ux, PARLOR.top + 40, 1.8, 2.6, palette.amberDeep, 0.13)
    }
  }

  private drawFacade(g: Graphics, rng: Rng) {
    const { x, y, width: w } = NY_HOUSE
    // brownstone: soft red-brown sandstone in big smooth blocks
    g.rect(x, y, w, PARLOR.floor - y).fill(ny.brownstone)
    for (let by = y + 40; by < PARLOR.floor; by += 26) {
      g.rect(x, by, w, 1.2).fill({ color: INK, alpha: 0.22 })
      const off = ((by - y) / 26) % 2 ? 40 : 0
      for (let bx = x + off; bx < x + w; bx += 80) g.rect(bx, by, 1.2, 26).fill({ color: INK, alpha: 0.14 })
    }
    // weathering: the stone flakes and darkens in patches
    for (let i = 0; i < 26; i++) {
      g.ellipse(range(rng, x, x + w), range(rng, y + 40, PARLOR.floor), range(rng, 10, 40), range(rng, 6, 20)).fill({
        color: i % 2 ? ny.brownstoneLight : ny.brownstoneDark,
        alpha: range(rng, 0.08, 0.2),
      })
    }
    // a belt course under each floor of rooms
    for (let row = 1; row <= NY_GRID.rows; row++) {
      const sy = NY_GRID.firstRowY + row * NY_GRID.floorH - 20
      g.rect(x, sy, w, 5).fill({ color: ny.brownstoneLight, alpha: 0.6 })
    }
    // party walls -- the edges where the neighbours butt right up against us
    g.rect(x - 3, y, 6, GROUND - y).rect(x + w - 3, y, 6, GROUND - y).fill(ny.brownstoneDark)
  }

  private drawCornice(g: Graphics) {
    const { x, y, width: w } = NY_HOUSE
    // chimney pots and the parapet behind
    g.rect(x + 40, y - 60, 30, 60).rect(x + w - 90, y - 50, 24, 50).fill(ny.brickDark)
    g.rect(x + 36, y - 66, 38, 7).rect(x + w - 94, y - 56, 32, 7).fill(ny.cornice)
    // big pressed-metal cornice on scroll brackets
    g.rect(x - 16, y, w + 32, 18).fill(ny.cornice).stroke(LINE)
    g.rect(x - 10, y + 18, w + 20, 8).fill(0x2a1c18)
    g.rect(x - 4, y + 26, w + 8, 22).fill(ny.cornice)
    for (let px = x + 20; px < x + w - 50; px += 74) g.rect(px, y + 30, 50, 14).stroke({ color: 0x3a2a22, width: 1.5 })
    for (let bx = x - 4; bx <= x + w - 10; bx += (w - 6) / 5) {
      g.rect(bx, y + 18, 13, 36).fill(ny.cornice)
      g.circle(bx + 6.5, y + 52, 6).fill(ny.cornice)
    }
    for (let dx = x - 12; dx < x + w + 12; dx += 10) g.rect(dx, y + 18, 5, 5).fill(0x2e221c)
  }

  /** the parlor floor: tall windows, the front door, its carved hood */
  private drawParlor(g: Graphics, lights: Container) {
    const top = PARLOR.top + 56
    const h = PARLOR.floor - top - 14
    for (const cx of [NY_GRID.x + NY_GRID.width / 6, NY_GRID.x + (NY_GRID.width * 5) / 6]) {
      const w = 92
      const x = cx - w / 2
      g.rect(x - 10, top - 10, w + 20, h + 18).fill(ny.brownstoneDark).stroke(LINE)
      g.rect(x, top, w, h).fill(0xe0782e)
      g.rect(x, top, w, h * 0.35).fill({ color: 0xffb860, alpha: 0.55 })
      // a piano in one, a fern in the other
      if (cx < 1200) {
        g.rect(x + 10, top + h - 34, 50, 34).fill(INK)
        g.rect(x + 12, top + h - 38, 46, 4).fill(INK)
      } else {
        g.rect(x + w - 30, top + h - 20, 16, 20).fill(INK)
        for (let l = 0; l < 7; l++) g.ellipse(x + w - 22 + (l - 3) * 5, top + h - 32, 3, 14).fill(INK)
      }
      g.rect(x + w / 2 - 2, top, 4, h).rect(x, top + h * 0.3, w, 3).fill(0x1a0f0b)
      g.rect(x, top, w, h).stroke({ color: 0x1a0f0b, width: 5 })
      // carved hood
      g.rect(x - 18, top - 28, w + 36, 12).fill(ny.brownstoneLight).stroke(LINE)
      g.moveTo(x - 14, top - 16).lineTo(x + w + 14, top - 16).lineTo(x + w + 6, top - 8).lineTo(x - 6, top - 8).closePath().fill(ny.brownstone)
      glow(lights, cx, top + h / 2, (w * 2) / 256, (h * 1.8) / 256, palette.amber, 0.45)
    }

    // front door: double doors with glass panels, a transom, a pediment over it
    const d = NY_DOOR
    g.rect(d.x - 16, d.y - 14, d.width + 32, d.height + 14).fill(ny.brownstoneLight).stroke(LINE)
    g.poly([d.x - 26, d.y - 14, d.x + d.width / 2, d.y - 46, d.x + d.width + 26, d.y - 14]).fill(ny.brownstoneLight).stroke(LINE)
    g.rect(d.x, d.y, d.width, 22).fill(0xf0a050)
    const number = new Text({ text: '214', style: { fontFamily: SIGN_FONT, fontSize: 13, fill: 0x2a140a }, resolution: 3 })
    number.anchor.set(0.5)
    number.position.set(d.x + d.width / 2, d.y + 11)
    this.signs.addChild(number)
    g.rect(d.x, d.y + 22, d.width, d.height - 22).fill(0x1e0c06)
    for (const px of [d.x + 5, d.x + d.width / 2 + 3]) {
      g.rect(px, d.y + 30, d.width / 2 - 8, 50).fill({ color: palette.amber, alpha: 0.85 })
      g.rect(px, d.y + 88, d.width / 2 - 8, d.height - 100).stroke({ color: 0x4a2414, width: 2 })
    }
    g.rect(d.x + d.width / 2 - 1.5, d.y + 22, 3, d.height - 22).fill(INK)
    g.circle(d.x + d.width / 2 - 6, d.y + 86, 2.5).circle(d.x + d.width / 2 + 6, d.y + 86, 2.5).fill(palette.gold)
    // a wreath, because someone in the house always does that
    g.circle(d.x + d.width / 4, d.y + 52, 9).stroke({ color: 0x1d3a1a, width: 5 })
    g.circle(d.x + d.width / 4, d.y + 60, 2.5).fill(palette.red)
  }

  /** the garden level, half below the street, behind the areaway railings */
  private drawGarden(g: Graphics, lights: Container) {
    const { x, width: w } = NY_HOUSE
    g.rect(x, PARLOR.floor, w, GROUND - PARLOR.floor).fill(ny.brownstoneDark)
    for (let gy = PARLOR.floor + 20; gy < GROUND; gy += 20) g.rect(x, gy, w, 2).fill({ color: INK, alpha: 0.4 })
    g.rect(x - 6, PARLOR.floor - 4, w + 12, 8).fill(ny.brownstoneLight)
    for (const cx of [x + 80, x + w - 80]) {
      g.rect(cx - 40, PARLOR.floor + 18, 80, 56).fill(0xc0602a)
      for (let bx = cx - 38; bx < cx + 40; bx += 9) g.rect(bx, PARLOR.floor + 18, 2, 56).fill(INK)
      g.rect(cx - 40, PARLOR.floor + 18, 80, 56).stroke({ color: ny.brownstoneLight, width: 4 })
      glow(lights, cx, PARLOR.floor + 46, 0.7, 0.5, palette.amberDeep, 0.35)
    }
    // bins under the stoop
    for (const bx of [x + 150, x + w - 184]) {
      g.roundRect(bx, GROUND - 46, 30, 46, 3).fill(0x2a2826)
      g.rect(bx - 3, GROUND - 50, 36, 6).fill(0x3a3634)
    }
  }

  override update(time: number, dt: number, reducedMotion: boolean) {
    super.update(time, dt, reducedMotion)
    this.doorGlow.alpha = 0.42 + Math.sin(time * 0.7) * 0.02
  }
}
