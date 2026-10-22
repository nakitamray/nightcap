import { Container } from 'pixi.js'
import { MAX_ROOMS, windowSlots, type Rect, type WindowSlot } from '../layout'
import type { Rooms } from '../types'
import { Marquee, type MarqueeLook } from './marquee'
import { RoomWindow, type WindowStyle } from './window'

/**
 * The parts every house has whatever street it's on: twelve windows in the
 * same places, and the marquee over the door. Themes draw the building around
 * them and decide what order things stack in.
 */
export abstract class BaseHouse extends Container {
  windows: RoomWindow[] = []
  marquee!: Marquee

  protected addWindows(lights: Container, style: WindowStyle, slots: WindowSlot[] = windowSlots()) {
    this.windows = slots.map((slot) => new RoomWindow(slot, lights, style))
    this.addChild(...this.windows)
    return this.windows
  }

  protected addMarquee(lights: Container, look?: MarqueeLook, rect?: Rect) {
    this.marquee = new Marquee(lights, look, rect)
    this.addChild(this.marquee)
    return this.marquee
  }

  setRooms(rooms: Rooms) {
    for (let i = 0; i < MAX_ROOMS; i++) {
      const w = this.windows[i]
      if (!w) continue
      const next = rooms[i] ?? null
      const prev = w.resident
      if (!prev || !next || prev.id !== next.id) {
        w.setResident(next)
      } else {
        w.resident = next
        w.setLit(next.home)
        w.setCurtains(next.curtains)
      }
    }
  }

  /** world-space hit test; see the note in scene.ts about why this isn't pixi's */
  windowAt(x: number, y: number) {
    return this.windows.find(
      ({ slot }) =>
        x >= slot.x - 12 &&
        x <= slot.x + slot.width + 12 &&
        y >= slot.y - 20 &&
        y <= slot.y + slot.height + 10,
    )
  }

  update(time: number, dt: number, reducedMotion: boolean) {
    for (const w of this.windows) w.update(time, dt, reducedMotion)
    this.marquee.update(time, dt, reducedMotion)
  }
}
