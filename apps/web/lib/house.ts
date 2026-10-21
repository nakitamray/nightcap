import type { Resident } from '@nightcap/scene'

// Placeholder house until there's a backend. Facade order: top floor first,
// left to right.

export interface Member extends Resident {
  city: string
  timeZone: string
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

export const demoMarquee = ['NIGHTCAP', "FRI: DEV'S BIRTHDAY", 'SAT: MOVIE NIGHT', 'SUN: ROOFTOP, 9PM']
