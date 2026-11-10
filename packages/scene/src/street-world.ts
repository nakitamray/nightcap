import { AdvancedBloomFilter } from 'pixi-filters'
import { Container, type Renderer } from 'pixi.js'
import { NIGHT, type Conditions } from './conditions'
import { celebrate, type Celebration } from './layers/celebration'
import { DaySky, Fog, grading, Lightning, lookFor, mix, NightClouds, Snow } from './layers/daylight'
import { Doorstep, type StepGift } from './layers/doorstep'
import type { BaseHouse } from './layers/house-base'
import type { Occasion } from './occasions'
import { Rain } from './layers/rain'
import { Sky } from './layers/sky'
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
  /** gifts waiting on the front step */
  readonly doorstep = new Doorstep()
  private rain: Rain
  private reflection: Reflection
  private seed: number
  private reducedMotion: boolean
  private occasion: Occasion | null = null
  private celebration: Celebration | null = null
  private rainTop = -900
  private conditions: Conditions = NIGHT
  private sunAt: { x: number; y: number; r: number } | null = null
  /** everything setConditions adds, so it can all go again */
  private weather: {
    sky?: DaySky
    clouds?: NightClouds
    storm?: Rain
    snow?: Snow
    fog?: Fog
    lightning?: Lightning
  } = {}

  constructor(options: StreetWorldOptions) {
    super()
    const { seed, reducedMotion: reduced } = options
    this.seed = seed
    this.reducedMotion = reduced
    const street = (this.street = themes[options.theme].build({
      seed,
      lights: this.lights,
      reducedMotion: reduced,
    }))
    this.house = street.house
    this.upper.addChild(
      ...street.backdrop,
      street.house,
      this.doorstep,
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
        quality: 3,
      }),
    ]

    // the reflection skips the bloom: it's smeared by the water anyway
    this.reflection = new Reflection(this.upper, 0.4, street.reflection, [this.lights])
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

  setGifts(gifts: StepGift[]) {
    this.doorstep.setGifts(gifts)
  }

  /**
   * Dress the street up for an occasion, or take it all down again with
   * null: lanterns and fireworks go up in front of it all, bunting goes on
   * the house.
   */
  setOccasion(occasion: Occasion | null) {
    if (occasion === this.occasion) return
    this.occasion = occasion
    this.celebration?.destroy()
    this.celebration = null
    if (!occasion) return
    const c = (this.celebration = celebrate(
      occasion,
      this.seed,
      this.house.windows,
      this.reducedMotion,
    ))
    this.upper.addChildAt(c.front, this.upper.getChildIndex(this.house) + 1)
    this.upper.addChild(c.sky)
  }

  /** rain has to start above whatever slice of sky is showing */
  setRainTop(top: number) {
    this.rainTop = top
    this.rain.setTop(top)
    this.weather.storm?.setTop(top)
    this.weather.snow?.setTop(top)
  }

  /**
   * The street at a given time of day and in given weather. The plain night
   * (no weather given) is exactly the street as drawn; everything else is
   * layered over it and graded, and rebuilt whenever this is called.
   */
  setConditions(c: Conditions, force = false) {
    if (!force && c.phase === this.conditions.phase && c.weather === this.conditions.weather) return
    this.conditions = c
    this.clearWeather()

    const look = lookFor(c)
    const grade = look ? grading(look) : null
    this.filters = grade ? [grade.filter] : []
    this.lights.alpha = look?.lights ?? 1
    this.street.pools.alpha = look?.pools ?? 1

    const sky = this.street.backdrop[0]
    const skyAt = sky ? this.upper.getChildIndex(sky) + 1 : 0
    if (look && grade) {
      const moon = sky instanceof Sky ? sky.moon : { x: 430, y: 200, r: 105 }
      this.weather.sky = new DaySky(
        look,
        grade.paint,
        c.weather,
        this.sunAt ?? moon,
        this.seed + 21,
      )
      this.upper.addChildAt(this.weather.sky, skyAt)
    } else if (c.weather && c.weather !== 'clear') {
      this.weather.clouds = new NightClouds(this.seed + 22, c.weather)
      this.upper.addChildAt(this.weather.clouds, skyAt)
    }

    const w = c.weather
    // the city's own drizzle only falls when it's raining (or nobody said)
    this.rain.visible = w === undefined || w === 'rain' || w === 'storm'
    if (w === 'storm') {
      this.weather.storm = new Rain(this.seed + 23, 200)
      this.weather.storm.setTop(this.rainTop)
      this.weather.lightning = new Lightning(this.seed + 24)
      this.upper.addChildAt(this.weather.lightning.sky, skyAt + 1)
      this.addChild(this.weather.storm, this.weather.lightning)
    }
    if (w === 'snow') {
      this.weather.snow = new Snow(this.seed + 25, 260)
      this.weather.snow.setTop(this.rainTop)
      this.addChild(this.weather.snow)
    }
    if (w === 'fog') {
      const haze = look && grade ? grade.paint(mix(look.sky[2], 0xd8d8d8, 0.5)) : 0x3a4060
      this.weather.fog = new Fog(this.seed + 26, haze, !look)
      // in front of the buildings, behind the people
      this.addChildAt(this.weather.fog, this.getChildIndex(this.upper) + 1)
    }
  }

  /**
   * Where the sun should hang, in world units. Through a room's window only a
   * slice of sky shows, so the room puts the sun in it.
   */
  setSunSpot(spot: { x: number; y: number; r: number }) {
    const old = this.sunAt
    if (old && Math.abs(old.x - spot.x) < 1 && Math.abs(old.y - spot.y) < 1) return
    this.sunAt = spot
    if (this.weather.sky) this.setConditions(this.conditions, true)
  }

  private clearWeather() {
    const w = this.weather
    w.lightning?.sky.destroy()
    for (const layer of [w.sky, w.clouds, w.storm, w.snow, w.fog, w.lightning]) {
      layer?.destroy({ children: true })
    }
    this.weather = {}
  }

  update(renderer: Renderer, t: number, dt: number, pointerX: number, reduced: boolean) {
    this.street.update(t, dt, pointerX, reduced)
    this.house.update(t, dt, reduced)
    this.street.people.update(dt, reduced)
    this.doorstep.update(dt, reduced)
    this.celebration?.update(reduced ? dt * 0.5 : dt)
    this.rain.update(reduced ? dt * 0.4 : dt)
    const w = this.weather
    w.sky?.update(dt)
    w.clouds?.update(dt)
    w.storm?.update(reduced ? dt * 0.4 : dt)
    w.snow?.update(reduced ? dt * 0.4 : dt)
    w.fog?.update(dt)
    if (!reduced) w.lightning?.update(dt)
    this.reflection.update(renderer, t)
  }

  /** for when the street is only seen small, through a window */
  lowDetail() {
    this.reflection.every = 3
  }

  /** for slow machines: no bloom, a lazier reflection */
  degrade() {
    this.lights.filters = []
    this.reflection.every = 4
  }

  override destroy() {
    this.clearWeather()
    this.celebration?.destroy()
    this.reflection.destroy()
    super.destroy({ children: true })
  }
}
