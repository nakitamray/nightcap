import type { Graphics } from 'pixi.js'
import { palette } from '../palette'
import { boxFaces, type Box } from './projection'

// Same rules as outside: flat colour, a dark ink line round everything,
// light comes from glows on top rather than from shading in the fills.

export const INK = palette.ink
export const LINE = { color: INK, width: 1.6, alpha: 0.9, join: 'round' as const }
export const THIN = { color: INK, width: 1, alpha: 0.7 }

export function hex(s: string) {
  return parseInt(s.slice(1), 16)
}

/** lighter (amt > 0) or darker (amt < 0) */
export function shade(c: number, amt: number) {
  const ch = [(c >> 16) & 255, (c >> 8) & 255, c & 255].map((v) =>
    Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt),
  )
  return (ch[0]! << 16) | (ch[1]! << 8) | ch[2]!
}

export function mix(a: number, b: number, t: number) {
  const ca = [(a >> 16) & 255, (a >> 8) & 255, a & 255]
  const cb = [(b >> 16) & 255, (b >> 8) & 255, b & 255]
  const ch = ca.map((v, i) => Math.round(v + (cb[i]! - v) * t))
  return (ch[0]! << 16) | (ch[1]! << 8) | ch[2]!
}

export function fillPoly(
  g: Graphics,
  pts: number[],
  color: number,
  line: typeof LINE | typeof THIN | null = LINE,
) {
  g.poly(pts).fill(color)
  if (line) g.poly(pts).stroke(line)
}

/** a box with its visible faces shaded and inked */
export function block(
  g: Graphics,
  b: Box,
  color: number,
  line: typeof LINE | typeof THIN | null = LINE,
) {
  const f = boxFaces(b)
  if (f.side) fillPoly(g, f.side, shade(color, -0.38), line)
  fillPoly(g, f.front, shade(color, -0.16), line)
  if (f.top) fillPoly(g, f.top, color, line)
  if (f.bottom) fillPoly(g, f.bottom, shade(color, -0.3), line)
  return f
}
