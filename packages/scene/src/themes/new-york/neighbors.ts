import { Container, Graphics, Text } from 'pixi.js'
import { SIGN_FONT } from '../../fonts'
import { glow, neonWord } from '../../layers/neon'
import { Smoke } from '../../layers/smoke'
import { GROUND, HOUSE } from '../../layout'
import { palette } from '../../palette'
import { chance, createRng, pick, range, type Rng } from '../../rng'
import { brickWall, fireEscape, ny, waterTower } from './parts'

interface Tenement {
  x: number
  width: number
  top: number
  /** ground floor starts here */
  base: number
  brick: number
  litChance: number
  /** which column of windows the fire escape hangs over, if any */
  escape?: number
  tower?: number
}

type Neon = { text: Text; glow: { alpha: number }; phase: number }

const INK = { color: palette.ink, width: 1.5, alpha: 0.6 }

// The rest of the block: tenements with fire escapes, a tank on every roof,
// and a deli, a record shop, a jazz club and a diner downstairs.
export class Neighbors extends Container {
  private neons: Neon[] = []
  private smoke: Smoke[] = []

  constructor(seed: number, lights: Container) {
    super()
    const rng = createRng(seed)
    const g = new Graphics()
    this.addChild(g)

    const farLeft: Tenement = { x: -500, width: 1060, top: 560, base: GROUND - 180, brick: 0x3e1610, litChance: 0.45, escape: 6, tower: 160 }
    const left: Tenement = { x: 560, width: HOUSE.x - 560, top: 430, base: GROUND - 200, brick: 0x4a1a10, litChance: 0.5, escape: 1, tower: 600 }
    const right: Tenement = { x: HOUSE.x + HOUSE.width, width: 290, top: 470, base: GROUND - 200, brick: 0x3a140e, litChance: 0.5, escape: 1, tower: 1700 }
    const farRight: Tenement = { x: right.x + right.width, width: 1100, top: 520, base: GROUND - 200, brick: 0x2e100c, litChance: 0.4, escape: 2, tower: 2050 }
    for (const t of [farLeft, left, right, farRight]) this.tenement(g, lights, rng, t)

    this.recordShop(g, lights, 120, farLeft.base + 10, 330)
    this.deli(g, lights, rng, left.x + 12, left.base + 14, left.width - 24)
    this.jazz(g, lights, right.x + 24, right.base + 14, right.width - 48)
    this.diner(g, lights, rng, farRight.x + 30, farRight.base + 20, 420)

    // steam off a couple of chimneys
    this.smoke = [
      new Smoke(seed + 1, { x: 700, y: left.top - 40 }, { tint: 0x9a8a80, strength: 0.3, rise: 170, count: 16 }),
      new Smoke(seed + 2, { x: 1640, y: right.top - 40 }, { tint: 0x9a8a80, strength: 0.3, rise: 170, count: 16 }),
    ]
    for (const s of this.smoke) this.addChildAt(s, 0)
    g.rect(686, left.top - 40, 28, 40).rect(1626, right.top - 40, 28, 40).fill(ny.brickDark)
  }

  private tenement(g: Graphics, lights: Container, rng: Rng, t: Tenement) {
    const { x, width: w, top, base } = t
    if (t.tower !== undefined) waterTower(g, t.tower, top - 8, range(rng, 0.9, 1.2))
    brickWall(g, x, top, w, GROUND - top, rng, t.brick)
    // simple cornice
    g.rect(x - 8, top - 12, w + 16, 14).fill(ny.cornice).stroke(INK)
    for (let bx = x; bx < x + w; bx += 30) g.rect(bx, top + 2, 10, 10).fill(ny.cornice)

    const bay = 88
    const cols = Math.max(1, Math.floor(w / bay))
    const off = x + (w - cols * bay) / 2
    const floorH = 132
    const floors = Math.floor((base - top - 40) / floorH)
    const ww = 40
    const wh = 72
    const escapeX = t.escape !== undefined ? off + t.escape * bay + bay / 2 : null
    for (let f = 0; f < floors; f++) {
      const wy = top + 46 + f * floorH
      for (let c = 0; c < cols; c++) {
        const wx = off + c * bay + (bay - ww) / 2
        g.rect(wx - 6, wy - 12, ww + 12, 8).fill(ny.brownstoneLight)
        g.rect(wx - 6, wy + wh + 2, ww + 12, 6).fill(ny.brownstoneLight)
        if (chance(rng, t.litChance)) {
          const warm = pick(rng, [0xf07a32, 0xffa040, 0xe0461f, 0xc0301a])
          g.rect(wx, wy, ww, wh).fill(warm)
          // half-pulled shade
          const shade = range(rng, 0.15, 0.55) * wh
          g.rect(wx, wy, ww, shade).fill({ color: 0xffd8a0, alpha: 0.35 })
          g.rect(wx, wy + shade, ww, 2).fill({ color: palette.ink, alpha: 0.5 })
          glow(lights, wx + ww / 2, wy + wh / 2, (ww * 3) / 256, (wh * 2) / 256, palette.amberDeep, 0.32)
        } else {
          g.rect(wx, wy, ww, wh).fill(0x0c0806)
        }
        g.rect(wx, wy + wh / 2 - 1.5, ww, 3).fill(palette.ink)
      }
    }
    if (escapeX !== null) fireEscape(g, escapeX - 60, top + 46 + wh + 6, 120, floors, floorH)
    // ground floor band
    g.rect(x, base, w, GROUND - base).fill({ color: palette.ink, alpha: 0.4 })
  }

  private deli(g: Graphics, lights: Container, rng: Rng, x: number, y: number, w: number) {
    const h = GROUND - y
    g.rect(x, y, w, h).fill(0x1a0c08)
    // bright window full of shelves
    g.rect(x + 10, y + 56, w - 70, h - 66).fill(0xf0b050)
    for (let s = 0; s < 3; s++) {
      for (let bx = x + 14; bx < x + w - 64; bx += range(rng, 5, 9)) {
        g.rect(bx, y + 66 + s * 24, 4, 14).fill({ color: pick(rng, [palette.ink, 0x8a2a14, 0x2a4a2a]), alpha: 0.6 })
      }
    }
    // produce crates out front
    for (let c = 0; c < 3; c++) {
      const cx = x + 18 + c * 34
      g.rect(cx, GROUND - 30, 30, 30).fill(0x4a2a14)
      for (let f = 0; f < 6; f++) g.circle(cx + 5 + (f % 3) * 10, GROUND - 32 + Math.floor(f / 3) * 6, 4).fill(pick(rng, [0xe0461f, 0xf0a030, 0x6a8a2a]))
    }
    g.rect(x + w - 54, y + 56, 40, h - 56).fill(0x8a3a16)
    // awning with the name on it
    g.poly([x - 10, y, x + w + 10, y, x + w + 20, y + 44, x - 20, y + 44]).fill(0xb8261a).stroke(INK)
    const name = new Text({ text: 'DELI  GROCERY', style: { fontFamily: SIGN_FONT, fontSize: 14, fill: 0xfff0d0, letterSpacing: 2 }, resolution: 2 })
    name.anchor.set(0.5)
    name.position.set(x + w / 2, y + 24)
    this.addChild(name)
    this.addNeon(neonWord(this, lights, 'OPEN', x + 60, y + 76, { size: 18, colour: 0xff3b2a }))
    glow(lights, x + w / 2, y + 100, (w * 2) / 256, 1.2, 0xffb050, 0.45)
  }

  private recordShop(g: Graphics, lights: Container, x: number, y: number, w: number) {
    const h = GROUND - y
    g.rect(x, y, w, h).fill(0x140808)
    g.rect(x + 12, y + 40, w - 24, h - 50).fill(0xc0501e)
    // sleeves propped in the window
    for (let i = 0; i < 6; i++) {
      const sx = x + 24 + i * ((w - 60) / 5)
      g.rect(sx, y + 80, 34, 34).fill([0x2a1a3a, 0xe0a030, 0x1a1a1a, 0xb02418, 0xf0e0c0, 0x3a2a1a][i]!)
      g.circle(sx + 17, y + 97, 9).fill({ color: palette.ink, alpha: 0.4 })
    }
    this.addNeon(neonWord(this, lights, 'RECORDS', x + w / 2, y + 20, { size: 24, colour: 0xffb03a }))
    glow(lights, x + w / 2, y + 90, (w * 2) / 256, 1.1, 0xff7a2a, 0.4)
  }

  private jazz(g: Graphics, lights: Container, x: number, y: number, w: number) {
    const h = GROUND - y
    g.rect(x, y, w, h).fill(palette.ink)
    const wx = x + 10
    const wy = y + 40
    const ww = w - 70
    const wh = h - 54
    g.rect(wx, wy, ww, wh).fill(0x9a2a14)
    g.rect(wx, wy, ww, wh).fill({ color: palette.amberDeep, alpha: 0.35 })
    // the sax player, mid-solo
    const px = wx + ww * 0.45
    const py = wy + wh
    g.poly([px - 12, py, px + 12, py, px + 9, py - 70, px - 9, py - 70]).fill(palette.ink)
    g.circle(px, py - 80, 9).fill(palette.ink)
    g.ellipse(px + 3, py - 87, 13, 4).fill(palette.ink)
    g.moveTo(px + 6, py - 70).bezierCurveTo(px + 26, py - 60, px + 24, py - 30, px + 14, py - 26).stroke({ color: 0xffc46a, width: 4 })
    g.rect(x + w - 52, y + 30, 40, h - 30).fill(0x5a120c)
    g.circle(x + w - 20, y + 30 + (h - 30) / 2, 2.5).fill(palette.gold)
    this.addNeon(neonWord(this, lights, 'JAZZ', x + w / 2, y - 120, { size: 34, colour: 0xff5a2a, vertical: true }))
    g.roundRect(x + w / 2 - 26, y - 222, 52, 206, 6).fill(palette.ink)
    glow(lights, wx + ww / 2, wy + wh / 2, (ww * 2.2) / 256, (wh * 2) / 256, 0xff6a2a, 0.55)
  }

  private diner(g: Graphics, lights: Container, rng: Rng, x: number, y: number, w: number) {
    const h = GROUND - y
    // stainless band, big windows, booths
    g.rect(x, y, w, h).fill(0x2a2a2e)
    g.rect(x, y, w, 26).fill(0x8a8a90)
    g.rect(x, y + 8, w, 3).fill(0xc8c8d0).rect(x, y + 16, w, 3).fill(0xc8c8d0)
    g.rect(x + 10, y + 40, w - 20, h - 76).fill(0xf0b860)
    for (let i = 0; i < 5; i++) {
      const bx = x + 30 + i * ((w - 60) / 4)
      g.rect(bx - 24, y + 90, 48, 30).fill(0x8a1a14)
      if (chance(rng, 0.7)) {
        g.circle(bx - 8, y + 74, 7).fill(palette.ink)
        g.poly([bx - 16, y + 80, bx, y + 80, bx + 2, y + 100, bx - 18, y + 100]).fill(palette.ink)
      }
    }
    for (let px = x + 10; px < x + w - 10; px += 60) g.rect(px, y + 40, 3, h - 76).fill(0x6a6a70)
    g.rect(x, GROUND - 36, w, 36).fill(0x8a1a14)
    g.rect(x, GROUND - 36, w, 3).fill(0xc8c8d0)
    this.addNeon(neonWord(this, lights, 'DINER', x + 120, y - 40, { size: 40, colour: 0xff2e24 }))
    glow(lights, x + w / 2, y + 80, (w * 2) / 256, 1.4, 0xffb050, 0.45)
  }

  private addNeon(n: { text: Text; glow: { alpha: number } }) {
    this.neons.push({ ...n, phase: this.neons.length * 1.7 })
  }

  update(time: number, dt: number) {
    for (const s of this.smoke) s.update(time, dt)
    for (const n of this.neons) {
      // every sign has its own bad tube
      const buzz = Math.sin(time * 41 + n.phase) > 0.985 || (time + n.phase) % 11 > 10.6
      n.text.alpha = buzz ? 0.35 : 1
      n.glow.alpha = buzz ? 0.15 : 0.55 + Math.sin(time * 2 + n.phase) * 0.03
    }
  }
}
