import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { SIGN_FONT } from '../../fonts'
import { glow } from '../../layers/neon'
import { GROUND, WORLD } from '../../layout'
import { palette } from '../../palette'
import { chance, createRng, pick, range, type Rng } from '../../rng'
import { CLIFF_EDGE, MIRROR } from './coast'
import { TERRACE_WING } from './layout'
import {
  agave,
  birdOfParadise,
  bougainvillea,
  INK,
  lantern,
  pricklyPear,
  sd,
  STUCCOS,
  stuccoWall,
  tileRoof,
} from './parts'

const LIT = [0xf0a850, 0xe8843a, 0xffc878, 0xd8703a]

// The street runs out along the cliff on one side of the house: a rail, a
// bench, the stairs down to the beach, a paleta cart. On the other side it's
// the town: the taco shop that never shuts, a surf shop, a brewery, the old
// tower in the park and the arch over Fifth Avenue behind them.
export class Neighbors extends Container {
  private signs = new Container()
  private neon: Sprite[] = []
  private tvs: Sprite[] = []
  private bulbs: Sprite[] = []

  constructor(seed: number, lights: Container) {
    super()
    const rng = createRng(seed)

    const back = new Graphics()
    this.backRow(back, rng)
    this.parkTower(back, lights, 2215)
    this.archSign(back, lights, 1790, 2070)
    this.hotel(back, lights, rng, 2330)
    const g = new Graphics()
    this.addChild(back, g)

    const x = TERRACE_WING.x + TERRACE_WING.width + 22
    this.tacoShop(g, lights, rng, x, 340)
    this.surfShop(g, lights, rng, x + 356, 290)
    this.brewery(g, lights, rng, x + 662, 330)
    this.bungalow(g, lights, rng, x + 1010, 330, true)
    this.streetLife(g, lights, x)

    // the cliff is drawn looking the other way, like the view beyond it
    const edge = new Graphics()
    edge.scale.x = -1
    edge.x = MIRROR
    this.cliffTop(edge, rng)
    const cart = new Graphics()
    this.paletaCart(cart, lights, 664)
    this.addChild(edge, cart, this.signs)
  }

  /** roofs and palms one street back, mostly dark */
  private backRow(g: Graphics, rng: Rng) {
    let x = 1640
    while (x < 3000) {
      const w = range(rng, 130, 220)
      const top = GROUND - range(rng, 300, 400)
      g.rect(x, top, w, GROUND - top).fill(0x15131b)
      g.poly([x - 12, top, x + w + 12, top, x + w - 24, top - 34, x + 24, top - 34]).fill(0x1e1418)
      for (let wx = x + 18; wx < x + w - 30; wx += 44)
        if (chance(rng, 0.5))
          g.rect(wx, top + 20, 20, 26).fill({ color: pick(rng, LIT), alpha: 0.8 })
      if (chance(rng, 0.6)) this.farPalm(g, x + range(rng, 10, w - 10), top - range(rng, 90, 210))
      x += w + range(rng, 6, 40)
    }
  }

  private farPalm(g: Graphics, x: number, top: number) {
    g.rect(x - 2.5, top, 5, GROUND - top).fill(0x110f15)
    for (let i = 0; i < 11; i++) {
      const a = -Math.PI * (i / 10)
      g.moveTo(x, top)
        .lineTo(x + Math.cos(a) * 30, top + Math.sin(a) * 24 + Math.abs(Math.cos(a)) * 14)
        .stroke({ color: 0x110f15, width: 4, cap: 'round' })
    }
  }

  /** one storey of stucco under a hipped tile roof, maybe a room built on top */
  private bungalow(
    g: Graphics,
    lights: Container,
    rng: Rng,
    x: number,
    w: number,
    upstairs: boolean,
  ) {
    const colour = pick(rng, STUCCOS)
    const top = GROUND - 190
    if (upstairs) {
      const ux = x + w * 0.3
      const uw = w * 0.5
      stuccoWall(g, ux, top - 150, uw, 150, colour, rng)
      tileRoof(g, ux, top - 150, uw, 44, [40, 40])
      this.window(g, lights, rng, ux + uw / 2 - 58, top - 112, 46, 64)
      this.window(g, lights, rng, ux + uw / 2 + 12, top - 112, 46, 64)
    }
    stuccoWall(g, x, top, w, 190, colour, rng)
    tileRoof(g, x, top, w, 52, [60, 60])
    // chimney
    g.rect(x + w * 0.16, top - 84, 26, 40).fill(colour)
    g.rect(x + w * 0.16 - 4, top - 90, 34, 8).fill(sd.tileDark)

    // an arched porch with the door back in the shade, a lantern by it
    const dx = x + w * 0.5 - 30
    g.moveTo(dx - 10, GROUND)
      .lineTo(dx - 10, GROUND - 100)
      .arc(dx + 30, GROUND - 100, 40, Math.PI, 0)
      .lineTo(dx + 70, GROUND)
      .closePath()
      .fill(sd.stuccoDark)
    g.rect(dx + 6, GROUND - 112, 48, 112).fill(sd.wood)
    g.rect(dx + 22, GROUND - 96, 16, 22).fill(0xe8a04a)
    lantern(g, dx - 14, GROUND - 126, -1)
    glow(lights, dx - 32, GROUND - 100, 0.8, 0.9, 0xffb84a, 0.6)

    const ww = Math.min(70, (w - 150) / 2)
    if (ww > 34) {
      this.window(g, lights, rng, x + 24, GROUND - 140, ww, 84)
      this.window(g, lights, rng, x + w - 24 - ww, GROUND - 140, ww, 84)
    }
    // yard
    agave(g, x + 30, GROUND, 0.7)
    if (w > 250) {
      pricklyPear(g, x + w - 40, GROUND, 0.8)
      birdOfParadise(g, x + w * 0.5 + 76, GROUND, 0.7)
      bougainvillea(g, x + w - 26, top + 6, 30, 120, rng, 0xd8602a)
    }
  }

  private window(
    g: Graphics,
    lights: Container,
    rng: Rng,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    g.rect(x - 6, y - 6, w + 12, h + 10).fill(sd.stuccoDark)
    g.rect(x - 8, y + h + 2, w + 16, 6).fill(sd.tile)
    const roll = rng()
    if (roll < 0.62) {
      const colour = pick(rng, LIT)
      g.rect(x, y, w, h).fill(colour)
      g.rect(x, y, w * 0.3, h).fill({ color: 0x4a2a1a, alpha: 0.6 })
      glow(lights, x + w / 2, y + h / 2, (w * 2.6) / 256, (h * 2.2) / 256, palette.amberDeep, 0.4)
    } else if (roll < 0.8) {
      // somebody up late with the television
      g.rect(x, y, w, h).fill(0x1a2a4a)
      this.tvs.push(
        glow(lights, x + w / 2, y + h / 2, (w * 2.4) / 256, (h * 2) / 256, 0x6a9aff, 0.4),
      )
    } else {
      g.rect(x, y, w, h).fill(0x0c0a0e)
    }
    g.rect(x + w / 2 - 1.5, y, 3, h).fill(sd.wood)
    g.rect(x, y + h * 0.4, w, 2.5).fill(sd.wood)
  }

  /** a walk-up window, a hand-painted menu, and a sign you can see from the freeway */
  private tacoShop(g: Graphics, lights: Container, rng: Rng, x: number, w: number) {
    const top = GROUND - 210
    stuccoWall(g, x, top, w, 210, 0x8a6a3a, rng)
    // parapet with a tile coping, and the stripes every one of these has
    g.rect(x - 6, top - 12, w + 12, 14).fill(sd.tile)
    for (let tx = x - 4; tx < x + w + 6; tx += 12)
      g.rect(tx, top - 12, 1.5, 14).fill({ color: palette.ink, alpha: 0.4 })
    g.rect(x, top + 6, w, 9).fill(0xc8281e)
    g.rect(x, top + 15, w, 9).fill(0xe8c02a)

    // papel picado strung across the front
    for (let px = x + 4; px < x + w - 8; px += 15)
      g.rect(px, top + 28 + Math.sin(((px - x) / w) * Math.PI) * 10, 12, 15).fill(
        pick(rng, [0xd8368a, 0x2a9ab0, 0xe8c02a, 0x3aa04a, 0xe8603a, 0x7a3ab0]),
      )

    // the sign on the roof, lit from inside
    const sx = x + 40
    const sw = w - 80
    g.rect(sx + 30, top - 34, 6, 24)
      .rect(sx + sw - 36, top - 34, 6, 24)
      .fill(0x1a1a1e)
    g.roundRect(sx, top - 108, sw, 76, 8)
      .fill(0xe8c02a)
      .stroke({ color: 0xc8281e, width: 5 })
    this.text('TACOS', x + w / 2, top - 82, 34, 0xc8281e, 4)
    this.text('BURRITOS  ·  CARNE ASADA FRIES', x + w / 2, top - 50, 11, 0x1e3a2a, 1)
    glow(lights, x + w / 2, top - 70, (sw * 1.9) / 256, 0.9, 0xffc040, 0.5)

    // the kitchen: a long lit window, the cook, the order shelf
    const wy = GROUND - 160
    g.rect(x + 22, wy - 8, 190, 108).fill(0x2a1a10)
    g.rect(x + 30, wy, 174, 92).fill(0xffd890)
    g.rect(x + 30, wy, 174, 30).fill({ color: 0xffffff, alpha: 0.25 })
    g.circle(x + 92, wy + 44, 10).fill(palette.ink)
    g.rect(x + 82, wy + 28, 20, 8).fill(0xf2e2bd)
    g.poly([x + 78, wy + 54, x + 106, wy + 54, x + 110, wy + 92, x + 74, wy + 92]).fill(palette.ink)
    g.rect(x + 138, wy + 20, 4, 72).fill(0x8a8a90)
    for (let i = 0; i < 4; i++) g.rect(x + 146, wy + 12 + i * 20, 46, 3).fill(0x8a8a90)
    g.rect(x + 18, wy + 92, 198, 9).fill(0xb8b8c0)
    glow(lights, x + 117, wy + 46, 1.9, 1.1, 0xffd890, 0.65)

    // menu boards
    const mx = x + 228
    g.rect(mx, wy - 8, 94, 108)
      .fill(0xf2e2bd)
      .stroke(INK)
    for (let i = 0; i < 7; i++) {
      g.rect(mx + 8, wy + 4 + i * 13, range(rng, 34, 54), 3.5).fill(i % 3 ? 0x2a2a2e : 0xc8281e)
      g.rect(mx + 72, wy + 4 + i * 13, 14, 3.5).fill(0x2a2a2e)
    }
    this.text('OPEN 24 HRS', x + 117, GROUND - 190, 13, 0xff4a3a, 2)
    this.neon.push(glow(lights, x + 117, GROUND - 190, 1, 0.3, 0xff2a1a, 0.6))

    // a concrete table out front, two people and their horchatas
    const tx = x + w - 96
    g.rect(tx - 34, GROUND - 40, 68, 6).fill(0x8a8680)
    g.rect(tx - 4, GROUND - 34, 8, 34).fill(0x6a6660)
    for (const side of [-1, 1]) {
      const px = tx + side * 50
      g.rect(px - 14, GROUND - 24, 28, 5).fill(0x8a8680)
      g.circle(px, GROUND - 76, 8).fill(palette.ink)
      g.poly([
        px - 10,
        GROUND - 68,
        px + 10,
        GROUND - 68,
        px + 12,
        GROUND - 22,
        px - 12,
        GROUND - 22,
      ]).fill(palette.ink)
      g.rect(tx + side * 14 - 3, GROUND - 54, 6, 14).fill(0xf2e2bd)
    }
  }

  /** a wooden shack with boards racked outside and wetsuits in the window */
  private surfShop(g: Graphics, lights: Container, rng: Rng, x: number, w: number) {
    const top = GROUND - 250
    g.rect(x, top, w, 250).fill(0x2a3a44)
    for (let bx = x; bx < x + w; bx += 14)
      g.rect(bx, top, 1.5, 250).fill({ color: palette.ink, alpha: 0.35 })
    g.poly([x - 14, top, x + w + 14, top, x + w / 2, top - 64]).fill(0x1e2a32)
    g.poly([x - 14, top, x + w + 14, top, x + w + 14, top + 8, x - 14, top + 8]).fill(0x16202a)
    // the sign: a board, naturally
    g.ellipse(x + w / 2, top + 44, 112, 26)
      .fill(0xf2e2bd)
      .stroke({ color: 0xd8502a, width: 4 })
    this.text('SURF SHOP', x + w / 2, top + 44, 22, 0x1e4a5a, 3)
    glow(lights, x + w / 2, top + 44, 1.6, 0.5, 0xfff0d0, 0.4)

    const wy = GROUND - 150
    g.rect(x + 16, wy - 6, 150, 116).fill(0x16202a)
    g.rect(x + 22, wy, 138, 104).fill(0xe8c080)
    // wetsuits on a rail
    for (let i = 0; i < 4; i++) {
      const hx = x + 44 + i * 30
      g.poly([
        hx - 12,
        wy + 16,
        hx + 12,
        wy + 16,
        hx + 9,
        wy + 60,
        hx + 3,
        wy + 96,
        hx - 3,
        wy + 96,
        hx - 9,
        wy + 60,
      ]).fill(i % 2 ? 0x101418 : 0x1a2a3a)
      g.rect(hx - 12, wy + 22, 24, 4).fill(pick(rng, [0xd8502a, 0x2a8a9a, 0xe8c25a]))
    }
    g.rect(x + 22, wy + 10, 138, 2).fill(0x8a8a90)
    glow(lights, x + 91, wy + 52, 1.5, 1.2, palette.amber, 0.5)
    g.rect(x + 186, GROUND - 130, 56, 130).fill(0x16202a)
    g.rect(x + 192, GROUND - 124, 44, 60).fill(0xc88a3a)

    // the rack out front
    const colours = [0xf2e2bd, 0xe8c25a, 0x8ac0c8, 0xd8502a, 0xf2e2bd]
    colours.forEach((c, i) => {
      const bx = x + w - 52 + i * 11
      g.ellipse(bx, GROUND - 98, 8, 98).fill(c)
      g.rect(bx - 0.75, GROUND - 190, 1.5, 186).fill({ color: palette.ink, alpha: 0.5 })
    })
    g.rect(x + w - 64, GROUND - 70, 72, 4).fill(sd.wood)
    // pennants along the eave
    for (let px = x + 6; px < x + w - 6; px += 18)
      g.poly([px, top + 8, px + 12, top + 8, px + 6, top + 22]).fill(
        pick(rng, [0xd8502a, 0xe8c25a, 0x2a8a9a, 0xf2e2bd]),
      )
  }

  /** an old brick warehouse with the door rolled up: tanks, taps, a crowd */
  private brewery(g: Graphics, lights: Container, rng: Rng, x: number, w: number) {
    const top = GROUND - 290
    g.rect(x, top, w, 290).fill(0x4a241a)
    for (let by = top; by < GROUND; by += 9)
      g.rect(x, by, w, 1).fill({ color: palette.ink, alpha: 0.3 })
    for (let i = 0; i < 70; i++)
      g.rect(
        x + Math.floor(range(rng, 0, w / 20)) * 20,
        top + Math.floor(range(rng, 0, 32)) * 9,
        20,
        9,
      ).fill({
        color: chance(rng, 0.5) ? 0x6a3424 : 0x341810,
        alpha: 0.6,
      })
    g.rect(x - 4, top - 10, w + 8, 12).fill(0x2a1610)
    // painted straight on the brick, the way they all do it
    g.roundRect(x + 24, top + 22, w - 48, 74, 6)
      .fill(0x14100c)
      .stroke({ color: 0xe8c25a, width: 3 })
    this.text('CLIFFSIDE', x + w / 2, top + 46, 26, 0xe8c25a, 4)
    this.text('BREWING CO.  ·  32 TAPS', x + w / 2, top + 78, 12, 0xf2e2bd, 2)
    glow(lights, x + w / 2, top + 58, (w * 1.5) / 256, 0.7, 0xffc040, 0.35)

    // the roll-up door, open: copper tanks at the back, the bar, people
    const dy = GROUND - 170
    g.rect(x + 20, dy - 10, 210, 10).fill(0x8a8a90)
    g.rect(x + 20, dy, 210, 170).fill(0xe89a40)
    g.rect(x + 20, dy, 210, 60).fill({ color: 0xffd890, alpha: 0.4 })
    for (const tx of [x + 40, x + 92, x + 144]) {
      g.roundRect(tx, dy + 14, 40, 96, 16).fill(0xb8642a)
      g.rect(tx + 6, dy + 20, 6, 80).fill({ color: 0xffd0a0, alpha: 0.5 })
      g.rect(tx + 14, dy + 4, 12, 12).fill(0x8a4a20)
    }
    g.rect(x + 20, dy + 112, 210, 12).fill(0x2a1610)
    for (let i = 0; i < 5; i++) {
      const px = x + 38 + i * 42 + range(rng, -6, 6)
      g.circle(px, dy + 96, 8).fill(palette.ink)
      g.poly([px - 10, dy + 104, px + 10, dy + 104, px + 11, GROUND, px - 11, GROUND]).fill(
        palette.ink,
      )
      g.rect(px + 9, dy + 112, 5, 10).fill(0xe8a020)
    }
    glow(lights, x + 125, dy + 80, 2, 1.5, 0xffb050, 0.6)
    // a chalkboard and a row of kegs
    g.rect(x + 246, GROUND - 150, 62, 84)
      .fill(0x14181a)
      .stroke({ color: sd.woodLight, width: 4 })
    for (let i = 0; i < 5; i++)
      g.rect(x + 254, GROUND - 138 + i * 14, range(rng, 24, 44), 3).fill({
        color: 0xf2e2bd,
        alpha: 0.8,
      })
    for (const kx of [x + 252, x + 284]) {
      g.roundRect(kx, GROUND - 50, 28, 50, 6).fill(0x8a8a90)
      g.rect(kx, GROUND - 36, 28, 3)
        .rect(kx, GROUND - 18, 28, 3)
        .fill(0x5a5a60)
    }
    this.swag(g, lights, x + 10, x + w - 10, top + 108, 8)
  }

  /** an old hotel a block back, its name down the side in red */
  private hotel(g: Graphics, lights: Container, rng: Rng, x: number) {
    const top = 520
    g.rect(x, top, 190, GROUND - top).fill(0x3a2a26)
    g.rect(x - 6, top - 12, 202, 14).fill(0x2a1c1a)
    for (let fy = top + 22; fy < GROUND - 300; fy += 52)
      for (let c = 0; c < 4; c++) {
        const lit = chance(rng, 0.55)
        g.rect(x + 16 + c * 44, fy, 26, 36).fill(lit ? pick(rng, LIT) : 0x0c0a0e)
      }
    g.rect(x - 30, top + 10, 30, 190).fill(0x14100c)
    this.text('H\nO\nT\nE\nL', x - 15, top + 105, 26, 0xff4a3a, 0)
    this.neon.push(glow(lights, x - 15, top + 105, 0.5, 1.7, 0xff2a1a, 0.6))
  }

  /** bulbs on a wire between two points */
  private swag(g: Graphics, lights: Container, x0: number, x1: number, y: number, n: number) {
    g.moveTo(x0, y)
      .quadraticCurveTo((x0 + x1) / 2, y + 36, x1, y)
      .stroke({ color: sd.iron, width: 1.5 })
    for (let i = 1; i < n; i++) {
      const t = i / n
      const bx = x0 + (x1 - x0) * t
      const by = y + 72 * t * (1 - t)
      g.circle(bx, by + 3, 3).fill(0xfff0c0)
      this.bulbs.push(glow(lights, bx, by + 3, 0.2, 0.2, 0xffc870, 0.8))
    }
  }

  /** the tower in the park: white, tiled dome, lit from below all night */
  private parkTower(g: Graphics, lights: Container, x: number) {
    const base = GROUND - 330
    const white = 0x8a8474
    g.rect(x - 34, base - 190, 68, 190 + 330).fill(white)
    g.rect(x - 34, base - 190, 14, 520).fill({ color: palette.ink, alpha: 0.25 })
    for (const wy of [base - 150, base - 90]) {
      g.roundRect(x - 9, wy, 18, 36, 9).fill(0x1a1410)
      g.rect(x - 22, wy + 44, 44, 4).fill(0x6a6456)
    }
    g.rect(x - 40, base - 198, 80, 10).fill(0xa09a88)
    // the belfry, three stages getting smaller, then the dome
    g.rect(x - 28, base - 262, 56, 64).fill(white)
    for (const ax of [x - 16, x + 4]) g.roundRect(ax, base - 250, 12, 40, 6).fill(0xffc870)
    g.rect(x - 32, base - 268, 64, 8).fill(0xa09a88)
    g.rect(x - 20, base - 308, 40, 40).fill(white)
    g.roundRect(x - 6, base - 300, 12, 26, 6).fill(0xffc870)
    g.moveTo(x - 22, base - 308)
      .arc(x, base - 308, 22, Math.PI, 0)
      .closePath()
      .fill(0x2a6a8a)
    for (let i = 1; i < 6; i++) {
      const a = Math.PI + (i / 6) * Math.PI
      g.moveTo(x, base - 308)
        .lineTo(x + Math.cos(a) * 22, base - 308 + Math.sin(a) * 22)
        .stroke({ color: 0xe8c25a, width: 2 })
    }
    g.rect(x - 1.5, base - 352, 3, 24).fill(0xe8c25a)
    g.circle(x, base - 354, 4).fill(0xe8c25a)
    glow(lights, x, base - 240, 0.8, 1.6, 0xffc870, 0.4)
    glow(lights, x, base - 60, 1.2, 2.4, 0xffb050, 0.18)
  }

  /** the sign across the avenue downtown, all bulbs */
  private archSign(g: Graphics, lights: Container, x0: number, x1: number) {
    const y = 560
    const cx = (x0 + x1) / 2
    for (const px of [x0, x1]) {
      g.rect(px - 6, y + 20, 12, GROUND - y).fill(0x1a2a24)
      g.circle(px, y + 14, 10).fill(0xffe0a0)
      glow(lights, px, y + 14, 0.5, 0.5, 0xffc870, 0.7)
    }
    g.moveTo(x0, y + 50)
      .quadraticCurveTo(cx, y - 60, x1, y + 50)
      .lineTo(x1, y + 96)
      .quadraticCurveTo(cx, y - 8, x0, y + 96)
      .closePath()
      .fill(0x16302a)
      .stroke({ color: 0xe8c25a, width: 3 })
    const word = 'GASLAMP QUARTER'
    ;[...word].forEach((ch, i) => {
      const t = (i + 1) / (word.length + 1)
      const lx = x0 + (x1 - x0) * t
      const ly = y + 73 - 108 * t * (1 - t) * 2 + 4
      this.text(ch, lx, ly, 19, 0xffe9a8, 0)
      if (ch !== ' ') this.bulbs.push(glow(lights, lx, ly, 0.2, 0.26, 0xffb050, 0.55))
    })
  }

  /** what's left out on the pavement: scooters, a sandwich board, newspaper boxes */
  private streetLife(g: Graphics, lights: Container, x: number) {
    // rental scooters, one of them on its side as usual
    for (const [sx, lean] of [
      [x + 334, 0.12],
      [x + 350, -0.08],
      [x + 980, 0.1],
    ] as const) {
      g.moveTo(sx - 16, GROUND - 5)
        .lineTo(sx + 14, GROUND - 5)
        .stroke({ color: 0x2a2a2e, width: 4 })
      g.moveTo(sx + 12, GROUND - 5)
        .lineTo(sx + 12 + lean * 80, GROUND - 66)
        .stroke({ color: 0x3ac0a0, width: 3 })
      g.rect(sx + 4 + lean * 80, GROUND - 68, 16, 3).fill(0x2a2a2e)
      g.circle(sx - 16, GROUND - 4, 5)
        .circle(sx + 16, GROUND - 4, 5)
        .fill(palette.ink)
    }
    // sandwich board outside the surf shop
    const bx = x + 370
    g.poly([bx, GROUND, bx + 14, GROUND - 62, bx + 46, GROUND - 62, bx + 60, GROUND]).fill(0x14181a)
    g.poly([
      bx + 6,
      GROUND - 6,
      bx + 17,
      GROUND - 56,
      bx + 43,
      GROUND - 56,
      bx + 54,
      GROUND - 6,
    ]).fill(0xf2e2bd)
    this.text('WAX\n$2', bx + 30, GROUND - 32, 12, 0xd8502a, 1)
    // newspaper boxes
    ;[0x2a5a9a, 0xc8281e, 0xe8c02a].forEach((c, i) => {
      const nx = x + 574 + i * 26
      g.rect(nx, GROUND - 56, 22, 48).fill(c)
      g.rect(nx + 3, GROUND - 52, 16, 18).fill(0x14181a)
      g.rect(nx + 9, GROUND - 8, 4, 8).fill(0x2a2a2e)
    })
    // a padres flag off the brewery wall, brown and gold
    const fx = x + 662
    g.moveTo(fx, GROUND - 210)
      .lineTo(fx - 44, GROUND - 250)
      .stroke({ color: 0x8a8a90, width: 3 })
    g.poly([
      fx - 44,
      GROUND - 250,
      fx - 44,
      GROUND - 196,
      fx - 8,
      GROUND - 176,
      fx - 8,
      GROUND - 222,
    ]).fill(0x4a2c1a)
    g.poly([
      fx - 44,
      GROUND - 232,
      fx - 44,
      GROUND - 216,
      fx - 8,
      GROUND - 194,
      fx - 8,
      GROUND - 210,
    ]).fill(0xe8c02a)
    // lights strung over the pavement from the taco shop to the surf shop
    this.swag(g, lights, x + 300, x + 372, GROUND - 236, 6)
    // potted palms by the doors
    for (const px of [x + 548, x + 1000]) {
      g.poly([px - 12, GROUND - 26, px + 12, GROUND - 26, px + 9, GROUND, px - 9, GROUND]).fill(
        sd.pot,
      )
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI * (0.1 + (i / 6) * 0.8)
        g.moveTo(px, GROUND - 26)
          .quadraticCurveTo(
            px + Math.cos(a) * 20,
            GROUND - 60,
            px + Math.cos(a) * 34,
            GROUND - 40 + Math.sin(a) * 30,
          )
          .stroke({ color: i % 2 ? sd.leaf : sd.leafLight, width: 3.5, cap: 'round' })
      }
    }
  }

  /** a paleta cart at the lookout, bell on the handle, umbrella up even at night */
  private paletaCart(g: Graphics, lights: Container, x: number) {
    g.rect(x - 34, GROUND - 62, 68, 44)
      .fill(0xf2e2bd)
      .stroke(INK)
    g.rect(x - 34, GROUND - 62, 68, 9).fill(0xd8368a)
    g.circle(x - 22, GROUND - 10, 11)
      .circle(x + 22, GROUND - 10, 11)
      .stroke({ color: 0x2a2a2e, width: 3 })
    g.moveTo(x + 34, GROUND - 52)
      .lineTo(x + 52, GROUND - 70)
      .stroke({ color: 0x8a8a90, width: 3 })
    g.rect(x - 1.5, GROUND - 150, 3, 90).fill(0x8a8a90)
    const colours = [0xd8368a, 0xe8c02a, 0x2a9ab0, 0xe8603a, 0x3aa04a, 0xf2e2bd]
    colours.forEach((c, i) => {
      const a0 = Math.PI + (i / colours.length) * Math.PI
      const a1 = Math.PI + ((i + 1) / colours.length) * Math.PI
      g.poly([
        x,
        GROUND - 150,
        x + Math.cos(a0) * 60,
        GROUND - 150 + Math.sin(a0) * 26 + 26,
        x + Math.cos(a1) * 60,
        GROUND - 150 + Math.sin(a1) * 26 + 26,
      ]).fill(c)
    })
    this.text('PALETAS', x, GROUND - 38, 11, 0x2a6a8a, 1)
    // the paletero, and a kid deciding
    g.circle(x + 62, GROUND - 92, 8).fill(palette.ink)
    g.ellipse(x + 62, GROUND - 100, 16, 4).fill(0xc8a86a)
    g.poly([x + 52, GROUND - 84, x + 72, GROUND - 84, x + 74, GROUND, x + 50, GROUND]).fill(
      palette.ink,
    )
    g.circle(x - 58, GROUND - 58, 6.5).fill(palette.ink)
    g.poly([x - 66, GROUND - 52, x - 50, GROUND - 52, x - 49, GROUND, x - 67, GROUND]).fill(
      palette.ink,
    )
    glow(lights, x, GROUND - 60, 0.9, 0.7, 0xffd890, 0.3)
  }

  /**
   * Where the land stops. A lip of sandstone with ice plant growing over it,
   * a rail to keep people off it, and the top of the stairs down to the sand.
   */
  private cliffTop(g: Graphics, rng: Rng) {
    const x0 = CLIFF_EDGE - 14
    const x1 = WORLD.width + 600
    const lip = (x: number) => GROUND - 44 - 9 * Math.sin(x / 83) - 5 * Math.sin(x / 31)
    const pts = [x0, GROUND]
    for (let x = x0; x <= x1; x += 18) pts.push(x, lip(x))
    pts.push(x1, GROUND)
    g.poly(pts).fill(0x5c4630)
    for (const [dy, c] of [
      [14, 0x44321f],
      [26, 0x6e5638],
    ] as const) {
      const band: number[] = []
      for (let x = x0; x <= x1; x += 18) band.push(x, lip(x) + dy + 3 * Math.sin(x / 47))
      g.poly(band, false).stroke({ color: c, width: 3.5, alpha: 0.7 })
    }
    // ice plant, in flower
    for (let x = x0 + 10; x < x1; x += range(rng, 14, 30)) {
      const y = lip(x) + 2
      g.ellipse(x, y, range(rng, 12, 22), range(rng, 5, 9)).fill(
        chance(rng, 0.5) ? 0x2a4a34 : sd.leaf,
      )
      if (chance(rng, 0.6))
        for (let i = 0; i < 3; i++)
          g.circle(x + range(rng, -12, 12), y + range(rng, -5, 3), 2).fill(
            chance(rng, 0.7) ? 0xd84a8a : 0xe8c25a,
          )
    }

    // post-and-rail, with a gap where the stairs go down
    const stairs = { x0: 2050, x1: 2120 }
    const railTop = GROUND - 88
    for (let x = x0 + 40; x < x1; x += 62) {
      if (x > stairs.x0 - 20 && x < stairs.x1 + 20) continue
      g.rect(x - 4.5, railTop - 8, 9, GROUND - railTop + 8).fill(sd.woodLight)
      g.rect(x - 4.5, railTop - 8, 3, GROUND - railTop + 8).fill({ color: 0xffa040, alpha: 0.14 })
    }
    for (const [a, b] of [
      [x0 + 20, stairs.x0],
      [stairs.x1, x1],
    ] as const)
      for (const y of [railTop, railTop + 34]) g.rect(a, y, b - a, 6).fill(0x3e2416)
    // the stairs: two newel posts and the handrails dropping out of sight
    for (const sx of [stairs.x0, stairs.x1]) {
      g.rect(sx - 6, railTop - 20, 12, GROUND - railTop + 20).fill(sd.woodLight)
      g.moveTo(sx, railTop - 8)
        .lineTo(sx + 44, GROUND - 30)
        .stroke({ color: 0x3e2416, width: 6 })
    }
    for (let i = 0; i < 3; i++)
      g.rect(stairs.x0 + 10 + i * 12, GROUND - 26 + i * 8, stairs.x1 - stairs.x0 - 4, 5).fill(
        0x3e2416,
      )
    g.roundRect(stairs.x0 - 86, railTop - 34, 72, 26, 3)
      .fill(0x2a4a34)
      .stroke(INK)
    this.text('BEACH  ↓', MIRROR - (stairs.x0 - 50), railTop - 21, 12, 0xf2e2bd, 1)

    // what the city puts up instead of fixing the cliff
    const wx = 1890
    g.rect(wx - 2, railTop - 62, 4, 70).fill(0x6a6a70)
    g.roundRect(wx - 44, railTop - 70, 88, 44, 3)
      .fill(0xe8c02a)
      .stroke({ color: palette.ink, width: 2 })
    this.text('UNSTABLE\nCLIFFS', MIRROR - wx, railTop - 48, 11, 0x14100c, 1)

    // a bench facing the water, two people on it who aren't going home yet
    const bx = 2190
    g.rect(bx - 62, GROUND - 58, 124, 7).fill(sd.woodLight)
    g.rect(bx - 62, GROUND - 44, 124, 7).fill(sd.woodLight)
    g.rect(bx - 66, GROUND - 30, 132, 8).fill(0x3e2416)
    for (const lx of [bx - 54, bx + 48]) g.rect(lx, GROUND - 60, 6, 60).fill(sd.iron)
    for (const [px, lean] of [
      [bx - 14, 3],
      [bx + 14, -3],
    ] as const) {
      g.poly([
        px - 15,
        GROUND - 30,
        px - 13 + lean,
        GROUND - 84,
        px + 13 + lean,
        GROUND - 84,
        px + 15,
        GROUND - 30,
      ]).fill(palette.ink)
      g.circle(px + lean * 1.6, GROUND - 97, 10).fill(palette.ink)
    }
  }

  private text(text: string, x: number, y: number, size: number, fill: number, spacing: number) {
    const t = new Text({
      text,
      style: {
        fontFamily: SIGN_FONT,
        fontSize: size,
        fill,
        letterSpacing: spacing,
        align: 'center',
        lineHeight: size * 1.15,
      },
      resolution: 2,
    })
    t.anchor.set(0.5)
    t.position.set(x, y)
    this.signs.addChild(t)
  }

  update(time: number, reducedMotion: boolean) {
    for (const n of this.neon)
      n.alpha = Math.sin(time * 41) > 0.985 ? 0.15 : 0.55 + Math.sin(time * 2.2) * 0.04
    if (reducedMotion) return
    this.bulbs.forEach((b, i) => (b.alpha = 0.68 + Math.sin(time * 1.8 + i * 0.9) * 0.12))
    this.tvs.forEach(
      (t, i) => (t.alpha = 0.3 + 0.12 * Math.sin(time * 5 + i * 2) * Math.sin(time * 1.3 + i)),
    )
  }
}
