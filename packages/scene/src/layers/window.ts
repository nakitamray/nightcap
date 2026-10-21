import { Container, FillGradient, Graphics, Sprite } from 'pixi.js'
import type { WindowSlot } from '../layout'
import { palette } from '../palette'
import { chance, createRng, hashString, pick, range, type Rng } from '../rng'
import { glowTexture } from '../textures'
import type { Curtains, Resident } from '../types'

type Prop = 'cat' | 'lamp' | 'plant' | 'figure' | 'shelf' | 'gramophone'

/**
 * How a window looks from the street. The light, curtains and furniture are
 * the same everywhere; the stone (or brick, or timber) around them, the shape
 * of the glass and the glazing bars belong to the street's theme.
 */
export interface WindowStyle {
  /** outline of the glass in window-local coords */
  glass(g: Graphics, w: number, h: number): Graphics
  /** the surround, drawn behind the glass */
  frame(g: Graphics, slot: WindowSlot): void
  /** glazing bars and anything else over the glass */
  bars(g: Graphics, slot: WindowSlot): void
  /** something in front of the whole window, like a rail */
  front?(slot: WindowSlot): Container | null
  /** curtain tint unlit / lit */
  curtains?: [number, number]
}

// switch-on flicker, [seconds, brightness]. old bulbs never come on clean.
const FLICKER: [number, number][] = [
  [0, 0],
  [0.05, 0.75],
  [0.1, 0.12],
  [0.17, 0.9],
  [0.23, 0.45],
  [0.38, 1],
]

function lerpColor(a: number, b: number, t: number) {
  const ar = (a >> 16) & 255
  const ag = (a >> 8) & 255
  const ab = a & 255
  const r = ar + (((b >> 16) & 255) - ar) * t
  const g = ag + (((b >> 8) & 255) - ag) * t
  const bl = ab + ((b & 255) - ab) * t
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl)
}

export class RoomWindow extends Container {
  readonly slot: WindowSlot
  resident: Resident | null = null

  private frame = new Graphics()
  private wall = new Graphics()
  private interior = new Container()
  private props = new Graphics()
  private catTail: Graphics | null = null
  private hotspot = new Sprite(glowTexture())
  private curtainL = new Graphics()
  private curtainR = new Graphics()
  private blind = new Graphics()
  private halo = new Sprite(glowTexture())
  private spill = new Sprite(glowTexture())

  private light = 0
  private lit = false
  private flickerT = -1
  private open = 1
  private openTarget = 1
  private hovered = false
  private phase: number

  private style: WindowStyle

  constructor(slot: WindowSlot, lights: Container, style: WindowStyle) {
    super()
    this.slot = slot
    this.style = style
    this.position.set(slot.x, slot.y)
    this.phase = slot.index * 1.7

    const { width: w, height: h } = slot
    style.frame(this.frame, slot)
    this.addChild(this.frame)

    const glass = new Graphics()
    this.glassPath(glass).fill(0x120c0e)
    this.addChild(glass)

    // everything you can see through the glass. the wall colour is picked
    // per resident in setResident()
    this.interior.addChild(this.wall)
    this.hotspot.anchor.set(0.5)
    this.hotspot.tint = palette.lampWhite
    this.hotspot.blendMode = 'add'
    this.hotspot.scale.set(0.7)
    this.interior.addChild(this.hotspot, this.props)
    const mask = new Graphics()
    this.glassPath(mask).fill(0xffffff)
    this.interior.addChild(mask)
    this.interior.mask = mask
    this.interior.alpha = 0
    this.addChild(this.interior)

    // curtains are drawn white and tinted, so one shape serves lit and unlit
    for (const [panel, side] of [
      [this.curtainL, 0],
      [this.curtainR, 1],
    ] as const) {
      panel.rect(0, 0, w / 2 + 2, h).fill(0xffffff)
      for (let fx = 5; fx < w / 2; fx += 9) panel.rect(fx, 0, 3, h).fill({ color: 0x000000, alpha: 0.22 })
      panel.rect(0, 0, w / 2 + 2, 6).fill({ color: 0x000000, alpha: 0.35 })
      panel.pivot.set(side ? w / 2 + 2 : 0, 0)
      panel.x = side ? w : 0
    }
    const curtains = new Container()
    curtains.addChild(this.curtainL, this.curtainR)
    const cmask = new Graphics()
    this.glassPath(cmask).fill(0xffffff)
    curtains.addChild(cmask)
    curtains.mask = cmask
    this.addChild(curtains)

    // vacant rooms get a pulled-down paper blind instead
    this.glassPath(this.blind).fill({ color: 0x3b2a1e, alpha: 0.9 })
    this.blind.visible = false
    this.addChild(this.blind)

    const bars = new Graphics()
    style.bars(bars, slot)
    this.addChild(bars)
    const front = style.front?.(slot)
    if (front) this.addChild(front)

    this.halo.anchor.set(0.5)
    this.halo.position.set(slot.x + w / 2, slot.y + h / 2)
    this.halo.scale.set((w * 3.3) / 256, (h * 2.9) / 256)
    this.halo.tint = palette.amber
    this.halo.blendMode = 'add'
    this.halo.alpha = 0
    this.spill.anchor.set(0.5)
    this.spill.position.set(slot.x + w / 2, slot.y + h + 22)
    this.spill.scale.set((w * 2.2) / 256, 0.32)
    this.spill.tint = palette.amberDeep
    this.spill.blendMode = 'add'
    this.spill.alpha = 0
    lights.addChild(this.halo, this.spill)
  }

  private glassPath(g: Graphics) {
    return this.style.glass(g, this.slot.width, this.slot.height)
  }

  setHovered(hovered: boolean) {
    this.hovered = hovered
  }

  setResident(resident: Resident | null, rng?: Rng) {
    this.resident = resident
    if (resident) this.setLightColour(pickLight(resident.id))
    this.props.clear()
    this.catTail?.destroy()
    this.catTail = null
    this.blind.visible = !resident
    if (!resident) {
      this.setLit(false, false)
      return
    }
    this.furnish(rng ?? createRng(hashString(resident.id)))
    this.setCurtains(resident.curtains, false)
    this.setLit(resident.home, false)
  }

  /** what's inside depends on who lives here, so it stays put between visits */
  private furnish(rng: Rng) {
    const { width: w, height: h } = this.slot
    const g = this.props
    const ink = palette.ink
    const floor = h - 2
    const all: Prop[] = ['cat', 'lamp', 'plant', 'figure', 'shelf', 'gramophone']
    const first = pick(rng, all)
    const second = pick(rng, all.filter((p) => p !== first))
    const props = chance(rng, 0.7) ? [first, second] : [first]
    // keep the two props on opposite sides
    const firstLeft = chance(rng, 0.5)
    props.forEach((prop, i) => {
      const left = i === 0 ? firstLeft : !firstLeft
      const x = left ? range(rng, 18, 30) : range(rng, w - 30, w - 18)
      switch (prop) {
        case 'lamp': {
          g.rect(x - 1.5, floor - 70, 3, 70).fill(ink)
          g.ellipse(x, floor, 10, 3).fill(ink)
          g.poly([x - 13, floor - 70, x + 13, floor - 70, x + 8, floor - 88, x - 8, floor - 88]).fill(0x3a160c)
          this.hotspot.position.set(x, floor - 76)
          break
        }
        case 'plant': {
          g.rect(x - 9, floor - 18, 18, 18).fill(ink)
          for (let l = 0; l < 7; l++) {
            const a = -Math.PI / 2 + range(rng, -1.1, 1.1)
            const len = range(rng, 18, 34)
            g.ellipse(x + Math.cos(a) * len * 0.6, floor - 18 + Math.sin(a) * len * 0.6, 4, len / 2.2).fill(ink)
          }
          break
        }
        case 'figure': {
          // tall and thin, the way the posters drew people
          const fh = range(rng, 92, 108)
          g.circle(x, floor - fh, 7).fill(ink)
          g.poly([x - 5, floor - fh + 8, x + 5, floor - fh + 8, x + 11, floor, x - 9, floor]).fill(ink)
          g.poly([x + 4, floor - fh + 14, x + 18, floor - fh + 40, x + 15, floor - fh + 42, x + 3, floor - fh + 24]).fill(ink)
          break
        }
        case 'shelf': {
          const sx = left ? 4 : w - 34
          for (let s = 0; s < 3; s++) {
            const sy = floor - 20 - s * 26
            g.rect(sx, sy, 30, 3).fill(ink)
            let bx = sx + 2
            while (bx < sx + 26) {
              const bw = range(rng, 3, 5)
              const bh = range(rng, 12, 20)
              g.rect(bx, sy - bh, bw, bh).fill({ color: ink, alpha: range(rng, 0.75, 1) })
              bx += bw + 1
            }
          }
          break
        }
        case 'gramophone': {
          g.rect(x - 14, floor - 34, 28, 34).fill(ink)
          g.ellipse(x, floor - 36, 13, 3).fill(0x2a0f08)
          g.moveTo(x + 2, floor - 38)
            .lineTo(x + 6, floor - 60)
            .stroke({ color: ink, width: 2 })
          g.poly([x + 6, floor - 60, x - 8, floor - 82, x + 22, floor - 78]).fill(ink)
          break
        }
        case 'cat': {
          // sat on the inside sill, facing the street
          const cy = floor
          g.ellipse(x, cy - 11, 10, 12).fill(ink)
          g.circle(x, cy - 27, 7).fill(ink)
          g.poly([x - 7, cy - 29, x - 6, cy - 40, x - 1, cy - 32]).fill(ink)
          g.poly([x + 7, cy - 29, x + 6, cy - 40, x + 1, cy - 32]).fill(ink)
          const tail = new Graphics()
            .moveTo(0, 0)
            .bezierCurveTo(10, 2, 14, -8, 10, -18)
            .stroke({ color: ink, width: 3, cap: 'round' })
          tail.position.set(x + 8, cy - 4)
          this.interior.addChildAt(tail, this.interior.getChildIndex(this.props) + 1)
          this.catTail = tail
          break
        }
      }
    })
    if (!props.includes('lamp')) this.hotspot.position.set(range(rng, w * 0.3, w * 0.7), h * 0.22)
  }

  private setLightColour(light: RoomLight) {
    const gradient = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: light.stops.map((color, i) => ({ offset: i / (light.stops.length - 1), color })),
      textureSpace: 'local',
    })
    this.wall.clear()
    this.glassPath(this.wall).fill(gradient)
    this.halo.tint = light.halo
    this.spill.tint = light.halo
  }

  setLit(on: boolean, animate = true) {
    if (on === this.lit && this.flickerT < 0) return
    this.lit = on
    if (on && animate) this.flickerT = 0
    else if (!animate) this.light = on ? 1 : 0
  }

  get isLit() {
    return this.lit
  }

  setCurtains(curtains: Curtains, animate = true) {
    this.openTarget = curtains === 'open' ? 1 : 0
    if (!animate) this.open = this.openTarget
  }

  update(time: number, dt: number, reducedMotion: boolean) {
    // light level
    if (this.lit && this.flickerT >= 0 && !reducedMotion) {
      this.flickerT += dt
      this.light = sampleFlicker(this.flickerT)
      if (this.flickerT > FLICKER[FLICKER.length - 1]![0]) this.flickerT = -1
    } else {
      this.flickerT = -1
      const target = this.lit ? 1 : 0
      this.light += (target - this.light) * Math.min(1, dt * (this.lit ? 10 : 3.2))
    }
    this.open += (this.openTarget - this.open) * Math.min(1, dt * 3)

    // lamps breathe a little; nobody's bulb is perfectly steady
    const breathe = 1 + Math.sin(time * 1.3 + this.phase) * 0.025 + Math.sin(time * 7.1 + this.phase) * 0.01
    const L = this.light * breathe

    const drawnDim = 0.55 + this.open * 0.45
    this.interior.alpha = this.light
    this.hotspot.alpha = 0.55 * L
    this.halo.alpha = L * 0.65 * drawnDim * (this.hovered ? 1.3 : 1)
    this.spill.alpha = L * 0.45

    // curtains: open = bunched at the sides, drawn = meeting in the middle
    const openScale = 0.24 + (1 - this.open) * 0.76
    const sway = reducedMotion ? 0 : Math.sin(time * 0.9 + this.phase) * 0.025 * (0.4 + this.light)
    this.curtainL.scale.x = openScale
    this.curtainR.scale.x = openScale
    this.curtainL.skew.x = sway
    this.curtainR.skew.x = -sway * 0.8
    const [dark, lit] = this.style.curtains ?? [palette.curtain, palette.curtainLit]
    const tint = lerpColor(dark, lit, this.light)
    this.curtainL.tint = this.curtainR.tint = tint
    this.curtainL.alpha = this.curtainR.alpha = 1 - this.light * 0.12

    if (this.catTail && !reducedMotion) this.catTail.rotation = Math.sin(time * 1.6 + this.phase) * 0.25

    this.frame.tint = this.hovered ? 0xffe0b8 : 0xffffff
  }
}

interface RoomLight {
  stops: number[]
  halo: number
}

// Not every lamp is the same colour. Some rooms are a soft amber, some are
// lit through a red shade or a paper lantern and come out ember or deep red.
const LIGHTS: { weight: number; light: RoomLight }[] = [
  { weight: 4, light: { stops: [0xd8582a, 0xf5823a, 0xffad5c], halo: palette.amber } },
  { weight: 3, light: { stops: [0xa8261a, 0xe0461f, 0xff7a3a], halo: 0xff5a24 } },
  { weight: 2, light: { stops: [0x6e100c, 0xb0201a, 0xe8442a], halo: 0xff3a1e } },
]

function pickLight(id: string): RoomLight {
  const total = LIGHTS.reduce((n, l) => n + l.weight, 0)
  let r = createRng(hashString(`${id}:light`))() * total
  for (const l of LIGHTS) {
    r -= l.weight
    if (r < 0) return l.light
  }
  return LIGHTS[0]!.light
}

function sampleFlicker(t: number) {
  for (let i = 1; i < FLICKER.length; i++) {
    const [t1, v1] = FLICKER[i]!
    const [t0, v0] = FLICKER[i - 1]!
    if (t <= t1) return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0)
  }
  return 1
}
