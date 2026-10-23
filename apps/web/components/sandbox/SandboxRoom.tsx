'use client'

import type { Conditions } from '@nightcap/scene'
import { RoomView } from '@/components/room/RoomView'
import { demoRooms } from '@/lib/house'
import { readLayout, type Extra, type Pet } from '@/lib/room'
import { THEME_NAMES, type Theme } from '@/lib/themes'

// made-up housemates so the map poster has pins on it
const FRIENDS = [
  { lat: 55.9, lon: -3.2, name: 'Ellie' },
  { lat: 45.5, lon: -73.6, name: 'Mars' },
  { lat: 21.3, lon: -157.8, name: 'Kai' },
  { lat: 42.4, lon: -71.1, name: 'Priya' },
  { lat: 30.3, lon: -97.7, name: 'Dev' },
]

// everyone in the made-up house has their own taste in pets and chairs
const TASTE: { pet: Pet; furniture: Extra[] }[] = [
  { pet: { kind: 'cat', breed: 'tabby' }, furniture: ['beanbag'] },
  { pet: { kind: 'dog', breed: 'golden' }, furniture: ['lounger', 'pouf'] },
  { pet: { kind: 'none' }, furniture: [] },
  { pet: { kind: 'cat', breed: 'white' }, furniture: ['dresser'] },
  { pet: { kind: 'dog', breed: 'terrier' }, furniture: ['loveseat'] },
  { pet: { kind: 'cat', breed: 'black' }, furniture: ['lounger', 'plantstand'] },
  { pet: { kind: 'cat', breed: 'persian' }, furniture: ['armchair'] },
  { pet: { kind: 'dog', breed: 'labradoodle' }, furniture: ['beanbag', 'floorlamp'] },
  { pet: { kind: 'cat', breed: 'grey' }, furniture: ['bookcase'] },
  { pet: { kind: 'dog', breed: 'shepherd' }, furniture: ['loveseat', 'pouf'] },
  { pet: { kind: 'none' }, furniture: [] },
  { pet: { kind: 'cat', breed: 'tabby' }, furniture: ['records', 'monstera'] },
]

// where everyone in the made-up house is, so their windows get their skies
const TOWNS: Record<string, [number, number]> = {
  Edinburgh: [55.9, -3.2],
  Montréal: [45.5, -73.6],
  Honolulu: [21.3, -157.8],
  Boston: [42.4, -71.1],
  Chicago: [41.9, -87.6],
  Portland: [45.5, -122.7],
  'Ann Arbor': [42.3, -83.7],
  Berkeley: [37.9, -122.3],
  Austin: [30.3, -97.7],
  Madison: [43.1, -89.4],
}

// an empty room takes the time of the city the house is in
const CITY_TIME: Record<Theme, { zone: string; at: [number, number]; name: string }> = {
  paris: { zone: 'Europe/Paris', at: [48.9, 2.3], name: 'Paris' },
  'new-york': { zone: 'America/New_York', at: [40.7, -74.0], name: 'New York' },
  venice: { zone: 'Europe/Rome', at: [45.4, 12.3], name: 'Venice' },
  tokyo: { zone: 'Asia/Tokyo', at: [35.7, 139.7], name: 'Tokyo' },
}

/** the made-up house has a room for you too, so "go to my room" has somewhere to go */
export const SANDBOX_ME = demoRooms.findIndex((r) => r?.id === 'nakita')

/** any room in the demo or dev house: have a play, nothing gets saved */
export function SandboxRoom({
  theme,
  room,
  base,
  sky,
}: {
  theme: Theme
  room: number
  base: '/demo' | '/dev'
  /** pin the sky to one time and weather, for trying them out */
  sky?: Conditions
}) {
  const mine = room === SANDBOX_ME
  const resident = demoRooms[room]
  const town = resident ? TOWNS[resident.city] : undefined
  const fallback = CITY_TIME[theme]
  const [lat, lon] = town ?? fallback.at
  return (
    <RoomView
      mode="sandbox"
      houseId={`${base.slice(1)}-${theme}`}
      userId="sandbox"
      theme={theme}
      room={room}
      owner={mine ? null : (resident?.name ?? 'nobody')}
      initialLayout={readLayout(resident ? TASTE[room] : null, room)}
      place={{ city: resident?.city ?? fallback.name, lat, lon }}
      ownerTimeZone={resident?.timeZone ?? fallback.zone}
      sky={sky}
      housemates={FRIENDS}
      spotify="dev"
      backHref={`${base}/${theme}`}
      backLabel={`back to ${THEME_NAMES[theme]}`}
      myRoomHref={mine ? null : `${base}/${theme}/room/${SANDBOX_ME}`}
      signUpHref="/signup"
    />
  )
}
