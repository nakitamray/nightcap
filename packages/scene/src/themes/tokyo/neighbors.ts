import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { SIGN_FONT } from '../../fonts'
import { glow } from '../../layers/neon'
import { GROUND, HOUSE } from '../../layout'
import { palette } from '../../palette'
import { chance, createRng, pick, range, type Rng } from '../../rng'
import { chochin, INK, sittingCat, strokePanel, tk } from './parts'

const BAR_NAMES = ['BAR', 'SNACK', 'JAZZ', 'KISSA', 'BAR NOIR', 'MOON', 'TORI', 'SAKE']
const NEON = [0xff3a2a, 0xff8a2a, 0xff4a8a, 0xffc040]

interface Flicker {
  glow: Sprite
  phase: number
}

// Golden Gai: two- and three-storey wooden bars packed tight, a lantern at
// every door, neon panels down the fronts, a bank of vending machines, cats.
export class Neighbors extends Container {
  private flickers: Flicker[] = []
  private tails: Graphics[] = []

  constructor(seed: number, lights: Container) {
    super()
    const rng = createRng(seed)
    const g = new Graphics()
    this.addChild(g)

    // left of the house, and right, as rows of narrow bars
    this.row(g, lights, rng, -500, HOUSE.x)
    this.row(g, lights, rng, HOUSE.x + HOUSE.width, 2900)
    this.vending(g, lights, HOUSE.x + HOUSE.width + 30)

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
    for (const f of this.flickers) f.glow.alpha = Math.sin(time * 37 + f.phase) > 0.97 ? 0.15 : 0.48 + Math.sin(time * 2 + f.phase) * 0.04
    if (!reducedMotion) this.tails.forEach((t, i) => (t.rotation = Math.sin(time * 1.4 + i * 2) * 0.3))
  }
}
