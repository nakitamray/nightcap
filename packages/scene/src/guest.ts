import type { Pet } from './room/layout'

/** someone in the living room: they get a seat, a lamp and their pet */
export interface Guest {
  id: string
  name: string
  /** their pet comes along with them */
  pet?: Pet
  /** the person looking at the screen */
  me?: boolean
  /** what they're listening to, "title · artist" */
  playing?: string | null
}
