import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { SIGN_FONT } from '../../fonts'
import { BaseHouse } from '../../layers/house-base'
import { glow } from '../../layers/neon'
import { DOOR, FIRST_ROW_Y, FLOOR_H, GROUND, GROUND_FLOOR, HOUSE, SHOPFRONTS, type Rect } from '../../layout'
import { palette } from '../../palette'
import { chance, createRng, range, type Rng } from '../../rng'
import { funnelChimney, INK, lancet, plasterWall, vn } from './parts'
import { veniceWindow } from './window'

const EAVES = HOUSE.y - 20

// A small gothic palazzo on the canal: rose plaster coming away to show the
// brick, istrian stone trim, a stone balcony on the middle floor, a wooden
// altana on the roof and funnel chimneys.
export class House extends BaseHouse {
  private lanterns: Sprite[] = []

  constructor(seed: number, lights: Container) {
    super()
    const rng = createRng(seed)

    const shell = new Graphics()
    this.drawRoof(shell)
    plasterWall(shell, HOUSE.x, EAVES, HOUSE.width, GROUND - EAVES, vn.plaster, rng)
    this.drawTrim(shell, rng)
    this.drawGroundFloor(shell, lights, rng)
    this.addChild(shell)

    this.addWindows(lights, veniceWindow)
    this.addChild(this.balcony())
    this.addMarquee(lights, { board: 0x5a1610, face: 0x2a0a08, trim: 0xd9a54a, fan: false })

    for (const [x, y] of [
      [HOUSE.x - 2, GROUND_FLOOR.y + 40],
      [HOUSE.x + HOUSE.width + 2, GROUND_FLOOR.y + 40],
    ] as const) {
      this.addChild(wallLantern(x, y, x < HOUSE.x + 10 ? -1 : 1))
      this.lanterns.push(glow(lights, x + (x < HOUSE.x + 10 ? -34 : 34), y + 26, 1.3, 1.3, 0xffb84a, 0.8))
    }
    for (let ux = HOUSE.x + 40; ux < HOUSE.x + HOUSE.width; ux += 130) {
      glow(lights, ux, GROUND_FLOOR.y - 20, 2.2, 2.6, palette.amberDeep, 0.13)
    }
  }

  private drawRoof(g: Graphics) {
    const { x, width: w } = HOUSE
    // altana: the wooden roof terrace venetians hang washing on
    const ax = x + w - 260
    for (const px of [ax, ax + 70, ax + 140, ax + 210]) g.rect(px, EAVES - 90, 6, 90).fill(0x24140c)
    g.rect(ax - 6, EAVES - 96, 228, 8).fill(0x2e1a10)
    for (let rx = ax; rx < ax + 216; rx += 9) g.rect(rx, EAVES - 130, 2, 34).fill(0x24140c)
    g.rect(ax - 6, EAVES - 132, 228, 4).fill(0x2e1a10)
    for (const cx of [x + 70, x + 260, x + w - 300]) funnelChimney(g, cx, EAVES - 10)
    // terracotta roof edge and deep eaves
    g.poly([x - 30, EAVES, x + w + 30, EAVES, x + w + 10, EAVES - 30, x - 10, EAVES - 30]).fill(vn.tile)
    for (let tx = x - 26; tx < x + w + 26; tx += 12) g.rect(tx, EAVES - 26, 7, 24).fill({ color: 0x7a2c18, alpha: 0.7 })
    g.rect(x - 30, EAVES, w + 60, 10).fill(0x2a120c)
  }

  private drawTrim(g: Graphics, rng: Rng) {
    const { x, width: w } = HOUSE
    // sawtooth "dente di sega" courses between floors
    for (let row = 0; row < 3; row++) {
      const sy = FIRST_ROW_Y + row * FLOOR_H - 40
      g.rect(x, sy, w, 6).fill(vn.istria)
      for (let tx = x; tx < x + w; tx += 10) g.poly([tx, sy + 6, tx + 5, sy + 12, tx + 10, sy + 6]).fill(vn.istria)
    }
    // corner quoins
    for (let qy = EAVES + 20; qy < GROUND_FLOOR.y; qy += 40) {
      g.rect(x, qy, 18, 30).rect(x + w - 18, qy, 18, 30).fill({ color: vn.istria, alpha: 0.75 })
    }
    // patere: carved stone roundels set into the plaster
    for (let i = 0; i < 5; i++) {
      const px = x + 60 + range(rng, 0, w - 120)
      const py = FIRST_ROW_Y + Math.floor(range(rng, 0, 3)) * FLOOR_H + 166
      g.circle(px, py, 11).fill(vn.istria).stroke(INK)
      g.circle(px, py, 6).stroke({ color: vn.istriaDark, width: 1.5 })
    }
  }

  private drawGroundFloor(g: Graphics, lights: Container, rng: Rng) {
    const { x, y, width: w } = GROUND_FLOOR
    g.rect(x, y, w, 10).fill(vn.istria)
    // istrian stone plinth along the fondamenta
    g.rect(x, GROUND - 30, w, 30).fill(vn.istriaDark)
    g.rect(x, GROUND - 30, w, 3).fill(vn.istria)

    // the door: a tall pointed portal with a wooden door, lit fanlight
    const d = DOOR
    lancet(g, d.x - 12, d.y - 22, d.width + 24, d.height + 22, (d.width + 24) * 0.7).fill(vn.istria).stroke(INK)
    lancet(g, d.x, d.y - 10, d.width, d.height + 10, d.width * 0.7).fill(0x2a1208)
    lancet(g, d.x + 6, d.y - 2, d.width - 12, 40, (d.width - 12) * 0.7).fill(0xf0a050)
    g.rect(d.x + d.width / 2 - 1.5, d.y + 38, 3, d.height - 38).fill(palette.ink)
    for (let by = d.y + 50; by < GROUND - 10; by += 24) g.rect(d.x + 6, by, d.width - 12, 2).fill({ color: palette.ink, alpha: 0.5 })
    g.circle(d.x + d.width / 2 - 8, d.y + 96, 3).circle(d.x + d.width / 2 + 8, d.y + 96, 3).fill(palette.gold)
    glow(lights, d.x + d.width / 2, d.y + 16, 0.6, 0.5, palette.amber, 0.5)

    this.shop(g, lights, rng, SHOPFRONTS[0]!, 'BACARO', 'bar')
    this.shop(g, lights, rng, SHOPFRONTS[1]!, 'MASCHERE', 'masks')
  }

  private shop(g: Graphics, lights: Container, rng: Rng, s: Rect, name: string, kind: 'bar' | 'masks') {
    const { x, y, width: w, height: h } = s
    // round-arched shop opening in stone
    g.moveTo(x - 12, y + h).lineTo(x - 12, y + 20).arc(x + w / 2, y + 20, w / 2 + 12, Math.PI, 0).lineTo(x + w + 12, y + h).closePath().fill(vn.istria).stroke(INK)
    g.moveTo(x, y + h).lineTo(x, y + 20).arc(x + w / 2, y + 20, w / 2, Math.PI, 0).lineTo(x + w, y + h).closePath().fill(0xc8641e)
    g.rect(x, y + 30, w, h - 30).fill({ color: 0xffb050, alpha: 0.35 })
    if (kind === 'bar') {
      // counter of cicchetti and the bottles behind
      for (let bx = x + 10; bx < x + w - 10; bx += range(rng, 6, 10)) g.rect(bx, y + 34, 4, 16).fill({ color: palette.ink, alpha: 0.6 })
      g.rect(x + 4, y + h - 34, w - 8, 30).fill(0x3a140a)
      for (let p = 0; p < 2; p++) {
        const px = x + 40 + p * 70
        g.circle(px, y + h - 58, 8).fill(palette.ink)
        g.poly([px - 10, y + h - 50, px + 10, y + h - 50, px + 12, y + h - 30, px - 12, y + h - 30]).fill(palette.ink)
      }
    } else {
      // masks on the wall: white faces, gold and red ones, a long-nosed doctor
      for (let i = 0; i < 6; i++) {
        const mx = x + 22 + (i % 3) * ((w - 44) / 2)
        const my = y + 42 + Math.floor(i / 3) * 34
        const colour = [0xf2e8d8, 0xd9a54a, 0xb02418][i % 3]!
        g.ellipse(mx, my, 11, 13).fill(colour)
        g.ellipse(mx - 4, my - 2, 3, 2).ellipse(mx + 4, my - 2, 3, 2).fill(palette.ink)
        if (chance(rng, 0.3)) g.poly([mx - 3, my + 2, mx + 3, my + 2, mx, my + 18]).fill(colour)
      }
    }
    g.rect(x + w / 2 - 1.5, y + 20, 3, h - 20).fill(palette.ink)
    const t = new Text({ text: name, style: { fontFamily: SIGN_FONT, fontSize: 14, fill: palette.gold, letterSpacing: 2 }, resolution: 2 })
    t.anchor.set(0.5)
    t.position.set(x + w / 2, y - 22)
    this.addChild(t)
    glow(lights, x + w / 2, y + h / 2, (w * 2) / 256, (h * 2) / 256, palette.amber, 0.45)
  }

  /** stone balustrade across the middle floor */
  private balcony() {
    const g = new Graphics()
    const slot = this.windows[4]!.slot
    const y = slot.y + slot.height + 4
    const x0 = HOUSE.x + 40
    const x1 = HOUSE.x + HOUSE.width - 40
    g.rect(x0 - 10, y, x1 - x0 + 20, 10).fill(vn.istria).stroke(INK)
    for (let bx = x0; bx < x1; bx += 14) {
      // little turned balusters
      g.ellipse(bx + 5, y - 18, 4, 10).fill(vn.istria)
      g.rect(bx + 2, y - 30, 6, 4).fill(vn.istria)
    }
    g.rect(x0 - 10, y - 38, x1 - x0 + 20, 8).fill(vn.istria).stroke(INK)
    for (let i = 0; i < 6; i++) {
      // brackets under the balcony
      const bx = x0 + i * ((x1 - x0) / 5)
      g.poly([bx - 8, y + 10, bx + 8, y + 10, bx + 4, y + 30, bx - 4, y + 30]).fill(vn.istria)
    }
    return g
  }

  override update(time: number, dt: number, reducedMotion: boolean) {
    super.update(time, dt, reducedMotion)
    this.lanterns.forEach((l, i) => (l.alpha = 0.76 + Math.sin(time * 5 + i * 2) * 0.03 + Math.sin(time * 1.3 + i) * 0.03))
  }
}

/** iron lantern on a curly wall bracket; side -1 hangs left, 1 hangs right */
export function wallLantern(x: number, y: number, side: -1 | 1) {
  const g = new Graphics()
  const ink = palette.ink
  g.moveTo(x, y).lineTo(x + side * 40, y).stroke({ color: ink, width: 4 })
  g.moveTo(x, y + 24).quadraticCurveTo(x + side * 10, y + 4, x + side * 30, y + 2).stroke({ color: ink, width: 2.5 })
  const lx = x + side * 34
  g.rect(lx - 1, y, 2, 8).fill(ink)
  g.poly([lx - 12, y + 8, lx + 12, y + 8, lx + 8, y + 42, lx - 8, y + 42]).fill(0xffd27a)
  g.poly([lx - 12, y + 8, lx + 12, y + 8, lx + 8, y + 42, lx - 8, y + 42]).stroke({ color: ink, width: 2 })
  g.rect(lx - 1, y + 8, 2, 34).fill(ink)
  g.poly([lx - 15, y + 8, lx + 15, y + 8, lx, y - 4]).fill(ink)
  g.rect(lx - 9, y + 42, 18, 4).fill(ink)
  return g
}

