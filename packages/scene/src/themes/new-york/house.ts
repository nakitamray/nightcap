import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { SIGN_FONT } from '../../fonts'
import { BaseHouse } from '../../layers/house-base'
import { ironRail } from '../../layers/ironwork'
import { glow } from '../../layers/neon'
import { DOOR, FLOOR_H, FIRST_ROW_Y, GROUND, GROUND_FLOOR, HOUSE, SHOPFRONTS } from '../../layout'
import { palette } from '../../palette'
import { chance, createRng, pick, range, type Rng } from '../../rng'
import { brickWall, ny, waterTower } from './parts'
import { nyWindow } from './window'

const CORNICE = HOUSE.y - 36
const STOOP_TOP = GROUND - 52

// A Brooklyn brownstone: red-brown brick, a heavy bracketed cornice, a water
// tank on the roof, and a high stoop with iron rails up to the front door.
export class House extends BaseHouse {
  private doorGlow: Sprite

  constructor(seed: number, lights: Container) {
    super()
    const rng = createRng(seed)

    const shell = new Graphics()
    this.drawRoof(shell)
    brickWall(shell, HOUSE.x, CORNICE, HOUSE.width, GROUND_FLOOR.y - CORNICE, rng)
    this.drawCornice(shell)
    this.drawCourses(shell)
    this.drawBase(shell, lights)
    this.addChild(shell)

    this.addWindows(lights, nyWindow)

    const boxes = new Graphics()
    for (const w of this.windows) {
      if (w.slot.row > 0 && chance(rng, 0.5)) this.windowBox(boxes, w.slot.x, w.slot.y + w.slot.height + 13, w.slot.width, rng)
    }
    this.addChild(boxes)

    this.addChild(this.drawStoop())
    this.addMarquee(lights, { board: 0x7a1810, face: 0x3e0c08, trim: 0xd9a54a, fan: false })

    this.doorGlow = glow(lights, DOOR.x + DOOR.width / 2, STOOP_TOP - 50, 0.9, 1.1, palette.amber, 0.45)
    for (let ux = HOUSE.x + 40; ux < HOUSE.x + HOUSE.width; ux += 130) {
      glow(lights, ux, GROUND_FLOOR.y - 30, 2.2, 2.8, palette.amberDeep, 0.14)
    }
  }

  private drawRoof(g: Graphics) {
    const { x, width: w } = HOUSE
    waterTower(g, x + w - 200, CORNICE - 30, 1.15)
    g.rect(x + 60, CORNICE - 70, 34, 70).rect(x + 300, CORNICE - 56, 26, 56).fill(ny.brickDark)
    g.rect(x + 56, CORNICE - 76, 42, 8).rect(x + 296, CORNICE - 62, 34, 8).fill(ny.brownstone)
    // parapet behind the cornice
    g.rect(x, CORNICE - 30, w, 30).fill(ny.brickDark)
  }

  private drawCornice(g: Graphics) {
    const { x, width: w } = HOUSE
    const y = CORNICE
    // painted pressed-metal cornice, the brownstone's party hat
    g.rect(x - 22, y - 22, w + 44, 18).fill(ny.cornice)
    g.rect(x - 16, y - 4, w + 32, 10).fill(0x2a1c18)
    g.rect(x - 10, y + 6, w + 20, 26).fill(ny.cornice)
    // frieze panels
    for (let px = x + 20; px < x + w - 40; px += 92) g.rect(px, y + 11, 60, 16).stroke({ color: 0x3a2a22, width: 1.5 })
    // scroll brackets
    for (let bx = x - 4; bx <= x + w - 10; bx += (w + 8) / 6) {
      g.rect(bx, y - 4, 14, 40).fill(ny.cornice)
      g.circle(bx + 7, y + 34, 6).fill(ny.cornice)
      g.rect(bx + 3, y + 2, 8, 2).fill({ color: 0x4a3a30, alpha: 0.8 })
    }
    // dentils
    for (let dx = x - 18; dx < x + w + 18; dx += 11) g.rect(dx, y - 4, 6, 6).fill(0x2e221c)
  }

  private drawCourses(g: Graphics) {
    const { x, width: w } = HOUSE
    for (let row = 1; row < 3; row++) {
      const sy = FIRST_ROW_Y + row * FLOOR_H - 34
      g.rect(x, sy, w, 5).fill({ color: ny.brownstoneLight, alpha: 0.7 })
    }
    g.rect(x - 8, GROUND_FLOOR.y - 6, w + 16, 12).fill(ny.brownstoneLight)
  }

  private drawBase(g: Graphics, lights: Container) {
    const { x, y, width: w } = GROUND_FLOOR
    // brownstone basement, rusticated
    g.rect(x, y + 6, w, GROUND - y - 6).fill(ny.brownstone)
    for (let gy = y + 30; gy < GROUND; gy += 22) g.rect(x, gy, w, 3).fill({ color: palette.ink, alpha: 0.45 })

    // garden-level windows behind iron grilles
    for (const shop of SHOPFRONTS) {
      const wx = shop.x + 14
      const wy = shop.y - 6
      const ww = shop.width - 28
      const wh = 80
      g.rect(wx - 8, wy - 8, ww + 16, wh + 14).fill(ny.brownstoneLight)
      g.rect(wx, wy, ww, wh).fill(0xd87a2e)
      g.rect(wx, wy, ww, wh * 0.4).fill({ color: 0xffb050, alpha: 0.5 })
      // plants on the sill inside
      for (let p = 0; p < 4; p++) {
        const px = wx + 14 + p * ((ww - 28) / 3)
        g.rect(px - 6, wy + wh - 16, 12, 14).fill(palette.ink)
        g.ellipse(px, wy + wh - 22, 9, 10).fill(palette.ink)
      }
      for (let bx = wx + 6; bx < wx + ww; bx += 12) g.rect(bx, wy, 2.5, wh).fill(palette.ink)
      g.rect(wx, wy + wh / 2, ww, 2.5).fill(palette.ink)
      glow(lights, wx + ww / 2, wy + wh / 2, (ww * 2) / 256, (wh * 2) / 256, palette.amber, 0.4)
    }

    // the front door, up at the top of the stoop
    const d = DOOR
    const top = d.y + 2
    const h = STOOP_TOP - top
    g.rect(d.x - 18, top - 16, d.width + 36, h + 16).fill(ny.brownstoneLight)
    g.rect(d.x - 18, top - 16, d.width + 36, h + 16).stroke({ color: palette.ink, width: 1.5, alpha: 0.7 })
    g.rect(d.x, top, d.width, 22).fill(0xf0a050)
    const number = new Text({ text: '214', style: { fontFamily: SIGN_FONT, fontSize: 13, fill: 0x2a140a }, resolution: 3 })
    number.anchor.set(0.5)
    number.position.set(d.x + d.width / 2, top + 11)
    this.addChild(number)
    g.rect(d.x, top + 22, d.width, h - 22).fill(0x2a120a)
    for (const px of [d.x + 6, d.x + d.width / 2 + 4]) {
      g.rect(px, top + 30, d.width / 2 - 10, 34).fill({ color: palette.amber, alpha: 0.8 })
      g.rect(px, top + 70, d.width / 2 - 10, h - 80).stroke({ color: 0x4a2414, width: 2 })
    }
    g.rect(d.x + d.width / 2 - 1.5, top + 22, 3, h - 22).fill(palette.ink)
    g.circle(d.x + d.width / 2 - 7, top + 76, 2.5).circle(d.x + d.width / 2 + 7, top + 76, 2.5).fill(palette.gold)
  }

  /** steps down to the pavement, iron rails either side, newel posts at the bottom */
  private drawStoop() {
    const g = new Graphics()
    const cx = DOOR.x + DOOR.width / 2
    const steps = 5
    const stepH = (GROUND - STOOP_TOP) / steps
    for (let i = 0; i < steps; i++) {
      const half = DOOR.width / 2 + 14 + i * 14
      const y = STOOP_TOP + i * stepH
      g.rect(cx - half, y, half * 2, stepH).fill(i % 2 ? ny.brownstone : ny.brownstoneLight)
      g.rect(cx - half, y, half * 2, 2).fill({ color: 0x7a5232, alpha: 0.6 })
    }
    for (const side of [-1, 1]) {
      const topX = cx + side * (DOOR.width / 2 + 10)
      const botX = cx + side * (DOOR.width / 2 + 14 + steps * 14)
      const railTop = STOOP_TOP - 38
      const railBot = GROUND - 40
      g.moveTo(topX, railTop).lineTo(botX, railBot).stroke({ color: ny.iron, width: 3 })
      for (let t = 0; t <= 1; t += 0.12) {
        const bx = topX + (botX - topX) * t
        const by = railTop + (railBot - railTop) * t
        g.rect(bx - 0.75, by, 1.5, STOOP_TOP + (GROUND - STOOP_TOP) * t - by).fill(ny.iron)
      }
      // newel post with a curl at the bottom
      g.rect(botX - 4, railBot - 6, 8, GROUND - railBot + 6).fill(ny.iron)
      g.circle(botX, railBot - 10, 6).fill(ny.iron)
    }
    // areaway railings in front of the garden windows
    ironRail(HOUSE.x + 6, GROUND - 46, cx - DOOR.width / 2 - 100 - HOUSE.x - 6, 46, g)
    ironRail(cx + DOOR.width / 2 + 100, GROUND - 46, HOUSE.x + HOUSE.width - 6 - (cx + DOOR.width / 2 + 100), 46, g)
    // bins by the rail, lids on
    for (const bx of [HOUSE.x + 250, HOUSE.x + HOUSE.width - 300]) {
      g.roundRect(bx, GROUND - 52, 34, 52, 3).fill(0x2a2826)
      g.rect(bx - 3, GROUND - 56, 40, 6).fill(0x3a3634)
      for (let r = 1; r < 4; r++) g.rect(bx, GROUND - 52 + r * 13, 34, 1.5).fill({ color: palette.ink, alpha: 0.5 })
    }
    return g
  }

  private windowBox(g: Graphics, x: number, y: number, w: number, rng: Rng) {
    g.rect(x - 4, y, w + 8, 14).fill(0x2a120c)
    const flower = pick(rng, [palette.red, palette.burnt, 0xd9a441])
    for (let i = 0; i < 8; i++) {
      const fx = x + 4 + (i / 7) * (w - 8)
      g.ellipse(fx, y - 4, 6, 8).fill(0x1b2416)
      if (chance(rng, 0.7)) g.circle(fx + range(rng, -3, 3), y - 9 - range(rng, 0, 5), 3).fill(flower)
    }
  }

  override update(time: number, dt: number, reducedMotion: boolean) {
    super.update(time, dt, reducedMotion)
    this.doorGlow.alpha = 0.42 + Math.sin(time * 0.7) * 0.02
  }
}
