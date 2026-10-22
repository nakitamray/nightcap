import { notFound, redirect } from 'next/navigation'
import { RoomView } from '@/components/room/RoomView'
import { roomIndex } from '@/lib/house'
import { readLayout } from '@/lib/room'
import { spotifyConfigured } from '@/lib/spotify'
import { currentUserId, supabaseServer } from '@/lib/supabase/server'
import { isTheme } from '@/lib/themes'

export const metadata = { title: 'Nightcap' }

// anyone in the house can look round any room; only its owner can change it
export default async function RoomPage({ params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params
  const room = roomIndex(n)
  const userId = await currentUserId()
  if (room === null || !userId) notFound()
  const supabase = await supabaseServer()

  // row level security: this is empty unless you live here
  const { data: house } = await supabase
    .from('houses')
    .select('id, name, theme')
    .eq('id', id)
    .maybeSingle()
  if (!house) notFound()

  const { data: everyone } = await supabase
    .from('memberships')
    .select('user_id, room, layout')
    .eq('house_id', id)
  const owner = everyone?.find((m) => m.room === room)
  // nobody lives here yet; the house is where you claim it
  if (!owner) redirect(`/h/${id}`)
  const mine = owner.user_id === userId
  const myRoom = everyone?.find((m) => m.user_id === userId)?.room ?? null

  const { data: people } = await supabase
    .from('profiles')
    .select('id, display_name, city, lat, lon')
    .in(
      'id',
      (everyone ?? []).map((m) => m.user_id),
    )
  const person = people?.find((p) => p.id === owner.user_id)
  const housemates = (people ?? [])
    .filter((p) => p.id !== owner.user_id && p.lat != null && p.lon != null)
    .map((p) => ({ lat: p.lat as number, lon: p.lon as number, name: p.display_name }))

  let spotify: 'off' | 'unlinked' | 'linked' = 'off'
  if (mine && spotifyConfigured()) {
    const { data } = await supabase
      .from('spotify_links')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
    spotify = data ? 'linked' : 'unlinked'
  }

  return (
    <RoomView
      mode={mine ? 'mine' : 'visit'}
      houseId={house.id}
      userId={userId}
      theme={isTheme(house.theme) ? house.theme : 'paris'}
      room={room}
      owner={mine ? null : (person?.display_name ?? 'someone')}
      initialLayout={readLayout(owner.layout, room)}
      place={{ city: person?.city ?? '', lat: person?.lat ?? null, lon: person?.lon ?? null }}
      housemates={housemates}
      spotify={spotify}
      backHref={`/h/${house.id}`}
      backLabel={`back to ${house.name}`}
      myRoomHref={!mine && myRoom != null ? `/h/${house.id}/room/${myRoom}` : null}
    />
  )
}
