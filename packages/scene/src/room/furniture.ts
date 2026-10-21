import { Graphics } from 'pixi.js'
import { at, type Ctx } from './context'
import { block, fillPoly, hex, INK, mix, shade, THIN } from './paint'
import { boxFaces, flat, mirror, onFloor, project, type Box, type P3 } from './projection'
import { potPlant } from './window'

const BOOKS = [
  0xc8302a, 0xe8c25a, 0x2a4a8a, 0x3a7a3a, 0xe8803a, 0x7a2a4a, 0xf2e2bd, 0x2f6b66, 0x1e1a1c,
]
const BRASS = 0xd9a54a

export function shelfBox(ctx: Ctx): Box {
  return ctx.layout.bed.spot === 'window'
    ? { x0: -194, x1: -64, y0: 0, y1: 80, z0: 366, z1: 400 }
    : { x0: -72, x1: 72, y0: 0, y1: 80, z0: 366, z1: 400 }
}

/** the low built-in bookcase under the window */
export function drawBookshelf(ctx: Ctx) {
  const g = ctx.layer()
  const b = shelfBox(ctx)
  const wood = 0x4a2a1c
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
  const cols = 3
  const cw = (w - 8) / cols
  let n = Math.floor(ctx.rng() * 9)
  for (let row = 0; row < 2; row++) {
    for (let c = 0; c < cols; c++) {
      const x = fx0 + 4 + c * cw
      const y = fy0 + 5 + row * ((h - 8) / 2)
      const ch = (h - 10) / 2 - 3
      // arched tops on the upper cubbies, like they were built into the wall
      if (row === 0) {
        g.moveTo(x, y + ch)
          .lineTo(x, y + cw / 3)
          .quadraticCurveTo(x + (cw - 2) / 2, y - cw / 6, x + cw - 2, y + cw / 3)
          .lineTo(x + cw - 2, y + ch)
          .closePath()
          .fill(0x160c08)
          .stroke(THIN)
      } else {
        g.rect(x, y, cw - 2, ch)
          .fill(0x160c08)
          .stroke(THIN)
      }
      const kind = (row * cols + c + n) % 5
      if (kind === 3) {
        const px = x + cw / 2
        g.moveTo(px - 7, y + ch - 12)
          .lineTo(px + 7, y + ch - 12)
          .lineTo(px + 5, y + ch)
          .lineTo(px - 5, y + ch)
          .closePath()
          .fill(0xb8643a)
          .stroke(THIN)
        for (let i = 0; i < 5; i++) {
          // trailing pothos spilling out of the cubby
          g.moveTo(px, y + ch - 12)
            .quadraticCurveTo(
              px - 12 + i * 6,
              y + ch - 4,
              px - 14 + i * 7,
              y + ch + 6 + (i % 2) * 8,
            )
            .stroke({ color: 0x2e5a2e, width: 1.2 })
          g.ellipse(px - 14 + i * 7, y + ch + 6 + (i % 2) * 8, 2.5, 3.5).fill(0x5a9a3a)
        }
      } else if (kind === 4) {
        // records leaning in a cubby
        for (let i = 0; i < 4; i++)
          g.rect(x + 3 + i * 3, y + ch - 24, 22, 24)
            .fill(BOOKS[(n + i * 2) % BOOKS.length]!)
            .stroke(THIN)
      } else {
        let bx = x + 3
        while (bx < x + cw - 9) {
          const bw = 3 + ((n * 7) % 4)
          const bh = ch * (0.62 + ((n * 13) % 5) * 0.07)
          g.rect(bx, y + ch - bh, bw, bh)
            .fill(BOOKS[n % BOOKS.length]!)
            .stroke({ ...THIN, width: 0.6 })
          bx += bw + 0.5
          n++
          // one leaning over every so often
          if (n % 7 === 0 && bx < x + cw - 14) {
            g.poly([
              bx,
              y + ch,
              bx + 4,
              y + ch,
              bx + 12,
              y + ch - bh * 0.8,
              bx + 8,
              y + ch - bh * 0.85,
            ])
              .fill(BOOKS[(n + 4) % BOOKS.length]!)
              .stroke({ ...THIN, width: 0.6 })
            bx += 12
          }
        }
      }
    }
  }
  return b
}

/** where the head and foot of the bed are, as lines along the floor */
function bedGeometry(ctx: Ctx) {
  if (ctx.layout.bed.spot === 'right') {
    return {
      frame: { x0: 74, x1: 198, y0: 14, y1: 30, z0: 172, z1: 392 } as Box,
      head: [
        [72, 396],
        [200, 396],
      ] as [number, number][],
      foot: [
        [72, 170],
        [200, 170],
      ] as [number, number][],
      blanket: { x0: 72, x1: 200, y0: 26, y1: 50, z0: 168, z1: 300 } as Box,
      pillows: [
        { x0: 84, x1: 136, z0: 352, z1: 388 },
        { x0: 140, x1: 192, z0: 352, z1: 388 },
        { x0: 96, x1: 128, z0: 330, z1: 352 },
      ],
      cat: [140, 50, 230] as P3,
    }
  }
  return {
    frame: { x0: -38, x1: 190, y0: 14, y1: 30, z0: 280, z1: 396 } as Box,
    head: [
      [196, 276],
      [196, 400],
    ] as [number, number][],
    foot: [
      [-42, 276],
      [-42, 400],
    ] as [number, number][],
    blanket: { x0: -44, x1: 112, y0: 26, y1: 50, z0: 276, z1: 399 } as Box,
    pillows: [
      { x0: 150, x1: 188, z0: 340, z1: 392 },
      { x0: 150, x1: 188, z0: 286, z1: 336 },
      { x0: 128, x1: 150, z0: 300, z1: 330 },
    ],
    cat: [10, 50, 320] as P3,
  }
}

export function drawBed(ctx: Ctx) {
  const { style, frame, sheets, pillows, blanket } = ctx.layout.bed
  const fc = hex(frame)
  const bg = bedGeometry(ctx)
  const g = ctx.layer('bed')

  const end = (line: [number, number][], height: number, back: boolean) => {
    const [[ax, az], [bx, bz]] = line as [[number, number], [number, number]]
    if (style === 'wood') {
      const box: Box =
        ax === bx
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
    // iron: two posts with brass knobs, a curved top rail and spindles
    const post = (x: number, z: number) => {
      const [px, py] = project([x, 0, z])
      const [tx, ty] = project([x, height + 8, z])
      g.moveTo(px, py).lineTo(tx, ty).stroke({ color: fc, width: 5 })
      const k = at([x, height + 8, z])
      g.circle(tx, ty - 3 * k.s, 4 * k.s)
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
    g.poly(rail(height, back ? 22 : 10), false).stroke({ color: fc, width: 3.5 })
    g.poly(rail(height * 0.45, 0), false).stroke({ color: fc, width: 3 })
    for (let i = 1; i < 10; i++) {
      const t = i / 10
      const top = height + Math.sin(t * Math.PI) * (back ? 22 : 10)
      const p0 = project([ax + (bx - ax) * t, height * 0.45, az + (bz - az) * t])
      const p1 = project([ax + (bx - ax) * t, top, az + (bz - az) * t])
      g.moveTo(...p0)
        .lineTo(...p1)
        .stroke({ color: fc, width: 2 })
    }
    // a pair of curls in the middle
    if (back) {
      const mid = project([(ax + bx) / 2, height + 4, (az + bz) / 2])
      const k = at([(ax + bx) / 2, height, (az + bz) / 2]).s
      for (const d of [-1, 1]) {
        g.circle(mid[0] + d * 9 * k, mid[1], 5 * k).stroke({ color: fc, width: 2 })
      }
    }
  }

  end(bg.head, 100, true)
  // bed base and mattress
  block(g, { ...bg.frame, y0: 8 }, style === 'iron' ? shade(fc, 0.15) : fc)
  const mattress = { ...bg.frame, y0: 30, y1: 46, x0: bg.frame.x0 + 2, x1: bg.frame.x1 - 2 }
  block(g, mattress, hex(sheets))

  // pillows, puffed up, plus a little accent cushion
  const pc = hex(pillows)
  bg.pillows.forEach((p, i) => {
    const c = i === 2 ? mix(pc, hex(blanket), 0.5) : i === 1 ? shade(pc, 0.12) : pc
    const box = { ...p, y0: 46, y1: i === 2 ? 60 : 62 }
    const f = boxFaces(box)
    fillPoly(g, f.front, shade(c, -0.12))
    if (f.top) fillPoly(g, f.top, c)
    if (f.side) fillPoly(g, f.side, shade(c, -0.3))
    const [cx, cy] = project([(p.x0 + p.x1) / 2, 62, (p.z0 + p.z1) / 2])
    g.moveTo(cx - 6, cy)
      .lineTo(cx + 6, cy)
      .stroke({ color: shade(c, -0.35), width: 1 })
  })

  // the blanket, with little stitched crosses all over it
  const bc = hex(blanket)
  block(g, bg.blanket, bc)
  const stitches = ctx.layer('bed')
  for (let i = 0; i < 26; i++) {
    const x = bg.blanket.x0 + 8 + ctx.rng() * (bg.blanket.x1 - bg.blanket.x0 - 16)
    const z = bg.blanket.z0 + 6 + ctx.rng() * (bg.blanket.z1 - bg.blanket.z0 - 12)
    const [sx, sy] = project([x, bg.blanket.y1 + 0.5, z])
    const k = at([x, 50, z]).s * 2.4
    stitches
      .moveTo(sx - k, sy - k * 0.5)
      .lineTo(sx + k, sy + k * 0.5)
      .moveTo(sx + k, sy - k * 0.5)
      .lineTo(sx - k, sy + k * 0.5)
      .stroke({ color: shade(bc, 0.5), width: 1.2 })
  }
  // folded-back sheet along the top of the blanket
  const fold =
    ctx.layout.bed.spot === 'right'
      ? { x0: 72, x1: 200, y0: 46, y1: 51, z0: 294, z1: 310 }
      : { x0: 104, x1: 120, y0: 46, y1: 51, z0: 276, z1: 399 }
  block(stitches, fold, hex(sheets))

  drawCat(ctx, bg.cat)
  end(bg.foot, 58, false)

  ctx.hit('bed', (h) => {
    const [x0, y0] = project([bg.frame.x0, 120, bg.frame.z1])
    const pts = [
      project([bg.frame.x0, 0, bg.frame.z0]),
      project([bg.frame.x1, 0, bg.frame.z0]),
      project([bg.frame.x1, 120, bg.frame.z1]),
      [x0, y0],
    ]
    h.poly(pts.flat())
  })
}

/** a black cat asleep in a ring, breathing */
function drawCat(ctx: Ctx, p: P3) {
  const { x, y, s } = at(p)
  const body = ctx.container('bed').addChild(new Graphics())
  const k = s * 1.1
  body.ellipse(0, 0, 22 * k, 11 * k).fill(0x121014)
  body.ellipse(-16 * k, -4 * k, 9 * k, 8 * k).fill(0x121014)
  body.poly([-22 * k, -9 * k, -20 * k, -18 * k, -15 * k, -11 * k]).fill(0x121014)
  body.poly([-14 * k, -11 * k, -10 * k, -18 * k, -8 * k, -9 * k]).fill(0x121014)
  body
    .moveTo(20 * k, 2 * k)
    .quadraticCurveTo(26 * k, 12 * k, 4 * k, 11 * k)
    .stroke({ color: 0x121014, width: 4 * k })
  // closed eyes
  body
    .moveTo(-20 * k, -4 * k)
    .lineTo(-17 * k, -3 * k)
    .moveTo(-14 * k, -4 * k)
    .lineTo(-11 * k, -3 * k)
    .stroke({ color: 0xe8c25a, width: 0.8 })
  body.position.set(x, y - 8 * k)
  ctx.anim.push((t) => {
    body.scale.set(1, 1 + Math.sin(t * 1.4) * 0.04)
  })
}

function deskBoxes(ctx: Ctx) {
  const flip = ctx.layout.desk.wall === 'right' ? mirror : (b: Box) => b
  const d = ctx.layout.desk.wall === 'right' ? -1 : 1
  return {
    d,
    top: flip({ x0: -200, x1: -116, y0: 68, y1: 76, z0: 128, z1: 274 }),
    legs: [
      { x0: -124, x1: -118, z0: 132, z1: 138 },
      { x0: -124, x1: -118, z0: 264, z1: 270 },
      { x0: -196, x1: -190, z0: 132, z1: 138 },
    ].map((l) => flip({ ...l, y0: 0, y1: 68 })),
    drawers: flip({ x0: -198, x1: -120, y0: 44, y1: 68, z0: 204, z1: 270 }),
    books: flip({ x0: -192, x1: -162, y0: 76, y1: 86, z0: 140, z1: 166 }),
    books2: flip({ x0: -190, x1: -164, y0: 86, y1: 94, z0: 143, z1: 163 }),
    paper: flip({ x0: -170, x1: -134, y0: 76, y1: 77, z0: 180, z1: 214 }),
    seat: flip({ x0: -112, x1: -74, y0: 40, y1: 46, z0: 178, z1: 220 }),
    back: flip({ x0: -78, x1: -72, y0: 46, y1: 96, z0: 180, z1: 218 }),
    chairLegs: (
      [
        [-110, 180],
        [-110, 214],
        [-78, 180],
        [-78, 214],
      ] as const
    ).map(([x, z]) => flip({ x0: x, x1: x + 3, y0: 0, y1: 40, z0: z, z1: z + 3 })),
    lamp: [-178 * d, 76, 250] as P3,
    mug: [-140 * d, 76, 240] as P3,
    plant: [-182 * d, 76, 196] as P3,
  }
}

export function drawDesk(ctx: Ctx) {
  const d = deskBoxes(ctx)
  const c = hex(ctx.layout.desk.color)
  const g = ctx.layer('desk')
  for (const l of d.legs) block(g, l, shade(c, -0.1))
  block(g, d.drawers, c)
  // drawer fronts and brass pulls
  const df = boxFaces(d.drawers)
  if (df.side) {
    const mid = (a: P3, b: P3) => project([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2])
    const x = d.d > 0 ? d.drawers.x1 : d.drawers.x0
    const zm = (d.drawers.z0 + d.drawers.z1) / 2
    g.poly(flat([x, 56, d.drawers.z0], [x, 56, d.drawers.z1]), false).stroke(THIN)
    for (const y of [50, 62]) {
      const [px, py] = mid([x, y, zm], [x, y, zm])
      g.circle(px, py, 2)
        .fill(BRASS)
        .stroke({ ...THIN, width: 0.6 })
    }
  }
  block(g, d.top, c)
  block(g, d.books, 0x2a4a8a)
  block(g, d.books2, 0xc8302a)
  block(g, d.paper, 0xf2e2bd, { ...THIN, width: 0.7 })
  // a pencil on the paper
  const [ax, ay] = project([(d.paper.x0 + d.paper.x1) / 2 - 8, 77, d.paper.z0 + 10])
  g.moveTo(ax, ay)
    .lineTo(ax + 14, ay - 3)
    .stroke({ color: 0xe8c25a, width: 2 })

  // a mug, steaming
  const m = at(d.mug)
  g.roundRect(m.x - 5 * m.s, m.y - 11 * m.s, 10 * m.s, 11 * m.s, 2)
    .fill(0xf2e2bd)
    .stroke(THIN)
  g.circle(m.x + 6 * m.s, m.y - 6 * m.s, 3 * m.s).stroke({ color: 0xf2e2bd, width: 1.5 })
  const steam = ctx.layer('desk')
  ctx.anim.push((t) => {
    steam.clear()
    for (let i = 0; i < 2; i++) {
      const ph = t * 0.8 + i * 1.7
      const yy = m.y - 14 * m.s - ((ph * 8) % 14)
      steam
        .moveTo(m.x + (i - 0.5) * 4, yy)
        .quadraticCurveTo(m.x + Math.sin(ph) * 5, yy - 6, m.x + (i - 0.5) * 4, yy - 12)
        .stroke({ color: 0xffffff, width: 1, alpha: 0.35 })
    }
  })
  potPlant(ctx, g, d.plant, 0.9, 1)

  // the chair: bright red, like a café chair someone took home
  const chair = ctx.layer('desk')
  const red = 0xc8302a
  for (const l of d.chairLegs) block(chair, l, shade(red, -0.3), THIN)
  block(chair, d.seat, red)
  block(chair, d.back, red)

  ctx.hit('desk', (h) => {
    h.poly([
      ...project([d.top.x0, 0, d.top.z0]),
      ...project([d.top.x1, 0, d.top.z0]),
      ...project([d.top.x1, 100, d.top.z1]),
      ...project([d.top.x0, 100, d.top.z1]),
    ])
  })
  return d.lamp
}

export function drawRug(ctx: Ctx) {
  const { shape, color } = ctx.layout.rug
  if (shape === 'none') return
  const c = hex(color)
  const cx = ctx.layout.bed.spot === 'right' ? -10 : 0
  const cz = 190
  const outline = (k: number): [number, number][] => {
    const corners = (...ps: [number, number][]) =>
      ps.map(([x, z]): [number, number] => [cx + x * k, cz + z * k])
    switch (shape) {
      case 'rect':
        return corners([-110, -72], [110, -72], [110, 72], [-110, 72])
      case 'diamond':
        return corners([0, -86], [120, 0], [0, 86], [-120, 0])
      default: {
        const [rx, rz] = shape === 'circle' ? [92, 92] : [130, 80]
        return Array.from({ length: 48 }, (_, i) => {
          const a = (i / 48) * Math.PI * 2
          return [cx + Math.cos(a) * rx * k, cz + Math.sin(a) * rz * k] as [number, number]
        })
      }
    }
  }
  const g = ctx.layer('rug')
  g.poly(onFloor(outline(1.03), 0.2)).fill({ color: INK, alpha: 0.35 })
  fillPoly(g, onFloor(outline(1)), c)
  g.poly(onFloor(outline(0.88)))
    .fill(shade(c, -0.35))
    .stroke({ ...THIN, alpha: 0.5 })
  g.poly(onFloor(outline(0.8))).fill(c)
  g.poly(onFloor(outline(0.6))).fill(0xf2e2bd)
  g.poly(onFloor(outline(0.5))).fill(shade(c, 0.15))
  g.poly(onFloor(outline(0.22)))
    .fill(0xe8c25a)
    .stroke({ ...THIN, alpha: 0.6 })
  // a ring of little diamonds in the border
  const ring = outline(0.84)
  ring.forEach(([x, z], i) => {
    if (i % (shape === 'rect' || shape === 'diamond' ? 1 : 4) !== 0) return
    const pts: [number, number][] = [
      [x, z - 6],
      [x + 6, z],
      [x, z + 6],
      [x - 6, z],
    ]
    g.poly(onFloor(pts, 0.7)).fill(0xe8c25a)
  })
  if (shape === 'rect') {
    for (const zEdge of [-72, 72]) {
      for (let x = -108; x <= 108; x += 6) {
        g.poly(
          onFloor(
            [
              [cx + x, cz + zEdge],
              [cx + x, cz + zEdge + Math.sign(zEdge) * 8],
            ],
            0.7,
          ),
          false,
        ).stroke({ color: 0xf2e2bd, width: 1 })
      }
    }
  }
  ctx.hit('rug', (h) => h.poly(onFloor(outline(1))))
}
