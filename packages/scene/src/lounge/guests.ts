import { Container, Graphics, Text } from 'pixi.js'
import { drawCharacter } from '../characters/draw'
import type { Guest } from '../characters/guest'
import { SIGN_FONT } from '../fonts'
import { at, type Ctx } from '../room/context'
import { INK } from '../room/paint'
import { drawPetAt } from '../room/pets'
import type { Seat } from './plan'

// People in the living room. Characters are drawn about 300 units tall
// standing, so they're scaled down to the room here (a person stands about
// 165 room units, the sofa seat is at 44).

const PERSON = 0.56

/** where someone ended up on screen, for hovering and clicking */
export interface Placed {
  guest: Guest
  /** view units */
  x: number
  y: number
  w: number
  h: number
  /** where their name tag goes */
  tagX: number
  tagY: number
}

export function seatGuest(ctx: Ctx, seat: Seat, guest: Guest): Placed {
  const { x, y, s } = at([seat.x, seat.y, seat.z])
  const holder = ctx.container()
  const person = drawCharacter(guest.avatar, {
    pose: seat.pose,
    turn: seat.turn,
    animate: (tick) => {
      ctx.live(holder)
      ctx.anim.push((t) => tick(t))
    },
  })
  holder.addChild(person)
  holder.position.set(x, y)
  holder.scale.set(s * PERSON)
  const b = person.getLocalBounds()
  const k = s * PERSON
  return {
    guest,
    x: x + b.x * k,
    y: y + b.y * k,
    w: b.width * k,
    h: b.height * k,
    tagX: x,
    tagY: y + b.y * k - 8,
  }
}

/** their pet comes too, settling at the seat's pet spot */
export function seatPet(ctx: Ctx, seat: Seat, guest: Guest) {
  if (!guest.pet || guest.pet.kind === 'none') return
  drawPetAt(ctx, guest.pet, seat.pet)
}

/** a little paper tag with someone's name on it, hung over their head */
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
