// One-point perspective for the room. Room space is in "inches-ish":
// x runs -200 (left wall) to 200 (right wall), y is 0 at the floor up to 280
// at the ceiling, z is 0 at the front edge of the picture and 400 at the back
// wall. The eye sits in the middle at y=150, so you look straight at the
// window and see a bit of floor and a bit of ceiling.

export const ROOM = { left: -200, right: 200, floor: 0, ceiling: 280, front: 0, back: 400 }
export const VIEW = { width: 1000, height: 700 }

const CX = 500
const HORIZON = 300
const EYE = 150
const F = 1000
const F0 = 400

export type P3 = [number, number, number]
export type P2 = [number, number]

/** how much things shrink at depth z */
export function scaleAt(z: number) {
  return F / (z + F0)
}

export function project([x, y, z]: P3): P2 {
  const s = scaleAt(z)
  return [CX + x * s, HORIZON - (y - EYE) * s]
}

const r1 = (n: number) => Math.round(n * 10) / 10

/** svg points="" for a polygon through these room points */
export function poly(...ps: P3[]) {
  return ps.map((p) => project(p).map(r1).join(',')).join(' ')
}

export interface Box {
  x0: number
  x1: number
  y0: number
  y1: number
  z0: number
  z1: number
}

/** the faces of a box you can actually see from the eye, as polygon points */
export function boxFaces({ x0, x1, y0, y1, z0, z1 }: Box) {
  const front = poly([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0])
  const top = y1 < EYE ? poly([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]) : null
  const bottom = y0 > EYE ? poly([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]) : null
  // stuff on the right shows its left side and the other way round
  const side =
    x0 > 0
      ? poly([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0])
      : x1 < 0
        ? poly([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0])
        : null
  return { front, top, bottom, side }
}

/** flips a box to the other side of the room */
export function mirror(b: Box): Box {
  return { ...b, x0: -b.x1, x1: -b.x0 }
}

/** a flat shape lying on the floor, from points on the floor plan [x, z] */
export function floorShape(points: [number, number][], y = 0.5) {
  return poly(...points.map(([x, z]): P3 => [x, y, z]))
}

/**
 * An svg matrix() that maps a 100x100 picture onto a rectangle on a wall,
 * given its top-left, top-right and bottom-left corners. It's affine so it's
 * a hair off at the far corner, which nobody will see at picture size.
 */
export function wallMatrix(tl: P3, tr: P3, bl: P3) {
  const [ax, ay] = project(tl)
  const [bx, by] = project(tr)
  const [cx, cy] = project(bl)
  return `matrix(${[(bx - ax) / 100, (by - ay) / 100, (cx - ax) / 100, (cy - ay) / 100, ax, ay].map(r1).join(' ')})`
}

/** nudges a hex colour lighter (amt > 0) or darker (amt < 0) */
export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt),
  )
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}
