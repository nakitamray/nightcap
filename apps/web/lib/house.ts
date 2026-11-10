import type { Resident, ThemeId } from '@nightcap/scene'
import type { Extra, Pet } from '@nightcap/scene/layout'

// Placeholder house until there's a backend. Facade order: top floor first,
// left to right.

export interface Member extends Resident {
  city: string
  timeZone: string
  /** where in the house they are, when they're home ("in the living room") */
  where?: string | null
  /** what they're listening to, "title · artist" */
  playing?: string | null
}

const m = (
  id: string,
  name: string,
  city: string,
  timeZone: string,
  home: boolean,
  curtains: Member['curtains'] = 'open',
): Member => ({ id, name, city, timeZone, home, curtains })

export const demoRooms: (Member | null)[] = [
  m('ellie', 'Ellie', 'Edinburgh', 'Europe/London', true, 'drawn'),
  m('mars', 'Mars', 'Montréal', 'America/Toronto', true),
  null,
  m('kai', 'Kai', 'Honolulu', 'Pacific/Honolulu', false),
  m('priya', 'Priya', 'Boston', 'America/New_York', true),
  m('nakita', 'Nakita', 'Chicago', 'America/Chicago', true),
  m('jonah', 'Jonah', 'Portland', 'America/Los_Angeles', true, 'drawn'),
  m('sam', 'Sam', 'Ann Arbor', 'America/Detroit', true),
  m('theo', 'Theo', 'Berkeley', 'America/Los_Angeles', false, 'drawn'),
  m('dev', 'Dev', 'Austin', 'America/Chicago', true),
  null,
  m('rosa', 'Rosa', 'Madison', 'America/Chicago', true),
]

export const demoMarquee = [
  'NIGHTCAP',
  "FRI: DEV'S BIRTHDAY",
  'SAT: MOVIE NIGHT',
  'SUN: ROOFTOP, 9PM',
]

// same calendar, different town
const marquees: Record<ThemeId, string[]> = {
  paris: demoMarquee,
  'new-york': ['NIGHTCAP', "FRI: DEV'S BIRTHDAY", 'SAT: CONEY ISLAND', 'SUN: ROOF, 9PM'],
  venice: ['NIGHTCAP', "FRI: DEV'S BIRTHDAY", 'SAT: GONDOLA AT 8', 'SUN: SPRITZ, 7PM'],
  tokyo: ['NIGHTCAP', "FRI: DEV'S BIRTHDAY", 'SAT: KARAOKE', 'SUN: RAMEN, 10PM'],
  'san-diego': ['NIGHTCAP', "FRI: DEV'S BIRTHDAY", 'SAT: BONFIRE AT 8', 'SUN: TACOS, 11PM'],
}

export function marqueeFor(theme: ThemeId) {
  return marquees[theme]
}

/** a room number out of a url, or null if it isn't one of the twelve */
export function roomIndex(raw: string): number | null {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 0 && n < 12 && /^\d+$/.test(raw) ? n : null
}

// everyone in the made-up house has their own taste in pets and chairs
export const DEMO_TASTE: { pet: Pet; furniture: Extra[] }[] = [
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

/** the made-up house has a room for you too, so "go to my room" has somewhere to go */
export const SANDBOX_ME = demoRooms.findIndex((r) => r?.id === 'nakita')
