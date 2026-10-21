import { Container, Graphics, Text } from 'pixi.js'
import { SIGN_FONT } from '../fonts'
import { glow } from '../layers/neon'
import type { ThemeId } from '../themes/types'
import { paintArt } from './art'
import { at, type Ctx } from './context'
import { block, hex, INK, LINE, shade, THIN } from './paint'
import { flat, pictureMatrix, project, ROOM, scaleAt, type P3 } from './projection'
import { potPlant } from './window'

const { left: L, right: R, back: B } = ROOM
const BRASS = 0xd9a54a
const WAX = 0xf6ead0

// -- the record and the map, either side of the window -----------------------

export function drawVinyl(ctx: Ctx) {
  const [cx, cy] = project([-160, 172, B])
  const r = 30 * scaleAt(B)
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
    ctx.pool([-160, 172, B], 160, 0.6)
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
  const [x0, y0] = project([116, 212, B])
  const [x1, y1] = project([196, 122, B])
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

/** frames hang on the side walls; two per wall at most */
export function drawFrames(ctx: Ctx) {
  const frames = ctx.layout.frames
  const area = ctx.container('frames')
  frames.forEach((f, i) => {
    const onThisWall = frames.filter((o) => o.wall === f.wall)
    const slot = onThisWall.indexOf(f)
    const zc = onThisWall.length === 1 ? 236 : slot === 0 ? 292 : 176
    const X = f.wall === 'left' ? L + 1 : R - 1
    const [near, far] = [zc - 36, zc + 36]
    const ya = 128
    const yb = 210
    // facing the left wall, the front of the room is on your left; facing the right wall, the back is
    const zl = f.wall === 'left' ? near : far
    const zr = f.wall === 'left' ? far : near
    const g = new Graphics()
    const pad = f.wall === 'left' ? -6 : 6
    const outer = flat(
      [X, yb + 6, zl + pad],
      [X, yb + 6, zr - pad],
      [X, ya - 6, zr - pad],
      [X, ya - 6, zl + pad],
    )
    g.poly(outer)
      .fill(i % 2 ? 0x2a1a10 : BRASS)
      .stroke(LINE)
    const inner = flat([X, yb, zl], [X, yb, zr], [X, ya, zr], [X, ya, zl])
    const pic = new Container()
    const art = new Graphics()
    paintArt(art, f.art)
    art.setFromMatrix(pictureMatrix([X, yb, zl], [X, yb, zr], [X, ya, zl]))
    const mask = new Graphics().poly(inner).fill(0xffffff)
    pic.addChild(art, mask)
    pic.mask = mask
    const edge = new Graphics().poly(inner).stroke(THIN)
    area.addChild(g, pic, edge)
    ctx.hit('frames', (h) => h.poly(outer))
  })
  if (frames.length === 0) {
    // a ghost of where one could go, so there's something to click
    const g = new Graphics()
    const spot = flat([L + 1, 210, 272], [L + 1, 210, 200], [L + 1, 128, 200], [L + 1, 128, 272])
    g.poly(spot).stroke({ color: 0xf2e2bd, width: 1, alpha: 0.35 })
    area.addChild(g)
    ctx.hit('frames', (h) => h.poly(spot))
  }
}

/** a floating shelf along a side wall, loaded with stuff */
export function drawShelves(ctx: Ctx) {
  for (const wall of ['left', 'right'] as const) {
    const X = wall === 'left' ? L : R
    const d = wall === 'left' ? 1 : -1
    const g = ctx.layer()
    const box =
      wall === 'left'
        ? { x0: L, x1: L + 22, y0: 240, y1: 245, z0: 104, z1: 304 }
        : { x0: R - 22, x1: R, y0: 240, y1: 245, z0: 104, z1: 304 }
    block(g, box, 0x5a3420)
    // brackets
    for (const z of [124, 284]) {
      g.poly(flat([X, 240, z], [X + d * 16, 240, z], [X, 222, z]), true).fill(0x1e1a1c)
    }
    const x = X + d * 11
    const items =
      wall === 'left'
        ? ['trail', 'books', 'candle', 'jar', 'trinket', 'cactus']
        : ['books', 'trail', 'candles', 'radio', 'plant']
    items.forEach((kind, i) => {
      const z = 116 + (i * 176) / items.length + 10
      const p: P3 = [x, 245, z]
      shelfItem(ctx, g, kind, p)
    })
  }
}

function shelfItem(ctx: Ctx, g: Graphics, kind: string, p: P3) {
  const { x, y, s } = at(p)
  switch (kind) {
    case 'trail': {
      potPlant(ctx, g, p, 0.85, 0)
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
      potPlant(ctx, g, p, 0.8, 1)
      break
    case 'plant':
      potPlant(ctx, g, p, 0.95, 2)
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

/** a candle with a flame that actually flickers */
export function candle(ctx: Ctx, g: Graphics, p: P3, height: number) {
  const { x, y, s } = at(p)
  const h = height * s
  g.rect(x - 2.6 * s, y - h, 5.2 * s, h)
    .fill(WAX)
    .stroke({ ...THIN, width: 0.6 })
  g.moveTo(x - 2.6 * s, y - h)
    .quadraticCurveTo(x - 3.4 * s, y - h + 4 * s, x - 2.2 * s, y - h + 6 * s)
    .stroke({ color: WAX, width: 1.5 })
  const flame = new Graphics()
  flame.ellipse(0, -3 * s, 1.6 * s, 3.4 * s).fill(0xffd27a)
  flame.ellipse(0, -2 * s, 0.8 * s, 1.6 * s).fill(0xfff6e0)
  flame.position.set(x, y - h)
  ctx.lights.addChild(flame)
  const halo = glow(ctx.lights, x, y - h - 3 * s, (24 * s) / 128, (30 * s) / 128, 0xffa040, 0.8)
  ctx.pool([p[0], p[1] + height, p[2]], 70, 0.45)
  const seed = ctx.rng() * 10
  ctx.anim.push((t) => {
    const f = Math.sin(t * 11 + seed) * 0.5 + Math.sin(t * 17.3 + seed * 2) * 0.5
    flame.scale.set(1 + f * 0.08, 1 + f * 0.18)
    flame.rotation = f * 0.08
    if (halo) halo.alpha = 0.7 + f * 0.12
  })
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
  const n = NEON[ctx.theme]
  const X = R - 1
  const [z0, z1] = [30, 136]
  const [y0, y1] = [148, 206]
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
    c.setFromMatrix(pictureMatrix([X, y1, z1], [X, y1, z0], [X, y0, z1]))
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

/** a tall arched mirror leaning against the left wall near the front */
export function drawMirror(ctx: Ctx) {
  const X = L + 3
  const [z0, z1] = [8, 92]
  const bottom = 4
  const top = 214
  const arch = (inset: number) => {
    const pts: P3[] = [[X, bottom + inset, z0 + inset]]
    const r = (z1 - z0) / 2 - inset
    const cz = (z0 + z1) / 2
    const spring = top - r - inset
    pts.push([X, spring, z0 + inset])
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI - (i / 12) * Math.PI
      pts.push([X, spring + Math.sin(a) * r, cz + Math.cos(a) * r])
    }
    pts.push([X, bottom + inset, z1 - inset])
    return flat(...pts)
  }
  const g = ctx.layer()
  g.poly(arch(0)).fill(BRASS).stroke(LINE)
  const wallC = hex(ctx.layout.wall)
  g.poly(arch(6)).fill(shade(wallC, -0.35))
  // what it reflects: a slice of the room and a smear of lamplight
  const refl = new Graphics()
  const mask = new Graphics().poly(arch(6)).fill(0xffffff)
  const [mx, my] = project([X, 110, 50])
  refl.rect(mx - 200, my - 400, 400, 800).fill({ color: 0x3a2a4a, alpha: 0.4 })
  refl.circle(mx + 10, my - 30, 30).fill({ color: 0xffb04a, alpha: 0.25 })
  for (let i = 0; i < 3; i++) {
    refl
      .poly([
        mx - 60 + i * 30,
        my + 200,
        mx - 40 + i * 30,
        my + 200,
        mx + 40 + i * 30,
        my - 200,
        mx + 20 + i * 30,
        my - 200,
      ])
      .fill({ color: 0xffffff, alpha: 0.08 })
  }
  refl.mask = mask
  ctx.back.addChild(refl, mask)
  const edge = ctx.layer()
  edge.poly(arch(6)).stroke(THIN)
}

// -- floor and ceiling bits ----------------------------------------------------

export function drawFloorThings(ctx: Ctx) {
  // a big leafy plant in the back corner
  bigPlant(ctx, ctx.layout.bed.spot === 'window' ? [-150, 0, 340] : [-136, 0, 384])

  // a basket with a throw in it, front right
  const g = ctx.layer()
  const bp: P3 = [150, 0, 70]
  const { x, y, s } = at(bp)
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
  g.moveTo(x - 20 * s, y - 30 * s)
    .quadraticCurveTo(x - 6 * s, y - 44 * s, x + 14 * s, y - 32 * s)
    .lineTo(x + 18 * s, y - 14 * s)
    .quadraticCurveTo(x + 26 * s, y - 22 * s, x + 20 * s, y - 30 * s)
    .fill(hex(ctx.layout.bed.blanket))
    .stroke(THIN)

  // a stack of books on the floor, front left, with a candle on top
  const sp: P3 = [-150, 0, 60]
  const k = at(sp)
  const colours = [0x2a4a8a, 0xc8302a, 0xe8c25a, 0x3a7a3a]
  let top = k.y
  colours.forEach((c, i) => {
    const bw = (34 - i * 3) * k.s
    const bh = 6 * k.s
    const off = (i % 2 ? 3 : -2) * k.s
    g.rect(k.x - bw / 2 + off, top - bh, bw, bh)
      .fill(c)
      .stroke({ ...THIN, width: 0.8 })
    g.rect(k.x - bw / 2 + off + 2, top - bh + 1.5, bw - 4, 1).fill({ color: 0xf2e2bd, alpha: 0.5 })
    top -= bh
  })
  candle(ctx, g, [-150, 24, 60], 12)
}

function bigPlant(ctx: Ctx, p: P3) {
  const g = ctx.layer()
  const { x, y, s } = at(p)
  g.moveTo(x - 18 * s, y - 34 * s)
    .lineTo(x + 18 * s, y - 34 * s)
    .lineTo(x + 14 * s, y)
    .lineTo(x - 14 * s, y)
    .closePath()
    .fill(0x8e3a1e)
    .stroke(LINE)
  g.rect(x - 20 * s, y - 38 * s, 40 * s, 6 * s)
    .fill(0xa84a26)
    .stroke(THIN)
  // monstera: big split leaves on long stems
  const leaves = 9
  for (let i = 0; i < leaves; i++) {
    const a = -Math.PI / 2 + (i - (leaves - 1) / 2) * 0.2 + (ctx.rng() - 0.5) * 0.15
    const len = (70 + ctx.rng() * 60) * s
    const lx = x + Math.cos(a) * len
    const ly = y - 36 * s + Math.sin(a) * len
    g.moveTo(x, y - 36 * s)
      .quadraticCurveTo(x + Math.cos(a) * len * 0.3, ly + 20 * s, lx, ly)
      .stroke({ color: 0x2e4a22, width: 1.6 })
    const leaf = new Graphics()
    const r = (16 + ctx.rng() * 6) * s
    leaf
      .ellipse(0, 0, r, r * 0.72)
      .fill(i % 3 ? 0x2e7a3a : 0x4a9a3a)
      .stroke({ ...THIN, width: 0.9 })
    // the splits
    for (let c = -2; c <= 2; c++)
      leaf
        .moveTo(c * r * 0.3, 0)
        .lineTo(c * r * 0.55, r * 0.7 * (c % 2 ? 1 : -1))
        .stroke({ color: 0x1e3a1a, width: 1.4 })
    leaf.moveTo(-r, 0).lineTo(r, 0).stroke({ color: 0x1e3a1a, width: 0.8 })
    leaf.position.set(lx, ly)
    leaf.rotation = a + Math.PI / 2
    ctx.back.addChild(leaf)
    const sway = ctx.rng() * 6
    ctx.anim.push((t) => {
      leaf.rotation = a + Math.PI / 2 + Math.sin(t * 0.6 + sway) * 0.03
    })
  }
}

/** a pothos in a macramé hanger, off the beam */
export function drawHangingPlant(ctx: Ctx) {
  const p: P3 = [140, 222, 200]
  const { x, y, s } = at(p)
  const [, top] = project([p[0], ROOM.ceiling - 16, p[2]])
  const g = ctx.layer()
  for (const d of [-1, 0, 1])
    g.moveTo(x, top)
      .lineTo(x + d * 12 * s, y - 14 * s)
      .stroke({ color: 0xe8d5b0, width: 1 })
  g.ellipse(x, y - 4 * s, 14 * s, 12 * s)
    .fill(0xe8c25a)
    .stroke(LINE)
  g.ellipse(x, y - 15 * s, 14 * s, 3 * s).fill(0x3a2a1a)
  const vines = new Graphics()
  for (let v = 0; v < 7; v++) {
    const dx = (v - 3) * 5 * s
    const len = (40 + ((v * 37) % 60)) * s
    vines
      .moveTo(x + dx, y - 12 * s)
      .quadraticCurveTo(x + dx * 2.2, y + len * 0.4, x + dx * 1.4, y + len)
      .stroke({ color: 0x2e5a2e, width: 1.2 })
    for (let l = 0; l < 7; l++) {
      const t = l / 7
      vines
        .ellipse(
          x + dx * (1 + t * 0.8) + (l % 2 ? 3.5 : -3.5) * s,
          y - 8 * s + len * t,
          3 * s,
          4.2 * s,
        )
        .fill(l % 2 ? 0x5a9a3a : 0x3a7a3a)
        .stroke({ ...THIN, width: 0.5 })
    }
  }
  ctx.back.addChild(vines)
  vines.pivot.set(x, y)
  vines.position.set(x, y)
  ctx.anim.push((t) => {
    vines.rotation = Math.sin(t * 0.5) * 0.02
  })
}

/** candles and a photo on the bookcase top */
export function drawShelfTop(ctx: Ctx, shelf: { x0: number; x1: number; y1: number }) {
  const g = ctx.layer()
  candle(ctx, g, [shelf.x0 + 14, shelf.y1 + 5, 384], 16)
  candle(ctx, g, [shelf.x0 + 24, shelf.y1 + 5, 380], 10)
  candle(ctx, g, [shelf.x0 + 32, shelf.y1 + 5, 388], 13)
  // a photo in a little frame, leaning
  const { x, y, s } = at([shelf.x1 - 22, shelf.y1 + 5, 390])
  g.rect(x - 9 * s, y - 24 * s, 18 * s, 24 * s)
    .fill(0x2a1a10)
    .stroke(THIN)
  g.rect(x - 6 * s, y - 21 * s, 12 * s, 16 * s).fill(0xe8a870)
  g.circle(x - 2 * s, y - 13 * s, 3 * s)
    .circle(x + 3 * s, y - 12 * s, 3 * s)
    .fill(0x2a1a10)
}
