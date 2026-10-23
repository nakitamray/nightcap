'use client'

import { avatarFromSeed } from '@nightcap/scene/layout'
import type { Note } from '@/components/notes/NotesPanel'
import { RoomView } from '@/components/room/RoomView'
import type { Housemate } from '@/components/room/useRoomCompany'
import { demoRooms } from '@/lib/house'
import { readLayout, type Extra, type Pet } from '@/lib/room'
import { THEME_NAMES, type Theme } from '@/lib/themes'

// made-up housemates so the map poster has pins on it
const PINS = [
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

// and what they look like, with their pets in tow
const HOUSEMATES: Housemate[] = demoRooms.flatMap((r, i) =>
  r ? [{ id: r.id, name: r.name, avatar: avatarFromSeed(r.id), pet: TASTE[i]?.pet }] : [],
)

// the panel only opens in the browser, so the demo notes can be dated from now
const NOW = Date.now()
const NOTES: Note[] = [
  {
    id: 'n1',
    from: 'mars',
    fromName: 'Mars',
    body: 'borrowed your umbrella, will bring it back friday x',
    createdAt: new Date(NOW - 40 * 60_000).toISOString(),
    read: false,
  },
  {
    id: 'n2',
    from: 'priya',
    fromName: 'Priya',
    body: 'movie night saturday, you pick this time',
    createdAt: new Date(NOW - 26 * 3600_000).toISOString(),
    read: true,
  },
]

/** the made-up house has a room for you too, so "go to my room" has somewhere to go */
export const SANDBOX_ME = demoRooms.findIndex((r) => r?.id === 'nakita')

/** any room in the demo or dev house: have a play, nothing gets saved */
export function SandboxRoom({
  theme,
  room,
  base,
}: {
  theme: Theme
  room: number
  base: '/demo' | '/dev'
}) {
  const mine = room === SANDBOX_ME
  const resident = demoRooms[room]
  return (
    <RoomView
      mode="sandbox"
      houseId={`${base.slice(1)}-${theme}`}
      userId="nakita"
      theme={theme}
      room={room}
      owner={mine ? null : (resident?.name ?? 'nobody')}
      ownerId={resident?.id ?? null}
      initialLayout={readLayout(resident ? TASTE[room] : null, room)}
      place={{ city: 'Chicago', lat: 41.9, lon: -87.6 }}
      pins={PINS}
      housemates={HOUSEMATES}
      // whoever lives here is in, and so are you
      initialSeen={Object.fromEntries(
        [resident?.id, 'nakita']
          .filter((id): id is string => !!id)
          .map((id) => [id, { at: '', place: `room:${room}` }]),
      )}
      initialNotes={mine ? NOTES : []}
      spotify="dev"
      backHref={`${base}/${theme}`}
      backLabel={`back to ${THEME_NAMES[theme]}`}
      myRoomHref={mine ? null : `${base}/${theme}/room/${SANDBOX_ME}`}
      signUpHref="/signup"
    />
  )
}
