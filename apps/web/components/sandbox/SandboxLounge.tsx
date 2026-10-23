'use client'

import { avatarFromSeed, type Guest } from '@nightcap/scene'
import { useMemo } from 'react'
import { LoungeView } from '@/components/lounge/LoungeView'
import { demoRooms } from '@/lib/house'
import { THEME_NAMES, type Theme } from '@/lib/themes'
import { DEMO_TASTE, SANDBOX_ME } from './SandboxRoom'

// a few more made-up friends, for seeing the living room full
const EXTRA = ['Lou', 'Ines', 'Bea', 'Oskar']

/** everyone in the made-up house, with their pets */
function demoPeople(count?: number): Guest[] {
  const everyone: Guest[] = demoRooms.flatMap((m, i) =>
    m ? [{ id: m.id, name: m.name, avatar: avatarFromSeed(m.id), pet: DEMO_TASTE[i]!.pet, me: i === SANDBOX_ME }] : [],
  )
  const more = EXTRA.map((name, i) => ({
    id: name.toLowerCase(),
    name,
    avatar: avatarFromSeed(name),
    pet: i % 2 ? DEMO_TASTE[i * 3]!.pet : ({ kind: 'none' } as const),
  }))
  // you first, then whoever's home, then everyone else if we're filling it up
  const home = everyone.filter((g) => !g.me && demoRooms.find((m) => m?.id === g.id)?.home)
  const out = [...everyone.filter((g) => g.me), ...home]
  if (count === undefined) return out
  const rest = [...everyone.filter((g) => !out.includes(g)), ...more]
  return [...out, ...rest].slice(0, count)
}

/** the demo or dev house's living room */
export function SandboxLounge({
  theme,
  base,
  count,
  house,
}: {
  theme: Theme
  base: '/demo' | '/dev'
  /** dev mode can ask for a particular number of people, to see it empty or full */
  count?: number
  /** and for a different house, since every house's living room is different */
  house?: string
}) {
  const people = useMemo(() => demoPeople(count), [count])
  return (
    <LoungeView
      theme={theme}
      seed={house ?? `${base.slice(1)}-${theme}`}
      people={people}
      backHref={`${base}/${theme}`}
      backLabel={`back to ${THEME_NAMES[theme]}`}
      myRoomHref={`${base}/${theme}/room/${SANDBOX_ME}`}
    />
  )
}
