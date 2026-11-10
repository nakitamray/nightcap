import { Container, Graphics, Sprite } from 'pixi.js'
import { BaseHouse } from '../../layers/house-base'
import { glow } from '../../layers/neon'
import { GROUND } from '../../layout'
import { palette } from '../../palette'
import { createRng, range, type Rng } from '../../rng'
import {
  CORE,
  GARAGE_DOOR,
  GARAGE_WING,
  LEVELS,
  PEAK,
  SD_DOOR,
  SD_MARQUEE,
  sdSlots,
  TERRACE_WING,
} from './layout'
import {
  agave,
  birdOfParadise,
  bougainvillea,
  INK,
  lantern,
  pot,
  pricklyPear,
  sd,
  stuccoWall,
  tileRoof,
} from './parts'
import { sanDiegoWindow } from './window'

/** the pergola on the roof terrace */
const PERGOLA = { top: 486, posts: [1424, 1530, 1636] } as const

// A Spanish revival house on a quiet street: cream stucco and clay tile,
// three storeys under a gable in the middle, the garage with a room over it
// on one side and a roof terrace under a pergola on the other. Bougainvillea
// up the corner, agaves in the front yard.
export class House extends BaseHouse {
  private lanterns: Sprite[] = []
  private bulbs: Sprite[] = []

  constructor(seed: number, lights: Container) {
    super()
    const rng = createRng(seed)

    const shell = new Graphics()
    this.drawChimney(shell)
    this.drawWalls(shell, rng)
    this.drawRoofs(shell)
    this.drawGarage(shell, lights)
    this.drawEntrance(shell)
    this.addChild(shell)

    this.addChild(this.terrace(lights))
    this.addWindows(lights, sanDiegoWindow, sdSlots())
    this.addChild(this.balcony())
    this.addChild(this.garden(rng))

    this.addMarquee(
      lights,
      { board: 0x4a2c1a, face: 0x2a160c, trim: 0xd9a54a, fan: false },
      SD_MARQUEE,
    )

    // warm light washing up the stucco from the yard
    for (let ux = GARAGE_WING.x + 50; ux < TERRACE_WING.x + TERRACE_WING.width; ux += 130)
      glow(lights, ux, LEVELS.ground - 10, 2.2, 2.4, palette.amberDeep, 0.13)
  }

  private drawChimney(g: Graphics) {
    const x = CORE.x + 64
    g.rect(x, 276, 40, 110).fill(sd.stucco)
    g.rect(x, 276, 8, 110).fill({ color: palette.ink, alpha: 0.2 })
    // its own little tiled cap, on four stubby legs
    g.rect(x - 6, 270, 52, 8).fill(sd.stuccoLight)
    for (const lx of [x - 2, x + 34]) g.rect(lx, 252, 8, 18).fill(sd.stuccoDark)
    g.rect(x + 8, 256, 24, 14).fill(palette.ink)
    g.poly([x - 12, 254, x + 52, 254, x + 20, 234]).fill(sd.tile)
    g.poly([x - 12, 254, x + 52, 254, x + 46, 248, x - 6, 248]).fill(sd.tileLight)
  }

  private drawWalls(g: Graphics, rng: Rng) {
    for (const wing of [GARAGE_WING, TERRACE_WING])
      stuccoWall(g, wing.x, wing.y, wing.width, wing.height, sd.stucco, rng)
    // the middle stands a little proud of the wings and catches more light
    stuccoWall(g, CORE.x, CORE.y, CORE.width, CORE.height, 0x7c664c, rng)
    g.rect(CORE.x - 10, LEVELS.second, 10, GROUND - LEVELS.second).fill({
      color: palette.ink,
      alpha: 0.35,
    })
    g.rect(CORE.x + CORE.width, LEVELS.second, 10, GROUND - LEVELS.second).fill({
      color: palette.ink,
      alpha: 0.35,
    })
    // a band of painted tile round the middle at each floor
    for (const y of [LEVELS.second, LEVELS.ground]) {
      g.rect(CORE.x, y - 5, CORE.width, 10).fill(sd.stuccoDark)
      for (let tx = CORE.x + 4; tx < CORE.x + CORE.width - 6; tx += 14)
        g.poly([tx, y, tx + 5, y - 4, tx + 10, y, tx + 5, y + 4]).fill(
          (tx - CORE.x) % 28 < 14 ? 0x2a5a7a : 0xc8902a,
        )
    }
    // plinth along the bottom
    for (const wing of [GARAGE_WING, CORE, TERRACE_WING])
      g.rect(wing.x, GROUND - 22, wing.width, 22).fill({ color: palette.ink, alpha: 0.25 })
    // rain streaks under the sills
    for (let i = 0; i < 12; i++)
      g.rect(
        range(rng, GARAGE_WING.x + 10, TERRACE_WING.x + TERRACE_WING.width - 10),
        range(rng, LEVELS.second + 180, GROUND - 80),
        3,
        range(rng, 18, 50),
      ).fill({ color: palette.ink, alpha: 0.12 })
  }

  private drawRoofs(g: Graphics) {
    // the gable: tile down both slopes, stucco face, a round vent
    const { x, width: w } = CORE
    const eave = LEVELS.third
    g.poly([x - 30, eave + 6, PEAK.x, PEAK.y - 16, x + w + 30, eave + 6]).fill(sd.tile)
    g.poly([x - 4, eave + 6, PEAK.x, PEAK.y + 6, x + w + 4, eave + 6]).fill(0x7c664c)
    g.poly([
      x - 4,
      eave + 6,
      PEAK.x,
      PEAK.y + 6,
      x + w + 4,
      eave + 6,
      x + w + 4,
      eave - 6,
      PEAK.x,
      PEAK.y + 16,
      x - 4,
      eave - 6,
    ]).fill({ color: palette.ink, alpha: 0.3 })
    // the barrel ends stepping down each rake
    for (let i = 0; i <= 18; i++) {
      const t = i / 18
      for (const side of [-1, 1]) {
        const bx = PEAK.x + side * t * (w / 2 + 22)
        const by = PEAK.y - 8 + t * (eave + 6 - PEAK.y + 2)
        g.circle(bx, by, 6).fill(i % 2 ? sd.tileLight : sd.tileDark)
      }
    }
    g.circle(PEAK.x, 352, 20).fill(sd.stuccoLight)
    g.circle(PEAK.x, 352, 15).fill(palette.ink)
    g.rect(PEAK.x - 15, 350.5, 30, 3)
      .rect(PEAK.x - 1.5, 337, 3, 30)
      .fill(sd.stuccoLight)

    // over the garage: a low tiled roof leaning back against the middle
    tileRoof(g, GARAGE_WING.x, LEVELS.second, GARAGE_WING.width - 18, 62, [70, 0])

    // the terrace: a parapet with a tile coping
    const t = TERRACE_WING
    g.rect(t.x, LEVELS.second - 26, t.width + 8, 26).fill(sd.stuccoLight)
    g.rect(t.x, LEVELS.second - 32, t.width + 12, 8).fill(sd.tile)
    for (let tx = t.x + 4; tx < t.x + t.width + 10; tx += 12)
      g.rect(tx, LEVELS.second - 32, 1.5, 8).fill({ color: palette.ink, alpha: 0.4 })
  }

  private drawGarage(g: Graphics, lights: Container) {
    const d = GARAGE_DOOR
    // a shallow arch of stucco round the opening
    g.roundRect(d.x - 14, d.y - 16, d.width + 28, d.height + 16, 18).fill(sd.stuccoLight)
    g.rect(d.x - 4, d.y - 4, d.width + 8, d.height + 4).fill(palette.ink)
    g.rect(d.x, d.y, d.width, d.height).fill(sd.woodLight)
    // carriage doors: four leaves of planks, a row of little lights across the top
    const leaf = d.width / 4
    for (let i = 0; i < 4; i++) {
      const lx = d.x + i * leaf
      g.rect(lx + 3, d.y + 4, leaf - 6, d.height - 8).fill(sd.wood)
      for (let px = lx + 12; px < lx + leaf - 6; px += 9)
        g.rect(px, d.y + 44, 1.5, d.height - 52).fill({ color: palette.ink, alpha: 0.45 })
      g.rect(lx + 8, d.y + 10, leaf - 16, 26).fill(0xc88a3a)
      g.rect(lx + leaf / 2 - 1, d.y + 10, 2, 26).fill(sd.wood)
      g.rect(lx + 8, d.y + 10, leaf - 16, 26).fill({ color: palette.ink, alpha: 0.35 })
    }
    for (const hx of [d.x + leaf * 2 - 8, d.x + leaf * 2 + 8])
      g.circle(hx, d.y + 110, 3).fill(palette.gold)
    g.rect(d.x + leaf * 2 - 1, d.y + 4, 2, d.height - 4).fill(palette.ink)
    glow(lights, d.x + d.width / 2, d.y + 24, 1.3, 0.3, palette.amber, 0.25)

    for (const side of [-1, 1] as const) {
      const lx = side < 0 ? d.x - 12 : d.x + d.width + 12
      lantern(g, lx, d.y + 6, side < 0 ? 1 : -1)
      this.lanterns.push(glow(lights, lx - side * 18, d.y + 30, 0.9, 1, 0xffb84a, 0.7))
    }
  }

  private drawEntrance(g: Graphics) {
    const d = SD_DOOR
    const cx = d.x + d.width / 2
    // steps up, a round-headed doorway cut deep into the wall
    g.rect(cx - 86, GROUND - 12, 172, 12).fill(sd.stuccoDark)
    g.rect(cx - 70, GROUND - 22, 140, 10).fill(0x5a4636)
    const arch = (pad: number) =>
      g
        .moveTo(d.x - pad, GROUND - 22)
        .lineTo(d.x - pad, d.y + 44)
        .arc(cx, d.y + 44, d.width / 2 + pad, Math.PI, 0)
        .lineTo(d.x + d.width + pad, GROUND - 22)
        .closePath()
    arch(18).fill(sd.stuccoLight).stroke(INK)
    arch(6).fill(sd.stuccoDark)
    arch(0).fill(sd.wood)
    // plank door, iron straps, a little grille with the hall light behind it
    for (let px = d.x + 12; px < d.x + d.width - 4; px += 13)
      g.rect(px, d.y + 12, 1.5, d.height - 34).fill({ color: palette.ink, alpha: 0.5 })
    for (const sy of [d.y + 50, d.y + 112]) g.rect(d.x + 4, sy, d.width - 8, 4).fill(sd.iron)
    g.roundRect(cx - 13, d.y + 62, 26, 32, 4).fill(0xf0a850)
    for (let bx = cx - 9; bx < cx + 12; bx += 6) g.rect(bx, d.y + 62, 1.5, 32).fill(sd.iron)
    g.rect(cx - 13, d.y + 77, 26, 1.5).fill(sd.iron)
    g.circle(d.x + d.width - 14, d.y + 104, 3.5).fill(palette.gold)
    // the tiles round the doorway
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI + (i / 10) * Math.PI
      g.circle(
        cx + Math.cos(a) * (d.width / 2 + 12),
        d.y + 44 + Math.sin(a) * (d.width / 2 + 12),
        3.5,
      ).fill(i % 2 ? 0x2a5a7a : 0xc8902a)
    }
    // house number
    g.roundRect(d.x - 62, d.y + 30, 30, 20, 3)
      .fill(0x2a5a7a)
      .stroke(INK)
    g.rect(d.x - 56, d.y + 36, 3, 8)
      .rect(d.x - 50, d.y + 36, 6, 8)
      .rect(d.x - 41, d.y + 36, 3, 8)
      .fill(0xf2e2bd)
  }

  /** the roof terrace: a pergola, bulbs strung along it, pots and a couple of chairs */
  private terrace(lights: Container) {
    const g = new Graphics()
    const deck = LEVELS.second - 32
    const { top, posts } = PERGOLA
    for (const px of posts) g.rect(px - 5, top, 10, deck - top).fill(sd.wood)
    g.rect(posts[0] - 26, top - 10, posts[2] - posts[0] + 52, 10).fill(sd.woodLight)
    for (let rx = posts[0] - 14; rx <= posts[2] + 14; rx += 22)
      g.rect(rx - 3, top - 20, 6, 12).fill(sd.wood)
    // two butterfly chairs and a low table, seen over the parapet
    for (const cx of [1466, 1512]) {
      g.poly([cx - 16, deck, cx - 12, deck - 30, cx + 12, deck - 30, cx + 16, deck]).fill(0xc8642e)
      g.rect(cx - 16, deck - 32, 32, 4).fill(sd.iron)
    }
    g.rect(1484, deck - 16, 12, 16).fill(sd.iron)
    pot(g, 1600, deck, 1.1)
    pricklyPear(g, 1600, deck - 28, 0.62)
    pot(g, 1436, deck, 0.8)
    agave(g, 1436, deck - 22, 0.5)

    // the bulbs: two swags between the posts
    const wire = g
    for (let s = 0; s < 2; s++) {
      const x0 = posts[s]!
      const x1 = posts[s + 1]!
      wire
        .moveTo(x0, top + 4)
        .quadraticCurveTo((x0 + x1) / 2, top + 44, x1, top + 4)
        .stroke({ color: sd.iron, width: 1.5 })
      for (let i = 1; i < 7; i++) {
        const t = i / 7
        const bx = x0 + (x1 - x0) * t
        const by = top + 4 + 80 * t * (1 - t)
        wire.circle(bx, by + 4, 3).fill(0xfff0c0)
        this.bulbs.push(glow(lights, bx, by + 4, 0.22, 0.22, 0xffc870, 0.8))
      }
    }
    glow(lights, 1530, deck - 50, 2, 1, palette.amber, 0.16)
    return g
  }

  /** a wooden balcony across the middle of the first floor, on carved brackets */
  private balcony() {
    const g = new Graphics()
    const x0 = CORE.x + 16
    const x1 = CORE.x + CORE.width - 16
    const floor = LEVELS.second + 40 + 130 + 12
    for (let bx = x0 + 20; bx <= x1 - 20; bx += (x1 - x0 - 40) / 4)
      g.poly([bx - 5, floor + 8, bx + 5, floor + 8, bx + 5, floor + 14, bx - 5, floor + 30]).fill(
        sd.wood,
      )
    g.rect(x0, floor, x1 - x0, 9).fill(sd.woodLight)
    g.rect(x0, floor + 9, x1 - x0, 3).fill({ color: palette.ink, alpha: 0.5 })
    g.rect(x0, floor - 46, x1 - x0, 5).fill(sd.woodLight)
    for (let bx = x0 + 5; bx < x1; bx += 12) g.rect(bx, floor - 41, 4, 41).fill(sd.wood)
    for (const px of [x0, x1 - 8]) g.rect(px, floor - 54, 8, 54).fill(sd.woodLight)
    // somebody's towels and a wetsuit drying over the rail
    g.rect(x0 + 54, floor - 48, 34, 40).fill(0xd8703a)
    g.rect(x0 + 54, floor - 30, 34, 5).fill(0xf2e2bd)
    g.rect(x1 - 110, floor - 48, 30, 34).fill(0x2a6a7a)
    g.poly([
      x1 - 70,
      floor - 48,
      x1 - 44,
      floor - 48,
      x1 - 46,
      floor + 4,
      x1 - 54,
      floor + 4,
      x1 - 57,
      floor - 22,
      x1 - 60,
      floor + 4,
      x1 - 68,
      floor + 4,
    ]).fill(0x101418)
    return g
  }

  /** the front yard: pots by the door, agaves and cactus, bougainvillea up the corner */
  private garden(rng: Rng) {
    const g = new Graphics()
    const d = SD_DOOR
    for (const side of [-1, 1]) {
      const px = d.x + d.width / 2 + side * 112
      pot(g, px, GROUND, 1.2)
      birdOfParadise(g, px, GROUND - 30, 0.62)
    }
    // right up the corner of the terrace wing and spilling over the parapet
    const t = TERRACE_WING
    g.moveTo(t.x + t.width - 14, GROUND)
      .bezierCurveTo(
        t.x + t.width - 34,
        GROUND - 160,
        t.x + t.width - 4,
        GROUND - 330,
        t.x + t.width - 24,
        LEVELS.second,
      )
      .stroke({ color: sd.wood, width: 5 })
    bougainvillea(g, t.x + t.width - 62, LEVELS.second + 20, 76, 250, rng)
    bougainvillea(g, t.x + t.width - 120, LEVELS.second - 40, 136, 76, rng)
    bougainvillea(g, t.x + t.width - 36, LEVELS.second + 250, 46, 130, rng)
    // and a smaller one starting up the garage corner
    bougainvillea(g, GARAGE_WING.x - 12, GROUND - 190, 40, 150, rng, 0xd8602a)

    agave(g, t.x + 44, GROUND, 1)
    pricklyPear(g, t.x + 214, GROUND, 0.9)
    agave(g, t.x + 150, GROUND, 0.6, 0x4a6a4a)
    agave(g, CORE.x + 26, GROUND, 0.7)
    // a low hedge of rosemary under the ground floor windows
    for (const [hx, hw] of [
      [CORE.x + 60, 70],
      [CORE.x + CORE.width - 130, 70],
    ] as const) {
      for (let bx = hx; bx < hx + hw; bx += 10)
        g.circle(bx, GROUND - 12 - ((bx * 7) % 6), 12).fill((bx / 10) % 2 < 1 ? sd.leaf : 0x24442e)
    }
    return g
  }

  override update(time: number, dt: number, reducedMotion: boolean) {
    super.update(time, dt, reducedMotion)
    this.lanterns.forEach((l, i) => (l.alpha = 0.66 + Math.sin(time * 5 + i * 3) * 0.03))
    if (reducedMotion) return
    this.bulbs.forEach((b, i) => (b.alpha = 0.7 + Math.sin(time * 1.8 + i * 0.9) * 0.12))
  }
}
