import { notFound, redirect } from 'next/navigation'
import { RoomView } from '@/components/room/RoomView'
import { readLayout } from '@/lib/room'
import { spotifyConfigured } from '@/lib/spotify'
import { currentUserId, supabaseServer } from '@/lib/supabase/server'
import { isTheme } from '@/lib/themes'

export const metadata = { title: 'Your room · Nightcap' }

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await currentUserId()
  const supabase = await supabaseServer()

  const { data: house } = await supabase
    .from('houses')
    .select('id, name, theme')
    .eq('id', id)
    .maybeSingle()
  if (!house || !userId) notFound()

  const { data: me } = await supabase
    .from('memberships')
    .select('room, layout')
    .eq('house_id', id)
    .eq('user_id', userId)
    .maybeSingle()
  // no room yet, nothing to decorate -- go pick one
  if (!me || me.room == null) redirect(`/h/${id}`)

  const { data: everyone } = await supabase.from('memberships').select('user_id').eq('house_id', id)
  const { data: people } = await supabase
    .from('profiles')
    .select('id, display_name, city, lat, lon')
    .in(
      'id',
      (everyone ?? []).map((m) => m.user_id),
    )
  const mine = people?.find((p) => p.id === userId)
  const housemates = (people ?? [])
    .filter((p) => p.id !== userId && p.lat != null && p.lon != null)
    .map((p) => ({ lat: p.lat as number, lon: p.lon as number, name: p.display_name }))

  let spotify: 'off' | 'unlinked' | 'linked' = 'off'
  if (spotifyConfigured()) {
    const { data } = await supabase
      .from('spotify_links')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
    spotify = data ? 'linked' : 'unlinked'
  }

  return (
    <RoomView
      houseId={house.id}
      houseName={house.name}
      userId={userId}
      theme={isTheme(house.theme) ? house.theme : 'paris'}
      room={me.room}
      initialLayout={readLayout(me.layout, me.room)}
      place={{ city: mine?.city ?? '', lat: mine?.lat ?? null, lon: mine?.lon ?? null }}
      housemates={housemates}
      spotify={spotify}
    />
  )
}
