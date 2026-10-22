'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Member } from '@/lib/house'
import { BEAT_MS, isHome } from '@/lib/presence'
import type { Theme } from '@/lib/themes'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { ClaimCard } from './ClaimCard'
import { InviteButton } from './InviteButton'
import styles from './HouseView.module.css'
import streetStyles from './Street.module.css'
import { useStreetScene } from './useStreetScene'
import { WindowCard } from './WindowCard'

interface Props {
  houseId: string
  houseName: string
  userId: string
  initialRooms: (Member | null)[]
  /** people who live here but haven't picked a window yet */
  roomless: { id: string; name: string }[]
  /** when each person last had the house open, by user id */
  initialSeen: Record<string, string>
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
  marquee,
  theme,
}: Props) {
  const router = useRouter()
  const supabase = useMemo(() => supabaseBrowser(), [])
  const hostRef = useRef<HTMLDivElement>(null)
  const [members, setMembers] = useState(initialRooms)
  const [seen, setSeen] = useState(initialSeen)
  const [now, setNow] = useState(() => Date.now())
  const [problem, setProblem] = useState('')

  // a window's light is on while that person has the house open (see presence.ts)
  const rooms = useMemo(
    () =>
      members.map((m) => (m ? { ...m, home: m.id === userId || isHome(seen[m.id], now) } : null)),
    [members, seen, now, userId],
  )

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

  // check in while the house is on screen, and once more whenever it comes back
  useEffect(() => {
    async function beat() {
      if (document.visibilityState !== 'visible') return
      const { error } = await supabase.rpc('here', { h: houseId })
      if (error) console.error('checking in', error)
    }
    beat()
    const t = setInterval(beat, BEAT_MS)
    document.addEventListener('visibilitychange', beat)
    // lights go out on their own as check-ins get old
    const tick = setInterval(() => setNow(Date.now()), 20_000)
    return () => {
      clearInterval(t)
      clearInterval(tick)
      document.removeEventListener('visibilitychange', beat)
    }
  }, [supabase, houseId])

  // lights and curtains arrive as database changes, on a channel only people
  // who live here can join; realtime checks each row against its own rules
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let stopped = false
    supabase.realtime.setAuth().then(() => {
      if (stopped) return
      channel = supabase
        .channel(`house:${houseId}`, { config: { private: true } })
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'presence', filter: `house_id=eq.${houseId}` },
          ({ new: row }) => {
            const r = row as { user_id?: string; seen_at?: string }
            if (r.user_id && r.seen_at) setSeen((prev) => ({ ...prev, [r.user_id!]: r.seen_at! }))
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'memberships',
            filter: `house_id=eq.${houseId}`,
          },
          ({ new: row }) => {
            const r = row as { user_id: string; curtains: Member['curtains'] }
            setMembers((prev) =>
              prev.map((m) => (m && m.id === r.user_id ? { ...m, curtains: r.curtains } : m)),
            )
          },
        )
        .subscribe((status, err) => {
          if (err) console.error('house channel', status, err)
        })
    })
    return () => {
      stopped = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [supabase, houseId])

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
          just you in here so far. this house only sticks around once a friend moves in
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
        {me && (
          <>
            <Link className={styles.button} href={`/h/${houseId}/room/${myRoom}`}>
              go to my room
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
