import { Container, Graphics } from 'pixi.js'
import { CLOTH_COLOURS, SKINS, type Avatar } from './avatar'

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

// placeholder until the real drawing lands; same signature
export function drawCharacter(avatar: Avatar, options: CharacterOptions = {}): Container {
  const c = new Container()
  const g = new Graphics()
  const sitting = options.pose === 'sit' || options.pose === 'floor'
  const top = sitting ? -190 : -300
  g.roundRect(-30, top + 60, 60, sitting ? 130 : 150, 20).fill(CLOTH_COLOURS[avatar.topColour]!)
  g.circle(0, top + 30, 28).fill(SKINS[avatar.skin]!)
  c.addChild(g)
  return c
}
