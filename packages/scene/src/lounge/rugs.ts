import type { Graphics } from 'pixi.js'
import type { Ctx } from '../room/context'
import { fillPoly, INK, mix, shade, THIN } from '../room/paint'
import { onFloor } from '../room/projection'
import type { Rug } from './plan'

// Rugs, lots of them, overlapping the way they do when everyone brings one.

type Pt = [number, number]

function rect(cx: number, cz: number, rx: number, rz: number, k = 1): Pt[] {
  return [
    [cx - rx * k, cz - rz * k],
    [cx + rx * k, cz - rz * k],
    [cx + rx * k, cz + rz * k],
    [cx - rx * k, cz + rz * k],
  ]
}

function oval(cx: number, cz: number, rx: number, rz: number, k = 1): Pt[] {
  return Array.from({ length: 48 }, (_, i): Pt => {
    const a = (i / 48) * Math.PI * 2
    return [cx + Math.cos(a) * rx * k, cz + Math.sin(a) * rz * k]
  })
}

export function drawRug(ctx: Ctx, rug: Rug) {
  const g = ctx.layer()
  const { cx, cz, rx, rz, colour: c, second } = rug
  const round = rug.pattern === 'round'
  const shape = round ? oval : rect
  // a soft shadow where it lies
  g.poly(onFloor(shape(cx, cz + 2, rx, rz, 1.03), 0.15)).fill({ color: INK, alpha: 0.25 })
  switch (rug.pattern) {
    case 'persian':
      persian(g, rug)
      break
    case 'checker':
      checker(g, rug)
      break
    case 'round': {
      // braided rings
      const rings = 7
      for (let i = 0; i < rings; i++) {
        const k = 1 - i / rings
        g.poly(onFloor(oval(cx, cz, rx, rz, k), 0.3 + i * 0.01)).fill(
          i % 3 === 0 ? c : i % 3 === 1 ? second : mix(c, second, 0.5),
        )
      }
      g.poly(onFloor(oval(cx, cz, rx, rz))).stroke({ ...THIN, alpha: 0.6 })
      break
    }
    case 'stripes': {
      fillPoly(g, onFloor(rect(cx, cz, rx, rz)), second, THIN)
      const bands = 9
      for (let i = 0; i < bands; i += 2) {
        const z0 = cz - rz + (i / bands) * rz * 2
        const z1 = cz - rz + ((i + 1) / bands) * rz * 2
        g.poly(
          onFloor(
            [
              [cx - rx, z0],
              [cx + rx, z0],
              [cx + rx, z1],
              [cx - rx, z1],
            ],
            0.35,
          ),
        ).fill(i % 4 ? c : shade(c, 0.3))
      }
      fringe(g, cx, cz, rx, rz, second)
      break
    }
    case 'kilim': {
      fillPoly(g, onFloor(rect(cx, cz, rx, rz)), c, THIN)
      g.poly(onFloor(rect(cx, cz, rx, rz, 0.86), 0.3)).fill(second)
      g.poly(onFloor(rect(cx, cz, rx, rz, 0.8), 0.32)).fill(shade(c, -0.2))
      // rows of diamonds
      const colours = [second, 0xe8c25a, shade(c, 0.35), 0x1e1a1c]
      for (let row = 0; row < 3; row++) {
        const z = cz - rz * 0.5 + row * rz * 0.5
        for (let i = 0; i < 7; i++) {
          const x = cx - rx * 0.66 + (i * rx * 1.32) / 6
          const d = Math.min(rx, rz) * 0.18
          g.poly(
            onFloor(
              [
                [x, z - d],
                [x + d * 1.3, z],
                [x, z + d],
                [x - d * 1.3, z],
              ],
              0.4,
            ),
          ).fill(colours[(i + row) % colours.length]!)
        }
      }
      fringe(g, cx, cz, rx, rz, second)
      break
    }
    case 'tatami': {
      // a run of mats, cloth bound at the long edges
      const n = 4
      const w = (rx * 2) / n
      for (let i = 0; i < n; i++) {
        const x0 = cx - rx + i * w
        const pts: Pt[] = [
          [x0, cz - rz],
          [x0 + w, cz - rz],
          [x0 + w, cz + rz],
          [x0, cz + rz],
        ]
        fillPoly(g, onFloor(pts, 0.3), i % 2 ? c : shade(c, -0.06), null)
        for (let k = 1; k < 12; k++)
          g.poly(
            onFloor(
              [
                [x0 + 3, cz - rz + (k / 12) * rz * 2],
                [x0 + w - 3, cz - rz + (k / 12) * rz * 2],
              ],
              0.35,
            ),
            false,
          ).stroke({ color: shade(c, -0.18), width: 0.7, alpha: 0.6 })
        for (const xe of [x0 + 2, x0 + w - 2])
          g.poly(
            onFloor(
              [
                [xe, cz - rz],
                [xe, cz + rz],
              ],
              0.4,
            ),
            false,
          ).stroke({ color: 0x1e2a3a, width: 3 })
      }
      g.poly(onFloor(rect(cx, cz, rx, rz))).stroke(THIN)
      break
    }
  }
}

function persian(g: Graphics, rug: Rug) {
  const { cx, cz, rx, rz, colour: c } = rug
  const ivory = 0xf2e2bd
  fillPoly(g, onFloor(rect(cx, cz, rx, rz)), shade(c, -0.25), THIN)
  g.poly(onFloor(rect(cx, cz, rx, rz, 0.92), 0.3)).fill(ivory)
  g.poly(onFloor(rect(cx, cz, rx, rz, 0.88), 0.31)).fill(shade(c, -0.35))
  g.poly(onFloor(rect(cx, cz, rx, rz, 0.8), 0.32)).fill(c)
  // little flowers round the border
  for (let i = 0; i < 18; i++) {
    const t = i / 18
    const x = cx - rx * 0.9 + t * rx * 1.8
    for (const z of [cz - rz * 0.9, cz + rz * 0.9])
      g.poly(
        onFloor(
          [
            [x, z - 3],
            [x + 4, z],
            [x, z + 3],
            [x - 4, z],
          ],
          0.4,
        ),
      ).fill(i % 2 ? 0xe8c25a : 0x2f6b66)
  }
  // the medallion, layered diamonds
  const layers = [
    [0.62, ivory],
    [0.52, 0x2a4a8a],
    [0.4, 0xe8c25a],
    [0.28, shade(c, -0.3)],
    [0.14, ivory],
  ] as const
  for (const [k, colour] of layers)
    g.poly(
      onFloor(
        [
          [cx, cz - rz * k],
          [cx + rx * k * 0.8, cz],
          [cx, cz + rz * k],
          [cx - rx * k * 0.8, cz],
        ],
        0.36,
      ),
    ).fill(colour)
  // corner spandrels
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ] as const)
    g.poly(
      onFloor(
        [
          [cx + sx * rx * 0.8, cz + sz * rz * 0.8],
          [cx + sx * rx * 0.45, cz + sz * rz * 0.8],
          [cx + sx * rx * 0.8, cz + sz * rz * 0.35],
        ],
        0.36,
      ),
    ).fill(0x2a4a8a)
  fringe(g, cx, cz, rx, rz, ivory)
}

function checker(g: Graphics, rug: Rug) {
  const { cx, cz, rx, rz, colour: c, second } = rug
  const n = 10
  const m = 6
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) {
      const x0 = cx - rx + (i * rx * 2) / n
      const z0 = cz - rz + (j * rz * 2) / m
      g.poly(
        onFloor(
          [
            [x0, z0],
            [x0 + (rx * 2) / n, z0],
            [x0 + (rx * 2) / n, z0 + (rz * 2) / m],
            [x0, z0 + (rz * 2) / m],
          ],
          0.3,
        ),
      ).fill((i + j) % 2 ? c : second)
    }
  g.poly(onFloor(rect(cx, cz, rx, rz))).stroke(THIN)
}

function fringe(g: Graphics, cx: number, cz: number, rx: number, rz: number, colour: number) {
  for (const zEdge of [-rz, rz])
    for (let x = -rx + 2; x <= rx - 2; x += 5)
      g.poly(
        onFloor(
          [
            [cx + x, cz + zEdge],
            [cx + x + ((x * 7) % 3) - 1, cz + zEdge + Math.sign(zEdge) * 9],
          ],
          0.5,
        ),
        false,
      ).stroke({ color: colour, width: 1 })
}
