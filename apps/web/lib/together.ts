// Small rules for being in the house together, shared by the street, the
// rooms and the living room.

import { HOME_FOR_MS } from './presence'

/** where someone is: out on the street view, in the living room, or in a room */
export type Place = 'street' | 'lounge' | `room:${number}`

export const roomPlace = (room: number): Place => `room:${room}`

/** a song someone stopped listening to without the app noticing goes stale */
export const PLAYING_FOR_MS = 5 * 60_000

export interface Seen {
  at: string
  place: string
}

/** everyone who's in a place right now */
export function whoIsIn(seen: Record<string, Seen>, place: Place, now: number) {
  return Object.entries(seen)
    .filter(([, s]) => s.place === place && now - Date.parse(s.at) < HOME_FOR_MS)
    .map(([id]) => id)
}

export function stillPlaying(updatedAt: string | null | undefined, now: number) {
  if (!updatedAt) return false
  const t = Date.parse(updatedAt)
  return Number.isFinite(t) && now - t < PLAYING_FOR_MS
}

/** for the window card: where in the house someone is */
export function whereabouts(place: string | undefined, ownRoom: number, names: (string | null)[]) {
  if (!place || place === 'street') return null
  if (place === 'lounge') return 'in the living room'
  const n = Number(place.slice(5))
  if (n === ownRoom) return 'in their room'
  return names[n] ? `visiting ${names[n]}` : 'wandering the halls'
}
