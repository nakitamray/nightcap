import { notFound, redirect } from 'next/navigation'
import { RoomView } from '@/components/room/RoomView'
import { roomIndex } from '@/lib/house'
import { loadHouse } from '@/lib/houseData'
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

  const { members: everyone, people, seen, housemates } = await loadHouse(supabase, id)
  const owner = everyone.find((m) => m.room === room)
  // nobody lives here yet; the house is where you claim it
  if (!owner) redirect(`/h/${id}`)
  const mine = owner.user_id === userId
  const myRoom = everyone.find((m) => m.user_id === userId)?.room ?? null

  const person = people.find((p) => p.id === owner.user_id)
  const pins = people
    .filter((p) => p.id !== owner.user_id && p.lat != null && p.lon != null)
    .map((p) => ({ lat: p.lat as number, lon: p.lon as number, name: p.display_name }))

  // your notes if it's your room, or what they're playing if it's theirs
  const notes = mine
    ? await supabase
        .from('notes')
        .select('id, from_user, body, created_at, read_at')
        .eq('house_id', id)
        .eq('to_user', userId)
        .order('created_at', { ascending: false })
        .limit(50)
    : null
  if (notes?.error) console.error(`room ${id}/${room}: notes`, notes.error)
  const playing = mine
    ? null
    : await supabase
        .from('now_playing')
        .select('title, artist, art, url, updated_at')
        .eq('user_id', owner.user_id)
        .maybeSingle()
  if (playing?.error) console.error(`room ${id}/${room}: now playing`, playing.error)

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
      ownerId={owner.user_id}
      initialLayout={readLayout(owner.layout, room)}
      place={{ city: person?.city ?? '', lat: person?.lat ?? null, lon: person?.lon ?? null }}
      pins={pins}
      housemates={housemates}
      initialSeen={seen}
      initialNotes={(notes?.data ?? []).map((n) => ({
        id: n.id,
        from: n.from_user,
        fromName: housemates.find((h) => h.id === n.from_user)?.name ?? 'someone',
        body: n.body,
        createdAt: n.created_at,
        read: !!n.read_at,
      }))}
      initialOwnerTrack={
        playing?.data
          ? {
              title: playing.data.title,
              artist: playing.data.artist,
              art: playing.data.art,
              url: playing.data.url,
              at: playing.data.updated_at,
            }
          : null
      }
      spotify={spotify}
      backHref={`/h/${house.id}`}
      backLabel={`back to ${house.name}`}
      myRoomHref={!mine && myRoom != null ? `/h/${house.id}/room/${myRoom}` : null}
    />
  )
}
