import { Container, Graphics } from 'pixi.js'
import { WORLD } from '../layout'
import { glow } from '../layers/neon'
import type { ThemeId } from '../themes/types'
import type { Ctx } from './context'
import { block, hex, INK, LINE, shade, THIN } from './paint'
import { onFloor, project, ROOM, type P3 } from './projection'
import { potPlant } from './soft'
import type { Variant } from './variants'

const B = ROOM.back
const FRAME = 0x2a1a14
const SILL_Y = 100

/** which bit of the street you see, in street-world units */
const VIEWS: Record<ThemeId, { cx: number; cy: number; h: number; tint: number }> = {
  paris: { cx: 1880, cy: 690, h: 1100, tint: 0xffa040 },
  'new-york': { cx: 560, cy: 660, h: 1200, tint: 0xff9030 },
  venice: { cx: 1700, cy: 760, h: 1080, tint: 0xffb850 },
  tokyo: { cx: 1860, cy: 650, h: 1150, tint: 0xff5a9a },
}

export function pane(v: Variant) {
  return { x0: -v.paneHalf, x1: v.paneHalf, y0: SILL_Y, y1: v.paneTop }
}

/** how far out from the middle the window's furniture (curtains, shutters) reaches */
export function windowReach(v: Variant) {
  return v.paneHalf + (v.glazing === 'french' ? 42 : 28)
}

export function paneRect(v: Variant) {
  const p = pane(v)
  const [x0, y0] = project([p.x0, p.y1, B])
  const [x1, y1] = project([p.x1, p.y0, B])
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

/** the glass outline, grown by `pad` view units */
export function paneShape(
  g: Graphics,
  v: Variant,
  shape: Ctx['layout']['window']['shape'],
  pad = 0,
) {
  const { x, y, w, h } = paneRect(v)
  const X = x - pad
  const Y = y - pad
  const W = w + pad * 2
  const H = h + pad * 2
  if (shape === 'circle') g.circle(X + W / 2, Y + H / 2, Math.min(W, H) / 2)
  else if (shape === 'arch')
    g.moveTo(X, Y + H)
      .lineTo(X, Y + W / 2)
      .arc(X + W / 2, Y + W / 2, W / 2, Math.PI, 0)
      .lineTo(X + W, Y + H)
      .closePath()
  else g.rect(X, Y, W, H)
  return g
}

/** fits the live street into the window, kept inside the world so there are no black edges */
export function placeStreet(street: Container, theme: ThemeId, v: Variant, room: number) {
  const view = VIEWS[theme]
  const { x, y, w, h } = paneRect(v)
  const scale = Math.max(h / view.h, w / (view.h * 1.2))
  const halfW = w / scale / 2
  // each room looks out from a slightly different spot along the block
  const shift = ((room % 4) - 1.5) * 90
  const cx = Math.min(Math.max(view.cx + shift, halfW), WORLD.width - halfW)
  street.scale.set(scale)
  street.position.set(x + w / 2 - cx * scale, y + h / 2 - view.cy * scale)
  return { top: view.cy - h / scale / 2 }
}

export function drawWindow(ctx: Ctx, street: Container | null) {
  const v = ctx.plan.variant
  const { shape, curtains, curtainColor } = ctx.layout.window
  const { x, y, w, h } = paneRect(v)
  const tint = VIEWS[ctx.theme].tint
  const french = v.glazing === 'french'

  if (french) shutters(ctx, v)

  const reveal = ctx.layer('window')
  paneShape(reveal, v, shape, 18).fill(shade(hex(ctx.layout.wall), -0.4))
  paneShape(reveal, v, shape, 18).stroke(LINE)

  const view = ctx.container('window')
  const mask = paneShape(new Graphics(), v, shape).fill(0xffffff)
  const glass = new Container()
  glass.addChild(new Graphics().rect(x, y, w, h).fill(0x04060f))
  if (street) glass.addChild(street)
  // french windows open onto a little iron balcony
  if (french) glass.addChild(balcony(x, y + h * 0.72, w, h * 0.28))
  const bars = new Graphics()
  glazing(bars, v, x, y, w, h)
  bars
    .poly([x + w * 0.12, y + h, x + w * 0.4, y, x + w * 0.48, y, x + w * 0.2, y + h])
    .fill({ color: 0xffffff, alpha: 0.05 })
  glass.addChild(bars)
  glass.mask = mask
  view.addChild(glass, mask)

  const f = ctx.layer('window')
  paneShape(f, v, shape, 4).stroke({ color: FRAME, width: 10 })
  paneShape(f, v, shape, 9).stroke({ ...LINE, width: 2 })

  const sill = ctx.layer('window')
  block(
    sill,
    {
      x0: -v.paneHalf - 18,
      x1: v.paneHalf + 18,
      y0: SILL_Y - 14,
      y1: SILL_Y - 4,
      z0: B - 20,
      z1: B,
    },
    0xe0d0b0,
  )
  potPlant(ctx, sill, [-v.paneHalf + 16, SILL_Y - 4, B - 10], 0.85, v.plants[0]!, 0)
  potPlant(
    ctx,
    sill,
    [v.paneHalf - 18, SILL_Y - 4, B - 10],
    0.75,
    v.plants[1 % v.plants.length]!,
    1,
  )
  if (v.plants.length > 2)
    potPlant(ctx, sill, [v.paneHalf - 46, SILL_Y - 4, B - 9], 0.6, v.plants[2]!, 2)

  ctx.hit('window', (g) => paneShape(g, v, shape, 14))

  // city light falling into the room: the window's shape laid across the floor
  const shaft = new Graphics()
  const p = pane(v)
  const toFloor = (px: number, py: number): [number, number] => [px * 1.3, B - (py - 70) * 0.85]
  const mid = (p.y0 + p.y1) / 2
  const quads =
    shape === 'circle'
      ? [[p.x0 + 24, p.y0 + 20, p.x1 - 24, p.y1 - 20]]
      : [
          [p.x0, p.y0, -3, mid - 3],
          [3, p.y0, p.x1, mid - 3],
          [p.x0, mid + 3, -3, p.y1],
          [3, mid + 3, p.x1, p.y1],
        ]
  for (const [qx0, qy0, qx1, qy1] of quads) {
    shaft
      .poly(
        onFloor(
          [toFloor(qx0!, qy0!), toFloor(qx1!, qy0!), toFloor(qx1!, qy1!), toFloor(qx0!, qy1!)],
          0.6,
        ),
      )
      .fill({ color: tint, alpha: 0.17 })
  }
  ctx.lights.addChild(shaft)
  glow(ctx.lights, x + w / 2, y + h / 2, (w * 2.2) / 256, (h * 2) / 256, tint, 0.24)
  ctx.pool([0, (p.y0 + p.y1) / 2, B], 360, 0.6)
  ctx.pool([0, 0, 230], 280, 0.3)

  if (curtains) drawCurtains(ctx, v, hex(curtainColor))
  if (v.fairy) fairyLights(ctx, v)
}

/** the bars across the glass, by window type */
function glazing(g: Graphics, v: Variant, x: number, y: number, w: number, h: number) {
  const bar = (x0: number, y0: number, x1: number, y1: number, width = 4) =>
    g.moveTo(x0, y0).lineTo(x1, y1).stroke({ color: FRAME, width })
  const cols = (n: number, top: number, bottom: number, width = 3) => {
    for (let i = 1; i < n; i++) bar(x + (w * i) / n, top, x + (w * i) / n, bottom, width)
  }
  const rows = (n: number, top: number, bottom: number, x0 = x, x1 = x + w, width = 3) => {
    for (let i = 1; i < n; i++)
      bar(x0, top + ((bottom - top) * i) / n, x1, top + ((bottom - top) * i) / n, width)
  }
  switch (v.glazing) {
    case 'grid':
      // old factory windows: lots of small panes
      cols(4, y, y + h)
      rows(6, y, y + h)
      break
    case 'sash':
      bar(x, y + h / 2, x + w, y + h / 2, 7)
      cols(3, y, y + h)
      rows(2, y, y + h / 2)
      rows(2, y + h / 2, y + h)
      break
    case 'casement':
      bar(x + w / 2, y, x + w / 2, y + h, 7)
      bar(x, y + h * 0.24, x + w, y + h * 0.24, 6)
      rows(3, y + h * 0.24, y + h, x, x + w)
      break
    case 'french':
      bar(x + w / 2, y, x + w / 2, y + h, 8)
      bar(x, y + h * 0.18, x + w, y + h * 0.18, 6)
      rows(5, y + h * 0.18, y + h, x, x + w)
      break
    case 'picture':
      bar(x, y + h * 0.2, x + w, y + h * 0.2, 4)
      bar(x + w / 2, y, x + w / 2, y + h * 0.2, 3)
      break
  }
}

function balcony(x: number, y: number, w: number, h: number) {
  const g = new Graphics()
  g.rect(x, y, w, 4).fill(INK)
  for (let bx = x + 6; bx < x + w; bx += 9) g.rect(bx, y, 2, h).fill(INK)
  for (let bx = x + 12; bx < x + w - 10; bx += 24)
    g.circle(bx + 4, y + h * 0.45, 6).stroke({ color: INK, width: 1.6 })
  return g
}

/** louvred shutters folded back against the wall either side of french windows */
function shutters(ctx: Ctx, v: Variant) {
  const g = ctx.layer('window')
  const colour = 0x4a7a7a
  for (const side of [-1, 1]) {
    const xa = side * (v.paneHalf + 4)
    const xb = side * (v.paneHalf + 40)
    const [ax, ay] = project([Math.min(xa, xb), v.paneTop, B])
    const [bx, by] = project([Math.max(xa, xb), SILL_Y - 4, B])
    g.rect(ax, ay, bx - ax, by - ay)
      .fill(colour)
      .stroke(LINE)
    g.rect(ax + 3, ay + 3, bx - ax - 6, by - ay - 6).stroke({
      color: shade(colour, -0.35),
      width: 1.2,
    })
    for (let ly = ay + 8; ly < by - 6; ly += 6)
      g.moveTo(ax + 5, ly)
        .lineTo(bx - 5, ly + 2)
        .stroke({ color: shade(colour, -0.4), width: 1.2 })
  }
}

function drawCurtains(ctx: Ctx, v: Variant, color: number) {
  const g = ctx.layer('window')
  const z = B - 10
  const top = v.paneTop + 24
  const reach = windowReach(v)
  const [rx0, ry] = project([-reach - 6, top + 4, z])
  const [rx1] = project([reach + 6, top + 4, z])
  g.moveTo(rx0, ry).lineTo(rx1, ry).stroke({ color: 0xc89a3a, width: 4 })
  g.circle(rx0, ry, 5).circle(rx1, ry, 5).fill(0xd9a54a).stroke(THIN)
  // french windows get sheers inside the frame; everything else heavy drapes either side
  const sheer = v.glazing === 'french'
  for (const side of [-1, 1]) {
    const outer = side * reach
    const inner = side * (v.paneHalf - (sheer ? 40 : 18))
    const tieY = SILL_Y + (v.paneTop - SILL_Y) * 0.42
    const tieX = side * (v.paneHalf + (sheer ? -8 : 10))
    const pts: P3[] = []
    // the top edge, gathered on the rod
    for (let i = 0; i <= 8; i++) pts.push([outer + ((inner - outer) * i) / 8, top, z])
    const [ax, ay] = project(pts[0]!)
    const [bx, by] = project(pts[8]!)
    const [tx, ty] = project([tieX, tieY, z])
    const [hx, hy] = project([inner * 0.98, 6, z - 6])
    const [ox, oy] = project([outer, 2, z - 6])
    const shape = (d: Graphics) => {
      d.moveTo(ax, ay)
        .lineTo(bx, by)
        .bezierCurveTo(bx, by + (ty - by) * 0.6, tx + side * 4, ty - 20, tx, ty)
        .bezierCurveTo(tx - side * 4, ty + 30, hx, hy - 40, hx, hy)
        // a hem that pools a little on the floor
        .quadraticCurveTo((hx + ox) / 2, hy + 8, ox, oy)
        .closePath()
    }
    shape(g)
    g.fill({ color, alpha: sheer ? 0.55 : 1 })
    shape(g)
    g.stroke({ ...LINE, alpha: sheer ? 0.4 : 0.9 })
    for (let i = 1; i < 6; i++) {
      const k = i / 6
      const fx = ax + (bx - ax) * k
      const fb = ox + (hx - ox) * k
      g.moveTo(fx, ay + 4)
        .bezierCurveTo(fx, ay + 60, tx + (fx - tx) * 0.2, ty - 10, tx + (fb - tx) * 0.15, ty + 6)
        .bezierCurveTo(tx + (fb - tx) * 0.4, ty + 50, fb, hy - 50, fb, (hy + oy) / 2)
        .stroke({ color: shade(color, i % 2 ? -0.4 : 0.25), width: 2, alpha: sheer ? 0.4 : 0.7 })
    }
    g.ellipse(tx, ty, 10, 5).fill(0xd9a54a).stroke(THIN)
  }
}

/** strings of warm bulbs looped over the window and along the top of the wall */
function fairyLights(ctx: Ctx, v: Variant) {
  const g = ctx.layer()
  const lit = new Graphics()
  const colours = [0xffd27a, 0xff9a5a, 0xffe6a8, 0xff7a8a]
  let n = 0
  const strand = (pts: P3[], sag: number) => {
    const line: number[] = []
    for (let s = 0; s < pts.length - 1; s++) {
      const [a, b] = [pts[s]!, pts[s + 1]!]
      for (let i = 0; i <= 12; i++) {
        const t = i / 12
        const p: P3 = [
          a[0] + (b[0] - a[0]) * t,
          a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag,
          a[2] + (b[2] - a[2]) * t,
        ]
        const [px, py] = project(p)
        line.push(px, py)
        if (i % 2 === 1) {
          const c = colours[n++ % colours.length]!
          g.circle(px, py + 3, 2.3).fill(c)
          lit.circle(px, py + 3, 3.2).fill({ color: c, alpha: 0.9 })
        }
      }
    }
    g.poly(line, false).stroke({ color: INK, width: 1, alpha: 0.8 })
  }
  const top = v.paneTop + 40
  strand(
    [
      [-195, top + 10, B - 2],
      [-60, top, B - 2],
      [60, top, B - 2],
      [195, top + 10, B - 2],
    ],
    16,
  )
  // and a loose one across the corner of the ceiling
  strand(
    [
      [ROOM.left + 2, ROOM.ceiling - 30, 120],
      [ROOM.left + 2, ROOM.ceiling - 30, 380],
    ],
    26,
  )
  strand(
    [
      [ROOM.right - 2, ROOM.ceiling - 34, 380],
      [ROOM.right - 2, ROOM.ceiling - 34, 140],
    ],
    22,
  )
  ctx.lights.addChild(lit)
  ctx.anim.push((t) => {
    lit.alpha = 0.75 + Math.sin(t * 1.7) * 0.15 + Math.sin(t * 5.3) * 0.05
  })
}
