import { Application, Container, Matrix, RenderTexture } from 'pixi.js'
import { PaperFilter } from './filters/PaperFilter'
import { loadDisplayFont } from './fonts'
import { HOUSE, MAX_ROOMS } from './layout'
import { StreetWorld } from './street-world'
import type { ThemeId } from './themes/types'

/**
 * Still pictures of each city's street, drawn by the real scene: the house,
 * its neighbours, the sky and the people out walking. For the pages that show
 * several cities at once, where running a live street per card would be too
 * heavy. Returns data urls, one per theme.
 */
export async function snapshotStreets(
  themes: ThemeId[],
  width = 420,
  height = 520,
): Promise<Record<string, string>> {
  const app = new Application()
  await app.init({
    width,
    height,
    preference: 'webgl',
    antialias: true,
    background: 0x01020b,
    resolution: 1,
    // nothing to animate; every frame is rendered by hand below
    autoStart: false,
  })
  await loadDisplayFont()
  const out: Record<string, string> = {}
  try {
    for (const theme of themes) {
      const world = new StreetWorld({ theme, seed: 1931, reducedMotion: true })
      // most of the house home, a couple of curtains drawn, the name up in lights
      world.house.setRooms(
        Array.from({ length: MAX_ROOMS }, (_, i) =>
          i === 2 || i === 9
            ? null
            : {
                id: `r${i}`,
                name: '',
                home: i % 5 !== 3,
                curtains: i % 4 === 1 ? 'drawn' : 'open',
              },
        ),
      )
      world.house.marquee.setLines(['NIGHTCAP'])
      // frame the house from its chimneys down to the water or the kerb
      const crop = { x: HOUSE.x + HOUSE.width / 2, top: 30, bottom: 1250 }
      const scale = height / (crop.bottom - crop.top)
      const holder = new Container()
      holder.addChild(world)
      const paper = new PaperFilter()
      paper.setScreen(width, height)
      paper.time = 3.2
      holder.filters = [paper]
      holder.filterArea = app.screen
      world.setRainTop(crop.top - 100)
      // let people walk out a little and the reflection catch up
      for (let i = 0; i < 40; i++) world.update(app.renderer, i / 30, 1 / 30, 0, true)
      const rt = RenderTexture.create({ width, height })
      app.renderer.render({
        container: holder,
        target: rt,
        transform: new Matrix(scale, 0, 0, scale, width / 2 - crop.x * scale, -crop.top * scale),
        clear: true,
      })
      const canvas = app.renderer.extract.canvas(rt) as HTMLCanvasElement
      out[theme] = canvas.toDataURL('image/jpeg', 0.86)
      rt.destroy(true)
      holder.destroy({ children: true })
    }
  } finally {
    app.destroy(true, { children: true })
  }
  return out
}
