// One-point perspective for the room. Room space: x runs from the left wall
// to the right wall (centred on 0), y is 0 at the floor up to the ceiling, z
// is 0 at the front of the picture and 400 at the back wall. The eye sits low,
// at y=170, so the room opens up above you.
//
// Rooms come in different shapes -- tall and narrow, low and wide -- so the
// walls and the camera are set per room with setRoomShape() before drawing.
// Everything comes out in "view" units, a 1000 x 960 picture that the scene
// scales to the screen.

import { Matrix } from 'pixi.js'

export const ROOM = { left: -200, right: 200, floor: 0, ceiling: 440, back: 400 }
export const VIEW = { width: 1000, height: 960 }
/** the walls carry on in front of the picture so wide screens don't get bars */
export const NEAR = -330

const CX = 500
const EYE = 170
// a camera a little further back than you'd stand, so the far wall stays big
const F0 = 600
const cam = { f: 1500, horizon: 445 }

/** sets the walls and points the camera so the whole room fits */
export function setRoomShape(half: number, ceiling: number) {
  ROOM.left = -half
  ROOM.right = half
  ROOM.ceiling = ceiling
  // tall rooms pull the camera back a touch so the ceiling stays in the picture
  cam.f = 1500 * Math.min(1, 470 / ceiling)
  const s = cam.f / (ROOM.back + F0)
  // keep the top of the back wall near the top of the picture; low rooms sit
  // a little lower, showing more ceiling
  cam.horizon = 40 + (ceiling - EYE) * s + Math.max(0, 440 - ceiling) * 0.9
}

export type P3 = readonly [number, number, number]
export type P2 = [number, number]

export function scaleAt(z: number) {
  return cam.f / (z + F0)
}

export function project([x, y, z]: P3): P2 {
  const s = scaleAt(z)
  return [CX + x * s, cam.horizon - (y - EYE) * s]
}

/** flat [x0, y0, x1, y1, ...] for pixi's poly() */
export function flat(...ps: P3[]) {
  return ps.flatMap(project)
}

export interface Box {
  x0: number
  x1: number
  y0: number
  y1: number
  z0: number
  z1: number
}

export interface Faces {
  front: number[]
  top: number[] | null
  bottom: number[] | null
  side: number[] | null
}

/** the faces of a box you can see from the eye */
export function boxFaces({ x0, x1, y0, y1, z0, z1 }: Box): Faces {
  return {
    front: flat([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]),
    top: y1 < EYE ? flat([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]) : null,
    bottom: y0 > EYE ? flat([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]) : null,
    // stuff on the right shows its left side and the other way round
    side:
      x0 > 0
        ? flat([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0])
        : x1 < 0
          ? flat([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0])
          : null,
  }
}

export function mirror(b: Box): Box {
  return { ...b, x0: -b.x1, x1: -b.x0 }
}

/** a shape lying on the floor, from floor-plan points [x, z] */
export function onFloor(points: [number, number][], y = 0.5) {
  return flat(...points.map(([x, z]): P3 => [x, y, z]))
}

/**
 * Maps a 100x100 picture onto a rectangle given its top-left, top-right and
 * bottom-left corners. Affine, so a hair off at the far corner, which nobody
 * sees at picture size.
 */
export function pictureMatrix(tl: P3, tr: P3, bl: P3) {
  const [ax, ay] = project(tl)
  const [bx, by] = project(tr)
  const [cx, cy] = project(bl)
  return new Matrix((bx - ax) / 100, (by - ay) / 100, (cx - ax) / 100, (cy - ay) / 100, ax, ay)
}
