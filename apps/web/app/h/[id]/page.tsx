import { notFound } from 'next/navigation'
import { HouseView } from '@/components/HouseView'
import type { Member } from '@/lib/house'
import { currentUserId, supabaseServer } from '@/lib/supabase/server'
import type { HouseRow } from '@/lib/supabase/types'
import { isTheme } from '@/lib/themes'

export const metadata = { title: 'Nightcap' }

export default async function HousePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await currentUserId()
  const supabase = await supabaseServer()

  // row level security means this comes back empty unless you live here
  const { data: house } = await supabase.from('houses').select('id, name, theme, marquee').eq('id', id).maybeSingle<HouseRow>()
  if (!house || !userId) notFound()

  const { data: rooms } = await supabase.from('memberships').select('user_id, room, curtains').eq('house_id', id)
  const ids = (rooms ?? []).map((r) => r.user_id)
  const { data: people } = await supabase.from('profiles').select('id, display_name, city, time_zone').in('id', ids)

  const members: (Member | null)[] = Array.from({ length: 12 }, () => null)
  for (const r of rooms ?? []) {
    const p = people?.find((p) => p.id === r.user_id)
    members[r.room] = {
      id: r.user_id,
      name: p?.display_name ?? '?',
      city: p?.city ?? '',
      timeZone: p?.time_zone ?? 'UTC',
      // lights come from who's actually online, filled in on the client
      home: false,
      curtains: r.curtains,
    }
  }

  const marquee = house.marquee.length ? house.marquee : [house.name.toUpperCase()]
  return (
    <HouseView
      houseId={house.id}
      houseName={house.name}
      userId={userId}
      initialRooms={members}
      marquee={marquee}
      theme={isTheme(house.theme) ? house.theme : 'paris'}
    />
  )
}
