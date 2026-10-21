import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { DISPLAY_FONT } from '../fonts'
import { MARQUEE } from '../layout'
import { palette } from '../palette'
import { coneTexture, glowTexture } from '../textures'

interface Bulb {
  core: Graphics
  glow: Sprite
  i: number
}

const BULB_GAP = 17
const ROTATE_EVERY = 6

// The lit sign over the front door. First line is the house name, the rest
// are the group calendar and take turns on the second line.
export class Marquee extends Container {
  private bulbs: Bulb[] = []
  private title: Text
  private line: Text
  private lines: string[] = []
  private lineIndex = 0
  private lineClock = 0

  constructor(lights: Container) {
    super()
    const { x, y, width: w, height: h } = MARQUEE

    // chains back to the wall
    const chains = new Graphics()
    for (const cx of [x + 30, x + w - 30]) {
      chains.moveTo(cx, y).lineTo(cx + (cx < x + w / 2 ? -40 : 40), y - 42).stroke({ color: palette.ink, width: 2 })
    }
    this.addChild(chains)

    const board = new Graphics()
    // underside of the canopy, then the face
    board.poly([x - 14, y + h, x + w + 14, y + h, x + w - 6, y + h + 8, x + 6, y + h + 8]).fill(0x2a0d08)
    board.roundRect(x - 14, y - 8, w + 28, h + 16, 6).fill(palette.red)
    board.roundRect(x - 6, y, w + 12, h, 4).fill(0x6b1a10)
    board.roundRect(x + 12, y + 12, w - 24, h - 24, 3).fill(0x140a08)
    board.roundRect(x + 12, y + 12, w - 24, h - 24, 3).stroke({ color: 0xb8742e, width: 2 })
    // little deco fan on top
    const cx = x + w / 2
    board.moveTo(cx - 46, y - 8).arc(cx, y - 8, 46, Math.PI, 0).fill(palette.red)
    for (let i = 1; i < 8; i++) {
      const a = Math.PI + (i / 8) * Math.PI
      board
        .moveTo(cx, y - 8)
        .lineTo(cx + Math.cos(a) * 42, y - 8 + Math.sin(a) * 42)
        .stroke({ color: 0xb8742e, width: 2 })
    }
    this.addChild(board)

    const perimeter = this.perimeterPoints(x - 4, y - 2, w + 8, h + 4)
    perimeter.forEach(([bx, by], i) => {
      const core = new Graphics().circle(0, 0, 3.4).fill(0xffffff)
      core.position.set(bx, by)
      this.addChild(core)
      const glow = new Sprite(glowTexture())
      glow.anchor.set(0.5)
      glow.position.set(bx, by)
      glow.scale.set(0.16)
      glow.tint = palette.amber
      glow.blendMode = 'add'
      lights.addChild(glow)
      this.bulbs.push({ core, glow, i })
    })

    this.title = new Text({
      text: '',
      style: { fontFamily: DISPLAY_FONT, fontSize: 38, fill: 0xffe2a0, letterSpacing: 5 },
      resolution: 2,
    })
    this.title.anchor.set(0.5)
    this.title.position.set(cx, y + h * 0.4)

    this.line = new Text({
      text: '',
      style: { fontFamily: DISPLAY_FONT, fontSize: 17, fill: 0xfff0d2, letterSpacing: 3 },
      resolution: 2,
    })
    this.line.anchor.set(0.5)
    this.line.position.set(cx, y + h * 0.77)
    // text sits on the lights layer so the bloom catches it
    lights.addChild(this.title, this.line)

    // light falling from the canopy onto the door
    const cone = new Sprite(coneTexture())
    cone.anchor.set(0.5, 0)
    cone.position.set(cx, y + h + 10)
    cone.scale.set(1.5, 0.55)
    cone.tint = palette.lampWhite
    cone.alpha = 0.28
    cone.blendMode = 'add'
    lights.addChild(cone)
  }

  private perimeterPoints(x: number, y: number, w: number, h: number) {
    const pts: [number, number][] = []
    for (let px = x; px <= x + w; px += BULB_GAP) pts.push([px, y])
    for (let py = y + BULB_GAP; py <= y + h; py += BULB_GAP) pts.push([x + w, py])
    for (let px = x + w - BULB_GAP; px >= x; px -= BULB_GAP) pts.push([px, y + h])
    for (let py = y + h - BULB_GAP; py > y; py -= BULB_GAP) pts.push([x, py])
    return pts
  }

  setLines(lines: string[]) {
    this.lines = lines
    this.title.text = lines[0] ?? ''
    this.lineIndex = 0
    this.lineClock = 0
    this.line.text = lines[1] ?? ''
    this.fitLine()
  }

  private fitLine() {
    const max = MARQUEE.width - 60
    this.line.scale.set(1)
    if (this.line.width > max) this.line.scale.set(max / this.line.width)
    this.title.scale.set(1)
    if (this.title.width > max) this.title.scale.set(max / this.title.width)
  }

  update(time: number, dt: number, reducedMotion: boolean) {
    // classic three-phase chase
    const step = reducedMotion ? 0 : Math.floor(time * 7)
    for (const b of this.bulbs) {
      const on = (b.i + step) % 3 !== 0
      const v = on ? 1 : 0.28
      b.core.tint = on ? palette.lampWhite : 0x7a4a26
      b.glow.alpha += (v * 0.75 - b.glow.alpha) * 0.5
    }

    const events = this.lines.slice(1)
    if (events.length < 2) return
    this.lineClock += dt
    const phase = this.lineClock % ROTATE_EVERY
    // flip the letters over like a changeboard
    if (phase > ROTATE_EVERY - 0.3) {
      this.line.scale.y = Math.max(0.01, (ROTATE_EVERY - phase) / 0.3) * this.line.scale.x
    } else if (phase < 0.3 && this.lineClock > ROTATE_EVERY) {
      this.line.scale.y = Math.max(0.01, phase / 0.3) * this.line.scale.x
    } else {
      this.line.scale.y = this.line.scale.x
    }
    const index = Math.floor(this.lineClock / ROTATE_EVERY) % events.length
    if (index !== this.lineIndex) {
      this.lineIndex = index
      this.line.text = events[index] ?? ''
      this.fitLine()
    }
  }
}
