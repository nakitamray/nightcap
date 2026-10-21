import { Container, Graphics } from 'pixi.js'
import { WORLD } from '../layout'
import { glow } from '../layers/neon'
import type { ThemeId } from '../themes/types'
import { at, type Ctx } from './context'
import { block, hex, INK, LINE, shade, THIN } from './paint'
import { flat, onFloor, project, ROOM, type P3 } from './projection'

const B = ROOM.back
export const PANE = { x0: -85, x1: 85, y0: 95, y1: 255 }
const FRAME = 0x2a1a14

/** which bit of the street you see out of the window, in street-world units */
const VIEWS: Record<ThemeId, { cx: number; cy: number; h: number; tint: number }> = {
  paris: { cx: 1880, cy: 700, h: 1080, tint: 0xffa040 },
  'new-york': { cx: 560, cy: 690, h: 1160, tint: 0xff9030 },
  venice: { cx: 1700, cy: 790, h: 1040, tint: 0xffb850 },
  tokyo: { cx: 1860, cy: 660, h: 1120, tint: 0xff5a9a },
}

export function paneRect() {
  const [x0, y0] = project([PANE.x0, PANE.y1, B])
  const [x1, y1] = project([PANE.x1, PANE.y0, B])
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

/** draws the glass outline, grown by `pad` view units */
export function paneShape(g: Graphics, shape: Ctx['layout']['window']['shape'], pad = 0) {
  const { x, y, w, h } = paneRect()
  const X = x - pad
  const Y = y - pad
  const W = w + pad * 2
  const H = h + pad * 2
  if (shape === 'circle') {
    const r = Math.min(W, H) / 2
    g.circle(X + W / 2, Y + H / 2, r)
  } else if (shape === 'arch') {
    const r = W / 2
    g.moveTo(X, Y + H)
      .lineTo(X, Y + r)
      .arc(X + r, Y + r, r, Math.PI, 0)
      .lineTo(X + W, Y + H)
      .closePath()
  } else {
    g.rect(X, Y, W, H)
  }
  return g
}

/**
 * Fits the live street into the window: scaled so the chosen slice of the
 * block fills the glass, kept inside the world so there are no black edges.
 */
export function placeStreet(street: Container, theme: ThemeId) {
  const v = VIEWS[theme]
  const { x, y, w, h } = paneRect()
  const scale = Math.max(h / v.h, w / (v.h * 1.4))
  const halfW = w / scale / 2
  const cx = Math.min(Math.max(v.cx, halfW), WORLD.width - halfW)
  street.scale.set(scale)
  street.position.set(x + w / 2 - cx * scale, y + h / 2 - v.cy * scale)
  return { top: v.cy - h / scale / 2 }
}

export function drawWindow(ctx: Ctx, street: Container | null) {
  const { shape, curtains, curtainColor } = ctx.layout.window
  const { x, y, w, h } = paneRect()
  const tint = VIEWS[ctx.theme].tint

  // deep reveal round the glass
  const reveal = ctx.layer('window')
  paneShape(reveal, shape, 16).fill(shade(hex(ctx.layout.wall), -0.45))
  paneShape(reveal, shape, 16).stroke(LINE)

  const view = ctx.container('window')
  const mask = paneShape(new Graphics(), shape).fill(0xffffff)
  const glass = new Container()
  glass.addChild(new Graphics().rect(x, y, w, h).fill(0x04060f))
  if (street) glass.addChild(street)
  glass.mask = mask
  view.addChild(glass, mask)

  // frame and glazing bars over the view
  const f = ctx.layer('window')
  paneShape(f, shape, 4).stroke({ color: FRAME, width: 9 })
  paneShape(f, shape, 8).stroke({ ...LINE, width: 2 })
  const bar = { color: FRAME, width: 5 }
  if (shape === 'circle') {
    const r = Math.min(w, h) / 2
    f.moveTo(x + w / 2, y + h / 2 - r)
      .lineTo(x + w / 2, y + h / 2 + r)
      .stroke(bar)
    f.moveTo(x + w / 2 - r, y + h / 2)
      .lineTo(x + w / 2 + r, y + h / 2)
      .stroke(bar)
  } else {
    const spring = shape === 'arch' ? y + w / 2 : y
    f.moveTo(x + w / 2, spring)
      .lineTo(x + w / 2, y + h)
      .stroke(bar)
    f.moveTo(x, y + h * 0.62)
      .lineTo(x + w, y + h * 0.62)
      .stroke(bar)
    if (shape === 'arch') {
      // a fanlight in the top of the arch
      f.moveTo(x, spring)
        .lineTo(x + w, spring)
        .stroke(bar)
      for (const a of [0.25, 0.5, 0.75]) {
        const ang = Math.PI + a * Math.PI
        f.moveTo(x + w / 2, spring)
          .lineTo(x + w / 2 + Math.cos(ang) * (w / 2), spring + Math.sin(ang) * (w / 2))
          .stroke({ ...bar, width: 3 })
      }
    }
  }
  // a streak of reflection on the glass
  const shine = new Graphics()
  shine
    .poly([
      x + w * 0.12,
      y + h,
      x + w * 0.4,
      y + h * 0.1,
      x + w * 0.48,
      y + h * 0.1,
      x + w * 0.2,
      y + h,
    ])
    .fill({ color: 0xffffff, alpha: 0.06 })
  shine.mask = paneShape(new Graphics(), shape).fill(0xffffff)
  view.addChild(shine, shine.mask)

  // sill, with a couple of pots on it
  const sill = ctx.layer('window')
  block(
    sill,
    { x0: PANE.x0 - 16, x1: PANE.x1 + 16, y0: PANE.y0 - 14, y1: PANE.y0 - 4, z0: B - 18, z1: B },
    0xd8c8a8,
  )
  potPlant(ctx, sill, [PANE.x0 + 12, PANE.y0 - 4, B - 9], 0.8, 0)
  potPlant(ctx, sill, [PANE.x1 - 14, PANE.y0 - 4, B - 9], 0.7, 1)

  ctx.hit('window', (g) => paneShape(g, shape, 12))

  // city light falling into the room: the window's shape laid across the floor
  const shaft = new Graphics()
  const toFloor = (px: number, py: number): [number, number] => [px * 1.35, B - (py - 60) * 1.2]
  const quads =
    shape === 'circle'
      ? [[PANE.x0 + 20, PANE.y0 + 10, PANE.x1 - 20, PANE.y1 - 10]]
      : [
          [PANE.x0, PANE.y0, -3, 150],
          [3, PANE.y0, PANE.x1, 150],
          [PANE.x0, 156, -3, PANE.y1],
          [3, 156, PANE.x1, PANE.y1],
        ]
  for (const [qx0, qy0, qx1, qy1] of quads) {
    shaft
      .poly(
        onFloor(
          [toFloor(qx0!, qy0!), toFloor(qx1!, qy0!), toFloor(qx1!, qy1!), toFloor(qx0!, qy1!)],
          0.6,
        ),
      )
      .fill({ color: tint, alpha: 0.2 })
  }
  ctx.lights.addChild(shaft)
  glow(ctx.lights, x + w / 2, y + h / 2, (w * 2.4) / 256, (h * 2.4) / 256, tint, 0.28)
  ctx.pool([0, 175, B], 320, 0.55)
  ctx.pool([0, 0, 240], 260, 0.35)

  if (curtains) drawCurtains(ctx, hex(curtainColor))
  drawFairyLights(ctx)
}

function drawCurtains(ctx: Ctx, color: number) {
  const g = ctx.layer('window')
  const z = B - 10
  const top = PANE.y1 + 26
  const bottom = 30
  // brass rod with finials
  const [rx0, ry] = project([PANE.x0 - 42, top + 4, z])
  const [rx1] = project([PANE.x1 + 42, top + 4, z])
  g.moveTo(rx0, ry).lineTo(rx1, ry).stroke({ color: 0xc89a3a, width: 4 })
  g.circle(rx0, ry, 5).circle(rx1, ry, 5).fill(0xd9a54a).stroke(THIN)

  for (const side of [-1, 1]) {
    // gathered at a tie-back a third of the way down, flaring out below it
    const outer = side < 0 ? PANE.x0 - 36 : PANE.x1 + 36
    const inner = side < 0 ? PANE.x0 + 16 : PANE.x1 - 16
    const tie = 120
    const tieX = side < 0 ? PANE.x0 - 20 : PANE.x1 + 20
    const pts: P3[] = [
      [outer, top, z],
      [inner, top, z],
      [tieX + side * -6, tie, z],
      [inner + side * -10, bottom, z],
      [outer, bottom, z],
    ]
    const [ax, ay] = project(pts[0]!)
    const [bx, by] = project(pts[1]!)
    const [tx, ty] = project(pts[2]!)
    const [cx, cy] = project(pts[3]!)
    const [dx, dy] = project(pts[4]!)
    g.moveTo(ax, ay)
      .lineTo(bx, by)
      .quadraticCurveTo(bx, (by + ty) / 2, tx, ty)
      .quadraticCurveTo(tx, (ty + cy) / 2, cx, cy)
      .lineTo(dx, dy)
      .closePath()
      .fill(color)
    g.stroke(LINE)
    // folds
    for (let i = 1; i < 5; i++) {
      const k = i / 5
      const fx = ax + (bx - ax) * k
      const fb = dx + (cx - dx) * k
      g.moveTo(fx, ay + 4)
        .quadraticCurveTo(tx + (fx - tx) * 0.3, ty, fb, cy)
        .stroke({ color: shade(color, -0.45), width: 2.2, alpha: 0.7 })
    }
    g.moveTo(ax + (bx - ax) * 0.5, ay + 4)
      .quadraticCurveTo(tx, ty, (cx + dx) / 2, cy)
      .stroke({ color: shade(color, 0.35), width: 1.6, alpha: 0.5 })
    // tie-back
    g.ellipse(tx, ty, 9, 4).fill(0xd9a54a).stroke(THIN)
  }
}

function drawFairyLights(ctx: Ctx) {
  const g = ctx.layer()
  const bulbs: { x: number; y: number; c: number }[] = []
  const colours = [0xffd27a, 0xff8a5a, 0xffe6a8, 0xff6a8a]
  const loops: [number, number][] = [
    [-195, -60],
    [-60, 60],
    [60, 195],
  ]
  for (const [u0, u1] of loops) {
    const pts: number[] = []
    for (let i = 0; i <= 14; i++) {
      const t = i / 14
      const u = u0 + (u1 - u0) * t
      const v = 268 - Math.sin(t * Math.PI) * 18
      const [px, py] = project([u, v, B - 2])
      pts.push(px, py)
      if (i % 2 === 1)
        bulbs.push({ x: px, y: py + 3, c: colours[(bulbs.length * 3) % colours.length]! })
    }
    g.poly(pts, false).stroke({ color: INK, width: 1, alpha: 0.8 })
  }
  const lit = new Graphics()
  for (const b of bulbs) {
    g.circle(b.x, b.y, 2.4).fill(b.c)
    lit.circle(b.x, b.y, 3.2).fill({ color: b.c, alpha: 0.9 })
  }
  ctx.lights.addChild(lit)
  ctx.anim.push((t) => {
    lit.alpha = 0.75 + Math.sin(t * 1.7) * 0.15 + Math.sin(t * 5.3) * 0.05
  })
}

/** a little pot with something leafy in it; `kind` picks the plant */
export function potPlant(ctx: Ctx, g: Graphics, p: P3, size: number, kind: number) {
  const { x, y, s } = at(p)
  const k = s * size
  const pot = [0xb8643a, 0x2f6b66, 0xe8c25a, 0xd8c8a8][kind % 4]!
  g.moveTo(x - 9 * k, y - 16 * k)
    .lineTo(x + 9 * k, y - 16 * k)
    .lineTo(x + 7 * k, y)
    .lineTo(x - 7 * k, y)
    .closePath()
    .fill(pot)
    .stroke(THIN)
  g.rect(x - 10 * k, y - 18 * k, 20 * k, 4 * k)
    .fill(shade(pot, -0.2))
    .stroke(THIN)
  const leaf = [0x3a7a3a, 0x5a9a3a, 0x2e5a2e][kind % 3]!
  if (kind % 3 === 1) {
    // cactus
    g.roundRect(x - 4 * k, y - 44 * k, 8 * k, 28 * k, 4 * k)
      .fill(leaf)
      .stroke(THIN)
    g.roundRect(x + 3 * k, y - 34 * k, 8 * k, 5 * k, 2 * k).fill(leaf)
    g.roundRect(x + 7 * k, y - 40 * k, 4 * k, 10 * k, 2 * k)
      .fill(leaf)
      .stroke(THIN)
  } else {
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.38
      const len = (18 + (i % 3) * 5) * k
      const lx = x + Math.cos(a) * len * 0.7
      const ly = y - 17 * k + Math.sin(a) * len
      g.moveTo(x, y - 17 * k)
        .lineTo(lx, ly)
        .stroke({ color: shade(leaf, -0.3), width: 1 })
      g.ellipse(lx, ly, 4.5 * k, 8 * k)
        .fill(i % 2 ? leaf : shade(leaf, 0.2))
        .stroke({ ...THIN, width: 0.8 })
    }
  }
}
