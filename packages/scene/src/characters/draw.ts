import { Container, Graphics } from 'pixi.js'
import { palette } from '../palette'
import { shade } from '../room/paint'
import {
  CLOTH_COLOURS,
  HAIR_COLOURS,
  SKINS,
  type Accessory,
  type Avatar,
  type Bottom,
  type Top,
} from './avatar'

/**
 * How someone is posed. Drawn flat like the passers-by on the street, origin
 * at the feet for `stand`, at the seat for `sit` and `floor`, about 300 units
 * tall standing, facing the viewer. Scale it to the room yourself.
 */
export type Pose = 'stand' | 'sit' | 'floor'

export interface CharacterOptions {
  pose?: Pose
  /** turn a little to one side; 0 faces straight out */
  turn?: -1 | 0 | 1
  /** something that moves (breathing, blinking): register it here */
  animate?: (tick: (t: number) => void) => void
}

// The same people who walk past on the street (layers/people.ts), come
// indoors: flat cut-out shapes, no outlines, the far arm and leg a shade
// darker, ink for shoes and little details. Same measurements too -- hips at
// 130, shoulders at 232, a small round head -- so a friend in a room is the
// same kind of person as a stranger outside. The only additions are a face
// (two dots and a mouth) and somewhere to sit.

const INK = palette.ink
const FAR = 0xb0a0a0
const GOLD = 0xd8a040

/** where the body is for each pose */
interface Frame {
  hip: number
  shoulder: number
}

const HIP_TO_SHOULDER = 102

const FRAMES: Record<Pose, Frame> = {
  stand: { hip: -130, shoulder: -232 },
  // on a seat: hips at the origin, feet on the floor at +80
  sit: { hip: 0, shoulder: -HIP_TO_SHOULDER },
  // cross-legged on the floor
  floor: { hip: -16, shoulder: -16 - HIP_TO_SHOULDER },
}

/** how each top is cut: where the hem falls (below the hips) and how much it flares */
const CUTS: Record<Top, { hem: number; flare: number }> = {
  sweater: { hem: 6, flare: 3 },
  tee: { hem: 2, flare: 1 },
  cardigan: { hem: 30, flare: 7 },
  hoodie: { hem: 8, flare: 2 },
}

type Prop = 'mug' | 'book' | 'bag' | 'none'

/** a little something each person has with them, the way the street has baguettes and briefcases */
function propFor(pose: Pose, n: number): Prop {
  const r = n % 10
  if (pose === 'stand') return r < 2 ? 'bag' : r < 4 ? 'mug' : 'none'
  return r < 4 ? 'mug' : r < 6 ? 'book' : 'none'
}

function hash(a: Avatar) {
  const s = JSON.stringify(a)
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

export function drawCharacter(avatar: Avatar, options: CharacterOptions = {}): Container {
  const pose = options.pose ?? 'stand'
  const turn = options.turn ?? 0
  const f = FRAMES[pose]
  const n = hash(avatar)
  const skin = SKINS[avatar.skin] ?? SKINS[5]
  const hair = HAIR_COLOURS[avatar.hairColour] ?? HAIR_COLOURS[1]
  const coat = CLOTH_COLOURS[avatar.topColour] ?? CLOTH_COLOURS[0]
  const legs = CLOTH_COLOURS[avatar.bottomColour] ?? CLOTH_COLOURS[3]
  const has = (a: Accessory) => avatar.accessories.includes(a)
  const knit = CLOTH_COLOURS[(avatar.topColour + 4) % CLOTH_COLOURS.length]!
  const wool = CLOTH_COLOURS[(avatar.topColour + 7) % CLOTH_COLOURS.length]!

  const root = new Container()
  const farLimbs = new Graphics()
  const lower = new Graphics()
  const upper = new Container()
  const back = new Graphics()
  const body = new Graphics()
  const head = new Container()
  const face = new Graphics()
  const eyes = new Graphics()
  const shut = new Graphics()
  const hat = new Graphics()
  const nearArm = new Graphics()
  farLimbs.tint = FAR

  root.addChild(farLimbs, lower, upper)
  upper.addChild(back, body, head, nearArm)
  head.addChild(face, eyes, shut, hat)
  upper.pivot.set(0, f.hip)
  upper.position.set(0, f.hip)
  // turning shifts the face a touch towards where they're looking
  head.x = turn * 2

  drawLegs(farLimbs, lower, pose, avatar.bottom, legs, skin, f, n)
  drawCoat(
    body,
    back,
    avatar.top,
    coat,
    skin,
    f,
    has('scarf') ? wool : null,
    has('necklace'),
    pose !== 'stand',
  )
  drawArms(farLimbs, nearArm, pose, avatar.top, coat, skin, f, propFor(pose, n), n)

  const hy = f.shoulder - 22
  drawHead(face, eyes, shut, back, avatar, skin, hair, hy)
  drawHat(hat, avatar, hair, knit, hy)
  if (has('glasses'))
    hat
      .circle(-5, hy + 2, 4)
      .circle(5, hy + 2, 4)
      .moveTo(-1, hy + 2)
      .lineTo(1, hy + 2)
      .stroke({ color: INK, width: 1.5 })
  if (has('earrings'))
    hat
      .circle(-14, hy + 6, 1.8)
      .circle(14, hy + 6, 1.8)
      .fill(GOLD)
  if (has('headphones')) {
    const top = has('beanie') ? hy - 22 : hy - 18
    hat
      .moveTo(-15, hy)
      .bezierCurveTo(-15, top - 6, 15, top - 6, 15, hy)
      .stroke({ color: 0x2a2a30, width: 3 })
    hat
      .roundRect(-19, hy - 5, 7, 12, 3)
      .roundRect(12, hy - 5, 7, 12, 3)
      .fill(0xb03a1e)
  }

  shut.visible = false
  const phase = (n % 1000) / 100
  options.animate?.((t) => {
    // a slow breath, and a blink every few seconds
    upper.scale.y = 1 + Math.sin(t * 1.5 + phase) * 0.01
    if (avatar.face !== 'sleepy') {
      const blink = (t + phase) % 4.4 < 0.13
      eyes.visible = !blink
      shut.visible = blink
    }
  })
  return root
}

// legs ------------------------------------------------------------------------

function drawLegs(
  far: Graphics,
  near: Graphics,
  pose: Pose,
  kind: Bottom,
  colour: number,
  skin: number,
  f: Frame,
  n: number,
) {
  const bare = kind === 'skirt' || kind === 'shorts'
  // bare legs get boots or dark tights now and then, like the street
  const boots = bare && n % 3 === 0 ? 0x1a100c : null
  const leg = bare ? (n % 4 === 1 ? 0x2a160e : skin) : colour
  const flare = kind === 'trousers' ? 9 : 0

  if (pose === 'stand') {
    for (const [g, x] of [
      [far, 6],
      [near, -6],
    ] as const) {
      g.poly([x - 7, f.hip, x + 7, f.hip, x + 7 + flare, 0, x - 7 - flare, 0]).fill(leg)
      if (kind === 'jeans') g.rect(x - 7, -12, 14, 6).fill(shade(colour, 0.22))
      if (boots) g.poly([x - 7, -56, x + 7, -56, x + 8, 0, x - 8, 0]).fill(boots)
      g.ellipse(x + 5, 0, 11, 4).fill(INK)
    }
    if (kind === 'skirt')
      near.poly([-17, f.hip - 8, 17, f.hip - 8, 26, f.hip + 56, -26, f.hip + 56]).fill(colour)
    if (kind === 'shorts') {
      near.poly([-14, f.hip - 6, 14, f.hip - 6, 15, f.hip + 32, -15, f.hip + 32]).fill(colour)
      near.rect(-1, f.hip + 6, 2, 26).fill({ color: INK, alpha: 0.3 })
    }
    return
  }

  if (pose === 'sit') {
    // shins down from the seat edge, thighs coming towards you
    for (const [g, x] of [
      [far, 8],
      [near, -8],
    ] as const) {
      g.poly([x - 7, 14, x + 7, 14, x + 7 + flare * 0.6, 80, x - 7 - flare * 0.6, 80]).fill(leg)
      if (boots) g.poly([x - 7, 36, x + 7, 36, x + 8, 80, x - 8, 80]).fill(boots)
      if (kind === 'jeans') g.rect(x - 7, 70, 14, 5).fill(shade(colour, 0.22))
      g.ellipse(x + 2, 80, 10, 4).fill(INK)
      // the thigh, end on, and the knee nearest you
      g.roundRect(x - 9, -4, 18, 22, 7).fill(bare ? leg : colour)
      g.ellipse(x, 13, 7, 4).fill({ color: 0xffffff, alpha: 0.1 })
    }
    if (kind === 'skirt') near.poly([-20, -6, 20, -6, 25, 22, -25, 22]).fill(colour)
    if (kind === 'shorts') near.roundRect(-17, -4, 34, 12, 4).fill(colour)
    return
  }

  // cross-legged: knees out, shins crossed in front
  for (const [g, s] of [
    [far, 1],
    [near, -1],
  ] as const) {
    g.poly([s * 2, f.hip - 4, s * 16, f.hip - 6, s * 40, -10, s * 38, 0, s * 4, f.hip + 8]).fill(
      bare ? leg : colour,
    )
    g.poly([s * 40, -10, s * 38, 0, -s * 14, 0, -s * 12, -9]).fill(bare ? leg : colour)
    g.ellipse(-s * 16, -2, 8, 3.5).fill(INK)
  }
  if (kind === 'skirt') near.poly([-18, f.hip - 8, 18, f.hip - 8, 40, -4, -40, -4]).fill(colour)
  if (kind === 'shorts')
    near.poly([-16, f.hip - 6, 16, f.hip - 6, 22, f.hip + 6, -22, f.hip + 6]).fill(colour)
}

// the top ---------------------------------------------------------------------

function drawCoat(
  g: Graphics,
  back: Graphics,
  kind: Top,
  colour: number,
  skin: number,
  f: Frame,
  scarf: number | null,
  necklace: boolean,
  seated: boolean,
) {
  const s = f.shoulder
  const cut = CUTS[kind]
  // sitting down, the hem rides up so you can see the lap
  const hem = f.hip + (seated ? Math.min(cut.hem, 0) - 2 : cut.hem)
  if (kind === 'hoodie') back.ellipse(0, s - 2, 17, 8).fill(shade(colour, -0.2))
  // the neck
  g.rect(-4, s - 12, 8, 14).fill(skin)
  g.poly([-17, s, 17, s, 18 + cut.flare, hem, -18 - cut.flare, hem]).fill(colour)
  // the seam down the middle, as on the street
  if (kind !== 'cardigan') g.rect(-1, s + 6, 2, hem - s - 6).fill({ color: INK, alpha: 0.18 })

  switch (kind) {
    case 'sweater':
      // turtleneck, and the ribbing at the hem
      g.rect(-6, s - 6, 12, 8).fill(shade(colour, -0.15))
      g.rect(-18 - cut.flare, hem - 7, 36 + cut.flare * 2, 7).fill(shade(colour, -0.15))
      break
    case 'tee':
      g.moveTo(-6, s)
        .quadraticCurveTo(0, s + 6, 6, s)
        .stroke({ color: shade(colour, -0.3), width: 1.5 })
      break
    case 'cardigan':
      // open over a cream top, a couple of buttons
      g.poly([-6, s, 6, s, 5, hem - 26, -5, hem - 26]).fill(0xe8d8c0)
      g.rect(-7, s + 2, 1.5, hem - s - 2).fill({ color: INK, alpha: 0.35 })
      g.circle(-10, s + 26, 1.6)
        .circle(-10, s + 44, 1.6)
        .fill(0xe8d8c0)
      break
    case 'hoodie':
      g.rect(-4, s + 2, 1.5, 22)
        .rect(3, s + 2, 1.5, 22)
        .fill(0xe8d8c0)
      g.rect(-12, hem - 26, 24, 16).fill({ color: INK, alpha: 0.18 })
      break
  }
  if (kind !== 'cardigan') g.rect(-17, f.hip - 20, 34, 3).fill({ color: INK, alpha: 0.2 })
  if (necklace) {
    g.moveTo(-5, s + 1)
      .quadraticCurveTo(0, s + 12, 5, s + 1)
      .stroke({ color: GOLD, width: 1.2 })
    g.circle(0, s + 8, 1.6).fill(GOLD)
  }
  if (scarf !== null) {
    g.rect(-14, s - 4, 28, 9).fill(scarf)
    g.rect(4, s + 2, 8, 40).fill(scarf)
  }
}

function drawArms(
  far: Graphics,
  near: Graphics,
  pose: Pose,
  kind: Top,
  colour: number,
  skin: number,
  f: Frame,
  prop: Prop,
  n: number,
) {
  const s = f.shoulder + 8
  const short = kind === 'tee'
  const sleeve = (g: Graphics, pts: [number, number][]) => {
    // a sleeve is a fat line in the top's colour; a tee's stops halfway
    g.moveTo(...pts[0]!)
    for (const p of pts.slice(1)) g.lineTo(...p)
    g.stroke({ color: short ? skin : colour, width: 11, cap: 'round', join: 'round' })
    if (short) {
      const [a, b] = [pts[0]!, pts[1]!]
      g.moveTo(...a)
        .lineTo(a[0] + (b[0] - a[0]) * 0.45, a[1] + (b[1] - a[1]) * 0.45)
        .stroke({ color: colour, width: 13, cap: 'round' })
    }
    const hand = pts[pts.length - 1]!
    g.circle(hand[0], hand[1] + 2, 5).fill(skin)
    return hand
  }

  for (const side of [1, -1] as const) {
    const g = side > 0 ? far : near
    let hand: [number, number]
    if (pose === 'stand') {
      hand = sleeve(g, [
        [side * 19, s],
        [side * 21, s + 92],
      ])
    } else if (pose === 'sit') {
      // forearms resting in the lap
      hand = sleeve(g, [
        [side * 19, s],
        [side * 22, s + 56],
        [side * 6, f.hip + 2],
      ])
    } else {
      // hands on the knees
      hand = sleeve(g, [
        [side * 19, s],
        [side * 24, s + 54],
        [side * 34, f.hip + 4],
      ])
    }
    // the near hand holds whatever they've got with them
    if (side < 0) holding(near, prop, hand, pose, n)
  }
}

function holding(g: Graphics, prop: Prop, [x, y]: [number, number], pose: Pose, n: number) {
  switch (prop) {
    case 'mug': {
      const c = [0xe8d8c0, 0xc0301e, 0x2f6b66, 0xe8c25a][n % 4]!
      const mx = pose === 'stand' ? x : x + 4
      const my = pose === 'stand' ? y - 4 : y - 6
      g.roundRect(mx - 5, my - 9, 10, 11, 2).fill(c)
      g.circle(mx + 6, my - 4, 3).stroke({ color: c, width: 1.6 })
      break
    }
    case 'book':
      g.rect(x - 9, y - 6, 18, 12).fill([0x2a4a8a, 0x8a1a14, 0x3a5a3a][n % 3]!)
      g.rect(x - 1, y - 6, 2, 12).fill({ color: INK, alpha: 0.4 })
      break
    case 'bag':
      g.roundRect(x - 10, y + 4, 20, 22, 3).fill([0xb03a1e, 0xe8d8c0, 0x3a2418][n % 3]!)
      g.rect(x - 1, y - 6, 2, 12).fill(INK)
      break
  }
}

// the head --------------------------------------------------------------------

function headSize(shape: Avatar['faceShape']) {
  return shape === 'oval'
    ? { rx: 13, ry: 15 }
    : shape === 'long'
      ? { rx: 12, ry: 16 }
      : { rx: 14, ry: 14 }
}

function drawHead(
  g: Graphics,
  eyes: Graphics,
  shut: Graphics,
  back: Graphics,
  a: Avatar,
  skin: number,
  hair: number,
  hy: number,
) {
  const { rx, ry } = headSize(a.faceShape)
  // hair that falls behind the head goes in first
  switch (a.hair) {
    case 'long':
      back.poly([-13, hy - 6, 13, hy - 6, 15, hy + 36, -15, hy + 36]).fill(hair)
      break
    case 'bob':
      back.roundRect(-17, hy - 12, 34, 26, 8).fill(hair)
      break
    case 'afro':
      back.circle(0, hy - 6, 22).fill(hair)
      break
    case 'curly':
      for (const [x, y] of [
        [-15, hy - 2],
        [15, hy - 2],
        [-14, hy + 8],
        [14, hy + 8],
      ] as const)
        back.circle(x, y, 7).fill(hair)
      break
    case 'braids':
      for (const s of [-1, 1])
        for (let i = 0; i < 5; i++) back.circle(s * 14, hy + 4 + i * 8, 4).fill(hair)
      break
  }
  g.ellipse(0, hy, rx, ry).fill(skin)

  // a face, kept as small as the rest: two dots and a mouth
  const ink = { color: INK, width: 1.3, cap: 'round' as const }
  const closed = (d: Graphics) =>
    d
      .moveTo(-7, hy + 2)
      .lineTo(-3, hy + 2)
      .moveTo(3, hy + 2)
      .lineTo(7, hy + 2)
      .stroke(ink)
  if (a.face === 'sleepy') {
    closed(eyes)
  } else {
    eyes
      .circle(-5, hy + 2, 1.5)
      .circle(5, hy + 2, 1.5)
      .fill(INK)
    closed(shut)
  }
  if (a.face === 'grin') g.ellipse(0, hy + 8, 3, 2).fill(0x5a1a1a)
  else
    g.moveTo(-2.5, hy + 7)
      .quadraticCurveTo(0, hy + (a.face === 'sleepy' ? 8 : 9.5), 2.5, hy + 7)
      .stroke(ink)
  if (a.face === 'freckles')
    g.circle(-8, hy + 5, 0.8)
      .circle(-6, hy + 6, 0.8)
      .circle(6, hy + 6, 0.8)
      .circle(8, hy + 5, 0.8)
      .fill(shade(skin, -0.4))
  else
    g.circle(-8, hy + 5, 2.4)
      .circle(8, hy + 5, 2.4)
      .fill({ color: 0xd85a4a, alpha: 0.3 })
}

/** hair on top, and hats, which on the street are half of who someone is */
function drawHat(g: Graphics, a: Avatar, hair: number, knit: number, hy: number) {
  const beanie = a.accessories.includes('beanie')
  switch (a.hair) {
    case 'bun':
      g.ellipse(0, hy - 9, 15, 8).fill(hair)
      if (!beanie) g.circle(0, hy - 20, 9).fill(hair)
      break
    case 'afro':
      if (!beanie) g.ellipse(0, hy - 10, 13, 5).fill(hair)
      break
    case 'buzz':
      g.ellipse(0, hy - 9, 14, 7).fill({ color: hair, alpha: 0.8 })
      break
    case 'curly':
      for (let i = -2; i <= 2; i++) g.circle(i * 6, hy - 10 + Math.abs(i) * 2, 6).fill(hair)
      break
    case 'bob':
      g.ellipse(0, hy - 9, 16, 8).fill(hair)
      g.rect(-14, hy - 8, 28, 5).fill(hair)
      break
    case 'braids':
      g.ellipse(0, hy - 9, 15, 8).fill(hair)
      g.rect(-0.5, hy - 15, 1, 8).fill({ color: INK, alpha: 0.3 })
      break
    case 'long':
      g.ellipse(0, hy - 9, 15, 8).fill(hair)
      break
    default:
      g.ellipse(0, hy - 9, 14, 8).fill(hair)
      // a little swept fringe
      g.poly([-12, hy - 6, 4, hy - 9, -2, hy - 3]).fill(hair)
  }
  if (beanie) {
    g.ellipse(0, hy - 10, 15, 9).fill(knit)
    g.rect(-15, hy - 8, 30, 5).fill(shade(knit, -0.18))
    g.circle(0, hy - 20, 4).fill(shade(knit, 0.3))
  }
}
