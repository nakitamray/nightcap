import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { SIGN_FONT } from '../../fonts'
import { glow } from '../../layers/neon'
import { Smoke } from '../../layers/smoke'
import { GROUND, HOUSE } from '../../layout'
import { palette } from '../../palette'
import { chance, createRng, pick, range, type Rng } from '../../rng'
import { glowTexture } from '../../textures'
import { wallLantern } from './house'
import { funnelChimney, INK, lancet, plasterWall, shutters, vn } from './parts'

interface Palazzo {
  x: number
  width: number
  top: number
  base: number
  colour: number
  litChance: number
  arch: 'pointed' | 'round'
}

// Palazzi shoulder to shoulder along the canal, each a different faded colour,
// shutters open and shut, washing strung between windows, a trattoria and a
// glass shop at the water's edge.
export class Neighbors extends Container {
  private smoke: Smoke[] = []
  private lanterns: Sprite[] = []
  private glass: Sprite[] = []

  constructor(seed: number, lights: Container) {
    super()
    const rng = createRng(seed)
    const g = new Graphics()
    this.addChild(g)

    const farLeft: Palazzo = { x: -500, width: 1060, top: 420, base: GROUND - 170, colour: vn.rose, litChance: 0.45, arch: 'round' }
    const left: Palazzo = { x: 560, width: HOUSE.x - 560, top: 330, base: GROUND - 190, colour: vn.ochre, litChance: 0.5, arch: 'pointed' }
    const right: Palazzo = { x: HOUSE.x + HOUSE.width, width: 290, top: 380, base: GROUND - 190, colour: vn.terracotta, litChance: 0.5, arch: 'round' }
    const farRight: Palazzo = { x: right.x + right.width, width: 1100, top: 300, base: GROUND - 190, colour: 0x4e2e22, litChance: 0.4, arch: 'pointed' }
    for (const p of [farLeft, left, right, farRight]) this.palazzo(g, lights, rng, p)

    this.washing(g, left.x + 30, left.top + 210, left.width - 60, rng)
    this.washing(g, farRight.x + 120, farRight.top + 200, 260, rng)
    this.trattoria(g, lights, left.x + 20, left.base + 20, left.width - 40)
    this.glassShop(g, lights, rng, right.x + 24, right.base + 26, right.width - 48)
    this.trattoria(g, lights, 120, farLeft.base + 14, 300)

    for (const [x, y, side] of [
      [left.x + 4, left.base - 30, 1],
      [farRight.x + 6, farRight.base - 30, 1],
    ] as const) {
      this.addChild(wallLantern(x, y, side))
      this.lanterns.push(glow(lights, x + side * 34, y + 26, 1.2, 1.2, 0xffb84a, 0.75))
    }

    this.smoke = [
      new Smoke(seed + 1, { x: 640, y: left.top - 110 }, { tint: 0x9a8a80, strength: 0.3, rise: 170, count: 16 }),
      new Smoke(seed + 2, { x: 1700, y: right.top - 110 }, { tint: 0x9a8a80, strength: 0.3, rise: 170, count: 16 }),
    ]
    for (const s of this.smoke) this.addChildAt(s, 0)
  }

  private palazzo(g: Graphics, lights: Container, rng: Rng, p: Palazzo) {
    const { x, width: w, top, base } = p
    for (let cx = x + 50; cx < x + w - 30; cx += range(rng, 120, 240)) funnelChimney(g, cx, top - 6, pick(rng, [vn.terracotta, vn.ochre, vn.rose]))
    g.poly([x - 16, top, x + w + 16, top, x + w + 4, top - 22, x - 4, top - 22]).fill(vn.tile)
    plasterWall(g, x, top, w, GROUND - top, p.colour, rng)
    g.rect(x - 16, top, w + 32, 8).fill(0x2a120c)

    const bay = 96
    const cols = Math.max(1, Math.floor(w / bay))
    const off = x + (w - cols * bay) / 2
    const floorH = 150
    const floors = Math.floor((base - top - 30) / floorH)
    const ww = 40
    const wh = 92
    for (let f = 0; f < floors; f++) {
      const wy = top + 40 + f * floorH
      g.rect(x, wy + wh + 18, w, 4).fill({ color: vn.istria, alpha: 0.6 })
      for (let c = 0; c < cols; c++) {
        const wx = off + c * bay + (bay - ww) / 2
        const lit = chance(rng, p.litChance)
        const closed = !lit && chance(rng, 0.5)
        if (!closed) shutters(g, wx, wy + 4, ww, wh - 4)
        this.opening(g, wx - 6, wy - 6, ww + 12, wh + 10, p.arch).fill(vn.istria)
        const glass = this.opening(g, wx, wy, ww, wh, p.arch)
        if (closed) {
          // shutters pulled to
          glass.fill(vn.shutter)
          g.rect(wx + ww / 2 - 0.75, wy + 10, 1.5, wh - 10).fill(palette.ink)
          for (let ly = wy + 14; ly < wy + wh - 4; ly += 6) g.rect(wx + 3, ly, ww - 6, 1.5).fill({ color: palette.ink, alpha: 0.45 })
        } else if (lit) {
          glass.fill(pick(rng, [0xf07a32, 0xffa040, 0xe0461f, 0xc0301a]))
          glow(lights, wx + ww / 2, wy + wh / 2, (ww * 3) / 256, (wh * 2) / 256, palette.amberDeep, 0.32)
        } else {
          glass.fill(0x0c0806)
        }
        g.rect(wx + ww / 2 - 1, wy + 14, 2, wh - 14).fill({ color: palette.ink, alpha: 0.8 })
        g.rect(wx - 8, wy + wh + 4, ww + 16, 5).fill(vn.istria)
      }
    }
    g.rect(x, base, w, GROUND - base).fill({ color: palette.ink, alpha: 0.3 })
    g.rect(x, GROUND - 26, w, 26).fill(vn.istriaDark)
  }

  private opening(g: Graphics, x: number, y: number, w: number, h: number, arch: 'pointed' | 'round') {
    if (arch === 'pointed') return lancet(g, x, y, w, h)
    return g.moveTo(x, y + h).lineTo(x, y + w / 2).arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0).lineTo(x + w, y + h).closePath()
  }

  /** a line of washing between two windows */
  private washing(g: Graphics, x: number, y: number, w: number, rng: Rng) {
    g.moveTo(x, y).quadraticCurveTo(x + w / 2, y + 26, x + w, y).stroke({ color: 0x1a1210, width: 1.5 })
    for (let t = 0.08; t < 0.95; t += range(rng, 0.08, 0.14)) {
      const px = x + w * t
      const py = y + 26 * 2 * t * (1 - t) * 2
      const colour = pick(rng, [0xd8c8b0, 0xb02418, 0xd9a54a, 0x6a8aa0, 0xe8e0d0])
      const kind = rng()
      if (kind < 0.4) g.rect(px - 9, py, 18, 26).fill({ color: colour, alpha: 0.75 })
      else if (kind < 0.7) g.poly([px - 12, py, px + 12, py, px + 9, py + 22, px - 9, py + 22]).fill({ color: colour, alpha: 0.75 })
      else g.rect(px - 5, py, 10, 30).fill({ color: colour, alpha: 0.75 })
    }
  }

  private trattoria(g: Graphics, lights: Container, x: number, y: number, w: number) {
    const h = GROUND - y - 26
    g.rect(x, y, w, h).fill(0x2a0e08)
    g.rect(x + 8, y + 30, w - 16, h - 36).fill(0xd8702a)
    g.rect(x + 8, y + 30, w - 16, (h - 36) * 0.4).fill({ color: 0xffb050, alpha: 0.5 })
    // checked tablecloths and someone at every table
    for (let tx = x + 30; tx < x + w - 30; tx += 70) {
      g.rect(tx - 20, y + h - 40, 40, 10).fill(0xc0301e)
      for (let k = 0; k < 4; k++) g.rect(tx - 20 + k * 10, y + h - 40, 5, 5).fill(0xf0e0c8)
      g.circle(tx - 26, y + h - 60, 7).fill(palette.ink)
      g.rect(tx - 31, y + h - 54, 10, 24).fill(palette.ink)
    }
    for (let px = x + 8; px < x + w - 8; px += 60) g.rect(px, y + 30, 3, h - 36).fill(0x2a0e08)
    // green awning with the name on the valance
    g.poly([x - 8, y, x + w + 8, y, x + w + 16, y + 26, x - 16, y + 26]).fill(0x1e4a30).stroke(INK)
    const t = new Text({ text: 'TRATTORIA', style: { fontFamily: SIGN_FONT, fontSize: 13, fill: 0xf2e2bd, letterSpacing: 3 }, resolution: 2 })
    t.anchor.set(0.5)
    t.position.set(x + w / 2, y + 14)
    this.addChild(t)
    glow(lights, x + w / 2, y + h / 2 + 10, (w * 2) / 256, 1.2, palette.amber, 0.45)
  }

  /** murano glass glowing in every colour on glass shelves */
  private glassShop(g: Graphics, lights: Container, rng: Rng, x: number, y: number, w: number) {
    const h = GROUND - y - 26
    g.moveTo(x - 10, y + h).lineTo(x - 10, y + 30).arc(x + w / 2, y + 30, w / 2 + 10, Math.PI, 0).lineTo(x + w + 10, y + h).closePath().fill(vn.istria)
    g.moveTo(x, y + h).lineTo(x, y + 30).arc(x + w / 2, y + 30, w / 2, Math.PI, 0).lineTo(x + w, y + h).closePath().fill(0x1a0a08)
    for (let s = 0; s < 3; s++) {
      const sy = y + 50 + s * 34
      g.rect(x + 8, sy + 22, w - 16, 2).fill({ color: 0xffe0b0, alpha: 0.5 })
      for (let vx = x + 18; vx < x + w - 14; vx += range(rng, 18, 26)) {
        const colour = pick(rng, [0xff3b2a, 0xffb03a, 0x3a8aff, 0x2ad08a, 0xff6ad0, 0xffe04a])
        const vh = range(rng, 12, 22)
        g.ellipse(vx, sy + 22 - vh / 2, 5, vh / 2).fill(colour)
        const s2 = new Sprite(glowTexture())
        s2.anchor.set(0.5)
        s2.position.set(vx, sy + 22 - vh / 2)
        s2.scale.set(0.12)
        s2.tint = colour
        s2.alpha = 0.5
        s2.blendMode = 'add'
        lights.addChild(s2)
        this.glass.push(s2)
      }
    }
    const t = new Text({ text: 'VETRI', style: { fontFamily: SIGN_FONT, fontSize: 13, fill: palette.gold, letterSpacing: 3 }, resolution: 2 })
    t.anchor.set(0.5)
    t.position.set(x + w / 2, y + 16)
    this.addChild(t)
  }

  update(time: number, dt: number) {
    for (const s of this.smoke) s.update(time, dt)
    this.lanterns.forEach((l, i) => (l.alpha = 0.72 + Math.sin(time * 5 + i * 3) * 0.03))
    this.glass.forEach((s, i) => (s.alpha = 0.45 + Math.sin(time * 0.8 + i) * 0.08))
  }
}

