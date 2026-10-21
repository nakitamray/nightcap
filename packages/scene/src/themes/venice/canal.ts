import { Container, Graphics, Sprite } from 'pixi.js'
import { CURB, GROUND, WORLD } from '../../layout'
import { palette } from '../../palette'
import { createRng, range } from '../../rng'
import { glowTexture } from '../../textures'
import { vn } from './parts'

const WATER_BOTTOM = WORLD.height + 700

/** the fondamenta (stone walkway) along the houses and the canal in front */
export class Canal extends Container {
  private ripples: Graphics[] = []

  constructor(seed: number) {
    super()
    const rng = createRng(seed)
    const g = new Graphics()
    // big grey trachyte slabs, istrian stone edge
    g.rect(-500, GROUND, WORLD.width + 1000, CURB - GROUND).fill(0x1c1814)
    for (let x = -500; x < WORLD.width + 500; x += 70) g.rect(x + (Math.floor(x / 70) % 2) * 20, GROUND, 2, CURB - GROUND).fill({ color: palette.ink, alpha: 0.6 })
    g.rect(-500, GROUND + 24, WORLD.width + 1000, 1.5).fill({ color: palette.ink, alpha: 0.5 })
    g.rect(-500, CURB - 8, WORLD.width + 1000, 8).fill(vn.istria)
    g.rect(-500, CURB, WORLD.width + 1000, 12).fill(0x14100c)
    // the water
    g.rect(-500, CURB + 12, WORLD.width + 1000, WATER_BOTTOM - CURB).fill(vn.water)
    // algae line where the tide sits on the stone
    g.rect(-500, CURB + 4, WORLD.width + 1000, 6).fill({ color: 0x1a2a18, alpha: 0.8 })
    this.addChild(g)

    // a few long horizontal ripple lines that drift
    for (let i = 0; i < 26; i++) {
      const r = new Graphics()
      const w = range(rng, 60, 240)
      r.rect(0, 0, w, 1.5).fill({ color: 0x3a4a60, alpha: range(rng, 0.25, 0.55) })
      r.position.set(range(rng, -400, WORLD.width + 400), range(rng, CURB + 20, CURB + 260))
      this.addChild(r)
      this.ripples.push(r)
    }
  }

  update(time: number, dt: number) {
    this.ripples.forEach((r, i) => {
      r.x += Math.sin(time * 0.4 + i) * 6 * dt + 4 * dt
      if (r.x > WORLD.width + 400) r.x = -400
    })
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
    for (let sy = top + 10; sy < CURB; sy += 26) g.poly([x - 7, sy, x + 7, sy - 10, x + 7, sy + 4, x - 7, sy + 14]).fill(colour)
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
  private x0 = 380
  private speed = 54
  private phase = 0

  constructor(private waterline: number) {
    super()
    this.reflection.addChild(this.drawBoat(new Graphics()), this.oarReflection)
    this.reflection.scale.set(1, -0.55)
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
    if (this.x0 > WORLD.width + 600) this.x0 = -900
    const bob = Math.sin(time * 1.4) * 2
    this.boat.position.set(this.x0, this.waterline + bob)
    this.reflection.position.set(this.x0, this.waterline + 4 - bob * 0.5)
    // the long stroke: blade forward, push back, lift and recover
    this.phase += dt * 0.9
    const sweep = Math.sin(this.phase * Math.PI)
    const blade = { x: -250 + sweep * 40, y: 26 - Math.max(0, -sweep) * 20 }
    for (const o of [this.oar, this.oarReflection]) {
      o.clear().moveTo(-190, -94).lineTo(blade.x, blade.y).stroke({ color: palette.ink, width: 3 })
      o.ellipse(blade.x, blade.y, 5, 10).fill(palette.ink)
    }
    this.lantern.position.set(this.x0 + 236, this.waterline - 70 + bob)
    this.lantern.alpha = 0.75 + Math.sin(time * 6) * 0.04
  }
}

/** a little stone bridge with steps up and over a side canal, lantern on top */
export function bridge(x: number, w: number) {
  const g = new Graphics()
  const crown = GROUND - 90
  const stone = vn.istriaDark
  // the arch, with dark water showing through underneath
  g.moveTo(x, CURB + 20)
    .lineTo(x, GROUND - 20)
    .quadraticCurveTo(x + w / 2, crown - 50, x + w, GROUND - 20)
    .lineTo(x + w, CURB + 20)
    .lineTo(x + w - 40, CURB + 20)
    .quadraticCurveTo(x + w / 2, crown + 20, x + 40, CURB + 20)
    .closePath()
    .fill(stone)
  g.moveTo(x, GROUND - 20).quadraticCurveTo(x + w / 2, crown - 50, x + w, GROUND - 20).stroke({ color: vn.istria, width: 6 })
  // steps up each side
  for (let i = 0; i < 6; i++) {
    const t = i / 6
    const sx = x + t * (w / 2 - 30)
    g.rect(sx, GROUND - 20 - t * 60, 18, 4).fill(vn.istria)
    g.rect(x + w - sx + x - 18, GROUND - 20 - t * 60, 18, 4).fill(vn.istria)
  }
  // iron railing following the curve
  g.moveTo(x, GROUND - 60).quadraticCurveTo(x + w / 2, crown - 100, x + w, GROUND - 60).stroke({ color: palette.ink, width: 3 })
  for (let t = 0; t <= 1; t += 0.06) {
    const px = x + w * t
    const top = (1 - t) * (1 - t) * (GROUND - 60) + 2 * (1 - t) * t * (crown - 100) + t * t * (GROUND - 60)
    const base = (1 - t) * (1 - t) * (GROUND - 20) + 2 * (1 - t) * t * (crown - 50) + t * t * (GROUND - 20)
    g.rect(px - 0.75, top, 1.5, base - top).fill(palette.ink)
  }
  return g
}
