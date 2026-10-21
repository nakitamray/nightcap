import type { Graphics } from 'pixi.js'

// Little paintings for the frames, each on a 100x100 square.
export const ART_NAMES = ['sunset', 'cut-outs', 'mountains', 'still life', 'portrait', 'stripes']

export function paintArt(g: Graphics, index: number) {
  switch (index % ART_NAMES.length) {
    case 0:
      g.rect(0, 0, 100, 60).fill(0xe8803a)
      g.rect(0, 28, 100, 32).fill(0xd8502a)
      g.circle(50, 58, 18).fill(0xf6d06a)
      g.rect(0, 58, 100, 42).fill(0x1e2a5a)
      for (const y of [66, 74, 84])
        g.rect(22 + (y % 3) * 6, y, 60 - (y - 66), 2).fill({ color: 0xf6d06a, alpha: 0.7 })
      break
    case 1:
      g.rect(0, 0, 100, 100).fill(0xf2e2bd)
      g.moveTo(20, 80)
        .quadraticCurveTo(10, 40, 35, 20)
        .quadraticCurveTo(45, 50, 30, 80)
        .closePath()
        .fill(0x2a4a8a)
      g.circle(66, 34, 16).fill(0xc8302a)
      g.moveTo(50, 90)
        .quadraticCurveTo(60, 55, 85, 60)
        .quadraticCurveTo(80, 85, 50, 90)
        .closePath()
        .fill(0xe8c25a)
      break
    case 2:
      g.rect(0, 0, 100, 100).fill(0x141a3a)
      g.circle(72, 24, 9).fill(0xf6e0b0)
      g.poly([0, 80, 28, 40, 46, 64, 66, 34, 100, 78, 100, 100, 0, 100]).fill(0x2f4a7a)
      g.poly([28, 40, 22, 49, 34, 49]).poly([66, 34, 59, 44, 73, 44]).fill(0xf2e2bd)
      g.poly([0, 88, 40, 70, 70, 84, 100, 74, 100, 100, 0, 100]).fill(0x1e3a2a)
      break
    case 3:
      g.rect(0, 0, 100, 100).fill(0x5a2a1c)
      g.rect(0, 72, 100, 28).fill(0x8a4a2a)
      g.moveTo(40, 74)
        .quadraticCurveTo(34, 58, 42, 46)
        .lineTo(58, 46)
        .quadraticCurveTo(66, 58, 60, 74)
        .closePath()
        .fill(0x2f6b8a)
      for (const [x, y, c] of [
        [40, 30, 0xe8c25a],
        [56, 26, 0xc8302a],
        [48, 18, 0xf2e2bd],
        [62, 38, 0xe8803a],
      ] as const)
        g.circle(x, y, 7).fill(c)
      g.circle(78, 76, 6).fill(0xc8302a)
      break
    case 4:
      g.rect(0, 0, 100, 100).fill(0xe8a890)
      g.moveTo(20, 100)
        .lineTo(20, 50)
        .arc(50, 50, 30, Math.PI, 0)
        .lineTo(80, 100)
        .closePath()
        .fill(0x8e2416)
      g.circle(50, 46, 14).fill(0x1e1210)
      g.moveTo(30, 100)
        .quadraticCurveTo(30, 66, 50, 64)
        .quadraticCurveTo(70, 66, 70, 100)
        .closePath()
        .fill(0x1e1210)
      break
    default:
      g.rect(0, 0, 100, 100).fill(0xf2e2bd)
      ;[0xc8302a, 0xe8c25a, 0x2a4a8a, 0xe8803a, 0x2f6b66].forEach((c, i) =>
        g.rect(10 + i * 17, 10, 12, 80).fill(c),
      )
      g.circle(50, 50, 12).fill(0xf2e2bd)
  }
}
