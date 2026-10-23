import type { Pet } from '../room/layout'
import type { Avatar } from './avatar'

/** someone in a room: whoever lives there, a visitor, or a friend in the living room */
export interface Guest {
  id: string
  name: string
  avatar: Avatar
  /** their pet comes along with them */
  pet?: Pet
  /** the person looking at the screen */
  me?: boolean
}
