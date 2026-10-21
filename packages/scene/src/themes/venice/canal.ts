import { Container, Graphics, Sprite } from 'pixi.js'
import { CURB, GROUND, WORLD } from '../../layout'
import { palette } from '../../palette'
import { createRng, pick, range } from '../../rng'
import { glowTexture } from '../../textures'
import { vn } from './parts'

const WATER_BOTTOM = WORLD.height + 700

/** the fondamenta (stone walkway) along the houses and the canal in front */
interface Ripple {
  g: Graphics
  y: number
  speed: number
  phase: number
}

interface Glint {
  s: Sprite
  speed: number
  phase: number
}

export class Canal extends Container {
  private ripples: Ripple[] = []
  private glints: Glint[] = []

  constructor(seed: number) {
    super()
    const rng = createRng(seed)
    const g = new Graphics()
    // big grey trachyte slabs, istrian stone edge
    g.rect(-500, GROUND, WORLD.width + 1000, CURB - GROUND).fill(0x1c1814)
    for (let x = -500; x < WORLD.width + 500; x += 70)
      g.rect(x + (Math.floor(x / 70) % 2) * 20, GROUND, 2, CURB - GROUND).fill({
        color: palette.ink,
        alpha: 0.6,
      })
    g.rect(-500, GROUND + 24, WORLD.width + 1000, 1.5).fill({ color: palette.ink, alpha: 0.5 })
    g.rect(-500, CURB - 8, WORLD.width + 1000, 8).fill(vn.istria)
    g.rect(-500, CURB, WORLD.width + 1000, 12).fill(0x14100c)
    // the water
    g.rect(-500, CURB + 12, WORLD.width + 1000, WATER_BOTTOM - CURB).fill(vn.water)
    // algae line where the tide sits on the stone
    g.rect(-500, CURB + 4, WORLD.width + 1000, 6).fill({ color: 0x1a2a18, alpha: 0.8 })
    this.addChild(g)

    // lots of short ripples, drifting with the current and bobbing on the swell
    for (let i = 0; i < 90; i++) {
      const g = new Graphics()
      const w = range(rng, 30, 160)
      const y = range(rng, CURB + 16, CURB + 280)
      // nearer the viewer, the ripples get longer and brighter
      const near = (y - CURB) / 280
      g.moveTo(0, 0)
        .quadraticCurveTo(w / 2, -2.5, w, 0)
        .stroke({ color: 0x4a5a78, width: 1.2 + near, alpha: range(rng, 0.25, 0.6) })
      g.position.set(range(rng, -400, WORLD.width + 400), y)
      this.addChild(g)
      this.ripples.push({ g, y, speed: range(rng, 8, 22) * (0.6 + near), phase: rng() * 10 })
    }
    // warm glints where the windows and lanterns land on the water
    for (let i = 0; i < 46; i++) {
      const s = new Sprite(glowTexture())
      s.anchor.set(0.5)
      s.position.set(range(rng, -200, WORLD.width + 200), range(rng, CURB + 20, CURB + 240))
      s.scale.set(range(rng, 0.08, 0.2), range(rng, 0.02, 0.04))
      s.tint = pick(rng, [0xffb84a, 0xff8a3a, 0xffd890])
      s.blendMode = 'add'
      this.addChild(s)
      this.glints.push({ s, speed: range(rng, 6, 16), phase: rng() * 10 })
    }
  }

  update(time: number, dt: number) {
    for (const r of this.ripples) {
      r.g.x += r.speed * dt
      r.g.y = r.y + Math.sin(time * 1.3 + r.phase) * 2.5
      r.g.scale.x = 0.8 + Math.sin(time * 0.9 + r.phase) * 0.2
      if (r.g.x > WORLD.width + 400) r.g.x = -400
    }
    for (const gl of this.glints) {
      gl.s.x += gl.speed * dt
      if (gl.s.x > WORLD.width + 200) gl.s.x = -200
      gl.s.alpha = Math.max(0, Math.sin(time * 2.2 + gl.phase)) * 0.7
    }
  }
}

/** striped mooring poles with gilded tops, standing in the water */
export function mooringPoles(xs: number[], stripes: number[]) {
  const g = new Graphics()
  xs.forEach((x, i) => {
    const colour = stripes[i % stripes.length]!
    const top = GROUND - 140
    const bottom = CURB + 200
    g.rect(x - 7, top, 14, bottom - top).fill(0xe8dcc8)
    for (let sy = top + 10; sy < CURB; sy += 26)
      g.poly([x - 7, sy, x + 7, sy - 10, x + 7, sy + 4, x - 7, sy + 14]).fill(colour)
    g.rect(x - 7, CURB - 10, 14, bottom - CURB + 10).fill({ color: 0x1a120e, alpha: 0.7 })
    g.ellipse(x, top - 2, 10, 5).fill(0xd9a54a)
    g.circle(x, top - 8, 6).fill(0xd9a54a)
  })
  return g
}

/**
 * A gondola sliding along the canal with the gondolier rowing at the back.
 * Draws its own dim upside-down reflection on the water.
 */
export class Gondola extends Container {
  private boat = new Container()
  private reflection = new Container()
  private oar = new Graphics()
  private oarReflection = new Graphics()
  private lantern = new Sprite(glowTexture())
  private x0: number
  private speed: number
  private phase = 0

  /** negative speed rows the other way */
  constructor(
    private waterline: number,
    opts: { speed?: number; start?: number; scale?: number } = {},
  ) {
    super()
    this.speed = opts.speed ?? 54
    this.x0 = opts.start ?? 380
    this.scale.set(opts.scale ?? 1)
    const dir = Math.sign(this.speed) || 1
    this.boat.scale.x = dir
    this.reflection.scale.x = dir
    this.reflection.addChild(this.drawBoat(new Graphics()), this.oarReflection)
    this.reflection.scale.y = -0.55
    this.reflection.alpha = 0.25
    this.boat.addChild(this.drawBoat(new Graphics()), this.oar)
    this.lantern.anchor.set(0.5)
    this.lantern.scale.set(0.35)
    this.lantern.tint = 0xffb84a
    this.lantern.blendMode = 'add'
    this.addChild(this.reflection, this.boat, this.lantern)
  }

  private drawBoat(g: Graphics) {
    const ink = palette.ink
    // long black hull, curling up at both ends; facing right
    g.moveTo(-250, -40)
      .quadraticCurveTo(-240, -6, -180, -2)
      .lineTo(170, -2)
      .quadraticCurveTo(240, -8, 262, -58)
      .lineTo(254, -60)
      .quadraticCurveTo(228, -24, 170, -20)
      .lineTo(-170, -20)
      .quadraticCurveTo(-226, -22, -244, -46)
      .closePath()
      .fill(ink)
    // the ferro: the comb on the prow
    g.rect(252, -98, 6, 42).fill(0xc8c0b0)
    for (let i = 0; i < 6; i++) g.rect(240, -96 + i * 7, 16, 3).fill(0xc8c0b0)
    g.rect(250, -104, 12, 6).fill(0xc8c0b0)
    // couple on the seat in the middle
    g.rect(-40, -34, 90, 14).fill(0x5a1410)
    g.circle(-10, -52, 8).circle(14, -50, 8).fill(ink)
    g.rect(-20, -44, 20, 22).fill(ink)
    g.rect(4, -42, 20, 22).fill(0xb3261a)
    // gondolier at the stern, straw hat, striped shirt
    g.rect(-212, -110, 16, 70).fill(ink)
    for (let s = 0; s < 4; s++) g.rect(-212, -106 + s * 10, 16, 4).fill(0xe8dcc8)
    g.circle(-204, -122, 9).fill(ink)
    g.ellipse(-204, -130, 17, 4).fill(0xc8a050)
    g.rect(-211, -138, 14, 8).fill(0xc8a050)
    g.rect(-212, -42, 6, 4).rect(-200, -42, 6, 4).fill(ink)
    return g
  }

  update(dt: number, time: number) {
    this.x0 += this.speed * dt
    const reach = (WORLD.width + 900) / this.scale.x
    if (this.speed > 0 && this.x0 > reach) this.x0 = -900
    if (this.speed < 0 && this.x0 < -900) this.x0 = reach
    const bob = Math.sin(time * 1.4) * 2
    const line = this.waterline / this.scale.y
    this.boat.position.set(this.x0, line + bob)
    this.reflection.position.set(this.x0, line + 4 - bob * 0.5)
    // the long stroke: blade forward, push back, lift and recover
    this.phase += dt * 0.9
    const sweep = Math.sin(this.phase * Math.PI)
    const blade = { x: -250 + sweep * 40, y: 26 - Math.max(0, -sweep) * 20 }
    for (const o of [this.oar, this.oarReflection]) {
      o.clear().moveTo(-190, -94).lineTo(blade.x, blade.y).stroke({ color: palette.ink, width: 3 })
      o.ellipse(blade.x, blade.y, 5, 10).fill(palette.ink)
    }
    this.lantern.position.set(this.x0 + 236 * this.boat.scale.x, line - 70 + bob)
    this.lantern.alpha = 0.75 + Math.sin(time * 6) * 0.04
  }
}
