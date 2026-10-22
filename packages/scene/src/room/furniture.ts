import { Graphics } from 'pixi.js'
import { at, type Ctx } from './context'
import { block, fillPoly, hex, INK, LINE, mix, shade, THIN } from './paint'
import { flat, mirror, onFloor, project, type Box, type P3 } from './projection'
import { cushion, drape, pillow, potPlant } from './soft'

export const BOOKS = [
  0xc8302a, 0xe8c25a, 0x2a4a8a, 0x3a7a3a, 0xe8803a, 0x7a2a4a, 0xf2e2bd, 0x2f6b66, 0x1e1a1c,
  0xd8a090, 0x8aa0b8,
]
const BRASS = 0xd9a54a

/** the low bookcase under the window -- only when the bed isn't there */
export function shelfBox(ctx: Ctx): Box | null {
  const s = ctx.plan.lowShelf
  return s ? { ...s, y0: 0, y1: 82 } : null
}

export function drawBookshelf(ctx: Ctx) {
  const b = shelfBox(ctx)
  if (!b) return null
  const g = ctx.layer()
  const wood = 0x5a3420
  block(g, b, wood)
  block(
    g,
    { ...b, x0: b.x0 - 4, x1: b.x1 + 4, y0: b.y1, y1: b.y1 + 5, z0: b.z0 - 4 },
    shade(wood, 0.15),
  )
  const [fx0, fy0] = project([b.x0, b.y1, b.z0])
  const [fx1, fy1] = project([b.x1, b.y0, b.z0])
  const w = fx1 - fx0
  const h = fy1 - fy0
  const cols = Math.max(3, Math.round(w / 70))
  const cw = (w - 8) / cols
  let n = Math.floor(ctx.rng() * 9)
  for (let row = 0; row < 2; row++) {
    for (let c = 0; c < cols; c++) {
      const x = fx0 + 4 + c * cw
      const y = fy0 + 5 + row * ((h - 8) / 2)
      const ch = (h - 10) / 2 - 3
      g.rect(x, y, cw - 2, ch)
        .fill(0x160c08)
        .stroke(THIN)
      const kind = (row * cols + c + n) % 5
      if (kind === 3) {
        potPlant(
          ctx,
          g,
          [b.x0 + ((c + 0.5) * (b.x1 - b.x0)) / cols, row ? 4 : 44, b.z0 + 2],
          0.7,
          ctx.plan.variant.plants[c % ctx.plan.variant.plants.length]!,
          c,
        )
      } else if (kind === 4) {
        for (let i = 0; i < 4; i++)
          g.rect(x + 3 + i * 3, y + ch - 24, 22, 24)
            .fill(BOOKS[(n + i * 2) % BOOKS.length]!)
            .stroke(THIN)
      } else {
        n = books(g, x + 3, y + ch, cw - 8, ch, n)
      }
    }
  }
  return b
}

/** a row of book spines standing on a shelf at (x, base), flat on to you */
export function books(g: Graphics, x: number, base: number, w: number, h: number, n: number) {
  let bx = x
  while (bx < x + w - 3) {
    const bw = 3 + ((n * 7) % 4)
    const bh = h * (0.62 + ((n * 13) % 5) * 0.07)
    g.rect(bx, base - bh, bw, bh)
      .fill(BOOKS[n % BOOKS.length]!)
      .stroke({ ...THIN, width: 0.5 })
    if (n % 4 === 0) g.rect(bx, base - bh * 0.8, bw, 1).fill({ color: 0xf2e2bd, alpha: 0.6 })
    bx += bw + 0.5
    n++
    if (n % 9 === 0 && bx < x + w - 14) {
      g.poly([bx, base, bx + 4, base, bx + 12, base - bh * 0.8, bx + 8, base - bh * 0.85])
        .fill(BOOKS[(n + 4) % BOOKS.length]!)
        .stroke({ ...THIN, width: 0.5 })
      bx += 12
    }
  }
  return n
}

// -- the bed -----------------------------------------------------------------

function bedGeometry(ctx: Ctx) {
  const R = ctx.plan.half
  if (ctx.layout.bed.spot === 'right') {
    return {
      frame: { x0: R - 124, x1: R - 2, y0: 0, y1: 30, z0: 170, z1: 394 } as Box,
      head: [
        [R - 128, 397],
        [R, 397],
      ] as [number, number][],
      foot: [
        [R - 128, 166],
        [R, 166],
      ] as [number, number][],
      // which way the free sides face: along x at the foot, along z down the side
      open: { side: { x: R - 126, z0: 170, z1: 330 }, foot: { z: 170, x0: R - 126, x1: R - 2 } },
      duvet: { x0: R - 128, x1: R, z0: 168, z1: 330 },
      fold: { x0: R - 128, x1: R, z0: 318, z1: 332 },
      pillows: [
        [R - 94, 372],
        [R - 38, 372],
        [R - 68, 346],
      ] as [number, number][],
    }
  }
  return {
    frame: { x0: -40, x1: R - 6, y0: 0, y1: 30, z0: 278, z1: 396 } as Box,
    head: [
      [R - 3, 274],
      [R - 3, 400],
    ] as [number, number][],
    foot: [
      [-44, 274],
      [-44, 400],
    ] as [number, number][],
    open: { side: null, foot: { z: 278, x0: -40, x1: R - 6 } },
    duvet: { x0: -44, x1: R - 80, z0: 276, z1: 399 },
    fold: { x0: R - 90, x1: R - 74, z0: 276, z1: 399 },
    pillows: [
      [R - 28, 362],
      [R - 28, 310],
      [R - 52, 336],
    ] as [number, number][],
  }
}

export function drawBed(ctx: Ctx) {
  const { style, frame, sheets, pillows, blanket } = ctx.layout.bed
  const fc = hex(frame)
  const bg = bedGeometry(ctx)
  // the back of a four-poster goes behind everything else on the bed
  if (style === 'canopy') canopyBack(ctx, ctx.layer('bed'), bg, fc)
  const g = ctx.layer('bed')
  const low = style === 'platform'
  const top = low ? 30 : 46

  const metal = style === 'iron' || style === 'brass'
  const metalColour = style === 'brass' ? mix(fc, BRASS, 0.7) : fc
  const end = (line: [number, number][], height: number, back: boolean) => {
    const [[ax, az], [bx, bz]] = line as [[number, number], [number, number]]
    const along = ax === bx
    if (style === 'wood' || style === 'canopy') {
      const box: Box = along
        ? { x0: ax - 4, x1: ax + 4, y0: 0, y1: height, z0: az, z1: bz }
        : { x0: ax, x1: bx, y0: 0, y1: height, z0: az - 4, z1: az + 4 }
      block(g, box, fc)
      block(
        g,
        { ...box, y0: height, y1: height + 6, x0: box.x0 - 2, x1: box.x1 + 2 },
        shade(fc, 0.2),
      )
      return
    }
    if (low) {
      // a padded headboard, no footboard
      if (!back) return
      const pts = [
        project([ax, 26, az]),
        project([bx, 26, bz]),
        project([bx, 96, bz]),
        project([ax, 96, az]),
      ]
      const c = mix(hex(pillows), fc, 0.4)
      g.moveTo(...pts[0]!)
        .lineTo(...pts[1]!)
        .quadraticCurveTo(pts[1]![0], pts[2]![1] - 6, pts[2]![0], pts[2]![1])
        .quadraticCurveTo((pts[2]![0] + pts[3]![0]) / 2, pts[2]![1] - 10, ...pts[3]!)
        .quadraticCurveTo(pts[0]![0], pts[3]![1] - 6, ...pts[0]!)
        .closePath()
        .fill(c)
        .stroke(LINE)
      for (let i = 1; i < 6; i++) {
        const t = i / 6
        const p0 = project([ax + (bx - ax) * t, 34, az + (bz - az) * t])
        const p1 = project([ax + (bx - ax) * t, 90, az + (bz - az) * t])
        g.moveTo(...p0)
          .lineTo(...p1)
          .stroke({ color: shade(c, -0.3), width: 1.2 })
      }
      return
    }
    // iron or brass: posts with knobs, a curved top rail, spindles and curls
    const post = (x: number, z: number) => {
      const [px, py] = project([x, 0, z])
      const [tx, ty] = project([x, height + 8, z])
      g.moveTo(px, py).lineTo(tx, ty).stroke({ color: metalColour, width: 5 })
      const k = at([x, height + 8, z])
      g.circle(tx, ty - 3 * k.s, 4.5 * k.s)
        .fill(BRASS)
        .stroke(THIN)
    }
    post(ax, az)
    post(bx, bz)
    const rail = (y: number, arc: number) => {
      const pts: number[] = []
      for (let i = 0; i <= 16; i++) {
        const t = i / 16
        pts.push(
          ...project([ax + (bx - ax) * t, y + Math.sin(t * Math.PI) * arc, az + (bz - az) * t]),
        )
      }
      return pts
    }
    g.poly(rail(height, back ? 26 : 12), false).stroke({ color: metalColour, width: 3.5 })
    g.poly(rail(height * 0.45, 0), false).stroke({ color: metalColour, width: 3 })
    for (let i = 1; i < 10; i++) {
      const t = i / 10
      const tp = height + Math.sin(t * Math.PI) * (back ? 26 : 12)
      g.moveTo(...project([ax + (bx - ax) * t, height * 0.45, az + (bz - az) * t]))
        .lineTo(...project([ax + (bx - ax) * t, tp, az + (bz - az) * t]))
        .stroke({ color: metalColour, width: 2 })
    }
    if (back) {
      const mid = project([(ax + bx) / 2, height + 6, (az + bz) / 2])
      const k = at([(ax + bx) / 2, height, (az + bz) / 2]).s
      for (const d of [-1, 1])
        g.circle(mid[0] + d * 10 * k, mid[1], 5.5 * k).stroke({ color: metalColour, width: 2 })
    }
  }

  end(bg.head, low ? 96 : 110, true)

  // base and mattress
  if (!metal) block(g, { ...bg.frame, y0: low ? 0 : 8, y1: low ? 16 : 30 }, fc)
  else block(g, { ...bg.frame, y0: 14, y1: 28 }, shade(metalColour, 0.1))
  const sh = hex(sheets)
  block(
    g,
    { ...bg.frame, y0: low ? 16 : 30, y1: top, x0: bg.frame.x0 + 2, x1: bg.frame.x1 - 2 },
    sh,
  )

  // pillows, plump and slightly askew, then a little cushion in front
  const pc = hex(pillows)
  bg.pillows.forEach(([px, pz], i) => {
    const p = at([px, top + 10, pz])
    const c = i === 2 ? mix(pc, hex(blanket), 0.5) : i === 1 ? shade(pc, 0.12) : pc
    const size = i === 2 ? 0.7 : 1
    pillow(g, p.x, p.y, 46 * p.s * size, 22 * p.s * size, c, (i - 1) * 0.12)
  })

  // the duvet: a soft lump on top, then fabric falling over every open edge
  const bc = hex(blanket)
  const d = bg.duvet
  const quilt = ctx.layer('bed')
  const lump: P3[] = []
  const steps = 8
  for (let i = 0; i <= steps; i++)
    lump.push([
      d.x0 + ((d.x1 - d.x0) * i) / steps,
      top + 6 + Math.sin((i / steps) * Math.PI) * 3,
      d.z0,
    ])
  for (let i = 0; i <= steps; i++)
    lump.push([
      d.x1,
      top + 6 + Math.sin((i / steps) * Math.PI) * 5,
      d.z0 + ((d.z1 - d.z0) * i) / steps,
    ])
  for (let i = steps; i >= 0; i--) lump.push([d.x0 + ((d.x1 - d.x0) * i) / steps, top + 8, d.z1])
  for (let i = steps; i >= 0; i--)
    lump.push([
      d.x0,
      top + 6 + Math.sin((i / steps) * Math.PI) * 4,
      d.z0 + ((d.z1 - d.z0) * i) / steps,
    ])
  quilt.poly(flat(...lump)).fill(bc)
  quilt.poly(flat(...lump)).stroke(THIN)
  // tufts and stitching on top
  for (let i = 0; i < 22; i++) {
    const x = d.x0 + 8 + ctx.rng() * (d.x1 - d.x0 - 16)
    const z = d.z0 + 6 + ctx.rng() * (d.z1 - d.z0 - 12)
    const [sx, sy] = project([x, top + 9, z])
    const k = at([x, top, z]).s * 2.2
    quilt
      .moveTo(sx - k, sy - k * 0.5)
      .lineTo(sx + k, sy + k * 0.5)
      .moveTo(sx + k, sy - k * 0.5)
      .lineTo(sx - k, sy + k * 0.5)
      .stroke({ color: shade(bc, 0.45), width: 1.1 })
  }
  // soft ridges where it's rumpled
  for (let i = 0; i < 4; i++) {
    const z = d.z0 + ((i + 0.5) * (d.z1 - d.z0)) / 4
    const a = project([d.x0 + 10, top + 8, z - 10])
    const b = project([d.x1 - 10, top + 8, z + 12])
    quilt
      .moveTo(...a)
      .quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 5, ...b)
      .stroke({ color: shade(bc, -0.3), width: 1.4, alpha: 0.6 })
  }
  const hang = top - (low ? 4 : 10)
  const footEdge: P3[] = []
  for (let i = 0; i <= 10; i++)
    footEdge.push([
      bg.open.foot.x0 - 2 + ((bg.open.foot.x1 - bg.open.foot.x0 + 4) * i) / 10,
      top + 6,
      bg.open.foot.z - 3,
    ])
  if (bg.open.side) {
    const sideEdge: P3[] = []
    for (let i = 0; i <= 10; i++)
      sideEdge.push([
        bg.open.side.x - 3,
        top + 6,
        bg.open.side.z1 - ((bg.open.side.z1 - bg.open.side.z0) * i) / 10,
      ])
    drape(ctx, quilt, sideEdge, hang, shade(bc, -0.12), { wave: 5 })
  } else {
    // bed under the window: the duvet hangs off the far end too
    const endEdge: P3[] = []
    for (let i = 0; i <= 6; i++) endEdge.push([d.x0 - 2, top + 6, d.z1 - ((d.z1 - d.z0) * i) / 6])
    drape(ctx, quilt, endEdge, hang, shade(bc, -0.2), { wave: 4 })
  }
  drape(ctx, quilt, footEdge, hang, shade(bc, -0.05), { wave: 6, folds: 6 })
  // the sheet folded back over the top of the duvet
  const f = bg.fold
  quilt
    .poly(
      flat(
        [f.x0, top + 8, f.z0],
        [f.x1, top + 8, f.z0],
        [f.x1, top + 9, f.z1],
        [f.x0, top + 9, f.z1],
      ),
    )
    .fill(sh)
    .stroke(THIN)

  end(bg.foot, low ? 0 : 60, false)
  if (style === 'canopy') canopyFront(ctx, bg, fc)

  ctx.hit('bed', (h) => {
    const f = bg.frame
    h.poly([
      ...project([f.x0, 0, f.z0]),
      ...project([f.x1, 0, f.z0]),
      ...project([f.x1, style === 'canopy' ? canopyHeight(ctx) : 130, f.z1]),
      ...project([f.x0, style === 'canopy' ? canopyHeight(ctx) : 130, f.z1]),
    ])
  })
}

type BedGeo = ReturnType<typeof bedGeometry>

/** a four-poster's frame stops short of the ceiling */
function canopyHeight(ctx: Ctx) {
  return Math.min(330, ctx.plan.height - 60)
}

/** a gathered panel of sheer fabric hanging down a post, flaring at the floor */
function panel(ctx: Ctx, g: Graphics, x: number, z: number, alongX: boolean, dir: number) {
  const CANOPY = canopyHeight(ctx)
  const top: P3[] = []
  for (let i = 0; i <= 3; i++)
    top.push(alongX ? [x + dir * i * 5, CANOPY, z] : [x, CANOPY, z + dir * i * 5])
  drape(ctx, g, top, CANOPY - 4, 0xf6f0e6, { alpha: 0.7, wave: 8, folds: 3 })
}

/** the two back posts of a four-poster, a swag between them and panels down each */
function canopyBack(ctx: Ctx, g: Graphics, bg: BedGeo, fc: number) {
  const CANOPY = canopyHeight(ctx)
  const [[ax, az], [bx, bz]] = bg.head as [[number, number], [number, number]]
  for (const [x, z] of [
    [ax, az],
    [bx, bz],
  ] as [number, number][])
    block(g, { x0: x - 3, x1: x + 3, y0: 0, y1: CANOPY, z0: z - 3, z1: z + 3 }, fc)
  const alongX = az === bz
  const edge: P3[] = []
  for (let i = 0; i <= 8; i++)
    edge.push([ax + ((bx - ax) * i) / 8, CANOPY, az + ((bz - az) * i) / 8])
  drape(ctx, g, edge, 30, 0xf6f0e6, { alpha: 0.5, wave: 12, folds: 5 })
  panel(ctx, g, ax, az, alongX, 1)
  panel(ctx, g, bx, bz, alongX, -1)
}

/** front posts, the rails across the top, a swag at the front and panels down the posts */
function canopyFront(ctx: Ctx, bg: BedGeo, fc: number) {
  const CANOPY = canopyHeight(ctx)
  const g = ctx.layer('bed')
  const [[hx0, hz0], [hx1, hz1]] = bg.head as [[number, number], [number, number]]
  const [[fx0, fz0], [fx1, fz1]] = bg.foot as [[number, number], [number, number]]
  for (const [x, z] of [
    [fx0, fz0],
    [fx1, fz1],
  ] as [number, number][])
    block(g, { x0: x - 3, x1: x + 3, y0: 0, y1: CANOPY, z0: z - 3, z1: z + 3 }, fc)
  const rails: [P3, P3][] = [
    [
      [hx0, CANOPY, hz0],
      [fx0, CANOPY, fz0],
    ],
    [
      [hx1, CANOPY, hz1],
      [fx1, CANOPY, fz1],
    ],
    [
      [fx0, CANOPY, fz0],
      [fx1, CANOPY, fz1],
    ],
  ]
  for (const [a, b] of rails) g.poly(flat(a, b), false).stroke({ color: fc, width: 4 })
  const swag: P3[] = []
  for (let i = 0; i <= 10; i++)
    swag.push([fx0 + ((fx1 - fx0) * i) / 10, CANOPY, fz0 + ((fz1 - fz0) * i) / 10])
  drape(ctx, g, swag, 30, 0xf6f0e6, { alpha: 0.55, wave: 12, folds: 5 })
  // one long drape down the post nearest the room
  panel(ctx, g, fx0, fz0, fz0 === fz1, 1)
}

// -- the desk ----------------------------------------------------------------

/** draws the desk and its chair, fitted to the stretch of wall the plan gives it */
export function drawDesk(ctx: Ctx) {
  const { wall, z0, z1 } = ctx.plan.desk
  const flip = wall === 'right' ? mirror : (b: Box) => b
  // x on the desk's side of the room, measured out from the wall
  const at_ = (depth: number) => (wall === 'right' ? ctx.plan.half - depth : -ctx.plan.half + depth)
  const c = hex(ctx.layout.desk.color)
  const g = ctx.layer('desk')
  const style = ctx.plan.variant.desk
  const L = -ctx.plan.half
  const mid = (z0 + z1) / 2
  let topY = 76
  let front = 40

  if (style === 'trestle') {
    // a long work table on A-frame legs
    for (const z of [z0 + 16, z1 - 16]) {
      for (const [x0, x1] of [
        [L + 8, L + 14],
        [L + 60, L + 66],
      ] as [number, number][])
        block(g, flip({ x0, x1, y0: 0, y1: 74, z0: z - 3, z1: z + 3 }), shade(c, -0.15))
      block(
        g,
        flip({ x0: L + 8, x1: L + 66, y0: 30, y1: 34, z0: z - 2, z1: z + 2 }),
        shade(c, -0.15),
      )
    }
    block(g, flip({ x0: L, x1: L + 78, y0: 74, y1: 80, z0: z0 + 4, z1: z1 - 2 }), c)
    topY = 80
    // drawings, a jar of brushes
    block(g, flip({ x0: L + 20, x1: L + 60, y0: 80, y1: 81, z0: z0 + 20, z1: mid }), 0xf2e2bd, {
      ...THIN,
      width: 0.6,
    })
    const jar = at([at_(30), 80, mid + 24])
    g.roundRect(jar.x - 5 * jar.s, jar.y - 12 * jar.s, 10 * jar.s, 12 * jar.s, 2)
      .fill({ color: 0xc8e8e0, alpha: 0.8 })
      .stroke(THIN)
    for (let i = 0; i < 4; i++)
      g.moveTo(jar.x + (i - 1.5) * 2 * jar.s, jar.y - 10 * jar.s)
        .lineTo(jar.x + (i - 1.5) * 4 * jar.s, jar.y - 26 * jar.s)
        .stroke({ color: BOOKS[i]!, width: 2 })
  } else if (style === 'secretary') {
    // a bureau: drawers below, the flap folded down to write on, pigeonholes
    // behind it and a glass-fronted bookcase on top
    const za = z0 + 10
    const zb = z1 - 10
    const body = flip({ x0: L, x1: L + 48, y0: 0, y1: 92, z0: za, z1: zb })
    block(g, body, c)
    const face = at_(48)
    for (const y of [30, 60]) g.poly(flat([face, y, za], [face, y, zb]), false).stroke(THIN)
    for (const y of [16, 46, 76]) {
      const [kx, ky] = project([face, y, (za + zb) / 2])
      g.circle(kx, ky, 2.2)
        .fill(BRASS)
        .stroke({ ...THIN, width: 0.6 })
    }
    block(g, flip({ x0: L, x1: L + 26, y0: 92, y1: 150, z0: za, z1: zb }), shade(c, -0.1))
    const hx = at_(26)
    for (let z = za + 18; z < zb; z += 22)
      g.poly(flat([hx, 92, z], [hx, 150, z]), false).stroke(THIN)
    g.poly(flat([hx, 121, za], [hx, 121, zb]), false).stroke(THIN)
    for (let z = za + 6; z < zb - 8; z += 22) {
      const [lx, ly] = project([hx, 96, z + 8])
      g.rect(lx - 2, ly - 10, 6, 10)
        .fill(0xf2e2bd)
        .stroke({ ...THIN, width: 0.5 })
    }
    // the flap, down
    block(
      g,
      flip({ x0: L + 48, x1: L + 82, y0: 88, y1: 92, z0: za + 2, z1: zb - 2 }),
      shade(c, 0.1),
    )
    // glass bookcase on top
    block(g, flip({ x0: L, x1: L + 30, y0: 150, y1: 236, z0: za, z1: zb }), c)
    const ux = at_(30)
    for (const y of [178, 206])
      g.poly(flat([ux, y, za + 6], [ux, y, zb - 6]), false).stroke({
        color: shade(c, -0.3),
        width: 2,
      })
    for (const [y0, y1] of [
      [152, 176],
      [180, 204],
      [208, 232],
    ] as [number, number][])
      shelfOfBooks(ctx, g, ux, y0, y1, za + 8, zb - 8)
    g.poly(flat([ux, 150, za + 4], [ux, 150, zb - 4], [ux, 236, zb - 4], [ux, 236, za + 4])).fill({
      color: 0xc8e8ff,
      alpha: 0.12,
    })
    block(
      g,
      flip({ x0: L - 2, x1: L + 34, y0: 236, y1: 244, z0: za - 4, z1: zb + 4 }),
      shade(c, 0.15),
    )
    topY = 92
    front = 66
  } else {
    // a plain table, maybe with a hutch of shelves along the wall
    for (const l of [
      { x0: L + 76, x1: L + 82, z0: z0 + 4, z1: z0 + 10 },
      { x0: L + 76, x1: L + 82, z0: z1 - 10, z1: z1 - 4 },
      { x0: L + 4, x1: L + 10, z0: z0 + 4, z1: z0 + 10 },
    ])
      block(g, flip({ ...l, y0: 0, y1: 68 }), shade(c, -0.1))
    const dz0 = Math.max(z0 + 14, z1 - 70)
    block(g, flip({ x0: L + 2, x1: L + 80, y0: 44, y1: 68, z0: dz0, z1: z1 - 4 }), c)
    const kx = at_(80)
    g.poly(flat([kx, 56, dz0], [kx, 56, z1 - 4]), false).stroke(THIN)
    for (const y of [50, 62]) {
      const [px, py] = project([kx, y, (dz0 + z1) / 2])
      g.circle(px, py, 2)
        .fill(BRASS)
        .stroke({ ...THIN, width: 0.6 })
    }
    block(g, flip({ x0: L, x1: L + 84, y0: 68, y1: 76, z0, z1 }), c)
    if (style === 'hutch') {
      block(
        g,
        flip({ x0: L, x1: L + 24, y0: 76, y1: 180, z0: z0 + 4, z1: z1 - 4 }),
        shade(c, -0.05),
      )
      const hx = at_(24)
      for (const [y0, y1] of [
        [80, 124],
        [128, 176],
      ] as [number, number][]) {
        g.poly(flat([hx, y1, z0 + 4], [hx, y1, z1 - 4]), false).stroke({
          color: shade(c, -0.35),
          width: 2,
        })
        shelfOfBooks(ctx, g, hx, y0, y1, z0 + 10, z1 - 12, true)
      }
      block(g, flip({ x0: L - 2, x1: L + 28, y0: 178, y1: 184, z0, z1 }), shade(c, 0.15))
    }
  }

  // things on the desk: notebook, a mug that steams, a plant
  block(
    g,
    flip({
      x0: L + front - 16,
      x1: L + front + 14,
      y0: topY,
      y1: topY + 1,
      z0: mid - 20,
      z1: mid + 16,
    }),
    0xf2e2bd,
    { ...THIN, width: 0.6 },
  )
  steamingMug(ctx, g, [at_(front + 22), topY, z1 - 32])
  if (style !== 'secretary')
    potPlant(ctx, g, [at_(16), topY, z0 + 18], 0.85, ctx.plan.variant.plants[0]!, 3)

  drawChair(ctx, flip, mid - 21, topY)

  ctx.hit('desk', (h) => {
    const x = at_(90)
    const tall = style === 'secretary' ? 244 : style === 'hutch' ? 184 : 110
    h.poly([
      ...project([x, 0, z0]),
      ...project([x, 0, z1]),
      ...project([x, tall, z1]),
      ...project([x, tall, z0]),
    ])
  })
}

/** a shelf's worth of book spines on a wall-facing plane, the odd plant among them */
function shelfOfBooks(
  ctx: Ctx,
  g: Graphics,
  x: number,
  y0: number,
  y1: number,
  za: number,
  zb: number,
  plants = false,
) {
  let z = za
  let n = Math.floor(ctx.rng() * 9)
  while (z < zb) {
    const bw = 4 + (n % 3) * 2
    if (plants && n % 7 === 3) {
      potPlant(
        ctx,
        g,
        [x, y0, z + 8],
        0.55,
        ctx.plan.variant.plants[n % ctx.plan.variant.plants.length]!,
        n,
      )
      z += 20
    } else {
      const top = y0 + (y1 - y0) * (0.65 + (n % 4) * 0.08)
      g.poly(flat([x, y0, z], [x, y0, z + bw], [x, top, z + bw], [x, top, z]))
        .fill(BOOKS[n % BOOKS.length]!)
        .stroke({ ...THIN, width: 0.4 })
      z += bw + 0.6
    }
    n++
  }
}

/** a mug with steam curling off it */
export function steamingMug(ctx: Ctx, g: Graphics, p: P3) {
  const mp = at(p)
  g.roundRect(mp.x - 5 * mp.s, mp.y - 11 * mp.s, 10 * mp.s, 11 * mp.s, 2)
    .fill(0xf2e2bd)
    .stroke(THIN)
  g.circle(mp.x + 6 * mp.s, mp.y - 6 * mp.s, 3 * mp.s).stroke({ color: 0xf2e2bd, width: 1.5 })
  const steam = ctx.layer()
  ctx.live(steam)
  ctx.anim.push((t) => {
    steam.clear()
    for (let i = 0; i < 2; i++) {
      const ph = t * 0.8 + i * 1.7
      const yy = mp.y - 14 * mp.s - ((ph * 8) % 14)
      steam
        .moveTo(mp.x + (i - 0.5) * 4, yy)
        .quadraticCurveTo(mp.x + Math.sin(ph) * 5, yy - 6, mp.x + (i - 0.5) * 4, yy - 12)
        .stroke({ color: 0xffffff, width: 1, alpha: 0.35 })
    }
  })
}

/** a café chair pulled up to the desk, with a cushion that's seen some use */
function drawChair(ctx: Ctx, flip: (b: Box) => Box, z: number, deskTop: number) {
  const L = -ctx.plan.half
  const g = ctx.layer('desk')
  const wood = shade(hex(ctx.layout.desk.color), 0.1)
  const seatY = Math.min(46, deskTop - 30)
  const x0 = L + 88
  for (const [lx, lz] of [
    [x0, z],
    [x0, z + 38],
    [x0 + 34, z],
    [x0 + 34, z + 38],
  ] as [number, number][])
    block(
      g,
      flip({ x0: lx, x1: lx + 3, y0: 0, y1: seatY, z0: lz, z1: lz + 3 }),
      shade(wood, -0.2),
      THIN,
    )
  block(g, flip({ x0, x1: x0 + 38, y0: seatY, y1: seatY + 5, z0: z, z1: z + 42 }), wood)
  block(
    g,
    flip({ x0: x0 + 34, x1: x0 + 39, y0: seatY + 5, y1: seatY + 58, z0: z + 2, z1: z + 40 }),
    wood,
  )
  const sx = (v: number) => flip({ x0: v, x1: v, y0: 0, y1: 0, z0: 0, z1: 0 }).x0
  cushion(
    g,
    [
      [sx(x0 + 3), seatY + 6, z + 3],
      [sx(x0 + 33), seatY + 6, z + 3],
      [sx(x0 + 33), seatY + 9, z + 39],
      [sx(x0 + 3), seatY + 9, z + 39],
    ],
    hex(ctx.layout.bed.pillows),
  )
}

// -- the nightstand --------------------------------------------------------------

/** the nightstand by the head of the bed; hands back where the lamp stands */
export function drawNightstand(ctx: Ctx): P3 {
  const n = ctx.plan.nightstand
  const g = ctx.layer('nightstand')
  const wood = hex(ctx.layout.desk.color)
  const cx = (n.x0 + n.x1) / 2
  const cz = (n.z0 + n.z1) / 2
  let top = n.h
  switch (ctx.layout.nightstand) {
    case 'drawers': {
      for (const [lx, lz] of [
        [n.x0 + 2, n.z0 + 2],
        [n.x1 - 6, n.z0 + 2],
      ] as [number, number][])
        block(g, { x0: lx, x1: lx + 4, y0: 0, y1: 10, z0: lz, z1: lz + 4 }, shade(wood, -0.2), THIN)
      const body = { x0: n.x0, x1: n.x1, y0: 10, y1: n.h, z0: n.z0, z1: n.z1 }
      block(g, body, wood)
      // two drawers with brass knobs on the front
      for (const y of [10 + (n.h - 10) / 2])
        g.poly(flat([n.x0, y, n.z0], [n.x1, y, n.z0]), false).stroke(THIN)
      for (const y of [10 + (n.h - 10) * 0.25, 10 + (n.h - 10) * 0.75]) {
        const [kx, ky] = project([cx, y, n.z0])
        g.circle(kx, ky, 2.4)
          .fill(BRASS)
          .stroke({ ...THIN, width: 0.6 })
      }
      block(
        g,
        { ...body, y0: n.h, y1: n.h + 3, x0: n.x0 - 2, x1: n.x1 + 2, z0: n.z0 - 2 },
        shade(wood, 0.15),
      )
      top = n.h + 3
      break
    }
    case 'skirted': {
      // a round table under a long cloth that pools on the floor
      const cloth = mix(hex(ctx.layout.window.curtainColor), 0xf2e2bd, 0.4)
      const rx = (n.x1 - n.x0) / 2 + 2
      const rz = (n.z1 - n.z0) / 2 + 2
      const rim: P3[] = []
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI + (i / 12) * Math.PI
        rim.push([cx + Math.cos(a) * rx, n.h, cz - Math.sin(a) * rz * -1])
      }
      drape(ctx, g, rim, n.h, cloth, { wave: 3, folds: 6 })
      const topRim: number[] = []
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2
        topRim.push(...project([cx + Math.cos(a) * rx, n.h, cz + Math.sin(a) * rz]))
      }
      const lid = ctx.layer('nightstand')
      lid.poly(topRim).fill(shade(cloth, 0.12)).stroke(THIN)
      top = n.h
      break
    }
    case 'suitcases': {
      // old suitcases stacked up, biggest at the bottom
      const cases = [
        { h: 24, c: 0x8a5a2a, inset: 0 },
        { h: 20, c: 0x2f6b66, inset: 3 },
        { h: 18, c: 0xa8432e, inset: 6 },
      ]
      let y = 0
      for (const k of cases) {
        const box = {
          x0: n.x0 + k.inset,
          x1: n.x1 - k.inset,
          y0: y,
          y1: y + k.h,
          z0: n.z0 + k.inset,
          z1: n.z1 - k.inset,
        }
        block(g, box, k.c)
        for (const sx of [box.x0 + (box.x1 - box.x0) * 0.3, box.x0 + (box.x1 - box.x0) * 0.7])
          g.poly(flat([sx, y, box.z0], [sx, y + k.h, box.z0]), false).stroke({
            color: 0x3a2418,
            width: 2.5,
          })
        const [hx, hy] = project([cx, y + k.h * 0.55, box.z0])
        g.rect(hx - 3, hy - 2, 6, 4).fill(BRASS)
        y += k.h
      }
      top = y
      break
    }
  }
  // a book and a glass of water next to the lamp
  const off = (n.x1 - n.x0) * 0.28
  block(
    g,
    { x0: cx + off - 8, x1: cx + off + 6, y0: top, y1: top + 3, z0: cz - 10, z1: cz + 6 },
    0x2a4a8a,
    { ...THIN, width: 0.5 },
  )
  const glass = at([cx - off, top, cz + 4])
  g.rect(glass.x - 2.5 * glass.s, glass.y - 9 * glass.s, 5 * glass.s, 9 * glass.s)
    .fill({ color: 0xc8e8ff, alpha: 0.5 })
    .stroke({ ...THIN, width: 0.6 })
  ctx.hit('nightstand', (h) =>
    h.poly([
      ...project([n.x0, 0, n.z0]),
      ...project([n.x1, 0, n.z0]),
      ...project([n.x1, top, n.z0]),
      ...project([n.x0, top, n.z0]),
    ]),
  )
  return [cx, top, cz + 2]
}

export function drawRug(ctx: Ctx) {
  const { shape, color } = ctx.layout.rug
  if (shape === 'none') return
  const c = hex(color)
  const cx = ctx.layout.bed.spot === 'right' ? -ctx.plan.half * 0.05 : 0
  const cz = 186
  const outline = (k: number): [number, number][] => {
    const corners = (...ps: [number, number][]) =>
      ps.map(([x, z]): [number, number] => [cx + x * k, cz + z * k])
    switch (shape) {
      case 'rect':
        return corners([-112, -76], [112, -76], [112, 76], [-112, 76])
      case 'diamond':
        return corners([0, -88], [124, 0], [0, 88], [-124, 0])
      default: {
        const [rx, rz] = shape === 'circle' ? [94, 94] : [132, 82]
        return Array.from({ length: 48 }, (_, i): [number, number] => {
          const a = (i / 48) * Math.PI * 2
          return [cx + Math.cos(a) * rx * k, cz + Math.sin(a) * rz * k]
        })
      }
    }
  }
  const g = ctx.layer('rug')
  g.poly(onFloor(outline(1.03), 0.2)).fill({ color: INK, alpha: 0.3 })
  fillPoly(g, onFloor(outline(1)), c)
  g.poly(onFloor(outline(0.9)))
    .fill(shade(c, -0.3))
    .stroke({ ...THIN, alpha: 0.5 })
  g.poly(onFloor(outline(0.84))).fill(c)
  g.poly(onFloor(outline(0.66))).fill(mix(c, 0xf2e2bd, 0.6))
  g.poly(onFloor(outline(0.56))).fill(shade(c, 0.12))
  g.poly(onFloor(outline(0.24)))
    .fill(0xe8c25a)
    .stroke({ ...THIN, alpha: 0.6 })
  // little woven motifs scattered over the field
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2
    const r = shape === 'rect' || shape === 'diamond' ? 0.4 : 0.42
    const [ox, oz] = outline(r)[Math.floor((i / 14) * outline(r).length)] ?? [cx, cz]
    const mx = ox + Math.cos(a) * 4
    const mz = oz + Math.sin(a) * 4
    g.poly(
      onFloor(
        [
          [mx, mz - 5],
          [mx + 5, mz],
          [mx, mz + 5],
          [mx - 5, mz],
        ],
        0.7,
      ),
    ).fill(i % 2 ? 0xe8c25a : shade(c, -0.35))
  }
  if (shape === 'rect') {
    for (const zEdge of [-76, 76]) {
      for (let x = -110; x <= 110; x += 5)
        g.poly(
          onFloor(
            [
              [cx + x, cz + zEdge],
              [cx + x + (x % 3), cz + zEdge + Math.sign(zEdge) * 9],
            ],
            0.7,
          ),
          false,
        ).stroke({ color: 0xf2e2bd, width: 1 })
    }
  }
  ctx.hit('rug', (h) => h.poly(onFloor(outline(1))))
}
