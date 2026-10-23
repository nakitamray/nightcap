'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Member } from '@/lib/house'
import { isHome } from '@/lib/presence'
import { stillPlaying, whereabouts, type Seen } from '@/lib/together'
import type { Theme } from '@/lib/themes'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { ClaimCard } from './ClaimCard'
import { InviteButton } from './InviteButton'
import styles from './HouseView.module.css'
import streetStyles from './Street.module.css'
import { useCheckIn } from './useCheckIn'
import { useHouseChannel } from './useHouseChannel'
import { useNowPlaying } from './useNowPlaying'
import { useStreetScene } from './useStreetScene'
import notesStyles from './notes/Notes.module.css'
import { WindowCard } from './WindowCard'

interface Props {
  houseId: string
  houseName: string
  userId: string
  initialRooms: (Member | null)[]
  /** people who live here but haven't picked a window yet */
  roomless: { id: string; name: string }[]
  /** when each person last had the house open, and where in it, by user id */
  initialSeen: Record<string, Seen>
  /** what each person's playing, by user id */
  initialPlaying: Record<string, { title: string; artist: string; at: string }>
  /** notes under your door you haven't read */
  unreadNotes: number
  /** whether you've hooked up spotify, so the street can share what you're playing */
  spotify: boolean
  /** a house still waiting for a friend goes away at this point */
  goesAt: string | null
  marquee: string[]
  theme: Theme
}

export function HouseView({
  houseId,
  houseName,
  userId,
  initialRooms,
  roomless,
  initialSeen,
  initialPlaying,
  unreadNotes,
  spotify,
  goesAt: initialGoesAt,
  marquee,
  theme,
}: Props) {
  const router = useRouter()
  const supabase = useMemo(() => supabaseBrowser(), [])
  const hostRef = useRef<HTMLDivElement>(null)
  const [members, setMembers] = useState(initialRooms)
  const [seen, setSeen] = useState(initialSeen)
  const [playing, setPlaying] = useState(initialPlaying)
  const [unread, setUnread] = useState(unreadNotes)
  const [goesAt, setGoesAt] = useState(initialGoesAt)
  const [now, setNow] = useState(() => Date.now())
  const [problem, setProblem] = useState('')

  // a window's light is on while that person has the house open (see presence.ts)
  const rooms = useMemo(() => {
    const names = members.map((m) => m?.name ?? null)
    return members.map((m, i): Member | null => {
      if (!m) return null
      const home = m.id === userId || isHome(seen[m.id]?.at, now)
      const song = playing[m.id]
      return {
        ...m,
        home,
        where: home ? whereabouts(m.id === userId ? 'street' : seen[m.id]?.place, i, names) : null,
        playing: song && stillPlaying(song.at, now) ? `${song.title} · ${song.artist}` : null,
      }
    })
  }, [members, seen, playing, now, userId])

  const myRoom = members.findIndex((m) => m?.id === userId)

  const me = myRoom >= 0 ? members[myRoom] : null

  // you can only touch your own curtains
  async function toggleCurtains() {
    if (!me) return
    const curtains = me.curtains === 'open' ? 'drawn' : 'open'
    const before = me.curtains
    setMembers((prev) => prev.map((m, i) => (i === myRoom && m ? { ...m, curtains } : m)))
    // everyone else hears about it from the database, once it's really saved
    const { error } = await supabase
      .from('memberships')
      .update({ curtains })
      .eq('house_id', houseId)
      .eq('user_id', userId)
    if (error) {
      console.error('saving curtains', error)
      setMembers((prev) => prev.map((m, i) => (i === myRoom && m ? { ...m, curtains: before } : m)))
      setProblem('couldn’t move your curtains, try again')
    }
  }

  const [claiming, setClaiming] = useState<number | null>(null)
  const [claimError, setClaimError] = useState('')

  // a lit window is someone's room to look round; a dark one is up for grabs
  const goInside = useCallback(
    (index: number) => {
      if (members[index]) router.push(`/h/${houseId}/room/${index}`)
      else {
        setClaimError('')
        setClaiming(index)
      }
    },
    [members, router, houseId],
  )

  async function claim() {
    if (claiming === null) return
    const { error } = await supabase.rpc('claim_room', { h: houseId, wanted: claiming })
    if (error) return setClaimError(error.message)
    setClaiming(null)
    router.refresh()
  }

  const { hover, ready } = useStreetScene(hostRef, rooms, marquee, theme, goInside)

  // you're out front looking at the house; lights go out as check-ins get old
  useCheckIn(supabase, houseId, 'street')
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 20_000)
    return () => clearInterval(tick)
  }, [])
  // and if you're listening to something, the house can see it from here too
  useNowPlaying(spotify)

  useHouseChannel(supabase, houseId, {
    onSeen: (id, s) => setSeen((prev) => ({ ...prev, [id]: s })),
    onCurtains: (id, curtains) =>
      setMembers((prev) => prev.map((m) => (m && m.id === id ? { ...m, curtains } : m))),
    onNote: (note, event) => {
      if (note.to_user !== userId) return
      if (event === 'INSERT') setUnread((n) => n + 1)
      else if (event === 'UPDATE' && note.read_at) setUnread((n) => Math.max(0, n - 1))
    },
    onPlaying: (id, row) =>
      setPlaying((prev) => {
        const next = { ...prev }
        if (row) next[id] = { title: row.title, artist: row.artist, at: row.updated_at }
        else delete next[id]
        return next
      }),
  })

  async function keepHouse() {
    const { data, error } = await supabase.rpc('keep_house', { h: houseId })
    if (error) return setProblem(error.message)
    setGoesAt(data as string)
  }

  // first visit: pick up your time zone from the browser so friends see your local time
  useEffect(() => {
    const me = initialRooms.find((m) => m?.id === userId)
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (me && me.timeZone === 'UTC' && zone && zone !== 'UTC') {
      supabase
        .from('profiles')
        .update({ time_zone: zone })
        .eq('id', userId)
        .then(({ error }) => {
          if (error) return console.error('saving time zone', error)
          setMembers((prev) => prev.map((m) => (m?.id === userId ? { ...m, timeZone: zone } : m)))
        })
    }
  }, [initialRooms, supabase, userId])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const residents = rooms.filter((r): r is Member => r !== null)
  const everyone = residents.length + roomless.length
  const unplaced = roomless.filter((p) => p.id !== userId).map((p) => p.name)
  const home = residents.filter((r) => r.home).length
  const hovered = hover ? (rooms[hover.index] ?? null) : null

  return (
    <main className={streetStyles.street}>
      <div ref={hostRef} className={streetStyles.canvas} data-ready={ready} />

      {hover && <WindowCard member={hovered} bounds={hover.bounds} />}

      {everyone < 2 && (
        <p className={styles.banner} data-ready={ready}>
          just you in here so far. a house sticks around once a friend moves in
          {goesAt && <> · until then it&apos;s here till {new Date(goesAt).toLocaleDateString()}</>}
          {' · '}
          <button type="button" className={styles.inline} onClick={keepHouse}>
            give it another week
          </button>
        </p>
      )}

      {problem && (
        <p className={styles.banner} data-ready={ready} role="alert" onClick={() => setProblem('')}>
          {problem}
        </p>
      )}

      {claiming !== null && (
        <ClaimCard
          movingHouse={myRoom >= 0}
          error={claimError}
          onClaim={claim}
          onCancel={() => setClaiming(null)}
        />
      )}

      <nav className={styles.controls} data-ready={ready}>
        <Link className={styles.button} href="/keys">
          keyring
        </Link>
        <span className={styles.name}>{houseName}</span>
        <Link className={styles.button} href={`/h/${houseId}/lounge`}>
          living room
        </Link>
        {me && (
          <>
            <Link className={styles.button} href={`/h/${houseId}/room/${myRoom}`}>
              {unread > 0 ? (
                <span className={notesStyles.badge}>
                  go to my room <b aria-label={`${unread} new notes`}>{unread}</b>
                </span>
              ) : (
                'go to my room'
              )}
            </Link>
            <button type="button" className={styles.button} onClick={toggleCurtains}>
              {me.curtains === 'open' ? 'draw my curtains' : 'open my curtains'}
            </button>
          </>
        )}
        <InviteButton houseId={houseId} userId={userId} />
        <button type="button" className={styles.button} onClick={signOut}>
          sign out
        </button>
      </nav>

      <footer className={streetStyles.footer} data-ready={ready}>
        <p className={streetStyles.count}>
          <span className={streetStyles.number}>{home}</span> of {residents.length} home
        </p>
        <p className={streetStyles.hint}>
          {myRoom >= 0 ? 'click a window to look inside' : 'click an empty window to make it yours'}
          {unplaced.length > 0 && ` · ${listNames(unplaced)} still picking a room`}
        </p>
      </footer>
      {/* the windows only exist in the canvas, so here they are again as buttons */}
      <ul className="sr-only" aria-label="windows">
        {rooms.map((m, i) => (
          <li key={i}>
            <button type="button" onClick={() => goInside(i)}>
              {m
                ? `${m.id === userId ? 'your room' : `${m.name}'s room`}, ${m.home ? 'home' : 'out'}, curtains ${m.curtains}`
                : `room ${i + 1} is empty, claim it`}
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}

function listNames(names: string[]) {
  if (names.length === 1) return `${names[0]} is`
  if (names.length === 2) return `${names[0]} and ${names[1]} are`
  return `${names.slice(0, 2).join(', ')} and ${names.length - 2} more are`
}
