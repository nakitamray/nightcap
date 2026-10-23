import { Application, Container, Graphics, Sprite } from 'pixi.js'
import { PaperFilter } from '../filters/PaperFilter'
import { palette } from '../palette'
import { shade } from '../room/paint'
import { glowTexture } from '../textures'
import type { Avatar } from './avatar'
import { drawCharacter, type Pose } from './draw'

// the little corner of a room the character maker shows you standing in
const W = 400
const H = 520
const FLOOR = 430
const INK = palette.ink
const LINE = { color: INK, width: 1.8, alpha: 0.9, join: 'round' as const }

/**
 * One person in a warm, lamp-lit nook, for the character maker. Redraws only
 * when the avatar changes; the rest of the time it just breathes, slowly.
 */
export class AvatarPreview {
  private view = new Container()
  private person: Container | null = null
  private ticks: ((t: number) => void)[] = []
  private paper = new PaperFilter()
  private time = 0
  private destroyed = false

  private constructor(
    private app: Application,
    private avatar: Avatar,
    private pose: Pose,
  ) {}

  static async create(host: HTMLElement, avatar: Avatar, pose: Pose = 'stand') {
    const app = new Application()
    await app.init({
      resizeTo: host,
      preference: 'webgl',
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      background: 0x0a0510,
    })
    const preview = new AvatarPreview(app, avatar, pose)
    preview.build()
    host.appendChild(app.canvas)
    return preview
  }

  set(avatar: Avatar) {
    this.avatar = avatar
    this.drawPerson()
  }

  private build() {
    const { app } = this
    // breathing doesn't need sixty frames a second
    app.ticker.maxFPS = 24
    app.stage.addChild(this.view)
    app.stage.filters = [this.paper]
    app.stage.filterArea = app.screen
    this.view.addChild(nook())
    this.drawPerson()
    this.view.addChild(lamplight())
    this.fit(app.screen.width, app.screen.height)
    app.renderer.on('resize', (w: number, h: number) => this.fit(w, h))
    app.ticker.add((t) => {
      if (this.destroyed) return
      this.time += Math.min(t.deltaMS, 100) / 1000
      this.paper.time = this.time
      for (const tick of this.ticks) tick(this.time)
    })
  }

  private drawPerson() {
    this.person?.destroy({ children: true })
    this.ticks = []
    const p = drawCharacter(this.avatar, {
      pose: this.pose,
      animate: (tick) => this.ticks.push(tick),
    })
    p.scale.set(1.45)
    p.position.set(W / 2, FLOOR + 14)
    // in front of the room, behind the lamp's glow
    this.view.addChildAt(p, 1)
    this.person = p
  }

  private fit(width: number, height: number) {
    const k = Math.min(width / W, height / H)
    this.view.scale.set(k)
    this.view.position.set((width - W * k) / 2, (height - H * k) / 2)
    this.paper.setScreen(width, height)
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.app.destroy({ removeView: true }, { children: true })
  }
}

/** the wall, floor, a rug, a lamp and a plant */
function nook() {
  const c = new Container()
  const g = new Graphics()
  const wall = 0x2f6b66
  // wall with a picture rail and the skirting
  g.rect(-200, -200, W + 400, FLOOR + 200).fill(wall)
  g.rect(-200, 120, W + 400, 6).fill(shade(wall, -0.25))
  g.rect(-200, FLOOR - 16, W + 400, 16)
    .fill(shade(wall, -0.4))
    .stroke(LINE)
  // a framed print
  g.rect(272, 168, 70, 92).fill(0xf2e2bd).stroke(LINE)
  g.rect(280, 176, 54, 76).fill(0xc8302a)
  g.circle(307, 204, 14).fill(0xe8c25a)
  g.rect(280, 230, 54, 22).fill(0x2a4a8a)
  // floorboards running away from you
  g.rect(-200, FLOOR, W + 400, 200).fill(0x6a3a22)
  for (let x = -200; x < W + 200; x += 38)
    g.moveTo(W / 2 + (x - W / 2) * 0.6, FLOOR)
      .lineTo(x, H + 40)
      .stroke({ color: INK, width: 1, alpha: 0.35 })
  // the rug
  g.ellipse(W / 2, FLOOR + 30, 150, 34)
    .fill(0xa8201a)
    .stroke(LINE)
  g.ellipse(W / 2, FLOOR + 30, 128, 26).stroke({ color: 0xe8c25a, width: 3 })
  g.ellipse(W / 2, FLOOR + 30, 96, 18).fill(0xc8642e)
  c.addChild(g)

  // a floor lamp with a pleated shade
  const lamp = new Graphics()
  lamp
    .ellipse(64, FLOOR + 6, 22, 6)
    .fill(0x1e1a1c)
    .stroke(LINE)
  lamp.rect(62, 180, 4, FLOOR - 176).fill(0x2a1a10)
  lamp.poly([38, 182, 90, 182, 78, 130, 50, 130]).fill(0xf2d08a).stroke(LINE)
  for (const x of [52, 60, 68, 76])
    lamp
      .moveTo(x, 132)
      .lineTo(x - 4 + (x - 64) * 0.2, 180)
      .stroke({ color: INK, width: 0.8, alpha: 0.3 })
  c.addChild(lamp)

  // a big leafy plant in a pot
  const plant = new Graphics()
  plant
    .poly([316, FLOOR + 10, 364, FLOOR + 10, 370, FLOOR - 40, 310, FLOOR - 40])
    .fill(0xc2501e)
    .stroke(LINE)
  const leaves: [number, number, number][] = [
    [-0.9, 70, 0x3a7a3a],
    [-0.4, 96, 0x2f6b3a],
    [0.1, 84, 0x4a8a3a],
    [0.6, 92, 0x3a7a3a],
    [1.0, 66, 0x2f6b3a],
    [-0.2, 120, 0x4a8a3a],
  ]
  for (const [a, len, col] of leaves) {
    const ex = 340 + Math.sin(a) * len
    const ey = FLOOR - 40 - Math.cos(a) * len
    plant
      .moveTo(340, FLOOR - 40)
      .lineTo(ex, ey)
      .stroke({ color: 0x2a4a1e, width: 2 })
    plant.ellipse(ex, ey, 14, 26).fill(col).stroke(LINE)
  }
  c.addChild(plant)

  // night falls on everything but the pool of light round the lamp
  const dark = new Graphics()
    .rect(-200, -200, W + 400, H + 400)
    .fill({ color: 0x0a0418, alpha: 0.32 })
  c.addChild(dark)
  return c
}

function lamplight() {
  const c = new Container()
  const glow = new Sprite(glowTexture())
  glow.anchor.set(0.5)
  glow.position.set(64, 170)
  glow.scale.set(2.2)
  glow.tint = 0xffc070
  glow.alpha = 0.7
  glow.blendMode = 'add'
  const pool = new Sprite(glowTexture())
  pool.anchor.set(0.5)
  pool.position.set(150, FLOOR - 40)
  pool.scale.set(3.2, 2.4)
  pool.tint = 0xff9a4a
  pool.alpha = 0.22
  pool.blendMode = 'add'
  c.addChild(pool, glow)
  return c
}
