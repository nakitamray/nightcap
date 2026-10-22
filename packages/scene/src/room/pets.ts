import { Graphics } from 'pixi.js'
import { at, type Ctx } from './context'
import type { CatBreed, DogBreed } from './layout'
import { shade, THIN } from './paint'
import type { P3 } from './projection'

// Whoever else lives in the room: a cat curled up on the bed or a dog
// stretched out on a cushion by the rug. Both breathe; dogs wag now and then.

const CATS: Record<CatBreed, { coat: number; stripe?: number; fluffy?: boolean; ear: number }> = {
  black: { coat: 0x121014, ear: 0x2a2024 },
  tabby: { coat: 0xd8823a, stripe: 0x8a4a1e, ear: 0xe8a080 },
  white: { coat: 0xf2ece0, ear: 0xe8a8a0 },
  persian: { coat: 0xd8c8b8, fluffy: true, ear: 0xc8a8a0 },
  grey: { coat: 0x7a7a84, stripe: 0x5a5a64, ear: 0xc8a0a0 },
}

const DOGS: Record<
  DogBreed,
  {
    coat: number
    saddle?: number
    size: number
    ears: 'up' | 'flop'
    curly?: boolean
    snout: number
  }
> = {
  terrier: { coat: 0xc89a5a, saddle: 0x3a2a1e, size: 0.75, ears: 'up', snout: 10 },
  labradoodle: { coat: 0xe8c8a0, size: 1, ears: 'flop', curly: true, snout: 9 },
  golden: { coat: 0xd89a3a, size: 1.05, ears: 'flop', snout: 12 },
  shepherd: { coat: 0xb8783a, saddle: 0x1a1410, size: 1.15, ears: 'up', snout: 15 },
}

export function drawPet(ctx: Ctx) {
  const pet = ctx.layout.pet
  if (pet.kind === 'cat') cat(ctx, pet.breed)
  else if (pet.kind === 'dog') dog(ctx, pet.breed)
}

/** a cat asleep in a ring on the duvet */
function cat(ctx: Ctx, breed: CatBreed) {
  const top = ctx.layout.bed.style === 'platform' ? 30 : 46
  const p: P3 =
    ctx.layout.bed.spot === 'right' ? [ctx.plan.half - 56, top + 8, 300] : [20, top + 8, 320]
  const { x, y, s } = at(p)
  const look = CATS[breed]
  const k = s * 1.1
  const body = ctx.live(ctx.container('pet')).addChild(new Graphics())
  if (look.fluffy) {
    // a persian is mostly fur
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2
      body.circle(Math.cos(a) * 21 * k, Math.sin(a) * 10 * k, 6 * k).fill(look.coat)
    }
  }
  body.ellipse(0, 0, 22 * k, 11 * k).fill(look.coat)
  if (look.stripe) {
    for (let i = -3; i <= 3; i++)
      body
        .moveTo(i * 5 * k, -10 * k)
        .quadraticCurveTo(i * 5 * k + 3 * k, -2 * k, i * 5 * k, 6 * k)
        .stroke({ color: look.stripe, width: 2 * k })
  }
  body
    .ellipse(-16 * k, -4 * k, (look.fluffy ? 11 : 9) * k, (look.fluffy ? 9 : 8) * k)
    .fill(look.coat)
  body
    .poly([-22 * k, -9 * k, -20 * k, -18 * k, -15 * k, -11 * k])
    .poly([-14 * k, -11 * k, -10 * k, -18 * k, -8 * k, -9 * k])
    .fill(look.coat)
  body.poly([-21 * k, -10 * k, -20 * k, -15 * k, -17 * k, -11 * k]).fill(look.ear)
  body
    .moveTo(20 * k, 2 * k)
    .quadraticCurveTo(26 * k, 12 * k, 4 * k, 11 * k)
    .stroke({ color: look.coat, width: (look.fluffy ? 7 : 4) * k, cap: 'round' })
  if (look.stripe)
    body
      .moveTo(22 * k, 6 * k)
      .lineTo(18 * k, 10 * k)
      .stroke({ color: look.stripe, width: 2 * k })
  // closed eyes, and a pink nose on the light ones
  const lid = breed === 'black' ? 0xe8c25a : 0x2a1a14
  body
    .moveTo(-20 * k, -4 * k)
    .lineTo(-17 * k, -3 * k)
    .moveTo(-14 * k, -4 * k)
    .lineTo(-11 * k, -3 * k)
    .stroke({ color: lid, width: 0.8 })
  if (breed !== 'black') body.circle(-16 * k, -1 * k, 1 * k).fill(0xd88080)
  if (breed === 'white' || breed === 'persian')
    body.ellipse(0, 0, 22 * k, 11 * k).stroke({ ...THIN, alpha: 0.4 })
  body.position.set(x, y - 8 * k)
  ctx.anim.push((t) => body.scale.set(1, 1 + Math.sin(t * 1.4) * 0.04))
  ctx.hit('pet', (h) => h.ellipse(x, y - 8 * k, 28 * k, 16 * k))
}

/** a dog stretched out on its cushion by the rug, head on its paws */
function dog(ctx: Ctx, breed: DogBreed) {
  const look = DOGS[breed]
  const spot: P3 = [0, 0, 150]
  const { x, y, s } = at(spot)
  const k = s * 0.9 * look.size
  // the cushion
  const bed = ctx.layer('pet')
  const fabric = shade(0x8a4a3a, 0.1)
  bed
    .ellipse(x, y - 4 * s, 60 * s, 16 * s)
    .fill(shade(fabric, -0.25))
    .stroke(THIN)
  bed.ellipse(x, y - 9 * s, 52 * s, 11 * s).fill(fabric)
  bed.ellipse(x, y - 9 * s, 40 * s, 7 * s).fill(shade(fabric, 0.12))

  const pup = ctx.live(ctx.container('pet'))
  const tail = new Graphics()
  const body = new Graphics()
  pup.addChild(tail, body)
  pup.position.set(x, y - 12 * s)
  const coat = look.coat
  // tail first so it tucks behind
  tail
    .moveTo(0, 0)
    .quadraticCurveTo(14 * k, -10 * k, 26 * k, -4 * k)
    .stroke({ color: coat, width: (look.curly ? 8 : 5) * k, cap: 'round' })
  if (breed === 'golden')
    tail
      .moveTo(4 * k, 2 * k)
      .quadraticCurveTo(16 * k, -2 * k, 24 * k, 2 * k)
      .stroke({ color: shade(coat, 0.2), width: 3 * k })
  tail.position.set(30 * k, -6 * k)
  // body and haunch
  body.ellipse(8 * k, -10 * k, 36 * k, 13 * k).fill(coat)
  body.ellipse(28 * k, -12 * k, 14 * k, 12 * k).fill(coat)
  if (look.saddle) body.ellipse(10 * k, -17 * k, 26 * k, 7 * k).fill(look.saddle)
  if (look.curly) {
    for (let i = 0; i < 16; i++)
      body
        .circle(-22 * k + i * 4 * k, -22 * k + Math.sin(i) * 2 * k, 4 * k)
        .fill(shade(coat, i % 2 ? 0.08 : -0.05))
  }
  // front paws stretched out
  body.roundRect(-36 * k, -4 * k, 24 * k, 6 * k, 3 * k).fill(shade(coat, 0.05))
  body.roundRect(-38 * k, 0, 24 * k, 6 * k, 3 * k).fill(coat)
  // head resting on the paws
  const hx = -30 * k
  const hy = -12 * k
  body.ellipse(hx, hy, 12 * k, 10 * k).fill(coat)
  body
    .ellipse(hx - look.snout * k * 0.7, hy + 3 * k, look.snout * k * 0.6, 5 * k)
    .fill(look.saddle && breed === 'shepherd' ? 0x2a1a10 : shade(coat, 0.06))
  body.circle(hx - look.snout * k * 1.2, hy + 2 * k, 2.2 * k).fill(0x1a1210)
  if (look.ears === 'up') {
    body
      .poly([hx + 2 * k, hy - 8 * k, hx + 6 * k, hy - 22 * k, hx + 10 * k, hy - 6 * k])
      .fill(look.saddle ?? coat)
  } else {
    body.ellipse(hx + 7 * k, hy + 2 * k, 5 * k, 10 * k).fill(shade(coat, -0.15))
  }
  if (breed === 'terrier')
    body
      .moveTo(hx - 12 * k, hy + 6 * k)
      .lineTo(hx - 14 * k, hy + 11 * k)
      .moveTo(hx - 9 * k, hy + 7 * k)
      .lineTo(hx - 10 * k, hy + 12 * k)
      .stroke({ color: shade(coat, -0.2), width: 1.5 })
  body
    .moveTo(hx - 3 * k, hy - 2 * k)
    .lineTo(hx, hy - 1 * k)
    .stroke({ color: 0x1a1210, width: 1 })
  ctx.anim.push((t) => {
    body.scale.set(1, 1 + Math.sin(t * 1.2) * 0.03)
    // a wag every few seconds
    const w = t % 6
    tail.rotation = w < 1.2 ? Math.sin(w * 18) * 0.35 : 0
  })
  ctx.hit('pet', (h) => h.ellipse(x, y - 14 * s, 62 * s, 22 * s))
}
