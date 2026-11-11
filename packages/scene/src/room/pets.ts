import { Graphics } from 'pixi.js'
import { at, type Ctx } from './context'
import type { CatBreed, DogBreed, Pet, SquirrelCoat } from './layout'
import { shade, THIN } from './paint'
import type { P3 } from './projection'

// Whoever else lives in the room: a cat or a squirrel curled up on the bed, a
// dog or a raccoon on a cushion by the rug. They all breathe; dogs wag now and
// then, and a squirrel's tail twitches in its sleep.

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

const SQUIRRELS: Record<SquirrelCoat, { coat: number; tail: number; belly: number; tuft: number }> =
  {
    red: { coat: 0xb85a2a, tail: 0xc8683a, belly: 0xf0dcc0, tuft: 0x8a3a1a },
    grey: { coat: 0x8a8680, tail: 0x9e9890, belly: 0xece6dc, tuft: 0x5a5650 },
  }

export function drawPet(ctx: Ctx) {
  const pet = ctx.layout.pet
  if (pet.kind === 'cat' || pet.kind === 'squirrel') {
    // curled up on the duvet
    const top = ctx.layout.bed.style === 'platform' ? 30 : 46
    const spot: P3 =
      ctx.layout.bed.spot === 'right' ? [ctx.plan.half - 56, top + 8, 300] : [20, top + 8, 320]
    if (pet.kind === 'cat') cat(ctx, pet.breed, spot)
    else squirrel(ctx, pet.breed, spot)
  } else if (pet.kind === 'dog') dog(ctx, pet.breed, [0, 0, 150], true)
  else if (pet.kind === 'raccoon') raccoon(ctx, [0, 0, 150], true)
}

/**
 * A pet anywhere: on a seat, by someone's feet. `p` is where it lies; dogs
 * can bring their cushion along.
 */
export function drawPetAt(ctx: Ctx, pet: Pet, p: P3, opts: { cushion?: boolean } = {}) {
  if (pet.kind === 'cat') cat(ctx, pet.breed, p)
  else if (pet.kind === 'dog') dog(ctx, pet.breed, p, opts.cushion ?? false)
  else if (pet.kind === 'squirrel') squirrel(ctx, pet.breed, p)
  else if (pet.kind === 'raccoon') raccoon(ctx, p, opts.cushion ?? false)
}

/** a cat asleep in a ring */
function cat(ctx: Ctx, breed: CatBreed, p: P3) {
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

/** a cushion on the floor for a dog or a raccoon to sleep on */
function floorCushion(ctx: Ctx, x: number, y: number, s: number) {
  const bed = ctx.layer('pet')
  const fabric = shade(0x8a4a3a, 0.1)
  bed
    .ellipse(x, y - 4 * s, 60 * s, 16 * s)
    .fill(shade(fabric, -0.25))
    .stroke(THIN)
  bed.ellipse(x, y - 9 * s, 52 * s, 11 * s).fill(fabric)
  bed.ellipse(x, y - 9 * s, 40 * s, 7 * s).fill(shade(fabric, 0.12))
}

/** a point along a quadratic curve, for laying things out along a tail */
function along(t: number, a: number[], b: number[], c: number[]): [number, number] {
  const u = 1 - t
  return [
    u * u * a[0]! + 2 * u * t * b[0]! + t * t * c[0]!,
    u * u * a[1]! + 2 * u * t * b[1]! + t * t * c[1]!,
  ]
}

/** a squirrel asleep in a ball, its big tail pulled up over its back */
function squirrel(ctx: Ctx, coat: SquirrelCoat, p: P3) {
  const { x, y, s } = at(p)
  const look = SQUIRRELS[coat]
  const k = s * 0.95
  const pet = ctx.live(ctx.container('pet'))
  const tail = new Graphics()
  const body = new Graphics()
  pet.addChild(tail, body)
  // the tail: a plume of fluff from its rump, up and over towards its head
  const a = [10, 4]
  const b = [22, -22]
  const c = [-6, -20]
  for (let i = 0; i <= 10; i++) {
    const [tx, ty] = along(i / 10, a, b, c)
    tail.circle(tx * k, ty * k, (5 + i * 0.45) * k).fill(look.tail)
  }
  for (let i = 2; i <= 10; i += 2) {
    const [tx, ty] = along(i / 10, a, b, c)
    tail.circle(tx * k - 2 * k, ty * k - 2 * k, (2 + i * 0.25) * k).fill(shade(look.tail, 0.12))
  }
  // body and a pale belly
  body.ellipse(0, 0, 15 * k, 9 * k).fill(look.coat)
  body.ellipse(-5 * k, 4 * k, 8 * k, 4 * k).fill(look.belly)
  // head tucked down, with tufted ears
  const hx = -13 * k
  const hy = -1 * k
  body.ellipse(hx, hy, 7.5 * k, 6.5 * k).fill(look.coat)
  body.ellipse(hx - 3 * k, hy + 2.5 * k, 3.5 * k, 2.5 * k).fill(look.belly)
  body
    .poly([hx - 1 * k, hy - 5 * k, hx + 1 * k, hy - 12 * k, hx + 4 * k, hy - 4 * k])
    .fill(look.coat)
  body
    .moveTo(hx + 1 * k, hy - 12 * k)
    .lineTo(hx + 0.5 * k, hy - 14 * k)
    .stroke({ color: look.tuft, width: 1.5 * k, cap: 'round' })
  // a closed eye and a little nose
  body
    .moveTo(hx - 3 * k, hy - 1.5 * k)
    .quadraticCurveTo(hx - 1.5 * k, hy - 0.5 * k, hx, hy - 1.5 * k)
    .stroke({ color: 0x1a1210, width: 0.9 })
  body.circle(hx - 7 * k, hy + 1.5 * k, 1 * k).fill(0x2a1a14)
  // paws folded under its chin
  body.ellipse(hx + 3 * k, hy + 6 * k, 3 * k, 2 * k).fill(shade(look.coat, -0.1))
  pet.position.set(x, y - 7 * k)
  ctx.anim.push((t) => {
    body.scale.set(1, 1 + Math.sin(t * 2.2) * 0.05)
    // a twitch of the tail every so often
    const w = t % 5
    tail.rotation = w < 0.4 ? Math.sin(w * 30) * 0.04 : 0
  })
  ctx.hit('pet', (h) => h.ellipse(x, y - 12 * k, 26 * k, 20 * k))
}

/** a raccoon curled up nose to tail, mask and all */
function raccoon(ctx: Ctx, spot: P3, withCushion: boolean) {
  const { x, y, s } = at(spot)
  const k = s * 1.05
  if (withCushion) floorCushion(ctx, x, y, s)
  const body = ctx.live(ctx.container('pet')).addChild(new Graphics())
  const coat = 0x7e7872
  const dark = 0x2e2a28
  const pale = 0xe6e0d8
  // body, with a darker back
  body.ellipse(0, 0, 25 * k, 12 * k).fill(coat)
  body.ellipse(3 * k, -6 * k, 18 * k, 5 * k).fill(shade(coat, -0.18))
  // the ringed tail, wrapped round the front
  const a = [22, 2]
  const b = [18, 16]
  const c = [-10, 11]
  for (let i = 0; i <= 12; i++) {
    const [tx, ty] = along(i / 12, a, b, c)
    const ring = Math.floor(i / 2) % 2 === 0
    body.circle(tx * k, ty * k, (5.5 - i * 0.12) * k).fill(ring ? dark : shade(coat, 0.15))
  }
  // head resting on the tail
  const hx = -18 * k
  const hy = -3 * k
  body.circle(hx + 6 * k, hy - 8 * k, 3.5 * k).fill(coat)
  body.circle(hx - 4 * k, hy - 8 * k, 3.5 * k).fill(coat)
  body.circle(hx + 6 * k, hy - 8 * k, 2 * k).fill(pale)
  body.circle(hx - 4 * k, hy - 8 * k, 2 * k).fill(pale)
  body.ellipse(hx, hy, 10 * k, 8 * k).fill(shade(coat, 0.1))
  body.ellipse(hx - 2 * k, hy + 1 * k, 8 * k, 5 * k).fill(pale)
  // the bandit mask, eyes shut behind it
  body.ellipse(hx - 2 * k, hy - 1 * k, 8.5 * k, 2.8 * k).fill(dark)
  body
    .moveTo(hx - 7 * k, hy - 1 * k)
    .lineTo(hx - 4 * k, hy - 0.5 * k)
    .moveTo(hx + 0 * k, hy - 1 * k)
    .lineTo(hx + 3 * k, hy - 0.5 * k)
    .stroke({ color: pale, width: 0.9 })
  // a pointed nose
  body.poly([hx - 8 * k, hy + 1 * k, hx - 13 * k, hy + 3 * k, hx - 8 * k, hy + 5 * k]).fill(pale)
  body.circle(hx - 13 * k, hy + 3 * k, 1.4 * k).fill(dark)
  body.position.set(x, y - (withCushion ? 12 : 4) * s)
  ctx.anim.push((t) => body.scale.set(1, 1 + Math.sin(t * 1.3) * 0.04))
  ctx.hit('pet', (h) => h.ellipse(x, y - 10 * s, 40 * k, 20 * k))
}

/** a dog stretched out (on its cushion, if it brought it), head on its paws */
function dog(ctx: Ctx, breed: DogBreed, spot: P3, withCushion: boolean) {
  const look = DOGS[breed]
  const { x, y, s } = at(spot)
  const k = s * 0.9 * look.size
  if (withCushion) floorCushion(ctx, x, y, s)

  const pup = ctx.live(ctx.container('pet'))
  const tail = new Graphics()
  const body = new Graphics()
  pup.addChild(tail, body)
  pup.position.set(x, y - (withCushion ? 12 : 2) * s)
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
