import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { SIGN_FONT } from '../../fonts'
import { BaseHouse } from '../../layers/house-base'
import { glow } from '../../layers/neon'
import { Smoke } from '../../layers/smoke'
import {
  DOOR,
  FIRST_ROW_Y,
  FLOOR_H,
  GROUND,
  GROUND_FLOOR,
  HOUSE,
  SHOPFRONTS,
  type Rect,
} from '../../layout'
import { palette } from '../../palette'
import { chance, createRng, range, type Rng } from '../../rng'
import { acUnit, chochin, INK, strokePanel, tk } from './parts'
import { tokyoWindow } from './window'

const ROOF = HOUSE.y - 10

// A little tiled apartment block over an izakaya: aluminium windows, air
// conditioners, a tank and a billboard frame on the roof, a vertical neon down
// the corner and red lanterns along the front.
export class House extends BaseHouse {
  /** text and lanterns drawn while building the shell, kept in front of it */
  private signs = new Container()
  private neon: Sprite
  private lanterns: Sprite[] = []
  private steam: Smoke[] = []

  constructor(seed: number, lights: Container) {
    super()
    const rng = createRng(seed)

    const shell = new Graphics()
    this.drawRoof(shell)
    this.drawTiles(shell, rng)
    this.drawGroundFloor(shell, lights, rng)
    this.addChild(shell, this.signs)

    // steam off the yakitori grill and the ramen pot, in front of the wall
    this.steam = SHOPFRONTS.map(
      (s, i) =>
        new Smoke(
          seed + 30 + i,
          { x: s.x + s.width / 2, y: s.y - 30 },
          { tint: 0xe0c0a0, strength: 0.3, rise: 120, count: 12 },
        ),
    )
    this.addChild(...this.steam)

    this.addWindows(lights, tokyoWindow)

    const extras = new Graphics()
    for (const w of this.windows) {
      // they go in the gap to the left of the window; the corner has the neon
      if (w.slot.col > 0 && chance(rng, 0.5)) acUnit(extras, w.slot.x - 62, w.slot.y + 60)
    }
    this.addChild(extras)

    this.addMarquee(lights, { board: 0x1a0a08, face: 0x2a0806, trim: tk.red, fan: false })

    // vertical neon down the right-hand corner
    const sign = new Graphics()
    strokePanel(sign, HOUSE.x + HOUSE.width - 36, 330, 42, 300, 0xff4a3a, rng)
    this.addChild(sign)
    this.neon = glow(lights, HOUSE.x + HOUSE.width - 15, 480, 0.9, 2.6, 0xff2a1a, 0.6)

    for (let ux = HOUSE.x + 40; ux < HOUSE.x + HOUSE.width; ux += 130) {
      glow(lights, ux, GROUND_FLOOR.y - 20, 2.2, 2.6, palette.amberDeep, 0.14)
    }
  }

  private drawRoof(g: Graphics) {
    const { x, width: w } = HOUSE
    // round water tank on legs, a billboard frame, an aerial
    g.rect(x + 80, ROOF - 70, 4, 70)
      .rect(x + 140, ROOF - 70, 4, 70)
      .fill(0x2a2a2e)
    g.roundRect(x + 70, ROOF - 120, 84, 54, 10).fill(0x3a3a40)
    g.rect(x + 70, ROOF - 96, 84, 3).fill(0x2a2a2e)
    const bx = x + w - 340
    for (const px of [bx, bx + 100, bx + 200]) g.rect(px, ROOF - 60, 4, 60).fill(0x1a1a1e)
    for (let ly = ROOF - 50; ly < ROOF; ly += 20) g.rect(bx, ly, 204, 2).fill(0x1a1a1e)
    g.rect(bx - 6, ROOF - 140, 216, 82).fill(0x2a0a08)
    g.rect(bx, ROOF - 134, 204, 70).fill(0xd8481e)
    const ad = new Text({
      text: 'NIGHT  RAMEN',
      style: { fontFamily: SIGN_FONT, fontSize: 22, fill: 0xfff0d0, letterSpacing: 3 },
      resolution: 2,
    })
    ad.anchor.set(0.5)
    ad.position.set(bx + 102, ROOF - 99)
    this.signs.addChild(ad)
    g.rect(x + 300, ROOF - 120, 2, 120).fill(0x1a1a1e)
    for (let i = 0; i < 4; i++)
      g.rect(x + 284 + i * 3, ROOF - 116 + i * 18, 34 - i * 6, 2).fill(0x1a1a1e)
    g.rect(x - 6, ROOF - 12, w + 12, 14).fill(0x2a201a)
  }

  private drawTiles(g: Graphics, rng: Rng) {
    const { x, width: w } = HOUSE
    g.rect(x, ROOF, w, GROUND_FLOOR.y - ROOF).fill(tk.tile)
    // small square tiles, a few gone darker
    for (let ty = ROOF; ty < GROUND_FLOOR.y; ty += 12)
      g.rect(x, ty, w, 1).fill({ color: palette.ink, alpha: 0.3 })
    for (let tx = x; tx < x + w; tx += 12)
      g.rect(tx, ROOF, 1, GROUND_FLOOR.y - ROOF).fill({ color: palette.ink, alpha: 0.18 })
    for (let i = 0; i < 160; i++) {
      g.rect(
        x + Math.floor(range(rng, 0, w / 12)) * 12,
        ROOF + Math.floor(range(rng, 0, (GROUND_FLOOR.y - ROOF) / 12)) * 12,
        12,
        12,
      ).fill({
        color: chance(rng, 0.5) ? 0x4a3628 : 0x2a1e16,
        alpha: 0.6,
      })
    }
    // concrete slab edges at each floor
    for (let row = 0; row < 3; row++) {
      const sy = FIRST_ROW_Y + row * FLOOR_H + 160
      g.rect(x - 4, sy, w + 8, 8).fill(tk.concrete)
    }
    // rust streaks under the rails
    for (let i = 0; i < 14; i++) {
      g.rect(
        range(rng, x + 10, x + w - 10),
        range(rng, FIRST_ROW_Y + 150, GROUND_FLOOR.y - 60),
        3,
        range(rng, 20, 60),
      ).fill({ color: 0x5a2a14, alpha: 0.35 })
    }
  }

  private drawGroundFloor(g: Graphics, lights: Container, rng: Rng) {
    const { x, y, width: w } = GROUND_FLOOR
    g.rect(x, y, w, GROUND - y).fill(tk.wood)
    for (let px = x; px < x + w; px += 16)
      g.rect(px, y, 2, GROUND - y).fill({ color: palette.ink, alpha: 0.35 })
    g.rect(x, y, w, 12).fill(tk.concrete)

    // sliding wooden lattice door with a noren curtain over it
    const d = DOOR
    g.rect(d.x - 10, d.y - 6, d.width + 20, d.height + 6).fill(tk.woodLight)
    g.rect(d.x, d.y, d.width, d.height).fill(0xf0a050)
    for (let lx = d.x; lx < d.x + d.width; lx += 10) g.rect(lx, d.y, 2, d.height).fill(tk.wood)
    for (let ly = d.y; ly < GROUND; ly += 14) g.rect(d.x, ly, d.width, 2).fill(tk.wood)
    this.noren(g, d.x - 8, d.y + 6, d.width + 16, 52, 3)
    glow(lights, d.x + d.width / 2, d.y + 80, 0.8, 1.2, palette.amber, 0.5)

    this.shop(g, lights, rng, SHOPFRONTS[0]!, 'YAKITORI')
    this.shop(g, lights, rng, SHOPFRONTS[1]!, 'RAMEN')

    // a row of red lanterns under the eaves
    const lanterns = new Graphics()
    g.rect(x + 10, y + 82, w - 20, 3).fill(palette.ink)
    for (let lx = x + 40; lx < x + w - 20; lx += 70) {
      if (Math.abs(lx - (d.x + d.width / 2)) < 50) continue
      chochin(lanterns, lx, y + 84, 1.15)
      this.lanterns.push(glow(lights, lx, y + 114, 0.7, 0.8, 0xff4a2a, 0.7))
    }
    this.signs.addChild(lanterns)
  }

  private shop(g: Graphics, lights: Container, rng: Rng, s: Rect, name: string) {
    const { x, y, width: w, height: h } = s
    g.rect(x - 8, y - 10, w + 16, h + 10).fill(tk.woodLight)
    g.rect(x, y, w, h).fill(0xd8702a)
    g.rect(x, y, w, h * 0.45).fill({ color: 0xffb050, alpha: 0.5 })
    // counter and the backs of people on stools
    g.rect(x, y + h - 30, w, 30).fill(0x3a1a0c)
    for (let i = 0; i < 3; i++) {
      const px = x + 26 + i * ((w - 52) / 2)
      g.circle(px, y + h - 56, 8).fill(palette.ink)
      g.poly([
        px - 11,
        y + h - 48,
        px + 11,
        y + h - 48,
        px + 12,
        y + h - 26,
        px - 12,
        y + h - 26,
      ]).fill(palette.ink)
    }
    for (let bx = x + 6; bx < x + w - 6; bx += range(rng, 8, 12))
      g.rect(bx, y + 12, 5, 12).fill({ color: palette.ink, alpha: 0.5 })
    this.noren(g, x - 4, y - 4, w + 8, 36, 4)
    const t = new Text({
      text: name,
      style: { fontFamily: SIGN_FONT, fontSize: 12, fill: 0xfff0d0, letterSpacing: 2 },
      resolution: 2,
    })
    t.anchor.set(0.5)
    t.position.set(x + w / 2, y + 12)
    this.signs.addChild(t)
    glow(lights, x + w / 2, y + h / 2, (w * 2) / 256, (h * 2) / 256, palette.amber, 0.5)
  }

  /** split indigo-and-red cloth curtain hung across a doorway */
  private noren(g: Graphics, x: number, y: number, w: number, h: number, panels: number) {
    const pw = w / panels
    for (let i = 0; i < panels; i++) {
      g.rect(x + i * pw + 1, y, pw - 2, h).fill(i % 2 ? 0x8a1a10 : 0xa8241a)
      g.rect(x + i * pw + 1, y + h - 8, pw - 2, 2).fill({ color: 0xf2e2bd, alpha: 0.6 })
    }
    g.rect(x - 4, y - 3, w + 8, 4).fill(tk.wood)
  }

  override update(time: number, dt: number, reducedMotion: boolean) {
    super.update(time, dt, reducedMotion)
    for (const s of this.steam) s.update(time, reducedMotion ? dt * 0.3 : dt)
    this.neon.alpha = Math.sin(time * 43) > 0.98 ? 0.2 : 0.58 + Math.sin(time * 2) * 0.03
    this.lanterns.forEach((l, i) => (l.alpha = 0.6 + Math.sin(time * 1.6 + i) * 0.05))
  }
}
