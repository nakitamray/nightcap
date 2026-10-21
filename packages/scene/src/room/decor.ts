import { Container, Graphics, Text } from 'pixi.js'
import { SIGN_FONT } from '../fonts'
import { glow } from '../layers/neon'
import type { ThemeId } from '../themes/types'
import { at, type Ctx } from './context'
import { candle } from './extras'
import { shelfBox } from './furniture'
import { block, hex, INK, LINE, shade, THIN } from './paint'
import type { WallSlot } from './plan'
import { paintPoster, POSTER_H } from './posters'
import { flat, pictureMatrix, project, ROOM, scaleAt, type P3 } from './projection'
import { potPlant, vines } from './soft'
import { windowReach } from './window'

const { left: L, right: R, back: B } = ROOM
const BRASS = 0xd9a54a

// -- the record and the map, either side of the window -----------------------

export function drawVinyl(ctx: Ctx) {
  // in the gap between the left wall and the curtains
  const reach = windowReach(ctx.plan.variant)
  const room = Math.min(30, (198 - reach) / 2 - 4)
  // high up, so nothing standing in the corner hides it
  const [cx, cy] = project([-(198 + reach) / 2, 374, B])
  const r = room * scaleAt(B)
  const g = ctx.layer('vinyl')
  // the sleeve hanging behind it, slightly crooked
  const sleeve = new Graphics()
  sleeve
    .rect(-r * 1.05, -r * 1.05, r * 2.1, r * 2.1)
    .fill(0xe8c25a)
    .stroke(LINE)
  sleeve.circle(-r * 0.3, -r * 0.2, r * 0.55).fill(0xc8302a)
  sleeve.rect(-r * 0.9, r * 0.55, r * 1.2, r * 0.2).fill(0x1e1a1c)
  sleeve.position.set(cx - r * 0.35, cy - r * 0.25)
  sleeve.rotation = -0.08
  ctx.container('vinyl').addChild(sleeve)

  const disc = new Graphics()
  disc.circle(0, 0, r).fill(0x121014).stroke(LINE)
  for (const k of [0.88, 0.76, 0.64, 0.52])
    disc.circle(0, 0, r * k).stroke({ color: 0x2c2628, width: 1 })
  disc.circle(0, 0, r * 0.34).fill(0xc8302a)
  disc.circle(r * 0.1, -r * 0.1, r * 0.1).fill(0xf2e2bd)
  disc.circle(0, 0, 1.6).fill(0xe8d5b0)
  disc
    .moveTo(-r * 0.75, -r * 0.45)
    .arc(0, 0, r * 0.87, Math.PI * 1.15, Math.PI * 1.45)
    .stroke({ color: 0xffffff, width: 1.5, alpha: 0.2 })
  disc.position.set(cx, cy)
  ctx.container('vinyl').addChild(disc)

  if (ctx.playing) {
    glow(ctx.lights, cx, cy, (r * 4) / 128, (r * 4) / 128, 0xff6a3a, 0.7)
    const ring = new Graphics().circle(cx, cy, r + 3).stroke({ color: 0xffb04a, width: 3 })
    ctx.lights.addChild(ring)
    const notes = new Container()
    ctx.lights.addChild(notes)
    const marks = [0, 1, 2].map((i) => {
      const n = new Graphics()
      n.circle(0, 0, 2.6).fill(0xffd27a)
      n.moveTo(2.4, 0).lineTo(2.4, -10).lineTo(7, -8).stroke({ color: 0xffd27a, width: 1.4 })
      notes.addChild(n)
      return { n, phase: i / 3 }
    })
    ctx.pool([-(198 + reach) / 2, 374, B], 160, 0.6)
    ctx.anim.push((t, dt) => {
      disc.rotation += dt * 3.5
      ring.alpha = 0.6 + Math.sin(t * 4) * 0.3
      for (const m of marks) {
        const k = (t * 0.35 + m.phase) % 1
        m.n.position.set(cx + r + 6 + Math.sin(k * 9) * 5, cy - k * 70)
        m.n.alpha = Math.sin(k * Math.PI)
      }
    })
  }
  ctx.hit('vinyl', (h) => h.circle(cx, cy, r * 1.2))
}

/** a hand-traced, deliberately loose world map */
const LANDS: [number, number][][] = [
  [
    [-168, 66],
    [-140, 70],
    [-110, 73],
    [-85, 70],
    [-75, 62],
    [-62, 58],
    [-55, 50],
    [-66, 44],
    [-75, 36],
    [-81, 30],
    [-81, 25],
    [-90, 29],
    [-97, 26],
    [-97, 20],
    [-87, 21],
    [-83, 10],
    [-78, 8],
    [-92, 15],
    [-105, 20],
    [-112, 30],
    [-117, 32],
    [-124, 40],
    [-124, 48],
    [-135, 58],
    [-150, 60],
    [-165, 60],
  ],
  [
    [-50, 60],
    [-42, 60],
    [-20, 70],
    [-20, 80],
    [-60, 82],
    [-70, 77],
    [-55, 68],
  ],
  [
    [-78, 8],
    [-60, 10],
    [-50, 0],
    [-35, -6],
    [-40, -22],
    [-48, -28],
    [-58, -38],
    [-65, -42],
    [-68, -55],
    [-75, -50],
    [-72, -35],
    [-71, -18],
    [-80, -5],
    [-80, 2],
  ],
  [
    [-10, 36],
    [-9, 43],
    [-2, 44],
    [-5, 48],
    [2, 51],
    [8, 54],
    [10, 58],
    [5, 62],
    [15, 69],
    [28, 71],
    [40, 67],
    [40, 60],
    [30, 55],
    [28, 45],
    [25, 40],
    [20, 40],
    [15, 45],
    [12, 44],
    [18, 40],
    [10, 44],
    [3, 43],
    [-1, 37],
  ],
  [
    [-5, 50],
    [1, 51],
    [0, 53],
    [-3, 56],
    [-5, 58],
    [-6, 56],
    [-3, 54],
    [-5, 52],
  ],
  [
    [-17, 21],
    [-10, 30],
    [-5, 36],
    [10, 37],
    [20, 32],
    [32, 31],
    [35, 28],
    [43, 12],
    [51, 12],
    [40, -2],
    [40, -15],
    [35, -25],
    [20, -35],
    [17, -29],
    [12, -17],
    [13, -5],
    [8, 4],
    [-8, 5],
    [-15, 10],
  ],
  [
    [28, 45],
    [30, 55],
    [40, 60],
    [40, 67],
    [60, 70],
    [80, 73],
    [105, 78],
    [140, 72],
    [180, 68],
    [180, 65],
    [160, 60],
    [140, 55],
    [135, 45],
    [128, 38],
    [122, 30],
    [120, 22],
    [108, 20],
    [106, 10],
    [100, 13],
    [98, 8],
    [100, 2],
    [97, 16],
    [92, 22],
    [80, 15],
    [77, 8],
    [72, 20],
    [66, 25],
    [57, 25],
    [52, 28],
    [56, 24],
    [59, 22],
    [52, 16],
    [44, 12],
    [38, 20],
    [35, 28],
    [35, 36],
  ],
  [
    [130, 31],
    [135, 34],
    [140, 36],
    [142, 40],
    [141, 45],
    [145, 44],
    [140, 41],
    [136, 37],
    [132, 34],
  ],
  [
    [114, -22],
    [122, -18],
    [130, -12],
    [137, -12],
    [142, -11],
    [146, -19],
    [153, -26],
    [150, -37],
    [140, -38],
    [132, -32],
    [115, -34],
  ],
  [
    [167, -46],
    [174, -41],
    [178, -38],
    [173, -35],
    [172, -41],
  ],
  [
    [44, -25],
    [47, -25],
    [50, -15],
    [49, -12],
    [44, -17],
  ],
]

export function drawMap(ctx: Ctx) {
  const left = windowReach(ctx.plan.variant) + 6
  const tall = (197 - left) * 1.5
  const [x0, y0] = project([left, 330 + tall / 2, B])
  const [x1, y1] = project([197, 330 - tall / 2, B])
  const w = x1 - x0
  const h = y1 - y0
  const g = ctx.layer('map')
  g.rect(x0 + 3, y0 + 4, w, h).fill({ color: INK, alpha: 0.4 })
  g.rect(x0, y0, w, h).fill(0xf0dcb0).stroke(LINE)
  // tape at the corners
  for (const [tx, ty] of [
    [x0, y0],
    [x1, y0],
  ])
    g.rect(tx! - 6, ty! - 3, 12, 6).fill({ color: 0xf2e2bd, alpha: 0.8 })
  const mx = x0 + 5
  const my = y0 + 6
  const mw = w - 10
  const mh = mw * 0.62
  g.rect(mx, my, mw, mh).fill(0x2f6b8a)
  const px = (lon: number) => mx + ((lon + 170) / 360) * mw
  const py = (lat: number) => my + ((82 - lat) / 140) * mh
  for (const coast of LANDS) {
    g.poly(coast.flatMap(([lon, lat]) => [px(lon), py(lat)]))
      .fill(0xe8c27a)
      .stroke({ color: 0x5a3a20, width: 0.5 })
  }
  for (const lat of [-30, 0, 30, 60])
    g.moveTo(mx, py(lat))
      .lineTo(mx + mw, py(lat))
      .stroke({ color: 0xf2e2bd, width: 0.4, alpha: 0.4 })
  const title = new Text({
    text: 'OUR PEOPLE',
    style: { fontFamily: SIGN_FONT, fontSize: 8, fill: 0x5a2a1c, letterSpacing: 1 },
    resolution: 4,
  })
  title.anchor.set(0.5)
  title.position.set(x0 + w / 2, my + mh + (y1 - my - mh) / 2)
  ctx.container('map').addChild(title)

  const pins = new Graphics()
  for (const p of ctx.pins) {
    const r = p.me ? 2.6 : 1.8
    pins
      .circle(px(p.lon), py(p.lat), r)
      .fill(p.me ? 0xff3a2a : 0xf2e2bd)
      .stroke({ ...THIN, width: 0.6 })
    if (p.me) glow(ctx.lights, px(p.lon), py(p.lat), 0.12, 0.12, 0xff3a2a, 0.9)
  }
  ctx.container('map').addChild(pins)
  ctx.hit('map', (hh) => hh.rect(x0, y0, w, h))
}

// -- side walls --------------------------------------------------------------

/** corners of a slot on a side wall, as you'd read it facing that wall */
function slotCorners(slot: WallSlot, inset = 0) {
  const X = slot.wall === 'left' ? L + 1 : R - 1
  // facing the left wall the front of the room is on your left; facing the right wall, the back is
  const zl = slot.wall === 'left' ? slot.z0 + inset : slot.z1 - inset
  const zr = slot.wall === 'left' ? slot.z1 - inset : slot.z0 + inset
  return { X, zl, zr }
}

/** your posters, one per free spot on the walls, each hung a little differently */
export function drawPosters(ctx: Ctx) {
  const area = ctx.container('posters')
  const slots = ctx.plan.posters
  const posters = ctx.layout.posters
  posters.slice(0, slots.length).forEach((design, i) => {
    const slot = slots[i]!
    const { X, zl, zr } = slotCorners(slot)
    // fit a 100 x 140 sheet in the middle of the slot
    const availZ = slot.z1 - slot.z0 - 14
    const availY = slot.y1 - slot.y0 - 8
    const ph = Math.min(availY, (availZ * POSTER_H) / 100)
    const pw = (ph * 100) / POSTER_H
    const zc = (zl + zr) / 2
    const dir = Math.sign(zr - zl)
    const za = zc - (dir * pw) / 2
    const zb = zc + (dir * pw) / 2
    const yc = (slot.y0 + slot.y1) / 2 + ((i * 7) % 3) * 3 - 3
    const ya = yc - ph / 2
    const yb = yc + ph / 2
    const style = (design + i) % 4
    const g = new Graphics()
    if (style === 0 || style === 3) {
      // a frame: dark wood or brass
      const pad = 4
      g.poly(
        flat(
          [X, yb + pad, za - dir * pad],
          [X, yb + pad, zb + dir * pad],
          [X, ya - pad, zb + dir * pad],
          [X, ya - pad, za - dir * pad],
        ),
      )
        .fill(style ? 0xd9a54a : 0x2a1a10)
        .stroke(LINE)
    }
    const pic = new Container()
    const art = new Graphics()
    paintPoster(art, design)
    const m = pictureMatrix([X, yb, za], [X, yb, zb], [X, ya, za])
    m.c *= 100 / POSTER_H
    m.d *= 100 / POSTER_H
    art.setFromMatrix(m)
    const mask = new Graphics()
      .poly(flat([X, yb, za], [X, yb, zb], [X, ya, zb], [X, ya, za]))
      .fill(0xffffff)
    pic.addChild(art, mask)
    pic.mask = mask
    const edge = new Graphics()
      .poly(flat([X, yb, za], [X, yb, zb], [X, ya, zb], [X, ya, za]))
      .stroke(THIN)
    area.addChild(g, pic, edge)
    if (style === 1) {
      // taped up at the corners
      const tape = new Graphics()
      for (const [y, z] of [
        [yb, za],
        [yb, zb],
      ] as [number, number][]) {
        const [tx, ty] = project([X, y, z])
        tape.rect(tx - 5, ty - 2.5, 10, 5).fill({ color: 0xf2e2bd, alpha: 0.8 })
      }
      area.addChild(tape)
    } else if (style === 2) {
      // hung from a bulldog clip on a nail
      const clip = new Graphics()
      const [cx, cy] = project([X, yb, zc])
      clip.rect(cx - 5, cy - 4, 10, 6).fill(0x2a2a2a)
      clip
        .moveTo(cx, cy - 4)
        .lineTo(cx, cy - 10)
        .stroke({ color: 0x2a2a2a, width: 1 })
      area.addChild(clip)
    }
    ctx.hit('posters', (h) =>
      h.poly(flat([X, yb + 4, za], [X, yb + 4, zb], [X, ya - 4, zb], [X, ya - 4, za])),
    )
  })
  // the spots still free get a faint outline, so there's something to click
  for (const slot of slots.slice(posters.length, posters.length + 1)) {
    const { X, zl, zr } = slotCorners(slot, 16)
    const pts = flat(
      [X, slot.y1 - 10, zl],
      [X, slot.y1 - 10, zr],
      [X, slot.y0 + 10, zr],
      [X, slot.y0 + 10, zl],
    )
    area.addChild(new Graphics().poly(pts).stroke({ color: 0xf2e2bd, width: 1, alpha: 0.3 }))
    ctx.hit('posters', (h) => h.poly(pts))
  }
}

/** the room's own wall shelving, in its own style, wherever the plan left space */
export function drawShelves(ctx: Ctx) {
  const style = ctx.plan.variant.shelf
  ctx.plan.shelves.forEach((slot, i) => {
    const X = slot.wall === 'left' ? L : R
    const d = slot.wall === 'left' ? 1 : -1
    const g = ctx.layer()
    const z0 = slot.z0 + 6
    const z1 = slot.z1 - 6
    const y = slot.y0
    const items =
      i % 2
        ? ['books', 'trail', 'candles', 'radio', 'plant']
        : ['trail', 'books', 'candle', 'jar', 'trinket', 'cactus']
    const place = (depth: number, base: number, list: string[], from = z0, to = z1) => {
      list.forEach((kind, k) =>
        shelfItem(ctx, g, kind, [
          X + d * depth,
          base,
          from + ((k + 0.5) * (to - from)) / list.length,
        ]),
      )
    }
    if (style === 'floating') {
      block(
        g,
        slot.wall === 'left'
          ? { x0: L, x1: L + 22, y0: y, y1: y + 5, z0, z1 }
          : { x0: R - 22, x1: R, y0: y, y1: y + 5, z0, z1 },
        0x5a3420,
      )
      for (const z of [z0 + 14, z1 - 14])
        g.poly(flat([X, y, z], [X + d * 16, y, z], [X, y - 18, z]), true).fill(0x1e1a1c)
      place(11, y + 5, items)
    } else if (style === 'ledge') {
      // a narrow picture ledge with little prints and books leaning on the wall
      block(
        g,
        slot.wall === 'left'
          ? { x0: L, x1: L + 10, y0: y, y1: y + 4, z0, z1 }
          : { x0: R - 10, x1: R, y0: y, y1: y + 4, z0, z1 },
        0x3a2418,
      )
      const n = Math.max(2, Math.round((z1 - z0) / 40))
      for (let k = 0; k < n; k++) {
        const za = z0 + 6 + (k * (z1 - z0 - 12)) / n
        const zb = za + ((z1 - z0 - 12) / n) * 0.75
        const top = y + 4 + 30 + (k % 2) * 10
        const zl = slot.wall === 'left' ? za : zb
        const zr = slot.wall === 'left' ? zb : za
        const pic = new Container()
        const art = new Graphics()
        paintPoster(art, (k * 5 + i * 3 + 2) % 16)
        const m = pictureMatrix([X + d * 3, top, zl], [X + d * 3, top, zr], [X + d * 6, y + 4, zl])
        m.c *= 100 / POSTER_H
        m.d *= 100 / POSTER_H
        art.setFromMatrix(m)
        const mask = new Graphics()
          .poly(
            flat(
              [X + d * 3, top, zl],
              [X + d * 3, top, zr],
              [X + d * 6, y + 4, zr],
              [X + d * 6, y + 4, zl],
            ),
          )
          .fill(0xffffff)
        pic.addChild(art, mask)
        pic.mask = mask
        ctx.back.addChild(pic)
        ctx.back.addChild(
          new Graphics()
            .poly(
              flat(
                [X + d * 3, top, zl],
                [X + d * 3, top, zr],
                [X + d * 6, y + 4, zr],
                [X + d * 6, y + 4, zl],
              ),
            )
            .stroke({ color: 0xf2e2bd, width: 2 }),
        )
      }
    } else if (style === 'niches') {
      // arched alcoves set into the wall, each with something in it
      const n = Math.max(1, Math.round((z1 - z0) / 60))
      for (let k = 0; k < n; k++) {
        const za = z0 + 4 + (k * (z1 - z0)) / n
        const zb = za + (z1 - z0) / n - 8
        const r = (zb - za) / 2
        const pts: P3[] = [
          [X, y, za],
          [X, y + 44, za],
        ]
        for (let a = 0; a <= 10; a++) {
          const ang = Math.PI - (a / 10) * Math.PI
          pts.push([X, y + 44 + Math.sin(ang) * r, (za + zb) / 2 + Math.cos(ang) * r])
        }
        pts.push([X, y, zb])
        g.poly(flat(...pts))
          .fill(shade(hex(ctx.layout.wall), -0.55))
          .stroke(LINE)
        g.poly(flat([X, y, za], [X, y, zb], [X + d * 4, y - 3, zb], [X + d * 4, y - 3, za])).fill(
          0xe8d8c0,
        )
        shelfItem(ctx, g, ['candles', 'plant', 'jar', 'trinket'][(k + i) % 4]!, [
          X + d * 8,
          y,
          (za + zb) / 2,
        ])
      }
    } else {
      // cubes: a grid of open boxes on the wall
      const n = Math.max(2, Math.round((z1 - z0) / 46))
      for (let row = 0; row < 2; row++) {
        for (let k = 0; k < n; k++) {
          const za = z0 + (k * (z1 - z0)) / n
          const zb = za + (z1 - z0) / n
          const yb = y - 20 + row * 40
          const box =
            slot.wall === 'left'
              ? { x0: L, x1: L + 26, y0: yb, y1: yb + 40, z0: za, z1: zb }
              : { x0: R - 26, x1: R, y0: yb, y1: yb + 40, z0: za, z1: zb }
          block(g, box, 0xe8d8c0, THIN)
          const face = X + d * 26
          g.poly(
            flat(
              [face, yb + 3, za + 3],
              [face, yb + 3, zb - 3],
              [face, yb + 37, zb - 3],
              [face, yb + 37, za + 3],
            ),
          ).fill(0x3a2a20)
          shelfItem(
            ctx,
            g,
            ['books', 'plant', 'candle', 'jar', 'cactus', 'trinket'][(row * n + k + i) % 6]!,
            [X + d * 13, yb + 3, (za + zb) / 2],
          )
        }
      }
    }
  })
}

function shelfItem(ctx: Ctx, g: Graphics, kind: string, p: P3) {
  const { x, y, s } = at(p)
  switch (kind) {
    case 'trail': {
      potPlant(ctx, g, p, 0.85, 'pothos', 0)
      // pothos vines spilling down the wall
      for (let v = 0; v < 5; v++) {
        const len = (30 + v * 14) * s
        const dx = (v - 2) * 4 * s
        g.moveTo(x + dx, y - 2)
          .quadraticCurveTo(x + dx * 2 + 6, y + len / 2, x + dx * 1.5, y + len)
          .stroke({ color: 0x2e5a2e, width: 1.2 })
        for (let l = 1; l < 6; l++) {
          const t = l / 6
          g.ellipse(x + dx * (1 + t * 0.5) + (l % 2 ? 3 : -3) * s, y + len * t, 2.6 * s, 3.6 * s)
            .fill(l % 2 ? 0x5a9a3a : 0x3a7a3a)
            .stroke({ ...THIN, width: 0.5 })
        }
      }
      break
    }
    case 'books':
      for (let b = 0; b < 4; b++) {
        g.rect(x - 10 * s + b * 4.5 * s, y - (18 + (b % 2) * 4) * s, 4 * s, (18 + (b % 2) * 4) * s)
          .fill([0xc8302a, 0x2a4a8a, 0xe8c25a, 0x3a7a3a][b]!)
          .stroke({ ...THIN, width: 0.6 })
      }
      break
    case 'candle':
    case 'candles':
      candle(ctx, g, p, 14)
      if (kind === 'candles') candle(ctx, g, [p[0], p[1], p[2] + 10], 9)
      break
    case 'jar':
      g.roundRect(x - 5 * s, y - 14 * s, 10 * s, 14 * s, 2 * s)
        .fill({ color: 0xc8e8e0, alpha: 0.7 })
        .stroke({ ...THIN, width: 0.7 })
      g.rect(x - 5 * s, y - 16 * s, 10 * s, 3 * s).fill(0xc8302a)
      for (let k = 0; k < 4; k++)
        g.circle(x - 2 * s + (k % 2) * 4 * s, y - 4 * s - k * 2.5 * s, 1.4 * s).fill(0xe8c25a)
      break
    case 'radio':
      g.roundRect(x - 10 * s, y - 13 * s, 20 * s, 13 * s, 3 * s)
        .fill(0x8e2416)
        .stroke(THIN)
      g.circle(x - 4 * s, y - 6.5 * s, 4 * s)
        .fill(0xf2e2bd)
        .stroke({ ...THIN, width: 0.6 })
      g.rect(x + 2 * s, y - 10 * s, 6 * s, 3 * s).fill(0xffd27a)
      glow(ctx.lights, x + 5 * s, y - 8.5 * s, 0.1, 0.06, 0xffb04a, 0.6)
      break
    case 'cactus':
      potPlant(ctx, g, p, 0.8, 'cactus', 1)
      break
    case 'plant':
      potPlant(ctx, g, p, 0.95, ctx.plan.variant.plants[0]!, 2)
      break
    case 'trinket':
      trinket(g, ctx.theme, x, y, s)
      break
  }
}

/** a souvenir from wherever the house is */
function trinket(g: Graphics, theme: ThemeId, x: number, y: number, s: number) {
  if (theme === 'paris') {
    // a little brass eiffel tower
    g.poly([
      x - 7 * s,
      y,
      x - 1 * s,
      y - 26 * s,
      x + 1 * s,
      y - 26 * s,
      x + 7 * s,
      y,
      x + 4 * s,
      y,
      x,
      y - 8 * s,
      x - 4 * s,
      y,
    ])
      .fill(BRASS)
      .stroke({ ...THIN, width: 0.6 })
    g.rect(x - 5 * s, y - 12 * s, 10 * s, 1.5 * s).fill(shade(BRASS, -0.3))
  } else if (theme === 'new-york') {
    // a toy taxi
    g.roundRect(x - 11 * s, y - 7 * s, 22 * s, 6 * s, 2 * s)
      .fill(0xf0c020)
      .stroke({ ...THIN, width: 0.6 })
    g.roundRect(x - 6 * s, y - 11 * s, 12 * s, 5 * s, 1.5 * s)
      .fill(0xf0c020)
      .stroke({ ...THIN, width: 0.6 })
    g.circle(x - 6 * s, y - 1 * s, 2.4 * s)
      .circle(x + 6 * s, y - 1 * s, 2.4 * s)
      .fill(0x121014)
  } else if (theme === 'venice') {
    // a carnival mask
    g.moveTo(x - 12 * s, y - 14 * s)
      .quadraticCurveTo(x, y - 22 * s, x + 12 * s, y - 14 * s)
      .quadraticCurveTo(x + 10 * s, y - 4 * s, x, y - 8 * s)
      .quadraticCurveTo(x - 10 * s, y - 4 * s, x - 12 * s, y - 14 * s)
      .fill(0xc8302a)
      .stroke({ ...THIN, width: 0.6 })
    g.ellipse(x - 5 * s, y - 13 * s, 3 * s, 2 * s)
      .ellipse(x + 5 * s, y - 13 * s, 3 * s, 2 * s)
      .fill(0x121014)
    g.moveTo(x + 10 * s, y - 16 * s)
      .quadraticCurveTo(x + 18 * s, y - 30 * s, x + 14 * s, y - 34 * s)
      .stroke({ color: BRASS, width: 1.5 })
  } else {
    // a lucky cat, waving
    g.roundRect(x - 8 * s, y - 16 * s, 16 * s, 16 * s, 5 * s)
      .fill(0xf6ead0)
      .stroke({ ...THIN, width: 0.6 })
    g.circle(x, y - 20 * s, 7 * s)
      .fill(0xf6ead0)
      .stroke({ ...THIN, width: 0.6 })
    g.poly([x - 6 * s, y - 24 * s, x - 5 * s, y - 30 * s, x - 2 * s, y - 26 * s])
      .poly([x + 6 * s, y - 24 * s, x + 5 * s, y - 30 * s, x + 2 * s, y - 26 * s])
      .fill(0xf6ead0)
    g.roundRect(x + 6 * s, y - 28 * s, 4 * s, 10 * s, 2 * s)
      .fill(0xf6ead0)
      .stroke({ ...THIN, width: 0.6 })
    g.rect(x - 7 * s, y - 14 * s, 14 * s, 2 * s).fill(0xc8302a)
    g.circle(x, y - 11 * s, 2 * s).fill(BRASS)
  }
}

/** a neon sign on the right wall, local to the city, buzzing on and off */
const NEON: Record<ThemeId, { text: string; colour: number; font: string }> = {
  paris: { text: 'amour', colour: 0xff4a9a, font: SIGN_FONT },
  'new-york': { text: 'OPEN', colour: 0xff3a2a, font: SIGN_FONT },
  venice: { text: 'amore', colour: 0xff7a3a, font: SIGN_FONT },
  tokyo: {
    text: '夜ふかし',
    colour: 0x5af0ff,
    font: `"Yu Gothic", "Hiragino Sans", "Noto Sans JP", sans-serif`,
  },
}

export function drawNeon(ctx: Ctx) {
  const slot = ctx.plan.neon
  if (!slot) return
  const n = NEON[ctx.theme]
  const X = slot.wall === 'left' ? L + 1 : R - 1
  const [z0, z1] = [slot.z0 + 6, slot.z1 - 6]
  const [y0, y1] = [slot.y0 + 6, slot.y1 - 6]
  const back = new Graphics()
  // the backing board it's mounted on
  back
    .poly(flat([X, y1 + 4, z0 - 4], [X, y1 + 4, z1 + 4], [X, y0 - 4, z1 + 4], [X, y0 - 4, z0 - 4]))
    .fill({ color: 0x121014, alpha: 0.75 })
    .stroke(THIN)
  ctx.back.addChild(back)
  const make = (alpha: number) => {
    const t = new Text({
      text: n.text,
      style: { fontFamily: n.font, fontSize: 40, fill: n.colour, align: 'center' },
      resolution: 3,
    })
    t.anchor.set(0.5)
    const c = new Container()
    c.addChild(t)
    t.position.set(50, 50)
    t.scale.set(Math.min(90 / t.width, 70 / t.height))
    c.setFromMatrix(
      slot.wall === 'left'
        ? pictureMatrix([X, y1, z0], [X, y1, z1], [X, y0, z0])
        : pictureMatrix([X, y1, z1], [X, y1, z0], [X, y0, z1]),
    )
    c.alpha = alpha
    return c
  }
  const tube = make(1)
  const halo = make(0.9)
  ctx.back.addChild(tube)
  ctx.lights.addChild(halo)
  const [gx, gy] = project([X, (y0 + y1) / 2, (z0 + z1) / 2])
  const wash = glow(ctx.lights, gx, gy, 2.4, 1.4, n.colour, 0.45)
  ctx.pool([X, (y0 + y1) / 2, (z0 + z1) / 2], 200, 0.5)
  // mostly on, with the odd stutter like it's on its last legs
  ctx.anim.push((t) => {
    const k = t % 7.3
    const off = (k > 5.1 && k < 5.18) || (k > 5.3 && k < 5.36) || (k > 5.5 && k < 5.9)
    halo.alpha = off ? 0.05 : 0.85 + Math.sin(t * 40) * 0.05
    tube.alpha = off ? 0.35 : 1
    if (wash) wash.alpha = off ? 0.08 : 0.45
  })
}

// -- floor and ceiling bits ----------------------------------------------------

/** a basket and a pile of books on the floor, out of everything's way */
export function drawFloorThings(ctx: Ctx) {
  const g = ctx.layer()
  const { x, y, s } = at([104, 0, 46])
  g.moveTo(x - 22 * s, y - 30 * s)
    .lineTo(x + 22 * s, y - 30 * s)
    .lineTo(x + 18 * s, y)
    .lineTo(x - 18 * s, y)
    .closePath()
    .fill(0xb8864a)
    .stroke(LINE)
  for (let i = 1; i < 6; i++)
    g.moveTo(x - 22 * s + i * 1.2 * s, y - 30 * s + i * 5 * s)
      .lineTo(x + 22 * s - i * 1.2 * s, y - 30 * s + i * 5 * s)
      .stroke({ color: 0x7a5a2a, width: 1 })
  for (let i = -3; i <= 3; i++)
    g.moveTo(x + i * 6 * s, y - 30 * s)
      .lineTo(x + i * 5 * s, y)
      .stroke({ color: 0x7a5a2a, width: 0.7 })
  // a throw spilling out of it
  g.moveTo(x - 20 * s, y - 30 * s)
    .bezierCurveTo(x - 10 * s, y - 50 * s, x + 6 * s, y - 40 * s, x + 14 * s, y - 32 * s)
    .bezierCurveTo(x + 22 * s, y - 26 * s, x + 30 * s, y - 14 * s, x + 26 * s, y - 2 * s)
    .quadraticCurveTo(x + 20 * s, y - 16 * s, x + 18 * s, y - 28 * s)
    .closePath()
    .fill(hex(ctx.layout.bed.blanket))
    .stroke(THIN)

  const k = at([-96, 0, 40])
  let top = k.y
  for (const [i, c] of [0x2a4a8a, 0xc8302a, 0xe8c25a, 0x3a7a3a].entries()) {
    const bw = (34 - i * 3) * k.s
    const bh = 6 * k.s
    const off = (i % 2 ? 3 : -2) * k.s
    g.rect(k.x - bw / 2 + off, top - bh, bw, bh)
      .fill(c)
      .stroke({ ...THIN, width: 0.8 })
    g.rect(k.x - bw / 2 + off + 2, top - bh + 1.5, bw - 4, 1).fill({ color: 0xf2e2bd, alpha: 0.5 })
    top -= bh
  }
  candle(ctx, g, [-96, 24, 40], 12)
}

/** pothos in macramé hangers, dropping from the ceiling (never near the walls) */
export function drawHangingPlants(ctx: Ctx) {
  const many = ctx.plan.variant.plants.length > 3
  // kept clear of the record, the map and the window
  const spots: P3[] = [[-172, 300, 60]]
  if (many) spots.push([172, 290, 70], [-40, 410, 30])
  for (const [i, p] of spots.entries()) {
    const { x, y, s } = at(p)
    const [, top] = project([
      p[0],
      ROOM.ceiling - (ctx.plan.variant.ceiling === 'beams' ? 18 : 0),
      p[2],
    ])
    const g = ctx.layer()
    for (const d of [-1, 0, 1])
      g.moveTo(x, top)
        .lineTo(x + d * 12 * s, y - 14 * s)
        .stroke({ color: 0xe8d5b0, width: 1 })
    g.ellipse(x, y - 4 * s, 14 * s, 12 * s)
      .fill([0xe8c25a, 0xf2e2bd, 0xb8643a][i % 3]!)
      .stroke(LINE)
    g.ellipse(x, y - 15 * s, 14 * s, 3 * s).fill(0x3a2a1a)
    const hang = new Graphics()
    vines(hang, x, y - 12 * s, s, 7, 90, i * 3)
    hang.pivot.set(x, y)
    hang.position.set(x, y)
    ctx.back.addChild(hang)
    ctx.anim.push((t) => {
      hang.rotation = Math.sin(t * 0.5 + i) * 0.02
    })
  }
}

/** a slow ceiling fan with rattan blades */
export function drawFan(ctx: Ctx) {
  if (ctx.plan.variant.ceiling !== 'fan') return
  const hub: P3 = [0, ROOM.ceiling - 60, 220]
  const [hx, hy] = project(hub)
  const [, cy] = project([0, ROOM.ceiling, 220])
  const s = scaleAt(220)
  const g = ctx.layer()
  g.moveTo(hx, cy).lineTo(hx, hy).stroke({ color: 0x2a1a10, width: 3 })
  g.ellipse(hx, cy + 2, 10 * s, 3 * s).fill(0x2a1a10)
  const blades = new Container()
  blades.position.set(hx, hy)
  blades.scale.y = 0.22
  const spin = new Container()
  blades.addChild(spin)
  for (let i = 0; i < 5; i++) {
    const b = new Graphics()
    b.moveTo(10 * s, -6 * s)
      .bezierCurveTo(60 * s, -16 * s, 90 * s, -10 * s, 96 * s, 0)
      .bezierCurveTo(90 * s, 10 * s, 60 * s, 16 * s, 10 * s, 6 * s)
      .closePath()
      .fill(0xc8904a)
      .stroke({ color: 0x5a3a1a, width: 4 })
    for (let k = 1; k < 6; k++)
      b.moveTo(10 * s + k * 15 * s, -10 * s)
        .lineTo(10 * s + k * 15 * s, 10 * s)
        .stroke({ color: 0x8a5a2a, width: 2 })
    b.rotation = (i / 5) * Math.PI * 2
    spin.addChild(b)
  }
  ctx.back.addChild(blades)
  const motor = ctx.layer()
  motor
    .ellipse(hx, hy, 12 * s, 7 * s)
    .fill(0x3a2418)
    .stroke(THIN)
  motor.ellipse(hx, hy + 6 * s, 7 * s, 5 * s).fill(0xf2d8a0)
  ctx.anim.push((t) => {
    spin.rotation = t * 1.2
  })
}

/** candles and a photo on the low bookcase under the window */
export function drawShelfTop(ctx: Ctx) {
  const shelf = shelfBox(ctx)
  if (!shelf) return
  const g = ctx.layer()
  candle(ctx, g, [shelf.x0 + 14, shelf.y1 + 5, 384], 16)
  candle(ctx, g, [shelf.x0 + 24, shelf.y1 + 5, 380], 10)
  candle(ctx, g, [shelf.x0 + 32, shelf.y1 + 5, 388], 13)
  const { x, y, s } = at([shelf.x1 - 22, shelf.y1 + 5, 390])
  g.rect(x - 9 * s, y - 24 * s, 18 * s, 24 * s)
    .fill(0x2a1a10)
    .stroke(THIN)
  g.rect(x - 6 * s, y - 21 * s, 12 * s, 16 * s).fill(0xe8a870)
  g.circle(x - 2 * s, y - 13 * s, 3 * s)
    .circle(x + 3 * s, y - 12 * s, 3 * s)
    .fill(0x2a1a10)
}
