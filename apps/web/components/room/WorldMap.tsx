// A rough, old-fashioned world map for the poster. The coastlines are
// hand-traced and deliberately loose; it's a poster, not an atlas.

export interface Pin {
  lat: number
  lon: number
  name: string
  me?: boolean
}

type Coast = [number, number][]

const LANDS: Coast[] = [
  // north america
  [
    [-168, 66],
    [-140, 70],
    [-110, 73],
    [-85, 70],
    [-75, 62],
    [-62, 58],
    [-55, 50],
    [-66, 44],
    [-75, 36],
    [-81, 30],
    [-81, 25],
    [-90, 29],
    [-97, 26],
    [-97, 20],
    [-87, 21],
    [-83, 10],
    [-78, 8],
    [-92, 15],
    [-105, 20],
    [-112, 30],
    [-117, 32],
    [-124, 40],
    [-124, 48],
    [-135, 58],
    [-150, 60],
    [-165, 60],
  ],
  // greenland
  [
    [-50, 60],
    [-42, 60],
    [-20, 70],
    [-20, 80],
    [-60, 82],
    [-70, 77],
    [-55, 68],
  ],
  // south america
  [
    [-78, 8],
    [-60, 10],
    [-50, 0],
    [-35, -6],
    [-40, -22],
    [-48, -28],
    [-58, -38],
    [-65, -42],
    [-68, -55],
    [-75, -50],
    [-72, -35],
    [-71, -18],
    [-80, -5],
    [-80, 2],
  ],
  // europe
  [
    [-10, 36],
    [-9, 43],
    [-2, 44],
    [-5, 48],
    [2, 51],
    [8, 54],
    [10, 58],
    [5, 62],
    [15, 69],
    [28, 71],
    [40, 67],
    [40, 60],
    [30, 55],
    [28, 45],
    [25, 40],
    [20, 40],
    [15, 45],
    [12, 44],
    [18, 40],
    [10, 44],
    [3, 43],
    [-1, 37],
  ],
  // britain
  [
    [-5, 50],
    [1, 51],
    [0, 53],
    [-3, 56],
    [-5, 58],
    [-6, 56],
    [-3, 54],
    [-5, 52],
  ],
  // africa
  [
    [-17, 21],
    [-10, 30],
    [-5, 36],
    [10, 37],
    [20, 32],
    [32, 31],
    [35, 28],
    [43, 12],
    [51, 12],
    [40, -2],
    [40, -15],
    [35, -25],
    [20, -35],
    [17, -29],
    [12, -17],
    [13, -5],
    [8, 4],
    [-8, 5],
    [-15, 10],
  ],
  // asia
  [
    [28, 45],
    [30, 55],
    [40, 60],
    [40, 67],
    [60, 70],
    [80, 73],
    [105, 78],
    [140, 72],
    [180, 68],
    [180, 65],
    [160, 60],
    [140, 55],
    [135, 45],
    [128, 38],
    [122, 30],
    [120, 22],
    [108, 20],
    [106, 10],
    [100, 13],
    [98, 8],
    [100, 2],
    [97, 16],
    [92, 22],
    [80, 15],
    [77, 8],
    [72, 20],
    [66, 25],
    [57, 25],
    [52, 28],
    [56, 24],
    [59, 22],
    [52, 16],
    [44, 12],
    [38, 20],
    [35, 28],
    [35, 36],
  ],
  // japan
  [
    [130, 31],
    [135, 34],
    [140, 36],
    [142, 40],
    [141, 45],
    [145, 44],
    [140, 41],
    [136, 37],
    [132, 34],
  ],
  // australia
  [
    [114, -22],
    [122, -18],
    [130, -12],
    [137, -12],
    [142, -11],
    [146, -19],
    [153, -26],
    [150, -37],
    [140, -38],
    [132, -32],
    [115, -34],
  ],
  // new zealand
  [
    [167, -46],
    [174, -41],
    [178, -38],
    [173, -35],
    [172, -41],
  ],
  // madagascar
  [
    [44, -25],
    [47, -25],
    [50, -15],
    [49, -12],
    [44, -17],
  ],
]

const WEST = -170
const EAST = 190
const NORTH = 82
const SOUTH = -58

interface Props {
  x: number
  y: number
  width: number
  height: number
  pins: Pin[]
}

export function WorldMap({ x, y, width, height, pins }: Props) {
  const px = (lon: number) => x + ((lon - WEST) / (EAST - WEST)) * width
  const py = (lat: number) => y + ((NORTH - lat) / (NORTH - SOUTH)) * height
  const s = width / 100
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="#b8c8b8" />
      {[-30, 0, 30, 60].map((lat) => (
        <line
          key={lat}
          x1={x}
          x2={x + width}
          y1={py(lat)}
          y2={py(lat)}
          stroke="#7a8a7a"
          strokeWidth={0.4}
        />
      ))}
      {[-120, -60, 0, 60, 120].map((lon) => (
        <line
          key={lon}
          y1={y}
          y2={y + height}
          x1={px(lon)}
          x2={px(lon)}
          stroke="#7a8a7a"
          strokeWidth={0.4}
        />
      ))}
      {LANDS.map((coast, i) => (
        <polygon
          key={i}
          points={coast
            .map(([lon, lat]) => `${px(lon).toFixed(1)},${py(lat).toFixed(1)}`)
            .join(' ')}
          fill="#e0c890"
          stroke="#8a6a4a"
          strokeWidth={0.5}
          strokeLinejoin="round"
        />
      ))}
      {pins
        .filter((p) => !p.me)
        .map((p) => (
          <circle
            key={p.name + p.lat}
            cx={px(p.lon)}
            cy={py(p.lat)}
            r={1.6 * s}
            fill="#2e3a5a"
            stroke="#efe3cc"
            strokeWidth={0.5}
          >
            <title>{p.name}</title>
          </circle>
        ))}
      {pins
        .filter((p) => p.me)
        .map((p) => (
          <g key="me">
            <circle
              cx={px(p.lon)}
              cy={py(p.lat)}
              r={2.4 * s}
              fill="#c8302a"
              stroke="#fff6e0"
              strokeWidth={0.7}
            />
            <title>{p.name}</title>
          </g>
        ))}
    </g>
  )
}
