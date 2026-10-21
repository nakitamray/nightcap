import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { SIGN_FONT } from '../../fonts'
import { glow } from '../../layers/neon'
import { GROUND, HOUSE } from '../../layout'
import { palette } from '../../palette'
import { chance, createRng, pick, range, type Rng } from '../../rng'
import { acUnit, chochin, INK, sittingCat, strokePanel, tk } from './parts'

const BAR_NAMES = ['BAR', 'SNACK', 'JAZZ', 'KISSA', 'BAR NOIR', 'MOON', 'TORI', 'SAKE']
const NEON = [0xff3a2a, 0xff8a2a, 0xff4a8a, 0xffc040]
// office and flat windows: mostly strip lights and tvs, a few warm lamps
const COOL = [0xe8f0ff, 0xd8ecff, 0xa8e0f0, 0x5ac8c0, 0x8ab0ff, 0xc8f0e0, 0xf0e0b0, 0xffb060]
const SIGNS = [0xfff4d0, 0xffd040, 0xe0402a, 0x3a8ae0, 0xffffff, 0xff6aa0, 0x40c070]
// what the screens cycle through
const ADS = [0xff3a6a, 0x3ad0ff, 0xffd040, 0x8a4aff, 0x40e08a, 0xff8a2a, 0xffffff]
/** where Tokyo Tower stands in the skyline -- keep buildings low in front of it */
const TOWER = { x: 1960 }

interface Flicker {
  glow: Sprite
  phase: number
}

// Tokyo at its most crammed: mid-rise blocks stacked behind every inch of
// street, strip-lit windows and signboards to the sky; at street level a
// konbini, a clothes shop, a wall of tvs, vending machines and little bars
// with lanterns, and cats.
export class Neighbors extends Container {
  private flickers: Flicker[] = []
  private tails: Graphics[] = []
  private screens: { g: Graphics; phase: number; speed: number }[] = []

  constructor(seed: number, lights: Container) {
    super()
    const rng = createRng(seed)
    const g = new Graphics()
    this.addChild(g)

    // behind the street: mid-rise blocks crammed together, every floor lit,
    // signboards stacked up their sides. kept low round the tower so it shows.
    let mx = -520
    while (mx < 2900) {
      const w = range(rng, 120, 210)
      const nearTower = mx + w > TOWER.x - 130 && mx < TOWER.x + 130
      const top = nearTower ? range(rng, 470, 540) : range(rng, 60, 300)
      this.midrise(g, lights, rng, mx, w, top)
      mx += w
    }

    // street level: bars further out, shops near the house
    this.row(g, lights, rng, -500, 500)
    this.konbini(g, lights, rng, 500, HOUSE.x - 500)
    this.vending(g, lights, HOUSE.x + HOUSE.width + 30)
    this.clothes(g, lights, rng, HOUSE.x + HOUSE.width + 180, 250)
    this.electronics(g, lights, rng, HOUSE.x + HOUSE.width + 430, 230)
    this.row(g, lights, rng, HOUSE.x + HOUSE.width + 660, 2900)

    const cats = new Graphics()
    this.addChild(cats)
    // one up on the vending machines, one on the step of a bar
    this.tails.push(sittingCat(cats, HOUSE.x + HOUSE.width + 76, GROUND - 120, 0.8))
    this.tails.push(sittingCat(cats, 740, GROUND, 0.75))
    this.addChild(...this.tails)
  }

  /** fill [x0, x1) with little bar buildings of random widths and heights */
  private row(g: Graphics, lights: Container, rng: Rng, x0: number, x1: number) {
    let x = x0
    while (x < x1) {
      const w = Math.min(range(rng, 110, 190), x1 - x)
      if (w < 60) break
      this.bar(g, lights, rng, x, w, Math.floor(range(rng, 2, 4)))
      x += w
    }
  }

  private bar(g: Graphics, lights: Container, rng: Rng, x: number, w: number, storeys: number) {
    const storeyH = 150
    const top = GROUND - storeys * storeyH - 20
    const wood = pick(rng, [tk.wood, 0x2e1a10, 0x1e120c, 0x2a1e18])
    g.rect(x, top, w, GROUND - top).fill(wood)
    // boards
    for (let by = top; by < GROUND; by += 9) g.rect(x, by, w, 1).fill({ color: palette.ink, alpha: 0.3 })
    // roof: curved tiles on some, a flat parapet on others
    if (chance(rng, 0.5)) {
      g.moveTo(x - 14, top).quadraticCurveTo(x + w / 2, top - 8, x + w + 14, top).lineTo(x + w + 4, top - 26).lineTo(x - 4, top - 26).closePath().fill(0x1e1e26)
      for (let tx = x - 8; tx < x + w + 8; tx += 9) g.rect(tx, top - 24, 5, 22).fill({ color: 0x2e2e38, alpha: 0.8 })
    } else {
      g.rect(x - 4, top - 10, w + 8, 10).fill(0x2a2a2e)
    }
    // upstairs windows, some lit with shoji glow
    for (let s = 1; s < storeys; s++) {
      const wy = top + 30 + (s - 1) * storeyH
      const ww = w * 0.55
      const wx = x + (w - ww) / 2
      g.rect(wx - 5, wy - 5, ww + 10, 80).fill(0x3a2a20)
      if (chance(rng, 0.65)) {
        g.rect(wx, wy, ww, 70).fill(pick(rng, [0xf0a050, 0xe8703a, 0xd84a2a]))
        for (let lx = wx + ww / 4; lx < wx + ww; lx += ww / 4) g.rect(lx, wy, 1.5, 70).fill({ color: palette.ink, alpha: 0.5 })
        for (let ly = wy + 17; ly < wy + 70; ly += 17) g.rect(wx, ly, ww, 1.5).fill({ color: palette.ink, alpha: 0.5 })
        glow(lights, wx + ww / 2, wy + 35, (ww * 2.6) / 256, 0.8, palette.amberDeep, 0.35)
      } else {
        g.rect(wx, wy, ww, 70).fill(0x0c0806)
      }
      // an outside iron stair on some
      if (s === 1 && chance(rng, 0.3)) {
        g.moveTo(x + 6, GROUND).lineTo(x + w * 0.4, wy + 76).stroke({ color: 0x3a3a40, width: 3 })
        for (let t = 0.1; t < 1; t += 0.1) g.rect(x + 6 + (w * 0.4 - 6) * t - 8, GROUND - (GROUND - wy - 76) * t, 16, 2).fill(0x3a3a40)
      }
    }
    // the bar at street level: door, lantern, a tiny sign
    const dy = GROUND - 130
    g.rect(x + 10, dy, w - 20, 130).fill(0x120806)
    g.rect(x + 18, dy + 14, w - 36, 116).fill(pick(rng, [0xd8702a, 0xc0501e, 0xe08a3a]))
    g.rect(x + w / 2 - 1, dy + 14, 2, 116).fill(palette.ink)
    if (chance(rng, 0.6)) {
      const lanterns = new Graphics()
      chochin(lanterns, x + w - 26, dy - 30, 0.8, chance(rng, 0.8) ? tk.red : 0xf2e2bd)
      this.addChild(lanterns)
      glow(lights, x + w - 26, dy - 8, 0.45, 0.55, 0xff5a2a, 0.6)
    }
    const name = new Text({ text: pick(rng, BAR_NAMES), style: { fontFamily: SIGN_FONT, fontSize: 12, fill: 0xfff0d0, letterSpacing: 1 }, resolution: 2 })
    name.anchor.set(0.5)
    g.rect(x + w / 2 - 30, dy - 22, 60, 18).fill(0x2a0806).stroke(INK)
    name.position.set(x + w / 2, dy - 13)
    this.addChild(name)
    glow(lights, x + w / 2, dy + 70, (w * 1.6) / 256, 1, palette.amber, 0.4)

    // vertical neon panel down the front of the taller ones
    if (storeys > 2 && chance(rng, 0.7)) {
      const colour = pick(rng, NEON)
      strokePanel(g, x + w - 30, top + 30, 22, Math.min(220, (storeys - 1) * storeyH - 60), colour, rng)
      const s = glow(lights, x + w - 19, top + 140, 0.5, 1.8, colour, 0.5)
      this.flickers.push({ glow: s, phase: rng() * 20 })
    }
  }

  /** a narrow concrete block, eight to fourteen floors, lit mostly by strip lights */
  private midrise(g: Graphics, lights: Container, rng: Rng, x: number, w: number, top: number) {
    const body = pick(rng, [0x2a2a30, 0x34302c, 0x2e3438, 0x3a3028, 0x26282e])
    g.rect(x, top, w, GROUND - top).fill(body)
    g.rect(x, top, w, GROUND - top).stroke({ color: palette.ink, width: 1.5, alpha: 0.5 })
    const floorH = 58
    const cols = Math.max(2, Math.floor((w - 16) / 34))
    const ww = (w - 16) / cols - 8
    const signSide = chance(rng, 0.6) ? (chance(rng, 0.5) ? 'left' : 'right') : null
    for (let fy = top + 14; fy < GROUND - 160; fy += floorH) {
      g.rect(x, fy + 44, w, 3).fill({ color: palette.ink, alpha: 0.35 })
      for (let c = 0; c < cols; c++) {
        const wx = x + 8 + c * (ww + 8)
        if (chance(rng, 0.64)) {
          const colour = pick(rng, COOL)
          g.rect(wx, fy, ww, 36).fill({ color: colour, alpha: range(rng, 0.62, 0.9) })
          // blinds, half drawn
          if (chance(rng, 0.4)) for (let by = fy + 3; by < fy + 18; by += 4) g.rect(wx, by, ww, 1.5).fill({ color: palette.ink, alpha: 0.35 })
          if (chance(rng, 0.25)) glow(lights, wx + ww / 2, fy + 18, (ww * 2.4) / 256, 0.35, colour, 0.3)
        } else {
          g.rect(wx, fy, ww, 36).fill(0x0a0a0e)
        }
      }
      if (chance(rng, 0.3)) acUnit(g, x + range(rng, 4, w - 50), fy + 40)
    }
    // the ladder of signboards down one side, one per floor
    if (signSide) {
      const sx = signSide === 'left' ? x - 6 : x + w - 30
      for (let fy = top + 20; fy < GROUND - 200; fy += 36) {
        const colour = pick(rng, SIGNS)
        g.rect(sx, fy, 36, 30).fill(colour).stroke({ color: palette.ink, width: 1.5 })
        for (let l = 0; l < 2; l++) g.rect(sx + 6, fy + 8 + l * 9, range(rng, 12, 24), 3).fill({ color: palette.ink, alpha: 0.6 })
        if (chance(rng, 0.35)) glow(lights, sx + 18, fy + 15, 0.3, 0.26, colour, 0.35)
      }
    }
    // something on the roof: a billboard or a water tank
    if (chance(rng, 0.45)) {
      const colour = pick(rng, SIGNS)
      g.rect(x + 8, top - 46, w - 16, 38).fill(colour).stroke({ color: palette.ink, width: 2 })
      g.rect(x + 14, top - 8, 3, 8).rect(x + w - 17, top - 8, 3, 8).fill(palette.ink)
      for (let l = 0; l < 2; l++) g.rect(x + 18, top - 38 + l * 14, range(rng, w * 0.3, w * 0.6), 5).fill({ color: palette.ink, alpha: 0.5 })
      glow(lights, x + w / 2, top - 27, (w * 1.4) / 256, 0.5, colour, 0.35)
    } else {
      g.rect(x + w / 2 - 18, top - 34, 36, 26).fill(0x4a4a50)
      g.rect(x + w / 2 - 14, top - 8, 3, 8).rect(x + w / 2 + 11, top - 8, 3, 8).fill(0x4a4a50)
    }
  }

  /** a screen that cycles through adverts -- just colour, at this distance */
  private screen(g: Graphics, x: number, y: number, w: number, h: number, rng: Rng) {
    const s = new Graphics().rect(x, y, w, h).fill(0xffffff)
    // a scan of 'content': a few bars across it
    s.rect(x + 4, y + h * 0.6, w * 0.6, 3).rect(x + 4, y + h * 0.75, w * 0.4, 3).fill({ color: 0x000000, alpha: 0.3 })
    g.rect(x - 3, y - 3, w + 6, h + 6).fill(0x111114)
    this.addChild(s)
    this.screens.push({ g: s, phase: rng() * 10, speed: range(rng, 0.4, 1.2) })
  }

  /** the convenience store: blazing white, shelves of colour, someone at the till */
  private konbini(g: Graphics, lights: Container, rng: Rng, x: number, w: number) {
    const top = GROUND - 300
    g.rect(x, top, w, GROUND - top).fill(0x3a3a3e)
    // upstairs offices, strip-lit
    for (let c = 0; c < 4; c++) g.rect(x + 14 + c * ((w - 28) / 4), top + 20, (w - 28) / 4 - 10, 60).fill(0xe8f0ff)
    glow(lights, x + w / 2, top + 50, (w * 1.6) / 256, 0.6, 0xe8f0ff, 0.3)
    // the stripes and the name
    const sy = top + 100
    g.rect(x, sy, w, 40).fill(0xf6f6f2)
    g.rect(x, sy + 6, w, 7).fill(0x2aa04a)
    g.rect(x, sy + 16, w, 7).fill(0x2a6ac0)
    const name = new Text({ text: '24 MART', style: { fontFamily: SIGN_FONT, fontSize: 15, fill: 0x1a2a4a, letterSpacing: 2 }, resolution: 2 })
    name.anchor.set(0.5)
    name.position.set(x + w - 70, sy + 31)
    this.addChild(name)
    // the window: shelves rammed with stuff, magazines up front
    const wy = sy + 44
    const wh = GROUND - wy - 6
    g.rect(x + 8, wy, w - 16, wh).fill(0xf4f8ff)
    for (let r = 0; r < 4; r++) {
      const ry = wy + 18 + r * 26
      g.rect(x + 14, ry + 16, w - 110, 2).fill(0x8a8a90)
      for (let px = x + 16; px < x + w - 100; px += range(rng, 4, 7)) {
        g.rect(px, ry + 4, 3.5, 12).fill(pick(rng, [0xe0402a, 0xf0c020, 0x2a7ae0, 0x2aa04a, 0xff7ab0, 0xf08a2a, 0x1a1a1a]))
      }
    }
    // till and the clerk, a customer at the magazines
    g.rect(x + w - 90, wy + wh - 40, 70, 40).fill(0xb8b8c0)
    g.circle(x + w - 56, wy + wh - 58, 7).fill(palette.ink)
    g.rect(x + w - 64, wy + wh - 52, 16, 14).fill(0x2a6ac0)
    g.circle(x + 40, wy + wh - 74, 7).fill(palette.ink)
    g.poly([x + 32, wy + wh - 66, x + 48, wy + wh - 66, x + 50, wy + wh, x + 30, wy + wh]).fill(palette.ink)
    for (let m = 0; m < 6; m++) g.rect(x + 14 + m * 12, wy + wh - 30, 10, 14).fill(pick(rng, [0xe0402a, 0xf0c020, 0x2a7ae0, 0xffffff]))
    for (let px = x + 8; px < x + w - 8; px += (w - 16) / 4) g.rect(px, wy, 3, wh).fill(0x6a6a70)
    this.screen(g, x + 70, wy + 4, 46, 28, rng)
    this.screen(g, x + 140, wy + 4, 46, 28, rng)
    glow(lights, x + w / 2, wy + wh / 2, (w * 2.2) / 256, (wh * 2.4) / 256, 0xf0f6ff, 0.6)
  }

  /** a clothes shop with the big red square sign, mannequins in the window */
  private clothes(g: Graphics, lights: Container, rng: Rng, x: number, w: number) {
    const top = GROUND - 340
    g.rect(x, top, w, GROUND - top).fill(0xd8d8d4)
    g.rect(x, top, w, GROUND - top).stroke({ color: palette.ink, width: 1.5, alpha: 0.6 })
    // the sign
    g.rect(x + 14, top + 14, 90, 90).fill(0xd8141a)
    const txt = new Text({ text: 'WEAR', style: { fontFamily: SIGN_FONT, fontSize: 24, fill: 0xffffff, letterSpacing: 1 }, resolution: 2 })
    txt.anchor.set(0.5)
    txt.position.set(x + 59, top + 59)
    this.addChild(txt)
    glow(lights, x + 59, top + 59, 0.9, 0.9, 0xff3a2a, 0.45)
    this.screen(g, x + 120, top + 20, w - 136, 76, rng)
    // floor-to-ceiling glass, mannequins in this season's colours
    const wy = top + 120
    const wh = GROUND - wy - 6
    g.rect(x + 8, wy, w - 16, wh).fill(0xfaf6ee)
    for (let m = 0; m < 4; m++) {
      const mx = x + 34 + m * ((w - 60) / 3)
      const colour = pick(rng, [0xe0402a, 0x2a4ab0, 0xf0c020, 0x1a1a1a, 0xf6a0c0, 0x3a8a5a])
      g.circle(mx, wy + 40, 8).fill(0xd8c8b0)
      g.poly([mx - 12, wy + 50, mx + 12, wy + 50, mx + 16, wy + 120, mx - 16, wy + 120]).fill(colour)
      g.rect(mx - 1.5, wy + 120, 3, wh - 120).fill(0x8a8a8a)
    }
    // shoppers inside
    for (let p = 0; p < 3; p++) {
      const px = x + range(rng, 30, w - 30)
      g.circle(px, wy + wh - 70, 6).fill(palette.ink)
      g.rect(px - 7, wy + wh - 64, 14, 64).fill(palette.ink)
    }
    glow(lights, x + w / 2, wy + wh / 2, (w * 2.2) / 256, (wh * 2.4) / 256, 0xfff6e8, 0.6)
  }

  /** electronics shop: a whole wall of tvs, all on different channels */
  private electronics(g: Graphics, lights: Container, rng: Rng, x: number, w: number) {
    const top = GROUND - 320
    g.rect(x, top, w, GROUND - top).fill(0x1a1a20)
    const sign = new Text({ text: 'ELECTRIC', style: { fontFamily: SIGN_FONT, fontSize: 22, fill: 0xff4ad0, letterSpacing: 3 }, resolution: 2 })
    sign.anchor.set(0.5)
    sign.position.set(x + w / 2, top + 26)
    this.addChild(sign)
    glow(lights, x + w / 2, top + 26, (w * 1.4) / 256, 0.4, 0xff4ad0, 0.5)
    const cols = 4
    const rows = 5
    const tw = (w - 30) / cols - 6
    const th = 34
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) this.screen(g, x + 15 + c * (tw + 6), top + 54 + r * (th + 8), tw, th, rng)
    }
    // people stopped to watch
    for (let p = 0; p < 2; p++) {
      const px = x + 40 + p * 70
      g.circle(px, GROUND - 76, 7).fill(palette.ink)
      g.poly([px - 8, GROUND - 68, px + 8, GROUND - 68, px + 9, GROUND, px - 9, GROUND]).fill(palette.ink)
    }
    glow(lights, x + w / 2, top + 160, (w * 2) / 256, 1.6, 0x8ab0ff, 0.4)
  }

  /** three vending machines in a row, lit up like fridges */
  private vending(g: Graphics, lights: Container, x: number) {
    const colours = [0xc8261a, 0xe8e0d0, 0x1a4a8a]
    colours.forEach((c, i) => {
      const vx = x + i * 46
      const top = GROUND - 120
      g.rect(vx, top, 44, 120).fill(c)
      g.rect(vx + 4, top + 6, 36, 56).fill(0xfff4dc)
      for (let r = 0; r < 3; r++) {
        for (let k = 0; k < 4; k++) g.roundRect(vx + 7 + k * 8, top + 10 + r * 17, 6, 13, 2).fill(pick(createRng(i * 10 + r * 4 + k), [0xc8261a, 0xf0a030, 0x2a7a3a, 0x3a5aa0, 0xe8e0d0]))
      }
      g.rect(vx + 6, top + 70, 32, 6).fill(0x2a2a2e)
      g.rect(vx + 10, top + 92, 24, 14).fill(0x1a1a1e)
      glow(lights, vx + 22, top + 40, 0.5, 0.8, 0xfff0d0, 0.45)
    })
  }

  update(time: number, reducedMotion: boolean) {
    for (const sc of this.screens) {
      const t = reducedMotion ? sc.phase : time * sc.speed + sc.phase
      sc.g.tint = ADS[Math.floor(t) % ADS.length]!
      sc.g.alpha = 0.85 + Math.sin(time * 9 + sc.phase) * 0.05
    }
    for (const f of this.flickers) f.glow.alpha = Math.sin(time * 37 + f.phase) > 0.97 ? 0.15 : 0.48 + Math.sin(time * 2 + f.phase) * 0.04
    if (!reducedMotion) this.tails.forEach((t, i) => (t.rotation = Math.sin(time * 1.4 + i * 2) * 0.3))
  }
}
