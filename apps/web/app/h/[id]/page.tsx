import Link from 'next/link'
import { notFound } from 'next/navigation'
import { WindowCardFrame } from '@/components/WindowCardFrame'
import { WindowWallBackground } from '@/components/WindowWallBackground'
import styles from '@/components/NightCard.module.css'
import { HouseView } from '@/components/HouseView'
import type { Member } from '@/lib/house'
import { spotifyConfigured } from '@/lib/spotify'
import { currentUserId, supabaseServer } from '@/lib/supabase/server'
import type { HouseRow } from '@/lib/supabase/types'
import { isTheme } from '@/lib/themes'

export const metadata = { title: 'Nightcap' }

export default async function HousePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await currentUserId()
  const supabase = await supabaseServer()

  // row level security means this comes back empty unless you live here
  const { data: house, error } = await supabase
    .from('houses')
    .select('id, name, theme, marquee, created_at, keep_until')
    .eq('id', id)
    .maybeSingle<HouseRow>()
  // a real error (permissions, a missing table) shouldn't pretend to be a 404
  if (error) return <HouseError message={error.message} />
  if (!house || !userId) notFound()

  const { data: rooms, error: roomsError } = await supabase
    .from('memberships')
    .select('user_id, room, curtains')
    .eq('house_id', id)
  if (roomsError) return <HouseError message={roomsError.message} />
  const ids = (rooms ?? []).map((r) => r.user_id)
  const [people, presence, playing, notes, spotify] = await Promise.all([
    supabase.from('profiles').select('id, display_name, city, time_zone').in('id', ids),
    supabase.from('presence').select('user_id, seen_at, place').eq('house_id', id),
    supabase.from('now_playing').select('user_id, title, artist, updated_at').in('user_id', ids),
    supabase
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('house_id', id)
      .eq('to_user', userId)
      .is('read_at', null),
    spotifyConfigured()
      ? supabase.from('spotify_links').select('user_id').eq('user_id', userId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])
  // the street still works without names, lights or music, so note these and carry on
  for (const [what, r] of Object.entries({ people, presence, playing, notes, spotify }))
    if (r.error) console.error(`house ${id}: ${what}`, r.error)
  const seen = Object.fromEntries(
    (presence.data ?? []).map((p) => [p.user_id, { at: p.seen_at, place: p.place }]),
  )
  const songs = Object.fromEntries(
    (playing.data ?? []).map((p) => [
      p.user_id,
      { title: p.title, artist: p.artist, at: p.updated_at },
    ]),
  )
  const waiting = (rooms ?? []).length < 2
  const goesAt = waiting
    ? new Date(
        Math.max(
          Date.parse(house.created_at) + 7 * 24 * 3600_000,
          house.keep_until ? Date.parse(house.keep_until) : 0,
        ),
      ).toISOString()
    : null

  const members: (Member | null)[] = Array.from({ length: 12 }, () => null)
  const roomless: { id: string; name: string }[] = []
  for (const r of rooms ?? []) {
    const p = people.data?.find((p) => p.id === r.user_id)
    // people who haven't picked a room yet don't light up a window
    if (r.room == null) {
      roomless.push({ id: r.user_id, name: p?.display_name ?? '?' })
      continue
    }
    members[r.room] = {
      id: r.user_id,
      name: p?.display_name ?? '?',
      city: p?.city ?? '',
      timeZone: p?.time_zone ?? 'UTC',
      // lights come from check-ins, worked out on the client as time passes
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
      roomless={roomless}
      initialSeen={seen}
      initialPlaying={songs}
      unreadNotes={notes.count ?? 0}
      spotify={!!spotify.data}
      goesAt={goesAt}
      marquee={marquee}
      theme={isTheme(house.theme) ? house.theme : 'paris'}
    />
  )
}

function HouseError({ message }: { message: string }) {
  return (
    <main className={styles.page}>
      <WindowWallBackground />
      <WindowCardFrame>
        <h1 className={styles.title}>HM.</h1>
        <p className={styles.lede}>the house wouldn&apos;t open</p>
        <p className={styles.note}>{message}</p>
        <p className={styles.note}>
          <Link className={styles.link} href="/keys">
            try again
          </Link>
        </p>
      </WindowCardFrame>
    </main>
  )
}
