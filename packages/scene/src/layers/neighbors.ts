import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { DISPLAY_FONT } from '../fonts'
import { GROUND, HOUSE } from '../layout'
import { palette } from '../palette'
import { chance, createRng, pick, range, type Rng } from '../rng'
import { dotTexture, glowTexture, puffTexture } from '../textures'
import { ironRail } from './ironwork'

interface Puff {
  s: Sprite
  age: number
  life: number
  drift: number
}

interface Lantern {
  glow: Sprite
  phase: number
}

interface Block {
  x: number
  width: number
  /** cornice line; the mansard sits above it */
  top: number
  tone: number
  bay: number
  litChance: number
  /** where the ground floor starts -- shops etc. go below this */
  base: number
}

type LitRect = { x: number; y: number; w: number; h: number }

const FLOOR = 150
const INK = { color: palette.ink, width: 1.5, alpha: 0.6 }

// The buildings either side of ours. Darker and quieter than the house on
// purpose -- they're the set, not the actors.
export class Neighbors extends Container {
  private puffs: Puff[] = []
  private lanterns: Lantern[] = []
  private chimney = { x: 640, y: 214 }
  private signGlow: Sprite
  private signText: Text
  private rng: Rng

  constructor(seed: number, lights: Container) {
    super()
    const rng = (this.rng = createRng(seed))
    const g = new Graphics()
    this.addChild(g)
    const lit: LitRect[] = []

    // far left: the café building
    const cafe: Block = { x: -500, width: 1060, top: 470, tone: 0x34251e, bay: 96, litChance: 0.5, base: GROUND - 170 }
    lit.push(...this.block(g, rng, cafe))

    // left neighbour
    const left: Block = { x: 560, width: HOUSE.x - 560, top: 300, tone: palette.neighbor, bay: 90, litChance: 0.5, base: GROUND - 200 }
    lit.push(...this.block(g, rng, left))
    this.plainGround(g, left)

    // right neighbour, with the club downstairs
    const right: Block = { x: HOUSE.x + HOUSE.width, width: 290, top: 420, tone: 0x2f211b, bay: 96, litChance: 0.5, base: GROUND - 200 }
    lit.push(...this.block(g, rng, right))
    this.clubFront(g, lights, right.x + 26, GROUND - 190, right.width - 52)

    // far right: a big block running off the edge of the world
    const far: Block = { x: right.x + right.width, width: 1100, top: 400, tone: palette.neighborDark, bay: 92, litChance: 0.5, base: GROUND - 200 }
    lit.push(...this.block(g, rng, far))
    this.plainGround(g, far)

    for (const r of lit) {
      const glow = new Sprite(glowTexture())
      glow.anchor.set(0.5)
      glow.position.set(r.x + r.w / 2, r.y + r.h / 2)
      glow.scale.set((r.w * 3) / 256, (r.h * 2) / 256)
      glow.tint = palette.amberDeep
      glow.alpha = 0.32
      glow.blendMode = 'add'
      lights.addChild(glow)
    }

    // the café terrace goes over the café block's ground floor
    this.cafeTerrace(g, lights, rng, 130, GROUND - 170, 310)

    // blade sign hanging off the club
    const sx = right.x + 30
    const sy = 520
    const board = new Graphics()
      .rect(sx - 26, sy - 10, 6, 10)
      .rect(sx - 26, sy - 14, 60, 5)
      .fill(palette.ink)
      .roundRect(sx, sy, 52, 196, 6)
      .fill(palette.ink)
      .roundRect(sx + 4, sy + 4, 44, 188, 4)
      .stroke({ color: palette.burnt, width: 2 })
    this.signText = new Text({
      text: 'J\nA\nZ\nZ',
      style: { fontFamily: DISPLAY_FONT, fontSize: 40, lineHeight: 44, align: 'center', fill: 0xff7b45 },
      resolution: 2,
    })
    this.signText.anchor.set(0.5)
    this.signText.position.set(sx + 26, sy + 98)
    this.signGlow = new Sprite(glowTexture())
    this.signGlow.anchor.set(0.5)
    this.signGlow.position.set(sx + 26, sy + 98)
    this.signGlow.scale.set(1.6, 2.4)
    this.signGlow.tint = 0xff5a2a
    this.signGlow.blendMode = 'add'
    this.signGlow.alpha = 0.45
    lights.addChild(this.signGlow)
    this.addChild(board, this.signText)

    for (let i = 0; i < 22; i++) this.spawnPuff(rng() * 6)
  }

  /** a generic Haussmann block: mansard, stone, rows of tall windows, a balcony or two */
  private block(g: Graphics, rng: Rng, b: Block) {
    const { x, width: w, top, tone, bay } = b
    const lit: LitRect[] = []

    // roof
    const roofH = 70
    g.poly([x - 4, top, x + w + 4, top, x + w - 18, top - roofH, x + 18, top - roofH]).fill(palette.neighborRoof)
    for (let cx = x + 30; cx < x + w - 40; cx += range(rng, 90, 180)) {
      g.rect(cx, top - roofH - 34, 30, 40).fill(tone)
      for (let p = 0; p < 3; p++) g.rect(cx + 2 + p * 9, top - roofH - 34 - range(rng, 8, 16), 7, 16).fill(palette.terracotta)
    }
    const cols = Math.max(1, Math.floor(w / bay))
    const off = x + (w - cols * bay) / 2
    for (let c = 0; c < cols; c++) {
      const cx = off + c * bay + bay / 2
      g.rect(cx - 14, top - roofH + 18, 28, roofH - 18).fill(tone)
      g.moveTo(cx - 18, top - roofH + 20).arc(cx, top - roofH + 20, 18, Math.PI, 0).fill(tone)
      const on = chance(rng, b.litChance * 0.6)
      g.rect(cx - 8, top - roofH + 18, 16, 30).fill(on ? palette.amberDeep : palette.ink)
      if (on) lit.push({ x: cx - 8, y: top - roofH + 18, w: 16, h: 30 })
    }

    // body
    g.rect(x, top, w, GROUND - top).fill(tone)
    for (let jy = top + 22; jy < b.base; jy += 22) g.rect(x, jy, w, 1.2).fill({ color: palette.ink, alpha: 0.18 })
    g.rect(x - 10, top - 4, w + 20, 14).fill(0x45302a).stroke(INK)

    // floors of tall windows
    const floors = Math.floor((b.base - top - 30) / FLOOR)
    for (let f = 0; f < floors; f++) {
      const wy = top + 40 + f * FLOOR
      const ww = bay * 0.42
      const wh = FLOOR * 0.66
      for (let c = 0; c < cols; c++) {
        const wx = off + c * bay + (bay - ww) / 2
        g.rect(wx - 6, wy - 6, ww + 12, wh + 10).fill(0x45302a).stroke(INK)
        if (chance(rng, b.litChance)) {
          g.rect(wx, wy, ww, wh).fill({ color: pick(rng, [0xf07a32, 0xffa040, 0xe0461f, 0xc0301a]), alpha: range(rng, 0.8, 1) })
          // half-drawn sheers
          g.rect(wx, wy, ww * 0.3, wh).rect(wx + ww * 0.7, wy, ww * 0.3, wh).fill({ color: 0xffd0a0, alpha: 0.25 })
          lit.push({ x: wx, y: wy, w: ww, h: wh })
        } else {
          g.rect(wx, wy, ww, wh).fill(0x0c0806)
        }
        g.rect(wx + ww / 2 - 1, wy, 2, wh).rect(wx, wy + wh * 0.22, ww, 2).fill(palette.ink)
        if (f !== 0 && f !== 2) ironRail(wx - 6, wy + wh - 26, ww + 12, 26, g)
      }
      // full-width balconies on the 2nd and top floors, like ours
      if (f === 0 || f === 2) {
        const by = wy + wh + 4
        g.rect(x - 6, by, w + 12, 7).fill(0x45302a)
        ironRail(x - 2, by - 30, w + 4, 30, g)
      }
      g.rect(x, wy + FLOOR - 26, w, 4).fill({ color: 0x45302a, alpha: 0.8 })
    }
    // ground floor band
    g.rect(x, b.base, w, GROUND - b.base).fill({ color: palette.ink, alpha: 0.35 })
    for (let gy = b.base + 22; gy < GROUND; gy += 22) g.rect(x, gy, w, 2).fill({ color: palette.ink, alpha: 0.4 })
    return lit
  }

  private plainGround(g: Graphics, b: Block) {
    // shuttered shops and a door or two
    const n = Math.max(1, Math.floor(b.width / 130))
    for (let i = 0; i < n; i++) {
      const x = b.x + 20 + i * (b.width / n)
      const w = b.width / n - 40
      if (x + w < -100) continue
      g.rect(x, b.base + 40, w, GROUND - b.base - 40).fill(0x160e0c)
      for (let y = b.base + 46; y < GROUND; y += 6) g.rect(x, y, w, 1.5).fill({ color: palette.ink, alpha: 0.6 })
    }
  }

  private cafeTerrace(g: Graphics, lights: Container, rng: Rng, x: number, y: number, w: number) {
    const h = GROUND - y
    // glowing interior behind big panes
    g.rect(x, y + 50, w, h - 50).fill(0x8a3a16)
    g.rect(x, y + 50, w, h - 50).fill({ color: palette.amber, alpha: 0.4 })
    for (let px = x; px <= x + w; px += w / 6) g.rect(px - 2, y + 50, 4, h - 50).fill(palette.oxblood)
    // bar shelves inside
    for (let s = 0; s < 2; s++) {
      for (let bx = x + 20; bx < x + w - 20; bx += range(rng, 6, 10)) {
        g.rect(bx, y + 74 + s * 22 - 14, 4, 14).fill({ color: palette.ink, alpha: 0.5 })
      }
    }
    // the awning, sloping out over the pavement
    g.poly([x - 30, y + 14, x + w + 30, y + 14, x + w + 70, y + 70, x - 70, y + 70]).fill(0x9a2414).stroke(INK)
    g.rect(x - 70, y + 70, w + 140, 18).fill(0x7a1a10).stroke(INK)
    // scalloped valance
    for (let vx = x - 70; vx < x + w + 70; vx += 20) {
      g.moveTo(vx + 20, y + 88).arc(vx + 10, y + 88, 10, 0, Math.PI).fill(0x7a1a10)
    }
    const name = new Text({
      text: 'CAFE DU SOIR',
      style: { fontFamily: DISPLAY_FONT, fontSize: 15, fill: 0xf2e2bd, letterSpacing: 3 },
      resolution: 2,
    })
    name.anchor.set(0.5)
    name.position.set(x + w / 2, y + 80)
    this.addChild(name)

    // globe lanterns hanging from the awning
    for (let i = 0; i < 4; i++) {
      const lx = x + 30 + (i * (w - 60)) / 3
      const ly = y + 108
      g.rect(lx - 0.5, y + 88, 1, 12).fill(palette.ink)
      g.circle(lx, ly, 8).fill(0xffd27a)
      g.rect(lx - 8, ly - 0.5, 16, 1).rect(lx - 0.5, ly - 8, 1, 16).fill({ color: 0xa8682a, alpha: 0.6 })
      const glow = new Sprite(glowTexture())
      glow.anchor.set(0.5)
      glow.position.set(lx, ly)
      glow.scale.set(0.55)
      glow.tint = palette.lampWhite
      glow.blendMode = 'add'
      glow.alpha = 0.7
      lights.addChild(glow)
      this.lanterns.push({ glow, phase: rng() * 6 })
    }

    // tables with yellow cloths, chairs, and a few late customers
    for (let i = 0; i < 4; i++) {
      const tx = x - 20 + i * ((w + 40) / 3)
      const ty = GROUND - 30
      g.poly([tx - 22, ty, tx + 22, ty, tx + 26, ty + 18, tx - 26, ty + 18]).fill(0xc99a3e)
      g.rect(tx - 1.5, ty + 18, 3, 12).fill(palette.ink)
      for (const side of [-1, 1]) {
        const cx = tx + side * 34
        g.rect(cx - 8, ty + 6, 16, 3).fill(palette.ink)
        g.rect(cx + side * 7 - 1.5, ty - 20, 3, 50).fill(palette.ink)
        g.rect(cx - 7, ty + 9, 2, 21).rect(cx + 5, ty + 9, 2, 21).fill(palette.ink)
        if (chance(rng, 0.5)) {
          // someone sitting: elongated, like the posters
          g.circle(cx, ty - 34, 6).fill(palette.ink)
          g.poly([cx - 6, ty - 28, cx + 6, ty - 28, cx + 9, ty + 6, cx - 9, ty + 6]).fill(palette.ink)
        }
      }
      g.rect(tx - 2, ty - 6, 4, 6).fill(0xf2e2bd)
    }
    const pool = new Sprite(glowTexture())
    pool.anchor.set(0.5)
    pool.position.set(x + w / 2, GROUND - 30)
    pool.scale.set((w * 1.8) / 256, 0.7)
    pool.tint = palette.amber
    pool.alpha = 0.4
    pool.blendMode = 'add'
    lights.addChild(pool)
  }

  private clubFront(g: Graphics, lights: Container, x: number, y: number, w: number) {
    const h = GROUND - y
    g.rect(x, y, w, h).fill(palette.ink)
    // big red window into the club, with the band as shapes in the glass
    const wx = x + 12
    const wy = y + 40
    const ww = w - 80
    const wh = h - 60
    g.rect(wx, wy, ww, wh).fill(0x9a2a14)
    g.rect(wx, wy, ww, wh).fill({ color: palette.amberDeep, alpha: 0.35 })
    // three cats: a sax, a bass, a drum. very small, very serious.
    const cat = (cx: number, cy: number, s: number) => {
      g.poly([cx - 9 * s, cy + 40 * s, cx, cy - 6 * s, cx + 9 * s, cy + 40 * s]).fill(palette.ink)
      g.circle(cx, cy - 10 * s, 6 * s).fill(palette.ink)
      g.poly([cx - 6 * s, cy - 13 * s, cx - 5 * s, cy - 22 * s, cx - 1 * s, cy - 15 * s]).fill(palette.ink)
      g.poly([cx + 6 * s, cy - 13 * s, cx + 5 * s, cy - 22 * s, cx + 1 * s, cy - 15 * s]).fill(palette.ink)
    }
    const base = wy + wh - 46
    cat(wx + 26, base, 1)
    g.moveTo(wx + 32, base + 6).lineTo(wx + 38, base + 26).stroke({ color: palette.amber, width: 3 })
    cat(wx + ww / 2, base - 6, 1.1)
    g.ellipse(wx + ww / 2 + 16, base + 18, 9, 18).fill(0x5a1a0e)
    g.rect(wx + ww / 2 + 15, base - 24, 2, 30).fill(palette.ink)
    cat(wx + ww - 26, base, 1)
    g.rect(wx + ww - 44, base + 22, 22, 14).fill(palette.ink)
    g.ellipse(wx + ww - 33, base + 22, 11, 3).fill(palette.amber)
    g.rect(wx + ww / 3, wy, 2, wh).rect(wx + (2 * ww) / 3, wy, 2, wh).fill(palette.ink)
    // door
    g.rect(x + w - 56, y + 30, 46, h - 30).fill(0x2a0f0a)
    g.circle(x + w - 18, y + 30 + (h - 30) / 2, 2.5).fill(palette.amber)
    // string of bulbs along the top of the window
    for (let bx = wx + 6; bx < wx + ww; bx += 14) {
      const b = new Sprite(dotTexture())
      b.anchor.set(0.5)
      b.position.set(bx, wy + 8)
      b.scale.set(0.07)
      b.tint = palette.lampWhite
      this.addChild(b)
    }

    const glow = new Sprite(glowTexture())
    glow.anchor.set(0.5)
    glow.position.set(wx + ww / 2, wy + wh / 2)
    glow.scale.set((ww * 2.2) / 256, (wh * 2) / 256)
    glow.tint = 0xff6a2a
    glow.alpha = 0.55
    glow.blendMode = 'add'
    lights.addChild(glow)
  }

  private spawnPuff(age = 0) {
    const s = new Sprite(puffTexture())
    s.anchor.set(0.5)
    s.tint = 0x56607a
    this.addChildAt(s, 0)
    this.puffs.push({ s, age, life: range(this.rng, 5, 8), drift: range(this.rng, 6, 16) })
  }

  update(time: number, dt: number) {
    for (const p of this.puffs) {
      p.age += dt
      if (p.age > p.life) {
        p.age = 0
        p.life = range(this.rng, 5, 8)
      }
      const t = p.age / p.life
      p.s.x = this.chimney.x + Math.sin(time * 0.6 + p.life) * 6 + t * p.drift * 6
      p.s.y = this.chimney.y - t * 150
      p.s.scale.set(0.12 + t * 0.5, 0.1 + t * 0.35)
      p.s.alpha = Math.sin(t * Math.PI) * 0.14
    }
    for (const l of this.lanterns) l.glow.alpha = 0.66 + Math.sin(time * 1.7 + l.phase) * 0.04

    // neon that buzzes now and then
    const buzz = Math.sin(time * 37) > 0.97 || (time % 9 > 8.6 && Math.sin(time * 90) > 0)
    this.signText.alpha = buzz ? 0.35 : 1
    this.signGlow.alpha = buzz ? 0.15 : 0.45 + Math.sin(time * 2) * 0.03
  }
}
