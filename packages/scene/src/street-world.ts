import { AdvancedBloomFilter } from 'pixi-filters'
import { Container, type Renderer } from 'pixi.js'
import type { BaseHouse } from './layers/house-base'
import { Rain } from './layers/rain'
import { Reflection } from './layers/reflection'
import { themes, type BuiltTheme } from './themes'
import type { ThemeId } from './themes/types'

export interface StreetWorldOptions {
  theme: ThemeId
  seed: number
  reducedMotion: boolean
}

/**
 * The street itself, without a canvas of its own: sky, buildings, the house,
 * people, rain, the wet reflection. StreetScene puts it full screen; the room
 * puts it behind its window glass.
 */
export class StreetWorld extends Container {
  readonly upper = new Container()
  readonly lights = new Container()
  readonly street: BuiltTheme
  readonly house: BaseHouse
  private rain: Rain
  private reflection: Reflection

  constructor(options: StreetWorldOptions) {
    super()
    const { seed, reducedMotion: reduced } = options
    const street = (this.street = themes[options.theme].build({
      seed,
      lights: this.lights,
      reducedMotion: reduced,
    }))
    this.house = street.house
    this.upper.addChild(
      ...street.backdrop,
      street.house,
      ...street.props,
      this.lights,
      ...street.front,
    )

    this.lights.filters = [
      new AdvancedBloomFilter({
        threshold: street.bloomThreshold ?? 0.42,
        bloomScale: 0.8,
        brightness: 1,
        blur: 5,
        quality: 4,
      }),
    ]

    this.reflection = new Reflection(this.upper, 0.4, street.reflection)
    const drops = street.rain ?? 160
    this.rain = new Rain(seed + 4, reduced ? Math.round(drops / 3) : drops)

    // people, cars and boats are on the pavement, road or water, below the
    // line the reflection mirrors around, so they live outside `upper`
    this.addChild(
      this.upper,
      street.ground,
      this.reflection,
      street.pools,
      street.people,
      ...street.foreground,
      this.rain,
    )
  }

  /** rain has to start above whatever slice of sky is showing */
  setRainTop(top: number) {
    this.rain.setTop(top)
  }

  update(renderer: Renderer, t: number, dt: number, pointerX: number, reduced: boolean) {
    this.street.update(t, dt, pointerX, reduced)
    this.house.update(t, dt, reduced)
    this.street.people.update(dt, reduced)
    this.rain.update(reduced ? dt * 0.4 : dt)
    this.reflection.update(renderer, t)
  }

  /** for slow machines: no bloom, a lazier reflection */
  degrade() {
    this.lights.filters = []
    this.reflection.every = 4
  }

  override destroy() {
    this.reflection.destroy()
    super.destroy({ children: true })
  }
}
