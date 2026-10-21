// Little paintings for the frames, each drawn on a 100x100 square.

export const ART_NAMES = ['sunset', 'cut-outs', 'mountains', 'still life', 'portrait', 'stripes']

export function Art({ index }: { index: number }) {
  switch (index % ART_NAMES.length) {
    case 0:
      return (
        <g>
          <rect width={100} height={60} fill="#e8803a" />
          <rect y={30} width={100} height={30} fill="#d9603a" />
          <circle cx={50} cy={58} r={18} fill="#f6d06a" />
          <rect y={58} width={100} height={42} fill="#2e3a5a" />
          {[66, 74, 84].map((y) => (
            <rect
              key={y}
              x={20 + (y % 3) * 6}
              y={y}
              width={60 - (y - 66)}
              height={2}
              fill="#f6d06a"
              opacity={0.6}
            />
          ))}
        </g>
      )
    case 1:
      return (
        <g>
          <rect width={100} height={100} fill="#efe3cc" />
          <path d="M20,80 Q10,40 35,20 Q45,50 30,80 Z" fill="#3a4a6a" />
          <circle cx={66} cy={34} r={16} fill="#a8432e" />
          <path d="M50,90 Q60,55 85,60 Q80,85 50,90 Z" fill="#e8c25a" />
          <rect x={58} y={60} width={6} height={24} fill="#4a6a3a" transform="rotate(20 61 72)" />
        </g>
      )
    case 2:
      return (
        <g>
          <rect width={100} height={100} fill="#1a2240" />
          <circle cx={72} cy={24} r={9} fill="#f6e0b0" />
          <path d="M0,80 L28,40 L46,64 L66,34 L100,78 L100,100 L0,100 Z" fill="#3a4a6a" />
          <path d="M28,40 L22,49 L34,49 Z M66,34 L59,44 L73,44 Z" fill="#efe3cc" />
          <path d="M0,88 L40,70 L70,84 L100,74 L100,100 L0,100 Z" fill="#2a3420" />
        </g>
      )
    case 3:
      return (
        <g>
          <rect width={100} height={100} fill="#5a3a28" />
          <rect y={72} width={100} height={28} fill="#8a5a3a" />
          <path d="M40,74 Q34,58 42,46 L58,46 Q66,58 60,74 Z" fill="#3a6a8a" />
          {[
            [40, 30, '#e8c25a'],
            [56, 26, '#a8432e'],
            [48, 18, '#efe3cc'],
            [62, 38, '#d98a3a'],
          ].map(([x, y, c]) => (
            <circle key={`${x}${y}`} cx={x as number} cy={y as number} r={7} fill={c as string} />
          ))}
          <circle cx={78} cy={76} r={6} fill="#c8432e" />
        </g>
      )
    case 4:
      return (
        <g>
          <rect width={100} height={100} fill="#d9b3a3" />
          <path d="M20,100 L20,50 A30,30 0 0 1 80,50 L80,100 Z" fill="#7a2a24" />
          <circle cx={50} cy={46} r={14} fill="#2a1a12" />
          <path d="M30,100 Q30,66 50,64 Q70,66 70,100 Z" fill="#2a1a12" />
        </g>
      )
    default:
      return (
        <g>
          <rect width={100} height={100} fill="#efe3cc" />
          {['#a8432e', '#e8c25a', '#3a4a6a', '#d98a3a', '#4a6a3a'].map((c, i) => (
            <rect key={c} x={10 + i * 17} y={10} width={12} height={80} fill={c} />
          ))}
          <circle cx={50} cy={50} r={12} fill="#efe3cc" />
        </g>
      )
  }
}
