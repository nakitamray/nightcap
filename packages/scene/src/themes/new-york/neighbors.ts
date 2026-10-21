import { Container, Graphics, Text } from 'pixi.js'
import { SIGN_FONT } from '../../fonts'
import { glow, neonWord } from '../../layers/neon'
import { Smoke } from '../../layers/smoke'
import { GROUND } from '../../layout'
import { palette } from '../../palette'
import { chance, createRng, pick, range, type Rng } from '../../rng'
import { areaway, stoop, windowExtras } from './details'
import { PARLOR, ROW } from './layout'
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

// The rest of the block, packed in: a back row of taller tenements with
// water tanks, a corner bodega, a brownstone either side of ours, and a big
// pre-war apartment building with a doorman.
export class Neighbors extends Container {
  private neons: Neon[] = []
  private smoke: Smoke[] = []
  private bulbs = new Container()

  constructor(seed: number, lights: Container) {
    super()
    const rng = createRng(seed)
    const g = new Graphics()
    this.addChild(g)

    // a second, taller row behind ours, so there's barely any sky between roofs
    let bx = -400
    while (bx < 2800) {
      const width = range(rng, 170, 320)
      // stay low round the empire state so it shows over the bodega
      const nearEmpire = bx < 700 && bx + width > 200
      this.tenement(g, lights, rng, {
        x: bx,
        width,
        top: nearEmpire ? range(rng, 440, 520) : range(rng, 170, 320),
        base: GROUND,
        brick: pick(rng, [0x2a0e0a, 0x241210, 0x30140e]),
        litChance: 0.38,
        escape: chance(rng, 0.5) ? 0 : undefined,
        tower: chance(rng, 0.5) ? bx + range(rng, 20, width - 60) : undefined,
      })
      bx += width
    }

    // the corner building with the bodega
    const corner: Tenement = { x: ROW.bodega.x, width: ROW.bodega.width, top: ROW.bodega.top, base: GROUND - 190, brick: 0x4a1a10, litChance: 0.55, escape: 3 }
    this.tenement(g, lights, rng, corner)
    this.bodega(g, lights, rng, corner.x + 40, GROUND - 186, corner.width - 60)

    // the brownstones either side of ours, each with its own stoop
    this.brownstone(g, lights, rng, { ...ROW.left, tone: 0x3e2318, light: 0x5e3a26, door: 'right', arched: true })
    this.brownstone(g, lights, rng, { ...ROW.right, tone: 0x4a1c14, light: 0x6a3020, door: 'left', brick: true })

    this.prewar(g, lights, rng, ROW.prewar.x, ROW.prewar.width, ROW.prewar.top)
    this.addChild(this.bulbs)

    // steam off a couple of chimneys
    this.smoke = [
      new Smoke(seed + 1, { x: ROW.left.x + 60, y: ROW.left.top - 66 }, { tint: 0x9a8a80, strength: 0.3, rise: 170, count: 16 }),
      new Smoke(seed + 2, { x: ROW.bodega.x + 300, y: ROW.bodega.top - 50 }, { tint: 0x9a8a80, strength: 0.3, rise: 170, count: 16 }),
    ]
    for (const sm of this.smoke) this.addChildAt(sm, 0)
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




  /** a three-bay brownstone with a stoop on one side, windows full of people's things */
  private brownstone(
    g: Graphics,
    lights: Container,
    rng: Rng,
    b: { x: number; width: number; top: number; tone: number; light: number; door: 'left' | 'right'; arched?: boolean; brick?: boolean },
  ) {
    const { x, width: w, top } = b
    // chimney, then the front
    g.rect(x + 40, top - 66, 28, 66).fill(ny.brickDark)
    if (b.brick) brickWall(g, x, top, w, GROUND - top, rng, b.tone)
    else {
      g.rect(x, top, w, GROUND - top).fill(b.tone)
      for (let jy = top + 30; jy < PARLOR.floor; jy += 26) g.rect(x, jy, w, 1.2).fill({ color: palette.ink, alpha: 0.2 })
    }
    g.rect(x - 3, top, 6, GROUND - top).rect(x + w - 3, top, 6, GROUND - top).fill(ny.brownstoneDark)
    // cornice
    g.rect(x - 12, top - 14, w + 24, 16).fill(ny.cornice).stroke(INK)
    g.rect(x - 6, top + 2, w + 12, 18).fill(ny.cornice)
    for (let cx = x; cx <= x + w - 10; cx += (w - 10) / 4) {
      g.rect(cx, top + 2, 10, 28).fill(ny.cornice)
      g.circle(cx + 5, top + 28, 4.5).fill(ny.cornice)
    }

    const bay = w / 3
    const ww = 74
    const wh = 104
    for (let wy = top + 58; wy + wh < PARLOR.top - 10; wy += 150) {
      for (let c = 0; c < 3; c++) {
        const wx = x + c * bay + (bay - ww) / 2
        this.sash(g, lights, rng, wx, wy, ww, wh, b.light, b.arched ?? false)
      }
    }

    // parlor floor: door bay with the stoop, two tall windows
    const doorCol = b.door === 'left' ? 0 : 2
    const ptop = PARLOR.top + 60
    for (let c = 0; c < 3; c++) {
      const cx = x + c * bay + bay / 2
      if (c === doorCol) {
        g.rect(cx - 46, ptop - 10, 92, PARLOR.floor - ptop + 10).fill(b.light).stroke(INK)
        g.rect(cx - 32, ptop, 64, 20).fill(0xf0a050)
        g.rect(cx - 32, ptop + 20, 64, PARLOR.floor - ptop - 20).fill(pick(rng, [0x2a0e08, 0x0e1a2a, 0x3a0a0a]))
        g.rect(cx - 26, ptop + 28, 22, 40).rect(cx + 4, ptop + 28, 22, 40).fill({ color: palette.amber, alpha: 0.7 })
        glow(lights, cx, ptop + 50, 0.6, 0.9, palette.amber, 0.35)
      } else {
        this.sash(g, lights, rng, cx - 44, ptop, 88, PARLOR.floor - ptop - 18, b.light, false, true)
      }
    }
    // garden level and the stoop
    g.rect(x, PARLOR.floor, w, GROUND - PARLOR.floor).fill({ color: palette.ink, alpha: 0.35 })
    const doorX = x + doorCol * bay + bay / 2
    stoop(g, doorX, PARLOR.floor, 64, b.tone, b.light)
    const fenceX = b.door === 'left' ? doorX + 110 : x + 6
    areaway(g, fenceX, w - (doorX - x > w / 2 ? doorX - x : w - (doorX - x)) - 116, 38)
  }

  /** one window on a neighbouring house: hood, sill, light, a life inside */
  private sash(g: Graphics, lights: Container, rng: Rng, x: number, y: number, w: number, h: number, stone: number, arched: boolean, tall = false) {
    g.rect(x - 7, y - 7, w + 14, h + 12).fill(ny.brownstoneDark).stroke(INK)
    if (arched) g.moveTo(x - 14, y - 6).quadraticCurveTo(x + w / 2, y - 34, x + w + 14, y - 6).closePath().fill(stone).stroke(INK)
    else g.rect(x - 14, y - 22, w + 28, 10).fill(stone).stroke(INK)
    g.rect(x - 12, y + h + 4, w + 24, 7).fill(stone)
    const lit = chance(rng, tall ? 0.8 : 0.62)
    if (lit) {
      const colour = pick(rng, [0xf07a32, 0xffa040, 0xe0461f, 0xc0301a, 0xf0c050, 0xe0782e, 0x6a8ad0])
      g.rect(x, y, w, h).fill(colour)
      g.rect(x, y, w, h * 0.3).fill({ color: 0xfff0d0, alpha: 0.2 })
      this.someone(g, rng, x, y, w, h)
      const shade = range(rng, 0.05, 0.4) * h
      g.rect(x, y, w, shade).fill({ color: 0xffe0b0, alpha: 0.35 })
      glow(lights, x + w / 2, y + h / 2, (w * 2.6) / 256, (h * 2) / 256, colour === 0x6a8ad0 ? 0x6a8ad0 : palette.amberDeep, 0.3)
    } else {
      g.rect(x, y, w, h).fill(0x0c0806)
    }
    g.rect(x, y + h / 2 - 2, w, 4).rect(x + w / 2 - 1.5, y, 3, h).fill(0x1a0f0b)
    if (!tall) windowExtras(g, lights, this.bulbs, rng, x, y, w, h)
  }

  /** whoever's home: a reader, a lamp, a cat, a couple, a fern */
  private someone(g: Graphics, rng: Rng, x: number, y: number, w: number, h: number) {
    const ink = palette.ink
    const floor = y + h
    const cx = x + range(rng, w * 0.25, w * 0.75)
    switch (pick(rng, ['person', 'lamp', 'cat', 'couple', 'plant', 'shelf'] as const)) {
      case 'person':
        g.circle(cx, floor - h * 0.62, 6).fill(ink)
        g.poly([cx - 7, floor - h * 0.55, cx + 7, floor - h * 0.55, cx + 9, floor, cx - 9, floor]).fill(ink)
        break
      case 'couple':
        for (const dx of [-9, 9]) {
          g.circle(cx + dx, floor - h * 0.6, 5.5).fill(ink)
          g.poly([cx + dx - 6, floor - h * 0.53, cx + dx + 6, floor - h * 0.53, cx + dx + 8, floor, cx + dx - 8, floor]).fill(ink)
        }
        break
      case 'lamp':
        g.rect(cx - 1, floor - h * 0.7, 2, h * 0.7).fill(ink)
        g.poly([cx - 9, floor - h * 0.7, cx + 9, floor - h * 0.7, cx + 6, floor - h * 0.82, cx - 6, floor - h * 0.82]).fill(ink)
        break
      case 'cat':
        g.ellipse(cx, floor - 9, 8, 9).fill(ink)
        g.circle(cx, floor - 22, 6).fill(ink)
        g.poly([cx - 6, floor - 24, cx - 5, floor - 33, cx - 1, floor - 26]).poly([cx + 6, floor - 24, cx + 5, floor - 33, cx + 1, floor - 26]).fill(ink)
        break
      case 'plant':
        g.rect(cx - 7, floor - 14, 14, 14).fill(ink)
        for (let l = 0; l < 6; l++) g.ellipse(cx + (l - 2.5) * 4, floor - 26, 3, 12).fill(ink)
        break
      case 'shelf':
        for (let s = 0; s < 3; s++) {
          g.rect(x + 4, floor - 20 - s * 22, w - 8, 2).fill(ink)
          for (let bx2 = x + 6; bx2 < x + w - 8; bx2 += 5) g.rect(bx2, floor - 34 - s * 22, 3.5, 14).fill({ color: ink, alpha: 0.8 })
        }
        break
    }
  }

  /** the corner bodega: lit sign, posters in the window, flowers and fruit outside, the cat */
  private bodega(g: Graphics, lights: Container, rng: Rng, x: number, y: number, w: number) {
    const h = GROUND - y
    g.rect(x, y, w, h).fill(0x140a06)
    // the big lit box sign
    g.rect(x - 6, y, w + 12, 38).fill(0xf0c020).stroke(INK)
    const name = new Text({ text: 'DELI  GROCERY  24 HRS', style: { fontFamily: SIGN_FONT, fontSize: 19, fill: 0xb0180e, letterSpacing: 2 }, resolution: 2 })
    name.anchor.set(0.5)
    name.position.set(x + w / 2, y + 20)
    this.addChild(name)
    glow(lights, x + w / 2, y + 20, (w * 1.6) / 256, 0.5, 0xffd040, 0.4)
    // red awning
    for (let i = 0; i < 10; i++) {
      const sx = x - 8 + (i * (w + 16)) / 10
      g.poly([sx, y + 38, sx + (w + 16) / 10, y + 38, sx + (w + 16) / 10 + 4, y + 74, sx + 4, y + 74]).fill(i % 2 ? 0xf2e2c0 : 0xb8261a)
    }
    // window: shelves, and every inch covered in posters and stickers
    const wx = x + 12
    const wy = y + 84
    const ww = w - 90
    const wh = h - 100
    g.rect(wx, wy, ww, wh).fill(0xf6d070)
    for (let s = 0; s < 3; s++) {
      for (let px = wx + 4; px < wx + ww - 6; px += range(rng, 5, 9)) {
        g.rect(px, wy + 18 + s * 24, 4, 14).fill({ color: pick(rng, [0xc0301e, 0x2a4ab0, 0xf0a020, 0x1a1a1a, 0xe06aa0]), alpha: 0.8 })
      }
    }
    for (let i = 0; i < 7; i++) {
      g.rect(wx + range(rng, 0, ww - 34), wy + range(rng, 0, wh - 40), range(rng, 18, 34), range(rng, 22, 40)).fill({
        color: pick(rng, [0xe0402a, 0x2a6ae0, 0xf0f0e0, 0xf0c020, 0xd040a0]),
        alpha: 0.9,
      })
    }
    this.addNeon(neonWord(this, lights, 'ATM', wx + 34, wy + 14, { size: 16, colour: 0x4aa0ff }))
    this.addNeon(neonWord(this, lights, 'LOTTO', wx + ww - 44, wy + 14, { size: 16, colour: 0xff3b2a }))
    this.addNeon(neonWord(this, lights, 'OPEN', wx + ww / 2, wy + wh - 20, { size: 18, colour: 0xff5a8a }))
    glow(lights, wx + ww / 2, wy + wh / 2, (ww * 2) / 256, (wh * 2.2) / 256, 0xffd070, 0.5)
    // door, propped open, light spilling out
    g.rect(x + w - 70, wy, 56, h - 100 + 16).fill(0xffe0a0)
    g.rect(x + w - 70, wy, 10, h - 100 + 16).fill(0x3a2a20)

    // buckets of flowers and crates of fruit out front
    for (let c = 0; c < 6; c++) {
      const cx = x + 14 + c * 34
      if (c < 3) {
        g.rect(cx, GROUND - 26, 28, 26).fill(0x4a2a14)
        for (let f = 0; f < 6; f++) g.circle(cx + 5 + (f % 3) * 9, GROUND - 28 + Math.floor(f / 3) * 6, 4.5).fill(pick(rng, [0xe0461f, 0xf0a030, 0xf0d040, 0xc0281a]))
      } else {
        g.poly([cx + 2, GROUND - 22, cx + 26, GROUND - 22, cx + 22, GROUND, cx + 6, GROUND]).fill(0x2a2a30)
        for (let f = 0; f < 7; f++) {
          const fx = cx + 4 + range(rng, 0, 20)
          const fy = GROUND - 26 - range(rng, 0, 22)
          g.moveTo(cx + 14, GROUND - 20).lineTo(fx, fy).stroke({ color: 0x1d3a1a, width: 1.2 })
          g.circle(fx, fy, 4).fill(pick(rng, [0xff5a8a, 0xf0e0f0, 0xffd040, 0xe0402a, 0xb070e0]))
        }
      }
    }
    // the bodega cat, on duty
    const kx = x + 50
    const ky = GROUND - 28
    g.ellipse(kx, ky - 9, 9, 10).fill(0xd88a3a)
    g.circle(kx, ky - 22, 6.5).fill(0xd88a3a)
    g.poly([kx - 6, ky - 24, kx - 5, ky - 33, kx - 1, ky - 26]).poly([kx + 6, ky - 24, kx + 5, ky - 33, kx + 1, ky - 26]).fill(0xd88a3a)
    g.moveTo(kx + 8, ky - 2).bezierCurveTo(kx + 18, ky, kx + 20, ky - 10, kx + 16, ky - 18).stroke({ color: 0xd88a3a, width: 3, cap: 'round' })

    // payphone on the corner
    const px = x - 30
    g.rect(px - 2, GROUND - 140, 4, 140).fill(0x3a3a40)
    g.rect(px - 16, GROUND - 150, 32, 48).fill(0x8a8a90).stroke(INK)
    g.rect(px - 10, GROUND - 142, 20, 30).fill(0x2a2a30)
    g.rect(px - 16, GROUND - 158, 32, 10).fill(0x2a5ab0)
  }

  /** a tall pre-war apartment building with a canopy out to the kerb and a doorman */
  private prewar(g: Graphics, lights: Container, rng: Rng, x: number, w: number, top: number) {
    const base = GROUND - 240
    brickWall(g, x, top, w, base - top, rng, 0x3a1a12)
    g.rect(x, base, w, GROUND - base).fill(0x5a4a3a)
    for (let gy = base + 24; gy < GROUND; gy += 24) g.rect(x, gy, w, 2).fill({ color: palette.ink, alpha: 0.35 })
    g.rect(x - 14, top - 18, w + 28, 22).fill(0x5a4a3a).stroke(INK)
    for (let dx = x - 10; dx < x + w + 10; dx += 14) g.rect(dx, top + 4, 7, 9).fill(0x4a3a2a)
    const cols = 6
    const bay = w / cols
    for (let wy = top + 40; wy < base - 60; wy += 96) {
      for (let c = 0; c < cols; c++) this.sash(g, lights, rng, x + c * bay + (bay - 46) / 2, wy, 46, 64, 0x6a5a48, false)
    }
    // lobby, and the canopy reaching out over the pavement
    const cx = x + 120
    g.rect(cx - 60, base + 40, 120, GROUND - base - 40).fill(0xf0b860)
    g.rect(cx - 60, base + 40, 120, GROUND - base - 40).stroke({ color: 0x8a6a3a, width: 4 })
    g.rect(cx - 4, base + 40, 8, GROUND - base - 40).fill(0x8a6a3a)
    glow(lights, cx, base + 120, 1.2, 1.2, palette.amber, 0.5)
    g.rect(cx - 80, base + 6, 160, 30).fill(0x2a1a3a).stroke(INK)
    for (let sx = cx - 80; sx < cx + 80; sx += 16) g.moveTo(sx, base + 36).arc(sx + 8, base + 36, 8, 0, Math.PI).fill(0x2a1a3a)
    const name = new Text({ text: 'THE MARLOWE', style: { fontFamily: SIGN_FONT, fontSize: 14, fill: 0xe8c890, letterSpacing: 3 }, resolution: 2 })
    name.anchor.set(0.5)
    name.position.set(cx, base + 21)
    this.addChild(name)
    for (const px of [cx - 74, cx + 74]) g.rect(px - 2, base + 36, 4, GROUND - base - 36).fill(0x8a6a3a)
    // the doorman, cap and all
    g.circle(cx + 40, GROUND - 98, 7).fill(palette.ink)
    g.rect(cx + 32, GROUND - 108, 16, 5).fill(palette.ink)
    g.poly([cx + 32, GROUND - 90, cx + 48, GROUND - 90, cx + 50, GROUND, cx + 30, GROUND]).fill(0x2a1a3a)
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
