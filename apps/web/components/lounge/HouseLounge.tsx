'use client'

import type { Guest, ThemeId } from '@nightcap/scene'
import { useEffect, useMemo, useState } from 'react'
import type { Housemate } from '@/components/room/useRoomCompany'
import { useCheckIn } from '@/components/useCheckIn'
import { useHouseChannel } from '@/components/useHouseChannel'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { whoIsIn, type Seen } from '@/lib/together'
import { LoungeView } from './LoungeView'

interface Props {
  houseId: string
  houseName: string
  userId: string
  theme: ThemeId
  housemates: Housemate[]
  initialSeen: Record<string, Seen>
  myRoom: number | null
}

/** a real house's living room: you're in it, and so is anyone else who checked in here lately */
export function HouseLounge({
  houseId,
  houseName,
  userId,
  theme,
  housemates,
  initialSeen,
  myRoom,
}: Props) {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [seen, setSeen] = useState(initialSeen)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 20_000)
    return () => clearInterval(tick)
  }, [])

  useCheckIn(supabase, houseId, 'lounge')
  useHouseChannel(supabase, houseId, {
    onSeen: (id, s) => setSeen((prev) => ({ ...prev, [id]: s })),
  })

  // you first, then everyone else in the order they live in the house, so
  // nobody swaps seats when someone new comes in
  const people: Guest[] = useMemo(() => {
    const here = new Set(whoIsIn(seen, 'lounge', now))
    here.add(userId)
    const order = [...housemates].sort((a, b) => (a.id === userId ? -1 : b.id === userId ? 1 : 0))
    return order
      .filter((h) => here.has(h.id))
      .map((h) => ({ id: h.id, name: h.name, pet: h.pet, me: h.id === userId }))
  }, [seen, now, userId, housemates])

  return (
    <LoungeView
      theme={theme}
      seed={houseId}
      people={people}
      backHref={`/h/${houseId}`}
      backLabel={`back to ${houseName}`}
      myRoomHref={myRoom != null ? `/h/${houseId}/room/${myRoom}` : null}
    />
  )
}
