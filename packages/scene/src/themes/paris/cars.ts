import { Container, Graphics, Sprite } from 'pixi.js'
import { palette } from '../../palette'
import { glowTexture } from '../../textures'

// Parked cars along the kerb, mostly cut off by the edge of the frame like
// they would be in a photo. Both drawn facing right, wheels on y = 0.

const INK = palette.ink
const CHROME = 0xd8b88a

/** the DS: long, low, nose like a shark */
function ds(body: number) {
  const g = new Graphics()
  g.moveTo(0, -28)
    .lineTo(4, -52)
    .bezierCurveTo(20, -62, 60, -66, 96, -70)
    .bezierCurveTo(120, -112, 170, -120, 230, -118)
    .bezierCurveTo(270, -116, 300, -96, 320, -72)
    .bezierCurveTo(360, -66, 392, -56, 410, -40)
    .lineTo(414, -22)
    .lineTo(0, -22)
    .closePath()
    .fill(body)
  // glass
  g.moveTo(110, -74)
    .bezierCurveTo(130, -106, 170, -112, 220, -111)
    .lineTo(222, -74)
    .closePath()
    .fill(0x2a1810)
  g.moveTo(230, -111)
    .bezierCurveTo(262, -110, 286, -94, 300, -74)
    .lineTo(232, -74)
    .closePath()
    .fill(0x2a1810)
  // warm street light caught on the roof and along the side
  g.moveTo(130, -112)
    .bezierCurveTo(170, -121, 230, -121, 270, -112)
    .stroke({ color: 0xff9a4a, width: 2, alpha: 0.7 })
  g.rect(20, -48, 380, 2).fill({ color: CHROME, alpha: 0.6 })
  g.rect(0, -26, 416, 5).fill(CHROME)
  // skirted rear wheel, open front one
  g.circle(320, -10, 28).fill(INK)
  g.circle(320, -10, 10).fill(0x3a2a20)
  g.rect(52, -40, 64, 22).fill(body)
  g.circle(84, -10, 28).fill(INK)
  return g
}

/** the 2CV: tall, round, all roof */
function deuxChevaux(body: number) {
  const g = new Graphics()
  g.moveTo(0, -30)
    .bezierCurveTo(4, -60, 30, -66, 56, -70)
    .bezierCurveTo(70, -128, 110, -138, 170, -136)
    .bezierCurveTo(220, -134, 240, -112, 250, -60)
    .lineTo(262, -50)
    .lineTo(264, -24)
    .lineTo(0, -24)
    .closePath()
    .fill(body)
  // bonnet ribs
  for (let i = 0; i < 5; i++)
    g.moveTo(10 + i * 9, -40)
      .lineTo(20 + i * 9, -64)
      .stroke({ color: INK, width: 1, alpha: 0.4 })
  g.moveTo(80, -76)
    .bezierCurveTo(92, -116, 120, -126, 160, -126)
    .lineTo(162, -76)
    .closePath()
    .fill(0x2a1810)
  g.moveTo(170, -126)
    .bezierCurveTo(204, -124, 220, -106, 228, -76)
    .lineTo(172, -76)
    .closePath()
    .fill(0x2a1810)
  g.moveTo(96, -128)
    .bezierCurveTo(130, -140, 190, -140, 220, -122)
    .stroke({ color: 0xff9a4a, width: 2, alpha: 0.7 })
  g.circle(52, -12, 22).fill(INK)
  g.circle(210, -12, 22).fill(INK)
  g.circle(52, -12, 8).circle(210, -12, 8).fill(0x8a7a6a)
  g.ellipse(8, -50, 7, 9).fill(0xffe0a0)
  return g
}

export class ParkedCars extends Container {
  constructor(left: { x: number; y: number }, right: { x: number; y: number }) {
    super()
    // left of frame: a dark red DS, nose toward us
    const a = ds(0x4a0e0a)
    a.position.set(left.x, left.y)
    a.scale.set(-1, 1)
    // right: a 2CV the colour of strong coffee, tail light on
    const b = deuxChevaux(0x3a2010)
    b.position.set(right.x, right.y)
    const tail = new Sprite(glowTexture())
    tail.anchor.set(0.5)
    tail.position.set(right.x + 262, right.y - 40)
    tail.scale.set(0.35)
    tail.tint = 0xff2a1a
    tail.alpha = 0.8
    tail.blendMode = 'add'
    const tailCore = new Graphics().roundRect(right.x + 258, right.y - 46, 7, 12, 2).fill(0xff3a24)
    this.addChild(a, b, tailCore, tail)
  }
}
