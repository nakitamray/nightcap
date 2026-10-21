'use client'

import { useId } from 'react'
import { CityWindow } from '@/components/CityWindow'
import {
  boxFaces,
  floorShape,
  mirror,
  poly,
  project,
  ROOM,
  scaleAt,
  shade,
  VIEW,
  wallMatrix,
  type Box,
  type P3,
} from '@/lib/perspective'
import type { Layout } from '@/lib/room'
import type { Theme } from '@/lib/themes'
import { Art } from './art'
import { WorldMap, type Pin } from './WorldMap'
import styles from './Room.module.css'

export type Thing =
  'bed' | 'wall' | 'window' | 'frames' | 'lamp' | 'rug' | 'desk' | 'led' | 'vinyl' | 'map'

interface Props {
  layout: Layout
  theme: Theme
  seed: string
  playing: boolean
  pins: Pin[]
  onPick: (thing: Thing) => void
}

const { left: L, right: R, ceiling: C, back: B } = ROOM
const FLOOR = '#4a3022'
const SHELF = '#5a3a28'
const LAMP_LIGHT = '#ffb45a'
// the walls carry on past the edge of the picture so wide screens don't get bars
const Z0 = -160

/** where the bookshelf sits; it scoots left when the bed's under the window */
function shelfBox(layout: Layout): Box {
  return layout.bed.spot === 'window'
    ? { x0: -192, x1: -62, y0: 0, y1: 78, z0: 368, z1: 400 }
    : { x0: -66, x1: 66, y0: 0, y1: 78, z0: 368, z1: 400 }
}

/** the room-space point the lamp's light comes from */
function lampPoint(layout: Layout): P3 {
  const d = layout.desk.wall === 'left' ? 1 : -1
  switch (layout.lamp) {
    case 'desk':
      return [-158 * d, 118, 236]
    case 'arc':
      return layout.bed.spot === 'right' ? [100, 168, 300] : [10, 168, 250]
    case 'lantern':
      return [0, 212, 220]
    case 'mushroom': {
      const s = shelfBox(layout)
      return [s.x1 - 26, 96, 384]
    }
  }
}

export function RoomScene({ layout, theme, seed, playing, pins, onPick }: Props) {
  const id = useId().replace(/:/g, '')
  const [lx, ly] = project(lampPoint(layout))
  const pick = (thing: Thing) => () => onPick(thing)

  return (
    <svg
      className={styles.scene}
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      role="img"
      aria-label="your room"
    >
      <defs>
        <radialGradient id={`${id}-dark`} gradientUnits="userSpaceOnUse" cx={lx} cy={ly} r={720}>
          <stop offset="0" stopColor="#0a0510" stopOpacity="0" />
          <stop offset="0.3" stopColor="#0a0510" stopOpacity="0.12" />
          <stop offset="1" stopColor="#0a0510" stopOpacity="0.62" />
        </radialGradient>
        <radialGradient id={`${id}-lamp`} gradientUnits="userSpaceOnUse" cx={lx} cy={ly} r={300}>
          <stop offset="0" stopColor={LAMP_LIGHT} stopOpacity="0.55" />
          <stop offset="0.4" stopColor={LAMP_LIGHT} stopOpacity="0.16" />
          <stop offset="1" stopColor={LAMP_LIGHT} stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id={`${id}-grain`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
          <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0 0.1  0 0 0 0.5 0" />
        </filter>
      </defs>

      <Shell layout={layout} id={id} onPick={pick} />
      <WindowWall layout={layout} theme={theme} seed={seed} id={id} onPick={pick} />
      <Vinyl playing={playing} id={id} onClick={pick('vinyl')} />
      <MapPoster pins={pins} onClick={pick('map')} />
      <Frames layout={layout} id={id} onClick={pick('frames')} />
      <Rug layout={layout} onClick={pick('rug')} />

      <Bookshelf layout={layout} />
      {layout.lamp === 'mushroom' && <MushroomLamp layout={layout} onClick={pick('lamp')} />}
      <Bed layout={layout} onClick={pick('bed')} />
      {layout.lamp === 'arc' && <ArcLamp layout={layout} onClick={pick('lamp')} />}
      <Desk layout={layout} onClick={pick('desk')} />
      {layout.lamp === 'desk' && <DeskLamp layout={layout} onClick={pick('lamp')} />}
      <Chair layout={layout} />
      {layout.lamp === 'lantern' && <Lantern onClick={pick('lamp')} />}

      {/* night falls everywhere the lamp doesn't reach */}
      <g pointerEvents="none">
        <rect
          x={-1000}
          y={-600}
          width={VIEW.width + 2000}
          height={VIEW.height + 1200}
          fill={`url(#${id}-dark)`}
        />
        <rect
          width={VIEW.width}
          height={VIEW.height}
          fill={`url(#${id}-lamp)`}
          style={{ mixBlendMode: 'screen' }}
        />
        <rect
          x={-1000}
          y={-600}
          width={VIEW.width + 2000}
          height={VIEW.height + 1200}
          filter={`url(#${id}-grain)`}
          opacity={0.35}
        />
      </g>
    </svg>
  )
}

// -- the room itself ---------------------------------------------------------

function Shell({
  layout,
  id,
  onPick,
}: {
  layout: Layout
  id: string
  onPick: (t: Thing) => () => void
}) {
  const wall = layout.wall
  const planks = []
  for (let x = L; x <= R; x += 25) planks.push(poly([x, 0, Z0], [x, 0, B]))
  // staggered board ends so it reads as a floor and not a grid
  const seams = []
  for (let z = 30; z < B; z += 60) {
    for (let x = L + ((z / 60) % 2 ? 12 : 37); x < R; x += 75)
      seams.push(poly([x, 0, z], [x + 25, 0, z]))
  }
  const led = layout.led
  const strip: P3[] = [
    [L + 2, C - 4, Z0],
    [L + 2, C - 4, B - 2],
    [R - 2, C - 4, B - 2],
    [R - 2, C - 4, Z0],
  ]
  return (
    <g>
      <g className={styles.hit} onClick={onPick('wall')}>
        <polygon
          points={poly([L, C, Z0], [R, C, Z0], [R, C, B], [L, C, B])}
          fill={shade(wall, -0.45)}
        />
        <polygon
          points={poly([L, 0, Z0], [L, 0, B], [L, C, B], [L, C, Z0])}
          fill={shade(wall, -0.18)}
        />
        <polygon
          points={poly([R, 0, Z0], [R, 0, B], [R, C, B], [R, C, Z0])}
          fill={shade(wall, -0.22)}
        />
        <polygon points={poly([L, 0, B], [R, 0, B], [R, C, B], [L, C, B])} fill={wall} />
        {/* crown moulding and skirting */}
        <polyline
          points={poly([L, C - 6, Z0], [L, C - 6, B], [R, C - 6, B], [R, C - 6, Z0])}
          fill="none"
          stroke={shade(wall, 0.25)}
          strokeWidth={3}
        />
        <polygon
          points={poly([L, 0, Z0], [L, 0, B], [L, 12, B], [L, 12, Z0])}
          fill={shade(wall, -0.4)}
        />
        <polygon
          points={poly([R, 0, Z0], [R, 0, B], [R, 12, B], [R, 12, Z0])}
          fill={shade(wall, -0.42)}
        />
        <polygon
          points={poly([L, 0, B], [R, 0, B], [R, 12, B], [L, 12, B])}
          fill={shade(wall, -0.3)}
        />
      </g>
      <polygon points={poly([L, 0, Z0], [R, 0, Z0], [R, 0, B], [L, 0, B])} fill={FLOOR} />
      {planks.map((p, i) => (
        <polyline key={i} points={p} stroke="#2a1a12" strokeWidth={1} opacity={0.6} />
      ))}
      {seams.map((p, i) => (
        <polyline key={i} points={p} stroke="#2a1a12" strokeWidth={1} opacity={0.5} />
      ))}
      {/* city light through the window, lying on the floor */}
      <polygon
        points={floorShape(
          [
            [-80, 400],
            [80, 400],
            [130, 240],
            [-130, 240],
          ],
          0.4,
        )}
        fill="#c8d8ff"
        opacity={0.06}
      />

      <g className={styles.hit} onClick={onPick('led')}>
        {led ? (
          <>
            <polygon
              points={poly([L, C, Z0], [R, C, Z0], [R, C, B], [L, C, B])}
              fill={led}
              opacity={0.12}
            />
            <polyline
              points={poly(...strip)}
              fill="none"
              stroke={led}
              strokeWidth={14}
              opacity={0.55}
              filter={`url(#${id}-blur)`}
            />
            <polyline
              points={poly(...strip)}
              fill="none"
              stroke={shade(led, 0.6)}
              strokeWidth={2.5}
            />
          </>
        ) : (
          <polyline
            points={poly(...strip)}
            fill="none"
            stroke="#000"
            strokeWidth={3}
            opacity={0.25}
          />
        )}
        {/* a fat invisible line so the strip is easy to click */}
        <polyline points={poly(...strip)} fill="none" stroke="transparent" strokeWidth={18} />
      </g>
    </g>
  )
}

// -- back wall ---------------------------------------------------------------

const PANE = { x0: -82, x1: 82, y0: 100, y1: 238 }

function panePath(shape: Layout['window']['shape']) {
  const [x0, y0] = project([PANE.x0, PANE.y1, B])
  const [x1, y1] = project([PANE.x1, PANE.y0, B])
  const w = x1 - x0
  const h = y1 - y0
  if (shape === 'circle') {
    const r = Math.min(w, h) / 2
    const cx = x0 + w / 2
    const cy = y0 + h / 2
    return {
      d: `M${cx - r},${cy} a${r},${r} 0 1 1 ${r * 2},0 a${r},${r} 0 1 1 ${-r * 2},0 Z`,
      x0,
      y0,
      w,
      h,
    }
  }
  if (shape === 'arch') {
    const r = w / 2
    return {
      d: `M${x0},${y1} L${x0},${y0 + r} A${r},${r} 0 0 1 ${x1},${y0 + r} L${x1},${y1} Z`,
      x0,
      y0,
      w,
      h,
    }
  }
  return { d: `M${x0},${y0} H${x1} V${y1} H${x0} Z`, x0, y0, w, h }
}

function WindowWall({
  layout,
  theme,
  seed,
  id,
  onPick,
}: {
  layout: Layout
  theme: Theme
  seed: string
  id: string
  onPick: (t: Thing) => () => void
}) {
  const pane = panePath(layout.window.shape)
  const { x0, y0, w, h } = pane
  const sill = boxFaces({
    x0: PANE.x0 - 12,
    x1: PANE.x1 + 12,
    y0: PANE.y0 - 10,
    y1: PANE.y0 - 2,
    z0: B - 14,
    z1: B,
  })
  const frame = '#efe3cc'
  const curtain = layout.window.curtainColor
  return (
    <g>
      <g className={styles.hit} onClick={onPick('window')}>
        <clipPath id={`${id}-pane`}>
          <path d={pane.d} />
        </clipPath>
        <path
          d={pane.d}
          fill={shade(layout.wall, -0.5)}
          transform={`translate(0 3)`}
          opacity={0.5}
        />
        <g clipPath={`url(#${id}-pane)`}>
          <CityWindow
            theme={theme}
            seed={seed}
            shape="rect"
            framed={false}
            view={{ x: x0, y: y0, width: w, height: h }}
          />
          {/* a bit of reflection on the glass */}
          <path
            d={`M${x0 + w * 0.1},${y0 + h} L${x0 + w * 0.45},${y0} L${x0 + w * 0.55},${y0} L${x0 + w * 0.2},${y0 + h} Z`}
            fill="#fff"
            opacity={0.05}
          />
        </g>
        <path d={pane.d} fill="none" stroke={frame} strokeWidth={8} />
        {layout.window.shape === 'circle' ? (
          <>
            <line
              x1={x0 + w / 2}
              y1={y0 + (h - Math.min(w, h)) / 2}
              x2={x0 + w / 2}
              y2={y0 + (h + Math.min(w, h)) / 2}
              stroke={frame}
              strokeWidth={4}
            />
            <line
              x1={x0 + (w - Math.min(w, h)) / 2}
              y1={y0 + h / 2}
              x2={x0 + (w + Math.min(w, h)) / 2}
              y2={y0 + h / 2}
              stroke={frame}
              strokeWidth={4}
            />
          </>
        ) : (
          <>
            <line
              x1={x0 + w / 2}
              y1={y0}
              x2={x0 + w / 2}
              y2={y0 + h}
              stroke={frame}
              strokeWidth={4}
              clipPath={`url(#${id}-pane)`}
            />
            <line
              x1={x0}
              y1={y0 + h * 0.55}
              x2={x0 + w}
              y2={y0 + h * 0.55}
              stroke={frame}
              strokeWidth={4}
            />
          </>
        )}
        <Faces faces={sill} color={frame} />
      </g>

      {layout.window.curtains && (
        <g className={styles.hit} onClick={onPick('window')}>
          <line
            {...line([PANE.x0 - 40, PANE.y1 + 14, B - 6], [PANE.x1 + 40, PANE.y1 + 14, B - 6])}
            stroke="#2a1a12"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <Curtain x0={PANE.x0 - 38} x1={PANE.x0 + 6} color={curtain} />
          <Curtain x0={PANE.x1 - 6} x1={PANE.x1 + 38} color={curtain} />
        </g>
      )}
    </g>
  )
}

function Curtain({ x0, x1, color }: { x0: number; x1: number; color: string }) {
  const top = PANE.y1 + 12
  const bottom = PANE.y0 - 24
  const z = B - 8
  const [ax, ay] = project([x0, top, z])
  const [bx, by] = project([x1, bottom, z])
  const folds = 5
  const fw = (bx - ax) / folds
  return (
    <g>
      <path
        d={`M${ax},${ay} H${bx} V${by} ${Array.from({ length: folds }, (_, i) => `Q${bx - fw * (i + 0.5)},${by + 6} ${bx - fw * (i + 1)},${by}`).join(' ')} Z`}
        fill={color}
      />
      {Array.from({ length: folds - 1 }, (_, i) => (
        <line
          key={i}
          x1={ax + fw * (i + 1)}
          y1={ay}
          x2={ax + fw * (i + 1)}
          y2={by}
          stroke={shade(color, -0.35)}
          strokeWidth={fw * 0.35}
          opacity={0.6}
        />
      ))}
      <rect x={ax} y={ay} width={bx - ax} height={4} fill={shade(color, -0.3)} />
    </g>
  )
}

function Vinyl({ playing, id, onClick }: { playing: boolean; id: string; onClick: () => void }) {
  const [cx, cy] = project([-160, 172, B])
  const r = 30 * scaleAt(B)
  return (
    <g className={styles.hit} onClick={onClick}>
      <title>{playing ? 'what’s playing' : 'connect spotify'}</title>
      {playing && (
        <circle
          cx={cx}
          cy={cy}
          r={r * 1.5}
          fill={LAMP_LIGHT}
          opacity={0.5}
          filter={`url(#${id}-blur)`}
        />
      )}
      <circle cx={cx + 2} cy={cy + 3} r={r} fill="#000" opacity={0.3} />
      <g
        className={playing ? styles.spin : undefined}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      >
        <circle cx={cx} cy={cy} r={r} fill="#141012" />
        {[0.86, 0.72, 0.58].map((k) => (
          <circle key={k} cx={cx} cy={cy} r={r * k} fill="none" stroke="#2c2628" strokeWidth={1} />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.34} fill={playing ? '#d9603a' : '#a8432e'} />
        <path
          d={`M${cx - r * 0.2},${cy - r * 0.1} a${r * 0.2},${r * 0.2} 0 0 1 ${r * 0.3},${-r * 0.12}`}
          stroke="#f6e0b0"
          strokeWidth={1.5}
          fill="none"
        />
        <path
          d={`M${cx - r * 0.7},${cy - r * 0.5} A${r * 0.86},${r * 0.86} 0 0 1 ${cx - r * 0.1},${cy - r * 0.86}`}
          stroke="#fff"
          strokeWidth={1.5}
          fill="none"
          opacity={0.18}
        />
      </g>
      <circle cx={cx} cy={cy} r={2} fill="#e8d5b0" />
    </g>
  )
}

function MapPoster({ pins, onClick }: { pins: Pin[]; onClick: () => void }) {
  const [x0, y0] = project([96, 214, B])
  const [x1, y1] = project([190, 136, B])
  const w = x1 - x0
  const h = y1 - y0
  return (
    <g className={styles.hit} onClick={onClick}>
      <title>where everyone is</title>
      <rect x={x0 + 2} y={y0 + 3} width={w} height={h} fill="#000" opacity={0.3} />
      <rect x={x0} y={y0} width={w} height={h} fill="#e8d9b8" stroke="#2a1a12" strokeWidth={2} />
      <WorldMap x={x0 + 5} y={y0 + 5} width={w - 10} height={h - 18} pins={pins} />
      <text
        x={x0 + w / 2}
        y={y1 - 4}
        textAnchor="middle"
        fontSize={7}
        letterSpacing={2}
        fill="#5a3a28"
        fontFamily="'Nightcap Sign', serif"
      >
        OUR PEOPLE
      </text>
    </g>
  )
}

// -- side walls --------------------------------------------------------------

function Frames({ layout, id, onClick }: { layout: Layout; id: string; onClick: () => void }) {
  const placed = layout.frames.map((f, i) => {
    const onWall = layout.frames.filter((g) => g.wall === f.wall)
    const slot = onWall.indexOf(f)
    const zc = onWall.length === 1 ? 250 : slot === 0 ? 300 : 175
    return { ...f, zc, key: i }
  })
  return (
    <g className={styles.hit} onClick={onClick}>
      {placed.map(({ wall, art, zc, key }) => {
        const X = wall === 'left' ? L + 1 : R - 1
        const za = zc - 38
        const zb = zc + 38
        const ya = 128
        const yb = 212
        // looking at the left wall the far end is on your left, and the other way round
        const [near, far] = [za, zb]
        const tl: P3 = wall === 'left' ? [X, yb, far] : [X, yb, near]
        const tr: P3 = wall === 'left' ? [X, yb, near] : [X, yb, far]
        const bl: P3 = wall === 'left' ? [X, ya, far] : [X, ya, near]
        const inset = 7
        const inner = {
          tl:
            wall === 'left'
              ? ([X, yb - inset, far - inset] as P3)
              : ([X, yb - inset, near + inset] as P3),
          tr:
            wall === 'left'
              ? ([X, yb - inset, near + inset] as P3)
              : ([X, yb - inset, far - inset] as P3),
          bl:
            wall === 'left'
              ? ([X, ya + inset, far - inset] as P3)
              : ([X, ya + inset, near + inset] as P3),
        }
        const br: P3 = [X, inner.bl[1], inner.tr[2]]
        const clip = `${id}-frame-${key}`
        return (
          <g key={key}>
            <polygon points={poly(tl, tr, [X, ya, tr[2]], bl)} fill="#2a1a12" />
            <polygon
              points={poly(tl, tr, [X, ya, tr[2]], bl)}
              fill="none"
              stroke="#c8a060"
              strokeWidth={1.2}
              opacity={0.6}
            />
            <clipPath id={clip}>
              <polygon points={poly(inner.tl, inner.tr, br, inner.bl)} />
            </clipPath>
            <g clipPath={`url(#${clip})`}>
              <g transform={wallMatrix(inner.tl, inner.tr, inner.bl)}>
                <Art index={art} />
              </g>
            </g>
          </g>
        )
      })}
      {/* somewhere to click when there aren't any yet */}
      {layout.frames.length === 0 && (
        <polygon
          points={poly([L + 1, 128, 212], [L + 1, 128, 288], [L + 1, 212, 288], [L + 1, 212, 212])}
          fill="#000"
          opacity={0.06}
          strokeDasharray="4 4"
          stroke="#fff"
          strokeOpacity={0.25}
        />
      )}
    </g>
  )
}

// -- floor -------------------------------------------------------------------

function Rug({ layout, onClick }: { layout: Layout; onClick: () => void }) {
  const { shape, color } = layout.rug
  if (shape === 'none') return null
  const cx = layout.bed.spot === 'right' ? -20 : -10
  const cz = 205
  const outline = (k: number): [number, number][] => {
    const corners = (...ps: [number, number][]) =>
      ps.map(([x, z]): [number, number] => [cx + x * k, cz + z * k])
    switch (shape) {
      case 'rect':
        return corners([-105, -68], [105, -68], [105, 68], [-105, 68])
      case 'diamond':
        return corners([0, -80], [115, 0], [0, 80], [-115, 0])
      default: {
        const [rx, rz] = shape === 'circle' ? [88, 88] : [125, 76]
        return Array.from({ length: 48 }, (_, i) => {
          const a = (i / 48) * Math.PI * 2
          return [cx + Math.cos(a) * rx * k, cz + Math.sin(a) * rz * k]
        })
      }
    }
  }
  return (
    <g className={styles.hit} onClick={onClick}>
      <polygon points={floorShape(outline(1.02), 0.3)} fill="#000" opacity={0.25} />
      <polygon points={floorShape(outline(1))} fill={color} />
      <polygon
        points={floorShape(outline(0.84))}
        fill="none"
        stroke={shade(color, 0.35)}
        strokeWidth={3}
      />
      <polygon
        points={floorShape(outline(0.72))}
        fill="none"
        stroke={shade(color, -0.3)}
        strokeWidth={2}
      />
      <polygon points={floorShape(outline(0.4))} fill={shade(color, 0.2)} opacity={0.6} />
    </g>
  )
}

// -- furniture ---------------------------------------------------------------

function Faces({ faces, color }: { faces: ReturnType<typeof boxFaces>; color: string }) {
  return (
    <>
      {faces.side && <polygon points={faces.side} fill={shade(color, -0.32)} />}
      {faces.bottom && <polygon points={faces.bottom} fill={shade(color, -0.45)} />}
      <polygon points={faces.front} fill={shade(color, -0.12)} />
      {faces.top && <polygon points={faces.top} fill={color} />}
    </>
  )
}

function Block({ box, color }: { box: Box; color: string }) {
  return <Faces faces={boxFaces(box)} color={color} />
}

function Bookshelf({ layout }: { layout: Layout }) {
  const b = shelfBox(layout)
  const [fx0, fy0] = project([b.x0, b.y1, b.z0])
  const [fx1, fy1] = project([b.x1, b.y0, b.z0])
  const w = fx1 - fx0
  const h = fy1 - fy0
  const cubbies = 3
  const cw = (w - 8) / cubbies
  const books = [
    '#a8432e',
    '#e8c25a',
    '#3a4a6a',
    '#5a6a3a',
    '#d98a3a',
    '#6a2a3a',
    '#efe3cc',
    '#2e3a5a',
  ]
  let n = 0
  return (
    <g>
      <Block box={b} color={SHELF} />
      {[0, 1].map((row) =>
        Array.from({ length: cubbies }, (_, c) => {
          const x = fx0 + 4 + c * cw
          const y = fy0 + 4 + row * ((h - 8) / 2)
          const ch = (h - 8) / 2 - 3
          let bx = x + 3
          const spines = []
          // fill each cubby with books, leave one with a little plant in it
          if ((row + c) % 4 === 3) {
            spines.push(
              <rect
                key="pot"
                x={x + cw / 2 - 5}
                y={y + ch - 9}
                width={10}
                height={9}
                fill="#b8643a"
              />,
            )
            spines.push(<circle key="leaf" cx={x + cw / 2} cy={y + ch - 13} r={6} fill="#4a6a3a" />)
          } else {
            while (bx < x + cw - 8) {
              const bw = 3 + ((n * 7) % 4)
              const bh = ch * (0.7 + ((n * 13) % 5) * 0.06)
              spines.push(
                <rect
                  key={bx}
                  x={bx}
                  y={y + ch - bh}
                  width={bw}
                  height={bh}
                  fill={books[n % books.length]}
                />,
              )
              bx += bw + 0.6
              n++
            }
            if (c === 1)
              spines.push(
                <rect
                  key="lean"
                  x={bx}
                  y={y + ch - 5}
                  width={cw - (bx - x) - 3}
                  height={5}
                  fill={books[(n + 3) % books.length]}
                />,
              )
          }
          return (
            <g key={`${row}-${c}`}>
              <rect x={x} y={y} width={cw - 2} height={ch} fill={shade(SHELF, -0.55)} />
              {spines}
            </g>
          )
        }),
      )}
      {/* a candle and a photo on top */}
      <Block
        box={{ x0: b.x0 + 12, x1: b.x0 + 20, y0: b.y1, y1: b.y1 + 12, z0: 382, z1: 390 }}
        color="#f6e8cc"
      />
      <Block
        box={{ x0: b.x0 + 32, x1: b.x0 + 54, y0: b.y1, y1: b.y1 + 26, z0: 394, z1: 396 }}
        color="#c8a060"
      />
    </g>
  )
}

function Bed({ layout, onClick }: { layout: Layout; onClick: () => void }) {
  const { frame, sheets, pillows, blanket } = layout.bed
  const pillow = (b: Box) => <Block box={b} color={pillows} />
  if (layout.bed.spot === 'right') {
    return (
      <g className={styles.hit} onClick={onClick}>
        <Block box={{ x0: 72, x1: 200, y0: 0, y1: 112, z0: 392, z1: 400 }} color={frame} />
        <Block
          box={{ x0: 68, x1: 200, y0: 108, y1: 116, z0: 390, z1: 400 }}
          color={shade(frame, 0.15)}
        />
        <Block box={{ x0: 75, x1: 200, y0: 6, y1: 30, z0: 170, z1: 392 }} color={frame} />
        <Block box={{ x0: 78, x1: 198, y0: 30, y1: 46, z0: 172, z1: 390 }} color={sheets} />
        {pillow({ x0: 84, x1: 136, y0: 46, y1: 58, z0: 352, z1: 388 })}
        {pillow({ x0: 142, x1: 194, y0: 46, y1: 58, z0: 352, z1: 388 })}
        <Block box={{ x0: 76, x1: 199, y0: 28, y1: 49, z0: 170, z1: 300 }} color={blanket} />
        <Block box={{ x0: 76, x1: 199, y0: 46, y1: 50, z0: 292, z1: 312 }} color={sheets} />
        <Block box={{ x0: 72, x1: 200, y0: 0, y1: 38, z0: 164, z1: 170 }} color={frame} />
      </g>
    )
  }
  return (
    <g className={styles.hit} onClick={onClick}>
      <Block box={{ x0: 192, x1: 200, y0: 0, y1: 112, z0: 274, z1: 400 }} color={frame} />
      <Block box={{ x0: -40, x1: 192, y0: 6, y1: 30, z0: 278, z1: 398 }} color={frame} />
      <Block box={{ x0: -38, x1: 190, y0: 30, y1: 46, z0: 280, z1: 396 }} color={sheets} />
      {pillow({ x0: 150, x1: 188, y0: 46, y1: 58, z0: 340, z1: 392 })}
      {pillow({ x0: 150, x1: 188, y0: 46, y1: 58, z0: 284, z1: 336 })}
      <Block box={{ x0: -42, x1: 110, y0: 28, y1: 49, z0: 276, z1: 399 }} color={blanket} />
      <Block box={{ x0: 104, x1: 122, y0: 46, y1: 50, z0: 276, z1: 399 }} color={sheets} />
      <Block box={{ x0: -46, x1: -40, y0: 0, y1: 40, z0: 274, z1: 400 }} color={frame} />
    </g>
  )
}

/** the desk on the left wall; the right wall version is the mirror image */
function deskBoxes(layout: Layout) {
  const flip = layout.desk.wall === 'right' ? mirror : (b: Box) => b
  return {
    top: flip({ x0: -200, x1: -118, y0: 68, y1: 76, z0: 130, z1: 272 }),
    legs: [
      { x0: -126, x1: -120, z0: 134, z1: 140 },
      { x0: -126, x1: -120, z0: 262, z1: 268 },
      { x0: -196, x1: -190, z0: 134, z1: 140 },
    ].map((l) => flip({ ...l, y0: 0, y1: 68 })),
    drawer: flip({ x0: -198, x1: -122, y0: 52, y1: 68, z0: 200, z1: 268 }),
    books: flip({ x0: -192, x1: -160, y0: 76, y1: 90, z0: 146, z1: 172 }),
    laptop: flip({ x0: -170, x1: -136, y0: 76, y1: 78, z0: 180, z1: 222 }),
    screen: flip({ x0: -172, x1: -168, y0: 78, y1: 108, z0: 180, z1: 222 }),
    seat: flip({ x0: -112, x1: -72, y0: 40, y1: 46, z0: 176, z1: 220 }),
    back: flip({ x0: -76, x1: -70, y0: 46, y1: 102, z0: 178, z1: 218 }),
    chairLegs: (
      [
        [-110, 178],
        [-110, 214],
        [-76, 178],
        [-76, 214],
      ] as const
    ).map(([x, z]) => flip({ x0: x, x1: x + 4, y0: 0, y1: 40, z0: z, z1: z + 4 })),
  }
}

function Desk({ layout, onClick }: { layout: Layout; onClick: () => void }) {
  const d = deskBoxes(layout)
  const c = layout.desk.color
  return (
    <g className={styles.hit} onClick={onClick}>
      {d.legs.map((b, i) => (
        <Block key={i} box={b} color={shade(c, -0.1)} />
      ))}
      <Block box={d.drawer} color={c} />
      <Block box={d.top} color={c} />
      <Block box={d.books} color="#3a4a6a" />
      <Block box={{ ...d.books, y0: 90, y1: 98 }} color="#a8432e" />
      <Block box={d.laptop} color="#8a8a90" />
      <Block box={d.screen} color="#2a2a30" />
    </g>
  )
}

function Chair({ layout }: { layout: Layout }) {
  const d = deskBoxes(layout)
  const wood = shade(layout.desk.color, 0.08)
  return (
    <g>
      {d.chairLegs.map((b, i) => (
        <Block key={i} box={b} color={shade(wood, -0.15)} />
      ))}
      <Block box={d.seat} color={wood} />
      <Block box={d.back} color={wood} />
    </g>
  )
}

function line(a: P3, b: P3) {
  const [x1, y1] = project(a)
  const [x2, y2] = project(b)
  return { x1, y1, x2, y2 }
}

function Glow({ at, r }: { at: P3; r: number }) {
  const [x, y] = project(at)
  return <circle cx={x} cy={y} r={r * scaleAt(at[2])} fill="#ffe6b0" opacity={0.9} />
}

function DeskLamp({ layout, onClick }: { layout: Layout; onClick: () => void }) {
  const f = layout.desk.wall === 'right' ? -1 : 1
  const base: P3 = [-182 * f, 76, 246]
  const elbow: P3 = [-178 * f, 128, 246]
  const head: P3 = [-158 * f, 120, 236]
  const [hx, hy] = project(head)
  const s = scaleAt(head[2])
  return (
    <g className={styles.hit} onClick={onClick}>
      <ellipse cx={project(base)[0]} cy={project(base)[1]} rx={10 * s} ry={3 * s} fill="#2a2420" />
      <polyline
        points={poly(base, elbow, head)}
        fill="none"
        stroke="#2a2420"
        strokeWidth={2.5 * s}
      />
      <path
        d={`M${hx - 12 * s},${hy + 6 * s} L${hx - 5 * s},${hy - 8 * s} L${hx + 5 * s},${hy - 8 * s} L${hx + 12 * s},${hy + 6 * s} Z`}
        fill="#7a2a24"
      />
      <Glow at={[head[0], head[1] - 6, head[2]]} r={5} />
    </g>
  )
}

function ArcLamp({ layout, onClick }: { layout: Layout; onClick: () => void }) {
  const [bx, bz, sx, sz] = layout.bed.spot === 'right' ? [45, 330, 100, 300] : [-60, 245, 10, 250]
  const [ax, ay] = project([bx, 0, bz])
  const [tx, ty] = project([bx, 200, bz])
  const [hx, hy] = project([sx, 176, sz])
  const s = scaleAt(sz)
  return (
    <g className={styles.hit} onClick={onClick}>
      <ellipse cx={ax} cy={ay} rx={14 * s} ry={4 * s} fill="#1e1a18" />
      <path
        d={`M${ax},${ay} L${tx},${ty} Q${(tx + hx) / 2},${ty - 30 * s} ${hx},${hy}`}
        fill="none"
        stroke="#c8a060"
        strokeWidth={2.2 * s}
      />
      <path
        d={`M${hx - 14 * s},${hy + 14 * s} Q${hx},${hy - 10 * s} ${hx + 14 * s},${hy + 14 * s} Z`}
        fill="#c8a060"
      />
      <Glow at={[sx, 166, sz]} r={6} />
    </g>
  )
}

function Lantern({ onClick }: { onClick: () => void }) {
  const at: P3 = [0, 212, 220]
  const [x, y] = project(at)
  const s = scaleAt(at[2])
  const r = 24 * s
  return (
    <g className={styles.hit} onClick={onClick}>
      <line {...line([0, C, 220], [0, 212 + 24, 220])} stroke="#1e1a18" strokeWidth={1.5} />
      <circle cx={x} cy={y} r={r * 1.6} fill="#ffcf80" opacity={0.25} />
      <circle cx={x} cy={y} r={r} fill="#f6dca8" />
      {[-0.6, -0.2, 0.2, 0.6].map((k) => (
        <ellipse
          key={k}
          cx={x}
          cy={y + k * r}
          rx={r * Math.sqrt(1 - k * k)}
          ry={r * 0.12}
          fill="none"
          stroke="#c8a070"
          strokeWidth={1}
        />
      ))}
    </g>
  )
}

function MushroomLamp({ layout, onClick }: { layout: Layout; onClick: () => void }) {
  const b = shelfBox(layout)
  const at: P3 = [b.x1 - 26, b.y1, 384]
  const [x, y] = project(at)
  const s = scaleAt(at[2])
  return (
    <g className={styles.hit} onClick={onClick}>
      <rect x={x - 3 * s} y={y - 16 * s} width={6 * s} height={16 * s} fill="#e8d5b0" />
      <ellipse cx={x} cy={y} rx={8 * s} ry={2 * s} fill="#c8b090" />
      <path
        d={`M${x - 16 * s},${y - 14 * s} Q${x},${y - 40 * s} ${x + 16 * s},${y - 14 * s} Z`}
        fill="#e8803a"
      />
      <ellipse cx={x} cy={y - 14 * s} rx={16 * s} ry={3 * s} fill="#ffe0a0" />
    </g>
  )
}
