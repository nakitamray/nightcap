import type { Housemate } from '@/components/room/useRoomCompany'
import { readLayout } from './room'
import type { supabaseServer } from './supabase/server'
import type { Seen } from './together'

type Server = Awaited<ReturnType<typeof supabaseServer>>

export interface Profile {
  id: string
  display_name: string
  city: string | null
  time_zone: string
  lat: number | null
  lon: number | null
}

const PROFILE = 'id, display_name, city, time_zone, lat, lon'

/**
 * Everyone in a house, with their pets and where they
 * are, for the pages inside it. Anything that fails is logged and left out
 * rather than taking the page down.
 */
export async function loadHouse(supabase: Server, houseId: string) {
  const { data: members, error } = await supabase
    .from('memberships')
    .select('user_id, room, layout')
    .eq('house_id', houseId)
  if (error) console.error(`house ${houseId}: memberships`, error)
  const ids = (members ?? []).map((m) => m.user_id)

  const profiles = await supabase.from('profiles').select(PROFILE).in('id', ids)
  if (profiles.error) console.error(`house ${houseId}: profiles`, profiles.error)
  const people = (profiles.data ?? []) as Profile[]

  const presence = await supabase
    .from('presence')
    .select('user_id, seen_at, place')
    .eq('house_id', houseId)
  if (presence.error) console.error(`house ${houseId}: presence`, presence.error)
  const seen: Record<string, Seen> = Object.fromEntries(
    (presence.data ?? []).map((p) => [p.user_id, { at: p.seen_at, place: p.place ?? 'street' }]),
  )

  const housemates: Housemate[] = (members ?? []).map((m) => {
    const p = people.find((x) => x.id === m.user_id)
    return {
      id: m.user_id,
      name: p?.display_name ?? '?',
      pet: readLayout(m.layout, m.room ?? 0).pet,
    }
  })

  return { members: members ?? [], people, seen, housemates }
}
