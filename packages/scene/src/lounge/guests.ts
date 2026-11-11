import { Container, Graphics, Text } from 'pixi.js'
import { SIGN_FONT } from '../fonts'
import type { Guest } from '../guest'
import { glow } from '../layers/neon'
import { at, type Ctx } from '../room/context'
import { steamingMug } from '../room/furniture'
import { INK, shade, THIN } from '../room/paint'
import { drawPetAt } from '../room/pets'
import { cushion } from '../room/soft'
import type { P3 } from '../room/projection'
import type { Seat } from './plan'

// Who's in the living room, the same way the street shows who's home: by
// light. Everyone who's here has their seat lit by their own little lantern,
// a cushion in their colour, a mug going, and their pet curled up beside them.
// Empty seats stay dark.

/** a colour that's theirs, picked from their id so it never changes */
const THEIRS = [0xc8302a, 0xe8603a, 0xe8c25a, 0x2a4a8a, 0x2f6b66, 0x5a2a5a, 0xff7a9a, 0x3a7a3a]

function colourFor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return THEIRS[h % THEIRS.length]!
}

/** where someone's seat is on screen, for hovering and the name tag */
export interface Placed {
  guest: Guest
  /** view units */
  x: number
  y: number
  w: number
  h: number
  tagX: number
  tagY: number
}

/** a glass lantern with a candle in it, standing on the floor at `p` */
function lantern(ctx: Ctx, p: P3) {
  const { x, y, s: depth } = at(p)
  // a small thing by their feet: keep it small even on the seats up front,
  // where the perspective would otherwise blow it up bigger than the mugs
  const s = Math.min(depth, 1.8) * 0.6
  const g = ctx.layer()
  const w = 9 * s
  const h = 20 * s
  // the frame, the glass, a ring on top to carry it by
  g.rect(x - w, y - h, w * 2, h).fill({ color: 0xffe2a0, alpha: 0.55 })
  g.rect(x - w, y - h, w * 2, h).stroke({ color: INK, width: 1.2 })
  g.moveTo(x, y - h)
    .lineTo(x, y)
    .stroke({ ...THIN, width: 0.6 })
  g.poly([x - w - 2 * s, y - h, x, y - h - 7 * s, x + w + 2 * s, y - h]).fill(0x2a1a10)
  g.circle(x, y - h - 10 * s, 3 * s).stroke({ color: INK, width: 1 })
  g.rect(x - w - 1.5 * s, y - 2.5 * s, w * 2 + 3 * s, 2.5 * s).fill(0x2a1a10)
  // the candle and its flame, which flickers
  g.rect(x - 2.5 * s, y - 10 * s, 5 * s, 8 * s).fill(0xf6ead0)
  const flame = new Graphics()
  flame.ellipse(0, 0, 2.2 * s, 4 * s).fill(0xffd070)
  flame.position.set(x, y - 13 * s)
  ctx.lights.addChild(flame)
  glow(ctx.lights, x, y - 12 * s, (50 * s) / 128, (44 * s) / 128, 0xffa040, 0.2)
  glow(ctx.lights, x, y - 12 * s, (16 * s) / 128, (16 * s) / 128, 0xfff0c8, 0.5)
  const phase = (p[0] * 7 + p[2]) % 10
  ctx.anim.push((t) => {
    flame.scale.y = 1 + Math.sin(t * 9 + phase) * 0.12
    flame.alpha = 0.85 + Math.sin(t * 13 + phase) * 0.15
  })
}

/** someone's here: light up their seat */
export function seatGuest(ctx: Ctx, seat: Seat, guest: Guest): Placed {
  const colour = colourFor(guest.id)
  const g = ctx.layer()
  // their cushion, plumped on the seat (on the floor seats, under them)
  const r = seat.on === 'cushion' || seat.on === 'beanbag' ? 26 : 20
  const y = seat.y + 2
  cushion(
    g,
    [
      [seat.x - r, y, seat.z - r * 0.6],
      [seat.x + r, y, seat.z - r * 0.6],
      [seat.x + r, y + 6, seat.z + r * 0.4],
      [seat.x - r, y + 6, seat.z + r * 0.4],
    ],
    colour,
  )
  // a throw over it in a darker shade, folded once
  const throwAt = at([seat.x + r * 0.2, y + 8, seat.z])
  g.roundRect(
    throwAt.x - 9 * throwAt.s,
    throwAt.y - 3 * throwAt.s,
    22 * throwAt.s,
    7 * throwAt.s,
    3,
  )
    .fill(shade(colour, -0.25))
    .stroke(THIN)

  // their lantern and their mug, down by their feet
  const [px] = seat.pet
  const side = px >= seat.x ? -1 : 1
  lantern(ctx, [seat.x + side * 30, 0, Math.max(30, seat.z - 26)])
  steamingMug(ctx, ctx.layer(), [
    seat.x + side * 14,
    seat.on === 'stool' ? 0 : seat.y * 0.2,
    seat.z - 30,
  ])

  ctx.pool([seat.x, seat.y + 30, seat.z], 150, 0.3)

  const top = at([seat.x, seat.y + 70, seat.z])
  const base = at([seat.x, 0, seat.z])
  const half = 34 * base.s
  return {
    guest,
    x: base.x - half,
    y: top.y,
    w: half * 2,
    h: base.y - top.y,
    tagX: top.x,
    tagY: top.y,
  }
}

/** their pet comes too, settling at the seat's pet spot */
export function seatPet(ctx: Ctx, seat: Seat, guest: Guest) {
  if (!guest.pet || guest.pet.kind === 'none') return
  drawPetAt(ctx, guest.pet, seat.pet as P3)
}

/** a little paper tag with someone's name on it, hung over their seat */
export function nameTag(name: string, x: number, y: number, mine: boolean) {
  const tag = new Container()
  const text = new Text({
    text: mine ? `${name} (you)` : name,
    style: { fontFamily: SIGN_FONT, fontSize: 13, fill: INK },
    resolution: 2,
  })
  text.anchor.set(0.5, 1)
  const w = text.width + 14
  const h = text.height + 6
  const paper = new Graphics()
  paper
    .roundRect(-w / 2, -h, w, h, 2)
    .fill(mine ? 0xe8c25a : 0xf2e2bd)
    .stroke({ color: INK, width: 1, alpha: 0.8 })
  // the string it hangs from
  paper.moveTo(0, 0).lineTo(0, 6).stroke({ color: INK, width: 0.8, alpha: 0.6 })
  text.position.set(0, -3)
  tag.addChild(paper, text)
  tag.position.set(x, y - 6)
  tag.rotation = ((name.length % 5) - 2) * 0.02
  return tag
}
