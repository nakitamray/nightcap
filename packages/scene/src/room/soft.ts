import type { Graphics } from 'pixi.js'
import { at, type Ctx } from './context'
import { shade, THIN } from './paint'
import { project, type P2, type P3 } from './projection'
import type { PlantKind } from './variants'

// Soft things: fabric that hangs and folds, pillows that look like you could
// sink into them, plants that grow every which way. All drawn with curves
// rather than boxes.

/**
 * Fabric hanging off an edge: `top` is the edge it hangs from (room points),
 * `drop` how far it falls. The hem waves, and folds run down from the top.
 */
export function drape(
  ctx: Ctx,
  _below: Graphics,
  top: P3[],
  drop: number,
  color: number,
  opts: { alpha?: number; folds?: number; wave?: number } = {},
) {
  // each piece of fabric is its own layer, on top of whatever it hangs off
  const g = ctx.layer()
  const wave = opts.wave ?? 4
  const seed = ctx.rng() * 10
  const upper = top.map(project)
  const lower = top.map(([x, y, z], i): P2 => {
    const t = i / Math.max(1, top.length - 1)
    const sag = Math.sin(t * Math.PI * (2 + (seed % 2)) + seed) * wave
    return project([x, y - drop + sag, z])
  })
  const shape = (d: Graphics) => {
    d.moveTo(...upper[0]!)
    for (const p of upper.slice(1)) d.lineTo(...p)
    // the hem: a soft curve through each hanging point
    const rev = [...lower].reverse()
    d.lineTo(...rev[0]!)
    for (let i = 1; i < rev.length; i++) {
      const [px, py] = rev[i - 1]!
      const [qx, qy] = rev[i]!
      d.quadraticCurveTo(px, py + 3, (px + qx) / 2, (py + qy) / 2 + 2)
    }
    d.lineTo(...rev[rev.length - 1]!)
    d.closePath()
  }
  shape(g)
  g.fill({ color, alpha: opts.alpha ?? 1 })
  shape(g)
  g.stroke({ ...THIN, alpha: (opts.alpha ?? 1) * 0.7 })
  // folds: darker valleys and the odd lit ridge
  const folds = opts.folds ?? Math.max(2, Math.round(top.length / 2))
  for (let f = 1; f <= folds; f++) {
    const t = f / (folds + 1)
    const i = Math.min(top.length - 1, Math.round(t * (top.length - 1)))
    const [ux, uy] = upper[i]!
    const [lx, ly] = lower[i]!
    g.moveTo(ux, uy + 2)
      .quadraticCurveTo(ux + (lx - ux) * 0.5 + (f % 2 ? 3 : -3), (uy + ly) / 2, lx, ly - 1)
      .stroke({
        color: f % 3 === 0 ? shade(color, 0.3) : shade(color, -0.35),
        width: 1.6,
        alpha: (opts.alpha ?? 1) * 0.7,
      })
  }
}

/**
 * A plump pillow: puffed-out sides, pinched corners, a crease across the
 * middle where someone's head was. Drawn flat, facing you, at a point.
 */
export function pillow(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
  tilt = 0,
) {
  const hw = w / 2
  const hh = h / 2
  const c = Math.cos(tilt)
  const s = Math.sin(tilt)
  const p = (px: number, py: number): P2 => [x + px * c - py * s, y + px * s + py * c]
  const pts = {
    tl: p(-hw, -hh),
    tr: p(hw, -hh),
    br: p(hw, hh),
    bl: p(-hw, hh),
  }
  const shape = (d: Graphics) => {
    d.moveTo(...pts.tl)
      .quadraticCurveTo(...p(0, -hh - h * 0.28), ...pts.tr)
      .quadraticCurveTo(...p(hw + w * 0.12, 0), ...pts.br)
      .quadraticCurveTo(...p(0, hh + h * 0.28), ...pts.bl)
      .quadraticCurveTo(...p(-hw - w * 0.12, 0), ...pts.tl)
      .closePath()
  }
  shape(g)
  g.fill(color)
  // a soft shadow along the bottom and a glow on top
  g.ellipse(...p(0, hh * 0.35), hw * 0.85, hh * 0.55).fill({
    color: shade(color, -0.25),
    alpha: 0.5,
  })
  g.ellipse(...p(-hw * 0.15, -hh * 0.3), hw * 0.6, hh * 0.35).fill({
    color: shade(color, 0.3),
    alpha: 0.45,
  })
  g.moveTo(...p(-hw * 0.5, hh * 0.05))
    .quadraticCurveTo(...p(0, -hh * 0.15), ...p(hw * 0.45, hh * 0.1))
    .stroke({ color: shade(color, -0.35), width: 1, alpha: 0.7 })
  for (const corner of [pts.tl, pts.tr, pts.br, pts.bl]) {
    g.moveTo(...corner)
      .lineTo(corner[0] + (x - corner[0]) * 0.12, corner[1] + (y - corner[1]) * 0.12)
      .stroke({ color: shade(color, -0.4), width: 1 })
  }
  shape(g)
  g.stroke(THIN)
}

/** a seat cushion lying on something: a squashed pillow seen from above */
export function cushion(g: Graphics, corners: [P3, P3, P3, P3], color: number) {
  const q = corners.map(project)
  const mid = (a: P2, b: P2, bulge: number): P2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + bulge]
  const shape = (d: Graphics) => {
    d.moveTo(...q[0]!)
      .quadraticCurveTo(...mid(q[0]!, q[1]!, 4), ...q[1]!)
      .quadraticCurveTo(...mid(q[1]!, q[2]!, -3), ...q[2]!)
      .quadraticCurveTo(...mid(q[2]!, q[3]!, -5), ...q[3]!)
      .quadraticCurveTo(...mid(q[3]!, q[0]!, -3), ...q[0]!)
      .closePath()
  }
  shape(g)
  g.fill(color)
  const cx = (q[0]![0] + q[2]![0]) / 2
  const cy = (q[0]![1] + q[2]![1]) / 2
  g.ellipse(
    cx,
    cy,
    Math.abs(q[1]![0] - q[0]![0]) * 0.3,
    Math.abs(q[2]![1] - q[0]![1]) * 0.25 + 1,
  ).fill({ color: shade(color, 0.25), alpha: 0.4 })
  g.circle(cx, cy, 1.5).fill(shade(color, -0.4))
  shape(g)
  g.stroke(THIN)
}

const LEAF = [0x3a7a3a, 0x5a9a3a, 0x2e5a2e, 0x4a8a4a]
const POTS = [0xb8643a, 0x2f6b66, 0xe8c25a, 0xd8c8a8, 0x8e3a1e, 0xf2e2bd]

/** a pot with a plant in it, standing at `p`; `kind` decides what grows */
export function potPlant(
  ctx: Ctx,
  g: Graphics,
  p: P3,
  size: number,
  kind: PlantKind,
  potIndex = 0,
) {
  const { x, y, s } = at(p)
  const k = s * size
  const pot = POTS[potIndex % POTS.length]!
  // rounded pot with a lip
  g.moveTo(x - 9 * k, y - 16 * k)
    .lineTo(x + 9 * k, y - 16 * k)
    .quadraticCurveTo(x + 9 * k, y - 2 * k, x + 6 * k, y)
    .lineTo(x - 6 * k, y)
    .quadraticCurveTo(x - 9 * k, y - 2 * k, x - 9 * k, y - 16 * k)
    .closePath()
    .fill(pot)
    .stroke(THIN)
  g.roundRect(x - 10.5 * k, y - 19 * k, 21 * k, 4.5 * k, 1.5 * k)
    .fill(shade(pot, -0.18))
    .stroke(THIN)
  const base = y - 18 * k
  const leaf = (lx: number, ly: number, rx: number, ry: number, rot: number, c: number) => {
    const d = { x: Math.sin(rot), y: -Math.cos(rot) }
    g.moveTo(lx - d.x * ry, ly - d.y * ry)
      .quadraticCurveTo(lx + d.y * rx * 1.4, ly - d.x * rx * 1.4, lx + d.x * ry, ly + d.y * ry)
      .quadraticCurveTo(lx - d.y * rx * 1.4, ly + d.x * rx * 1.4, lx - d.x * ry, ly - d.y * ry)
      .fill(c)
      .stroke({ ...THIN, width: 0.6 })
    g.moveTo(lx - d.x * ry * 0.8, ly - d.y * ry * 0.8)
      .lineTo(lx + d.x * ry * 0.8, ly + d.y * ry * 0.8)
      .stroke({ color: shade(c, -0.35), width: 0.6 })
  }
  switch (kind) {
    case 'cactus': {
      g.roundRect(x - 4.5 * k, base - 28 * k, 9 * k, 30 * k, 4.5 * k)
        .fill(LEAF[1]!)
        .stroke(THIN)
      g.roundRect(x + 4 * k, base - 22 * k, 7 * k, 4 * k, 2 * k).fill(LEAF[1]!)
      g.roundRect(x + 8 * k, base - 30 * k, 4.5 * k, 12 * k, 2.2 * k)
        .fill(LEAF[1]!)
        .stroke(THIN)
      g.roundRect(x - 11 * k, base - 18 * k, 7 * k, 4 * k, 2 * k).fill(LEAF[1]!)
      g.roundRect(x - 12 * k, base - 25 * k, 4.5 * k, 10 * k, 2.2 * k)
        .fill(LEAF[1]!)
        .stroke(THIN)
      g.circle(x, base - 30 * k, 2.4 * k).fill(0xff7a9a)
      break
    }
    case 'snake': {
      for (let i = 0; i < 6; i++) {
        const lx = x + (i - 2.5) * 3 * k
        const h = (26 + ((i * 7) % 4) * 6) * k
        const lean = (i - 2.5) * 1.5 * k
        g.moveTo(lx - 2.4 * k, base)
          .quadraticCurveTo(lx - 3 * k + lean, base - h * 0.6, lx + lean, base - h)
          .quadraticCurveTo(lx + 3 * k + lean, base - h * 0.6, lx + 2.4 * k, base)
          .closePath()
          .fill(i % 2 ? 0x3a6a3a : 0x5a8a3a)
          .stroke({ ...THIN, width: 0.6 })
        g.moveTo(lx + lean * 0.5, base - h * 0.2)
          .lineTo(lx + lean * 0.9, base - h * 0.85)
          .stroke({ color: 0xc8d870, width: 0.7, alpha: 0.6 })
      }
      break
    }
    case 'palm': {
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.42
        const len = (26 + (i % 3) * 5) * k
        const tx = x + Math.cos(a) * len
        const ty = base + Math.sin(a) * len * 0.9
        g.moveTo(x, base)
          .quadraticCurveTo(x + Math.cos(a) * len * 0.4, base - len * 0.6, tx, ty)
          .stroke({ color: 0x3a6a2a, width: 1.2 })
        for (let f = 1; f < 7; f++) {
          const t = f / 7
          const fx = x + (tx - x) * t
          const fy = base + (ty - base) * t - Math.sin(t * Math.PI) * len * 0.25
          for (const side of [-1, 1])
            g.moveTo(fx, fy)
              .lineTo(fx + side * 5 * k * (1 - t * 0.5), fy + 4 * k)
              .stroke({ color: LEAF[(f + i) % 4]!, width: 1.4 })
        }
      }
      break
    }
    case 'fern': {
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (i - 4) * 0.36
        const len = (22 + (i % 3) * 6) * k
        let px = x
        let py = base
        for (let f = 1; f <= 8; f++) {
          const t = f / 8
          const nx = x + Math.cos(a) * len * t * 1.2
          const ny = base + Math.sin(a) * len * t + t * t * len * 0.7
          g.moveTo(px, py).lineTo(nx, ny).stroke({ color: 0x2e5a2e, width: 0.9 })
          leaf(nx, ny, 1.4 * k, 3 * k * (1.1 - t * 0.6), a + Math.PI / 2, LEAF[(f + i) % 4]!)
          px = nx
          py = ny
        }
      }
      break
    }
    case 'flowers': {
      for (let i = 0; i < 7; i++) {
        const fx = x + (i - 3) * 3.4 * k
        const fy = base - (18 + ((i * 5) % 9)) * k
        g.moveTo(x + (i - 3) * k, base)
          .quadraticCurveTo(fx, base - 8 * k, fx, fy)
          .stroke({ color: 0x3a6a2a, width: 0.9 })
        leaf(fx - 2 * k, base - 8 * k, 1.5 * k, 3.5 * k, -0.6, LEAF[i % 4]!)
        const petal = [0xff7a9a, 0xf6e0f0, 0xffd04a, 0xe8503a, 0xc89aff][i % 5]!
        for (let pi = 0; pi < 5; pi++) {
          const a = (pi / 5) * Math.PI * 2
          g.circle(fx + Math.cos(a) * 2.2 * k, fy + Math.sin(a) * 2.2 * k, 1.8 * k).fill(petal)
        }
        g.circle(fx, fy, 1.3 * k).fill(0xffd04a)
      }
      break
    }
    default: {
      // pothos: heart-shaped leaves spilling over the rim
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (i - 4) * 0.5
        const len = (14 + (i % 3) * 6) * k
        const lx = x + Math.cos(a) * len
        const ly = base + Math.sin(a) * len * 0.8 + (Math.abs(i - 4) > 2 ? 8 * k : 0)
        g.moveTo(x, base)
          .quadraticCurveTo(x + (lx - x) * 0.4, base - 6 * k, lx, ly)
          .stroke({ color: 0x2e5a2e, width: 0.9 })
        leaf(lx, ly, 3 * k, 4.5 * k, a + Math.PI / 2, LEAF[i % 4]!)
      }
    }
  }
}

/** vines trailing down from a point, for shelves, hangers and bookcase tops */
export function vines(
  g: Graphics,
  x: number,
  y: number,
  s: number,
  count: number,
  length: number,
  seed = 0,
) {
  for (let v = 0; v < count; v++) {
    const dx = (v - (count - 1) / 2) * 5 * s
    const len = length * (0.5 + (((v + seed) * 37) % 50) / 100) * s
    const bend = (((v + seed) * 13) % 7) - 3
    g.moveTo(x + dx, y)
      .bezierCurveTo(
        x + dx + bend * 3 * s,
        y + len * 0.3,
        x + dx * 1.6 - bend * 2 * s,
        y + len * 0.7,
        x + dx * 1.3 + bend * s,
        y + len,
      )
      .stroke({ color: 0x2e5a2e, width: 1.1 })
    for (let l = 0; l < 7; l++) {
      const t = (l + 0.5) / 7
      const lx = x + dx * (1 + t * 0.3) + bend * s * Math.sin(t * 3) + (l % 2 ? 3 : -3) * s
      const ly = y + len * t
      g.ellipse(lx, ly, 2.8 * s, 3.8 * s)
        .fill(LEAF[(l + v) % 4]!)
        .stroke({ ...THIN, width: 0.5 })
    }
  }
}
