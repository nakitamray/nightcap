import { Container, Graphics } from 'pixi.js'
import { glow } from '../layers/neon'
import { range } from '../rng'
import type { Ctx } from '../room/context'
import { block, fillPoly, INK, LINE, mix, shade, THIN } from '../room/paint'
import { flat, NEAR, onFloor, project, ROOM, type P3 } from '../room/projection'
import { drape, potPlant } from '../room/soft'
import type { LoungePlan, Pane } from './plan'

// The bones of the living room: walls, floor, ceiling and the big windows,
// each city in its own way.

const B = ROOM.back

/** the screen outline of a pane on the back wall, grown by `pad` */
export function paneOutline(g: Graphics, p: Pane, pad = 0) {
  const [x0, y0] = project([p.x0 - pad, p.y1 + pad, B])
  const [x1, y1] = project([p.x1 + pad, p.y0 - pad, B])
  const w = x1 - x0
  if (!p.arch) return g.rect(x0, y0, w, y1 - y0)
  const r = w / 2
  return g
    .moveTo(x0, y1)
    .lineTo(x0, y0 + r)
    .arc(x0 + r, y0 + r, r, Math.PI, 0)
    .lineTo(x1, y1)
    .closePath()
}

/** the box round all the glass, in view units */
export function glassBounds(plan: LoungePlan) {
  const xs = plan.panes.flatMap((p) => [p.x0, p.x1])
  const ys = plan.panes.flatMap((p) => [p.y0, p.y1])
  const [x0, y0] = project([Math.min(...xs), Math.max(...ys), B])
  const [x1, y1] = project([Math.max(...xs), Math.min(...ys), B])
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

export function drawShell(ctx: Ctx, plan: LoungePlan) {
  const { left: L, right: R, ceiling: C } = ROOM
  const g = ctx.layer()
  const wall = plan.wall
  // ceiling, side walls, back wall
  fillPoly(
    g,
    flat([L, C, NEAR], [R, C, NEAR], [R, C, B], [L, C, B]),
    mix(shade(wall, -0.3), 0xf2e2bd, 0.25),
    null,
  )
  fillPoly(g, flat([L, 0, NEAR], [L, 0, B], [L, C, B], [L, C, NEAR]), shade(wall, -0.1), null)
  fillPoly(g, flat([R, 0, NEAR], [R, 0, B], [R, C, B], [R, C, NEAR]), shade(wall, -0.18), null)
  fillPoly(g, flat([L, 0, B], [R, 0, B], [R, C, B], [L, C, B]), wall, null)

  switch (plan.theme) {
    case 'paris':
      panelling(ctx, plan)
      break
    case 'new-york':
      bricks(ctx, plan)
      break
    case 'venice':
      damask(ctx, plan)
      break
    case 'tokyo':
      slats(ctx, plan)
      break
  }

  // cornice and skirting the whole way round, corners inked
  const ring = (y: number): P3[] => [
    [L, y, NEAR],
    [L, y, B],
    [R, y, B],
    [R, y, NEAR],
  ]
  const trim = plan.trim
  g.poly(flat(...ring(C - 10)), false).stroke({ color: trim, width: 9 })
  g.poly(flat(...ring(C - 10)), false).stroke({ ...THIN, alpha: 0.5 })
  const sk = ctx.layer()
  for (const side of [L, R])
    fillPoly(
      sk,
      flat([side, 0, NEAR], [side, 0, B], [side, 18, B], [side, 18, NEAR]),
      shade(trim, -0.3),
      THIN,
    )
  fillPoly(sk, flat([L, 0, B], [R, 0, B], [R, 18, B], [L, 18, B]), shade(trim, -0.25), THIN)
  for (const [a, b] of [
    [
      [L, 0, B],
      [L, C, B],
    ],
    [
      [R, 0, B],
      [R, C, B],
    ],
    [
      [L, C, B],
      [R, C, B],
    ],
  ] as [P3, P3][])
    sk.poly(flat(a, b), false).stroke({ color: INK, width: 2, alpha: 0.7 })

  drawFloor(ctx, plan)
  ceiling(ctx, plan)
}

// -- walls -------------------------------------------------------------------

/** Paris: boiserie, the moulded panels old apartments have */
function panelling(ctx: Ctx, plan: LoungePlan) {
  const { left: L, right: R, ceiling: C } = ROOM
  const g = ctx.layer()
  const line = { color: shade(plan.wall, 0.35), width: 2.2 }
  const dark = { color: shade(plan.wall, -0.25), width: 1.2 }
  // a dado rail, then tall panels above and short ones below
  for (const side of [L, R]) {
    g.poly(flat([side, 110, NEAR], [side, 110, B]), false).stroke({
      color: shade(plan.wall, 0.3),
      width: 4,
    })
    for (let z = NEAR + 40; z < B - 40; z += 110) {
      const z1 = Math.min(z + 90, B - 20)
      for (const [y0, y1] of [
        [28, 92],
        [134, C - 60],
      ] as [number, number][]) {
        const pts = flat([side, y0, z], [side, y0, z1], [side, y1, z1], [side, y1, z])
        g.poly(pts).stroke(line)
        g.poly(
          flat(
            [side, y0 + 4, z + 4],
            [side, y0 + 4, z1 - 4],
            [side, y1 - 4, z1 - 4],
            [side, y1 - 4, z + 4],
          ),
        ).stroke(dark)
      }
    }
  }
  // the back wall round the windows and fireplace
  const panes = plan.panes
  g.poly(flat([L, 110, B], [R, 110, B]), false).stroke({ color: shade(plan.wall, 0.3), width: 4 })
  for (const [x0, x1] of [
    [L + 12, panes[0]!.x0 - 14],
    [panes[1]!.x1 + 14, R - 12],
  ] as [number, number][]) {
    if (x1 - x0 < 16) continue
    g.poly(flat([x0, 134, B], [x1, 134, B], [x1, C - 60, B], [x0, C - 60, B])).stroke(line)
  }
}

/** New York: old brick, a bit uneven, mortar showing */
function bricks(ctx: Ctx, plan: LoungePlan) {
  const { left: L, right: R, ceiling: C } = ROOM
  const g = ctx.layer()
  const course = 14
  const brick = 34
  const base = plan.wall
  const tones = [base, shade(base, -0.12), shade(base, 0.08), mix(base, 0x5a2a1a, 0.4)]
  const mortar = { color: mix(base, 0xd8c8a8, 0.5), width: 0.8, alpha: 0.55 }
  let n = 0
  for (const side of [L, R]) {
    for (let y = 0, row = 0; y < C; y += course, row++) {
      for (let z = NEAR + (row % 2) * (brick / 2); z < B; z += brick) {
        const z1 = Math.min(z + brick, B)
        const pts = flat(
          [side, y, Math.max(NEAR, z)],
          [side, y, z1],
          [side, y + course, z1],
          [side, y + course, Math.max(NEAR, z)],
        )
        g.poly(pts).fill(shade(tones[(n * 7 + row * 3) % 4]!, side === L ? -0.08 : -0.16))
        n++
      }
      g.poly(flat([side, y, NEAR], [side, y, B]), false).stroke(mortar)
    }
  }
  // the back wall shows brick either side of the glass and above it
  const pane = plan.panes[0]!
  for (let y = 0, row = 0; y < C; y += course, row++) {
    for (let x = L + (row % 2) * (brick / 2); x < R; x += brick) {
      const x1 = Math.min(x + brick, R)
      if (x1 > pane.x0 - 6 && x < pane.x1 + 6 && y + course > pane.y0 - 6 && y < pane.y1 + 6)
        continue
      g.poly(
        flat(
          [Math.max(L, x), y, B],
          [x1, y, B],
          [x1, y + course, B],
          [Math.max(L, x), y + course, B],
        ),
      )
        .fill(tones[(n * 5 + row) % 4]!)
        .stroke(mortar)
      n++
    }
  }
}

/** Venice: a damask print and a gilded rail */
function damask(ctx: Ctx, plan: LoungePlan) {
  const { left: L, right: R, ceiling: C } = ROOM
  const g = ctx.layer()
  const motif = shade(plan.wall, 0.16)
  const flower = (p: P3, k: number) => {
    const [x, y] = project(p)
    g.ellipse(x, y, 4 * k, 7 * k).fill({ color: motif, alpha: 0.6 })
    g.ellipse(x - 5 * k, y + 3 * k, 3 * k, 2 * k)
      .ellipse(x + 5 * k, y + 3 * k, 3 * k, 2 * k)
      .fill({ color: motif, alpha: 0.6 })
  }
  for (const side of [L, R])
    for (let z = NEAR + 20; z < B; z += 40)
      for (let y = 140, r = 0; y < C - 40; y += 46, r++) {
        const p: P3 = [side, y, z + (r % 2) * 20]
        flower(p, project([side, y, z])[0] > 0 ? 1 : 1)
      }
  for (let x = L + 20; x < R; x += 40)
    for (let y = 140, r = 0; y < C - 40; y += 46, r++) {
      const px = x + (r % 2) * 20
      if (plan.panes.some((p) => px > p.x0 - 12 && px < p.x1 + 12 && y < p.y1 + 30)) continue
      flower([px, y, B], 1)
    }
  // a painted dado and gilt rail
  const gold = 0xd9a54a
  for (const side of [L, R]) {
    fillPoly(
      g,
      flat([side, 0, NEAR], [side, 0, B], [side, 110, B], [side, 110, NEAR]),
      shade(plan.wall, -0.3),
      null,
    )
    g.poly(flat([side, 110, NEAR], [side, 110, B]), false).stroke({ color: gold, width: 4 })
  }
  fillPoly(g, flat([L, 0, B], [R, 0, B], [R, 110, B], [L, 110, B]), shade(plan.wall, -0.22), null)
  g.poly(flat([L, 110, B], [R, 110, B]), false).stroke({ color: gold, width: 4 })
}

/** Tokyo: pale wood slats low down, plain plaster above */
function slats(ctx: Ctx, plan: LoungePlan) {
  const { left: L, right: R } = ROOM
  const g = ctx.layer()
  const wood = plan.wood
  for (const side of [L, R]) {
    fillPoly(
      g,
      flat([side, 0, NEAR], [side, 0, B], [side, 120, B], [side, 120, NEAR]),
      shade(wood, side === L ? 0 : -0.1),
      null,
    )
    for (let z = NEAR; z < B; z += 10)
      g.poly(flat([side, 0, z], [side, 120, z]), false).stroke({
        color: shade(wood, -0.35),
        width: 1,
        alpha: 0.6,
      })
    g.poly(flat([side, 120, NEAR], [side, 120, B]), false).stroke({
      color: shade(wood, -0.4),
      width: 3,
    })
  }
}

// -- floor -------------------------------------------------------------------

function drawFloor(ctx: Ctx, plan: LoungePlan) {
  const { left: L, right: R } = ROOM
  const g = ctx.layer()
  const seam = { color: INK, width: 1, alpha: 0.4 }
  const base = {
    herringbone: 0x8a5028,
    planks: 0x6a4026,
    terrazzo: 0xb0a088,
    boards: 0xa8784a,
    saltillo: 0xa8562e,
  }[plan.floor]
  fillPoly(g, flat([L, 0, NEAR], [R, 0, NEAR], [R, 0, B], [L, 0, B]), base, null)
  switch (plan.floor) {
    case 'herringbone': {
      const bw = 22
      const bl = 56
      for (let i = 0; L + i * bw < R; i++) {
        const x = L + i * bw
        const d = i % 2 ? bw : -bw
        for (let z = NEAR - bl + (i % 2) * (bl / 2); z < B; z += bl) {
          const c = (
            [
              [x, z],
              [x + bw, z + d],
              [x + bw, z + d + bl],
              [x, z + bl],
            ] as [number, number][]
          ).map(([px, pz]): [number, number] => [px, Math.min(B, Math.max(NEAR, pz))])
          g.poly(onFloor(c))
            .fill(ctx.rng() < 0.55 ? base : shade(base, ctx.rng() < 0.5 ? 0.1 : -0.12))
            .stroke(seam)
        }
      }
      break
    }
    case 'planks':
    case 'boards': {
      const w = plan.floor === 'planks' ? 34 : 20
      for (let x = L; x <= R; x += w)
        g.poly(flat([x, 0, NEAR], [x, 0, B]), false).stroke({ ...seam, width: 1.2 })
      for (let x = L; x < R; x += w) {
        for (let z = NEAR + (((x - L) / w) % 3) * 50; z < B; z += 150)
          g.poly(flat([x, 0, z], [x + w, 0, z]), false).stroke(seam)
        if (ctx.rng() < 0.45)
          g.poly(
            onFloor(
              [
                [x + 4, NEAR],
                [x + w * 0.4, NEAR],
                [x + w * 0.4, B],
                [x + 4, B],
              ],
              0.2,
            ),
          ).fill({ color: shade(base, ctx.rng() < 0.5 ? 0.14 : -0.14), alpha: 0.4 })
      }
      break
    }
    case 'terrazzo': {
      // chips of marble in four colours, scattered
      const chips = [0x8a3a2a, 0x2f5a5a, 0xe8dcc8, 0x6a5a4a, 0xc8906a]
      for (let i = 0; i < 700; i++) {
        const x = range(ctx.rng, L, R)
        const z = range(ctx.rng, NEAR, B)
        const r = range(ctx.rng, 1.5, 4)
        g.poly(
          onFloor(
            [
              [x - r, z],
              [x, z - r * 0.7],
              [x + r * 0.8, z + r * 0.2],
              [x - r * 0.2, z + r],
            ],
            0.3,
          ),
        ).fill({ color: chips[i % chips.length]!, alpha: 0.75 })
      }
      for (let z = NEAR; z < B; z += 100)
        g.poly(flat([L, 0.4, z], [R, 0.4, z]), false).stroke({
          color: 0xd9a54a,
          width: 1.4,
          alpha: 0.6,
        })
      break
    }
    case 'saltillo': {
      // square clay tiles, no two fired quite the same, pale grout between
      const size = 52
      for (let x = L; x < R; x += size) {
        for (let z = NEAR; z < B; z += size) {
          const c: [number, number][] = [
            [x, z],
            [Math.min(R, x + size), z],
            [Math.min(R, x + size), Math.min(B, z + size)],
            [x, Math.min(B, z + size)],
          ]
          g.poly(onFloor(c))
            .fill(shade(base, range(ctx.rng, -0.16, 0.14)))
            .stroke({ color: 0xd8c0a0, width: 1.6, alpha: 0.55 })
        }
      }
      break
    }
  }
}

// -- ceiling -----------------------------------------------------------------

function ceiling(ctx: Ctx, plan: LoungePlan) {
  const { left: L, right: R, ceiling: C } = ROOM
  const g = ctx.layer()
  switch (plan.theme) {
    case 'paris': {
      // a plaster rose in the middle of the ceiling
      const [cx, cy] = project([0, C, 200])
      const [, cy2] = project([0, C, 260])
      const ry = Math.abs(cy2 - cy) * 0.9
      for (let i = 4; i >= 1; i--)
        g.ellipse(cx, cy, 16 * i, ry * (i / 4) + 2)
          .fill(shade(plan.trim, -0.06 * i))
          .stroke({ ...THIN, alpha: 0.3 })
      break
    }
    case 'new-york': {
      // steel beams and a fat silver duct running back to front
      for (const z of [60, 220, 370])
        block(g, { x0: L, x1: R, y0: C - 24, y1: C, z0: z - 8, z1: z + 8 }, 0x2a2624)
      const duct = (x: number) => {
        const top = C - 30
        g.poly(
          flat([x - 22, top, NEAR], [x - 22, top, B], [x + 22, top, B], [x + 22, top, NEAR]),
        ).fill(0x9aa0a8)
        g.poly(
          flat(
            [x - 22, top - 34, NEAR],
            [x - 22, top - 34, B],
            [x + 22, top - 34, B],
            [x + 22, top - 34, NEAR],
          ),
        ).fill(0x6a7078)
        for (let z = NEAR; z < B; z += 40)
          g.poly(flat([x - 22, top - 34, z], [x + 22, top - 34, z]), false).stroke({
            color: 0xc8ccd0,
            width: 1.5,
          })
        g.poly(
          flat([x - 22, top - 34, B], [x + 22, top - 34, B], [x + 22, top, B], [x - 22, top, B]),
        )
          .fill(0x4a5058)
          .stroke(THIN)
      }
      duct(plan.books * -150)
      break
    }
    case 'venice': {
      // painted beams
      for (const z of [40, 140, 240, 340]) {
        block(g, { x0: L, x1: R, y0: C - 20, y1: C, z0: z - 9, z1: z + 9 }, 0x5a3420)
        for (let x = L + 30; x < R; x += 60) {
          const [px, py] = project([x, C - 20, z - 9])
          g.circle(px, py + 4, 2.5).fill(0xd9a54a)
        }
      }
      break
    }
    case 'san-diego': {
      // dark beams, rough-sawn, close together
      for (const z of [30, 110, 190, 270, 350])
        block(g, { x0: L, x1: R, y0: C - 22, y1: C, z0: z - 10, z1: z + 10 }, 0x3a2418)
      break
    }
    case 'tokyo': {
      // a track of little spotlights
      g.poly(flat([0, C - 2, NEAR], [0, C - 2, B]), false).stroke({ color: 0x1e1a1c, width: 4 })
      for (const z of [60, 160, 260, 360]) {
        const [x, y] = project([0, C - 6, z])
        g.roundRect(x - 5, y, 10, 12, 3).fill(0x1e1a1c)
      }
      break
    }
  }
}

// -- windows -----------------------------------------------------------------

/**
 * The glass and everything round it. `street` shows the view, sized to the
 * box round all the panes; it's masked to the panes themselves.
 */
export function drawWindows(ctx: Ctx, plan: LoungePlan, street: Container) {
  const g = ctx.layer()
  const frame =
    plan.theme === 'new-york'
      ? 0x1e1e22
      : plan.theme === 'tokyo'
        ? 0x2a2420
        : plan.theme === 'venice' || plan.theme === 'san-diego'
          ? 0x3a2418
          : 0xf2e8d4
  // deep reveals
  for (const p of plan.panes) {
    paneOutline(g, p, 14).fill(shade(plan.wall, -0.42))
    paneOutline(g, p, 14).stroke(LINE)
  }

  // the view, with a little light falling in
  const view = ctx.live(ctx.container())
  const mask = new Graphics()
  for (const p of plan.panes) paneOutline(mask, p).fill(0xffffff)
  const box = glassBounds(plan)
  const glass = new Container()
  glass.addChild(new Graphics().rect(box.x, box.y, box.w, box.h).fill(0x04060f))
  street.position.set(box.x, box.y)
  street.width = box.w
  street.height = box.h
  glass.addChild(street)
  view.addChild(glass, mask)
  view.mask = mask

  // frames and glazing bars, per city
  const bars = ctx.layer()
  for (const p of plan.panes) glazing(bars, plan, p, frame)
  for (const p of plan.panes) {
    paneOutline(bars, p).stroke({ color: frame, width: 7 })
    paneOutline(bars, p).stroke(LINE)
    // a sheen across the glass
    const [x0, y0] = project([p.x0, p.y1, B])
    const [x1, y1] = project([p.x1, p.y0, B])
    const w = x1 - x0
    bars
      .poly([x0 + w * 0.1, y1, x0 + w * 0.42, y0 + 30, x0 + w * 0.5, y0 + 30, x0 + w * 0.18, y1])
      .fill({ color: 0xffffff, alpha: 0.04 })
    const [cx, cy] = project([(p.x0 + p.x1) / 2, (p.y0 + p.y1) / 2, B])
    glow(ctx.lights, cx, cy + (y1 - y0) * 0.3, w / 128, (y1 - y0) / 256, 0xff9a50, 0.08)
    ctx.pool([(p.x0 + p.x1) / 2, p.y0 + 120, B - 10], 380, 0.25)
  }

  sills(ctx, plan)
  curtains(ctx, plan)
}

function glazing(g: Graphics, plan: LoungePlan, p: Pane, frame: number) {
  const bar = (a: P3, b: P3, w = 3) => g.poly(flat(a, b), false).stroke({ color: frame, width: w })
  const midX = (p.x0 + p.x1) / 2
  const top = p.arch ? p.y1 - (p.x1 - p.x0) / 2 : p.y1
  switch (plan.theme) {
    case 'paris':
    case 'venice':
    case 'san-diego': {
      // a centre post and small panes, radiating bars in the arch
      bar([midX, p.y0, B], [midX, p.y1, B], 5)
      const step = plan.theme === 'paris' ? 68 : 80
      for (let y = p.y0 + step; y < top; y += step) bar([p.x0, y, B], [p.x1, y, B])
      if (p.arch) {
        const [cx, cy] = project([midX, top, B])
        const [ex] = project([p.x1, top, B])
        const r = ex - cx
        for (let i = 1; i < 4; i++) {
          const a = Math.PI + (i / 4) * Math.PI
          g.moveTo(cx, cy)
            .lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
            .stroke({ color: frame, width: 3 })
        }
        bar([p.x0, top, B], [p.x1, top, B])
      }
      break
    }
    case 'new-york': {
      // the steel grid of a converted factory
      for (let x = p.x0 + 54; x < p.x1 - 10; x += 54) bar([x, p.y0, B], [x, p.y1, B], 3.5)
      for (let y = p.y0 + 64; y < p.y1 - 10; y += 64) bar([p.x0, y, B], [p.x1, y, B], 3.5)
      break
    }
    case 'tokyo': {
      // four big sheets of glass and a transom
      const w = (p.x1 - p.x0) / 4
      for (let i = 1; i < 4; i++) bar([p.x0 + i * w, p.y0, B], [p.x0 + i * w, p.y1, B], 4)
      bar([p.x0, p.y1 - 90, B], [p.x1, p.y1 - 90, B], 4)
      break
    }
  }
}

/** a deep sill along the bottom of the glass, with plants on it */
function sills(ctx: Ctx, plan: LoungePlan) {
  const g = ctx.layer()
  for (const [i, p] of plan.panes.entries()) {
    const y = p.y0
    block(
      g,
      { x0: p.x0 - 16, x1: p.x1 + 16, y0: y - 8, y1: y, z0: B - 26, z1: B },
      plan.theme === 'new-york' ? 0x5a5650 : plan.trim,
    )
    // a few pots along it
    const kinds = ['pothos', 'cactus', 'snake', 'flowers', 'fern'] as const
    const n = Math.max(1, Math.floor((p.x1 - p.x0) / 90))
    for (let k = 0; k < n; k++) {
      const x = p.x0 + ((k + 0.5) / n) * (p.x1 - p.x0) + (k % 2 ? 10 : -10)
      if (plan.theme === 'paris' && Math.abs(x) < 90) continue
      potPlant(
        g,
        [x, y, B - 12],
        0.9 + ((k + i) % 3) * 0.15,
        kinds[(k + i * 2) % kinds.length]!,
        k + i,
      )
    }
  }
  if (plan.theme === 'new-york') {
    // an old radiator under the glass
    const r = ctx.layer()
    const x0 = -120
    block(r, { x0, x1: x0 + 150, y0: 4, y1: 62, z0: B - 30, z1: B - 12 }, 0xc8c0b0)
    for (let x = x0 + 8; x < x0 + 150; x += 10)
      r.poly(flat([x, 8, B - 30], [x, 58, B - 30]), false).stroke({ color: 0x7a7468, width: 2 })
  }
}

/** curtains: tall velvet drapes in Paris and Venice, sheer ones in Tokyo, none in the loft */
function curtains(ctx: Ctx, plan: LoungePlan) {
  if (plan.theme === 'new-york') return
  const C = ROOM.ceiling
  const sheer = plan.theme === 'tokyo'
  const colour = sheer
    ? 0xf2ece0
    : plan.theme === 'venice'
      ? shade(plan.sofa, 0.1)
      : mix(plan.accent, 0xf2e2bd, 0.3)
  const rodY = C - 34
  const rod = ctx.layer()
  const xs = plan.panes.flatMap((p) => [p.x0, p.x1])
  const x0 = Math.min(...xs) - 50
  const x1 = Math.max(...xs) + 50
  rod
    .poly(flat([x0, rodY, B - 14], [x1, rodY, B - 14]), false)
    .stroke({ color: 0x2a1a10, width: 3.5 })
  for (const x of [x0, x1]) {
    const [px, py] = project([x, rodY, B - 14])
    rod.circle(px, py, 5).fill(0xd9a54a).stroke(THIN)
  }
  const panel = (a: number, b: number) => {
    const top: P3[] = []
    for (let i = 0; i <= 8; i++) top.push([a + ((b - a) * i) / 8, rodY, B - 16])
    drape(ctx, rod, top, rodY - 6, colour, { alpha: sheer ? 0.55 : 1, folds: 6, wave: 4 })
  }
  for (const p of plan.panes) {
    panel(p.x0 - 46, p.x0 + (sheer ? 30 : 10))
    panel(p.x1 - (sheer ? 30 : 10), p.x1 + 46)
  }
}
