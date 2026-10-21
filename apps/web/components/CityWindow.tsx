import type { Theme } from '@/lib/themes'

// A little window looking out over a house's city at night: sky, moon, a
// skyline with its landmark, lit windows. Plain svg so a page can show
// several at once. Used on the keyring and as the view out of your room.

export type WindowShape = 'arch' | 'rect' | 'circle' | 'gothic'

interface Props {
  theme: Theme
  /** anything stable -- the house id -- so the same house always looks the same */
  seed: string
  shape?: WindowShape
  /** draw the frame and sill around the glass */
  framed?: boolean
  className?: string
}

const W = 200
const H = 260

export function CityWindow({ theme, seed, shape = defaultShape(theme), framed = true, className }: Props) {
  const rng = makeRng(seed + theme)
  const id = `cw-${hash(seed + theme + shape).toString(36)}`
  const look = LOOKS[theme]
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`a window over ${theme.replace('-', ' ')}`}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#03061a" />
          <stop offset="0.6" stopColor="#0b1236" />
          <stop offset="1" stopColor={look.horizon} />
        </linearGradient>
        <radialGradient id={`${id}-moon`}>
          <stop offset="0" stopColor="#fff2cc" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff2cc" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-glass`}>
          <path d={glassPath(shape, 16, 16, W - 32, H - 40)} />
        </clipPath>
      </defs>

      {framed && <path d={glassPath(shape, 6, 6, W - 12, H - 20)} fill={look.frame} />}
      <g clipPath={`url(#${id}-glass)`}>
        <rect width={W} height={H} fill={`url(#${id}-sky)`} />
        {stars(rng).map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#fff6e0" opacity={0.8} />
        ))}
        <circle cx={look.moon[0]} cy={look.moon[1]} r={34} fill={`url(#${id}-moon)`} />
        <circle cx={look.moon[0]} cy={look.moon[1]} r={13} fill="#f6dfae" />
        <Skyline theme={theme} rng={rng} />
      </g>
      {framed && <Glazing shape={shape} theme={theme} />}
      {framed && <rect x={0} y={H - 22} width={W} height={10} fill={look.sill} />}
    </svg>
  )
}

export function defaultShape(theme: Theme): WindowShape {
  return theme === 'venice' ? 'gothic' : theme === 'paris' ? 'arch' : 'rect'
}

const LOOKS: Record<Theme, { frame: string; sill: string; horizon: string; moon: [number, number] }> = {
  paris: { frame: '#b8a582', sill: '#9a8669', horizon: '#3a1a2a', moon: [150, 62] },
  'new-york': { frame: '#4a2a1c', sill: '#5a3622', horizon: '#4a1e18', moon: [58, 58] },
  venice: { frame: '#8a3a32', sill: '#c8b89a', horizon: '#2a1a3a', moon: [146, 70] },
  tokyo: { frame: '#5a5a62', sill: '#7a7a80', horizon: '#4a1a2a', moon: [56, 64] },
}

function glassPath(shape: WindowShape, x: number, y: number, w: number, h: number) {
  const r = w / 2
  switch (shape) {
    case 'arch':
      return `M${x},${y + h} L${x},${y + r} A${r},${r} 0 0 1 ${x + w},${y + r} L${x + w},${y + h} Z`
    case 'gothic':
      return `M${x},${y + h} L${x},${y + r * 1.1} Q${x},${y + r * 0.2} ${x + r},${y} Q${x + w},${y + r * 0.2} ${x + w},${y + r * 1.1} L${x + w},${y + h} Z`
    case 'circle': {
      const cy = y + h / 2
      const rr = Math.min(w, h) / 2
      return `M${x + r - rr},${cy} A${rr},${rr} 0 1 1 ${x + r + rr},${cy} A${rr},${rr} 0 1 1 ${x + r - rr},${cy} Z`
    }
    default:
      return `M${x},${y} H${x + w} V${y + h} H${x} Z`
  }
}

/** the bars over the glass, and a little something on the outside for each city */
function Glazing({ shape, theme }: { shape: WindowShape; theme: Theme }) {
  const bar = LOOKS[theme].frame
  if (shape === 'circle') {
    return (
      <g stroke={bar} strokeWidth={5}>
        <line x1={W / 2} y1={30} x2={W / 2} y2={H - 50} />
        <line x1={30} y1={(H - 20) / 2} x2={W - 30} y2={(H - 20) / 2} />
      </g>
    )
  }
  return (
    <g>
      <g stroke={bar} strokeWidth={5}>
        <line x1={W / 2} y1={shape === 'rect' ? 16 : 30} x2={W / 2} y2={H - 24} />
        <line x1={16} y1={H * 0.55} x2={W - 16} y2={H * 0.55} />
      </g>
      {theme === 'paris' && <Balconette />}
      {theme === 'venice' && <Shutters />}
      {theme === 'tokyo' && <rect x={16} y={H - 70} width={W - 32} height={4} fill="#3a3a40" />}
    </g>
  )
}

function Balconette() {
  const xs = Array.from({ length: 22 }, (_, i) => 12 + i * 8.4)
  return (
    <g fill="none" stroke="#07080d" strokeWidth={1.6}>
      <line x1={8} x2={W - 8} y1={H - 62} y2={H - 62} strokeWidth={3} />
      {xs.map((x) => (
        <line key={x} x1={x} x2={x} y1={H - 62} y2={H - 24} />
      ))}
      {xs.filter((_, i) => i % 2 === 0).map((x) => (
        <ellipse key={`o${x}`} cx={x + 4} cy={H - 43} rx={4} ry={9} />
      ))}
    </g>
  )
}

function Shutters() {
  return (
    <g fill="#24402e" opacity={0.95}>
      <rect x={-30} y={20} width={36} height={H - 44} />
      <rect x={W - 6} y={20} width={36} height={H - 44} />
    </g>
  )
}

// ---- skylines --------------------------------------------------------------

type Rng = () => number

function Skyline({ theme, rng }: { theme: Theme; rng: Rng }) {
  const base = theme === 'venice' ? 200 : 240
  const blocks = buildings(rng, base, theme === 'tokyo' ? [60, 150] : [40, 110], theme === 'tokyo' ? 14 : 22)
  const lit = theme === 'tokyo' ? ['#e8f0ff', '#a8e0f0', '#ffd27a', '#ff8ab0'] : ['#ffc46a', '#ffa040', '#ffe0a0']
  return (
    <g>
      {theme === 'paris' && <Eiffel x={150} base={base} />}
      {theme === 'new-york' && <EmpireState x={130} base={base} />}
      {theme === 'tokyo' && <TokyoTower x={150} base={base} />}
      {theme === 'venice' && <Campanile x={60} base={base} />}
      {blocks.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={b.top} width={b.w} height={base - b.top + 40} fill={theme === 'tokyo' ? '#161828' : '#120c14'} />
          {theme === 'paris' && <path d={`M${b.x - 2},${b.top} L${b.x + 5},${b.top - 9} L${b.x + b.w - 5},${b.top - 9} L${b.x + b.w + 2},${b.top} Z`} fill="#1a1a2a" />}
          {theme === 'new-york' && i % 3 === 0 && <WaterTank x={b.x + b.w / 2} y={b.top} />}
          {b.windows.map(([wx, wy], j) => (
            <rect key={j} x={wx} y={wy} width={3} height={4} fill={lit[(i + j) % lit.length]} opacity={0.85} />
          ))}
        </g>
      ))}
      {theme === 'venice' && <Canal base={base} />}
    </g>
  )
}

function buildings(rng: Rng, base: number, height: [number, number], minW: number) {
  const out: { x: number; w: number; top: number; windows: [number, number][] }[] = []
  let x = -10
  while (x < W + 10) {
    const w = minW + rng() * 24
    const top = base - (height[0] + rng() * (height[1] - height[0]))
    const windows: [number, number][] = []
    for (let wy = top + 6; wy < base - 4; wy += 9) {
      for (let wx = x + 4; wx < x + w - 5; wx += 7) if (rng() < 0.32) windows.push([wx, wy])
    }
    out.push({ x, w, top, windows })
    x += w + rng() * 3
  }
  return out
}

function Eiffel({ x, base }: { x: number; base: number }) {
  const top = base - 170
  return (
    <g>
      <path d={`M${x - 34},${base} Q${x - 8},${base - 60} ${x - 3},${top} L${x + 3},${top} Q${x + 8},${base - 60} ${x + 34},${base} Z`} fill="#b8601c" />
      <path d={`M${x - 20},${base} Q${x},${base - 50} ${x + 20},${base}`} fill="#03061a" />
      <rect x={x - 14} y={base - 74} width={28} height={4} fill="#ffb24a" />
      <rect x={x - 8} y={base - 118} width={16} height={3} fill="#ffb24a" />
      <rect x={x - 1} y={top - 16} width={2} height={16} fill="#ffb24a" />
      <circle cx={x} cy={top - 16} r={3} fill="#fff2cc" />
    </g>
  )
}

function EmpireState({ x, base }: { x: number; base: number }) {
  const c = '#1a1e36'
  return (
    <g fill={c}>
      <rect x={x - 22} y={base - 120} width={44} height={140} />
      <rect x={x - 15} y={base - 150} width={30} height={30} />
      <rect x={x - 9} y={base - 172} width={18} height={22} />
      <rect x={x - 5} y={base - 182} width={10} height={10} fill="#ffd27a" />
      <rect x={x - 1.5} y={base - 206} width={3} height={24} />
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x={x - 16 + (i % 4) * 9} y={base - 112 + Math.floor(i / 4) * 12} width={3} height={5} fill="#ffc46a" opacity={0.8} />
      ))}
    </g>
  )
}

function TokyoTower({ x, base }: { x: number; base: number }) {
  const top = base - 180
  return (
    <g>
      <path d={`M${x - 30},${base} L${x - 3},${top} L${x + 3},${top} L${x + 30},${base} Z`} fill="#e8401e" />
      {[0.25, 0.45, 0.65].map((t) => (
        <rect key={t} x={x - 30 * (1 - t) - 2} y={base - (base - top) * t} width={60 * (1 - t) + 4} height={4} fill="#fff0e0" />
      ))}
      <rect x={x - 10} y={base - 108} width={20} height={8} fill="#fff0e0" />
      <rect x={x - 1} y={top - 20} width={2} height={20} fill="#e8401e" />
    </g>
  )
}

function Campanile({ x, base }: { x: number; base: number }) {
  return (
    <g fill="#2a1a2a">
      <rect x={x - 10} y={base - 150} width={20} height={150} />
      <rect x={x - 12} y={base - 156} width={24} height={14} fill="#ffcf7a" opacity={0.85} />
      <path d={`M${x - 12},${base - 156} L${x},${base - 186} L${x + 12},${base - 156} Z`} />
      {/* the dome of a church across the water */}
      <path d={`M${x + 50},${base - 50} A30,30 0 0 1 ${x + 110},${base - 50} Z`} />
      <rect x={x + 76} y={base - 92} width={6} height={14} />
    </g>
  )
}

function Canal({ base }: { base: number }) {
  return (
    <g>
      <rect x={0} y={base} width={W} height={H - base} fill="#060c1a" />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={(i * 37) % (W - 30)} y={base + 8 + i * 4} width={18 + (i % 3) * 10} height={1.4} fill="#ffb84a" opacity={0.6} />
      ))}
    </g>
  )
}

function WaterTank({ x, y }: { x: number; y: number }) {
  return (
    <g fill="#120c14">
      <rect x={x - 7} y={y - 18} width={14} height={13} />
      <path d={`M${x - 8},${y - 18} L${x},${y - 24} L${x + 8},${y - 18} Z`} />
      <rect x={x - 6} y={y - 5} width={1.5} height={5} />
      <rect x={x + 4.5} y={y - 5} width={1.5} height={5} />
    </g>
  )
}

function stars(rng: Rng) {
  return Array.from({ length: 22 }, () => [rng() * W, rng() * 120, 0.5 + rng() * 1.1] as const)
}

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function makeRng(seed: string): Rng {
  let a = hash(seed)
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
