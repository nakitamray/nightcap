import { Container, Sprite, Text } from 'pixi.js'
import { DISPLAY_FONT } from '../fonts'
import { glowTexture } from '../textures'

/** neon tubes spelling a word, with a glow behind it on the lights layer */
export function neonWord(
  parent: Container,
  lights: Container,
  word: string,
  x: number,
  y: number,
  opts: { size?: number; colour?: number; vertical?: boolean; font?: string } = {},
) {
  const size = opts.size ?? 26
  const colour = opts.colour ?? 0xff3b2a
  const text = new Text({
    text: opts.vertical ? word.split('').join('\n') : word,
    style: {
      fontFamily: opts.font ?? DISPLAY_FONT,
      fontSize: size,
      lineHeight: size * 1.15,
      align: 'center',
      fill: colour,
      letterSpacing: opts.vertical ? 0 : 2,
    },
    resolution: 2,
  })
  text.anchor.set(0.5)
  text.position.set(x, y)
  parent.addChild(text)
  const glow = new Sprite(glowTexture())
  glow.anchor.set(0.5)
  glow.position.set(x, y)
  glow.scale.set(Math.max(0.5, (text.width * 2) / 256), Math.max(0.4, (text.height * 2.2) / 256))
  glow.tint = colour
  glow.alpha = 0.55
  glow.blendMode = 'add'
  lights.addChild(glow)
  return { text, glow }
}

export function glow(
  lights: Container,
  x: number,
  y: number,
  sx: number,
  sy: number,
  tint: number,
  alpha: number,
) {
  const s = new Sprite(glowTexture())
  s.anchor.set(0.5)
  s.position.set(x, y)
  s.scale.set(sx, sy)
  s.tint = tint
  s.alpha = alpha
  s.blendMode = 'add'
  lights.addChild(s)
  return s
}
