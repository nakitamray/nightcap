import { Container, Matrix, RenderTexture, Sprite, type Renderer } from 'pixi.js'
import { WetFilter } from '../filters/WetFilter'
import { GROUND, REFLECT_DEPTH, WORLD } from '../layout'

const MARGIN = 400

/**
 * Renders the strip of world just above the ground into a texture, flips it
 * and lays it on the street. Runs at low res and every other frame -- the
 * wet filter smears it anyway, so nobody can tell.
 */
export class Reflection extends Container {
  private rt: RenderTexture
  private sprite: Sprite
  private filter: WetFilter
  private matrix = new Matrix()
  private frame = 0
  every = 2

  constructor(
    private source: Container,
    resolution = 0.4,
    strength?: number,
    /** containers whose filters are switched off while the reflection renders */
    private plain: Container[] = [],
  ) {
    super()
    this.filter = new WetFilter(strength)
    this.rt = RenderTexture.create({
      width: WORLD.width + MARGIN * 2,
      height: REFLECT_DEPTH,
      resolution,
    })
    this.sprite = new Sprite(this.rt)
    this.sprite.scale.y = -1
    this.sprite.position.set(-MARGIN, GROUND + REFLECT_DEPTH)
    // the flip means the bottom of the texture lands on the ground line.
    // blend mode has to live on the filter -- it's what draws to the screen
    this.filter.blendMode = 'add'
    this.sprite.filters = [this.filter]
    this.addChild(this.sprite)
    this.matrix.translate(MARGIN, -(GROUND - REFLECT_DEPTH))
  }

  update(renderer: Renderer, time: number) {
    this.filter.time = time
    if (this.frame++ % this.every !== 0) return
    const saved = this.plain.map((c) => c.filters)
    for (const c of this.plain) c.filters = null
    renderer.render({
      container: this.source,
      target: this.rt,
      transform: this.matrix,
      clear: true,
    })
    this.plain.forEach((c, i) => (c.filters = saved[i] ? [...saved[i]!] : null))
  }

  override destroy() {
    this.rt.destroy(true)
    super.destroy({ children: true })
  }
}
