import type { Guest } from '../characters/guest'
import { drawCharacter, type Pose } from '../characters/draw'
import { at, type Ctx } from './context'
import type { P3 } from './projection'

// People in a bedroom: whoever lives here and anyone who's dropped by. A few
// natural places to be, in the order people fill them: perched on the bed,
// cross-legged on the rug, standing about.

/** characters are drawn about 300 units tall; a person here is about 225 */
const SIZE = 0.75

interface Spot {
  p: P3
  pose: Pose
  turn: -1 | 0 | 1
}

function spots(ctx: Ctx): Spot[] {
  const R = ctx.plan.half
  const mattress = ctx.layout.bed.style === 'platform' ? 34 : 50
  const bed: Spot =
    ctx.layout.bed.spot === 'right'
      ? { p: [R - 128, mattress, 250], pose: 'sit', turn: -1 }
      : { p: [70, mattress, 278], pose: 'sit', turn: 0 }
  return [
    bed,
    { p: [10, 0, 236], pose: 'floor', turn: 0 },
    { p: [-Math.min(110, R - 70), 0, 172], pose: 'stand', turn: 1 },
    { p: [Math.min(100, R - 70), 0, 176], pose: 'stand', turn: -1 },
    { p: [-40, 0, 120], pose: 'stand', turn: 0 },
  ]
}

export function drawGuests(ctx: Ctx, people: Guest[]) {
  if (!people.length) return
  const places = spots(ctx)
  // further back first, so nearer people stand in front
  const placed = people
    .slice(0, places.length)
    .map((guest, i) => ({ guest, spot: places[i]! }))
    .sort((a, b) => b.spot.p[2] - a.spot.p[2])
  for (const { guest, spot } of placed) {
    const { x, y, s } = at(spot.p)
    const layer = ctx.live(ctx.container())
    const person = drawCharacter(guest.avatar, {
      pose: spot.pose,
      turn: spot.turn,
      animate: (tick) => ctx.anim.push(tick),
    })
    person.position.set(x, y)
    person.scale.set(SIZE * s)
    layer.addChild(person)
  }
}
