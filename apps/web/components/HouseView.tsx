'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Member } from '@/lib/house'
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
  marquee: string[]
  theme: Theme
}

export function HouseView({
  houseId,
  houseName,
  userId,
  initialRooms,
  roomless,
  marquee,
  theme,
}: Props) {
  const router = useRouter()
  const supabase = useMemo(() => supabaseBrowser(), [])
  const hostRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const [members, setMembers] = useState(initialRooms)
  const [online, setOnline] = useState<Set<string>>(new Set())

  // a window's light is on when that person actually has the site open
  const rooms = useMemo(
    () => members.map((m) => (m ? { ...m, home: online.has(m.id) } : null)),
    [members, online],
  )

  const myRoom = members.findIndex((m) => m?.id === userId)

  const me = myRoom >= 0 ? members[myRoom] : null

  // you can only touch your own curtains
  async function toggleCurtains() {
    if (!me) return
    const curtains = me.curtains === 'open' ? 'drawn' : 'open'
    setMembers((prev) => prev.map((m, i) => (i === myRoom && m ? { ...m, curtains } : m)))
    await supabase
      .from('memberships')
      .update({ curtains })
      .eq('house_id', houseId)
      .eq('user_id', userId)
    channelRef.current?.send({
      type: 'broadcast',
      event: 'curtains',
      payload: { userId, curtains },
    })
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

  // presence: everyone with the house open is "home"
  useEffect(() => {
    const channel = supabase.channel(`house:${houseId}`, { config: { presence: { key: userId } } })
    channelRef.current = channel
    channel
      .on('presence', { event: 'sync' }, () =>
        setOnline(new Set(Object.keys(channel.presenceState()))),
      )
      .on('broadcast', { event: 'curtains' }, ({ payload }) => {
        setMembers((prev) =>
          prev.map((m) =>
            m && m.id === payload.userId ? { ...m, curtains: payload.curtains } : m,
          ),
        )
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') channel.track({ since: Date.now() })
      })
    return () => {
      channelRef.current = null
      supabase.removeChannel(channel)
    }
  }, [supabase, houseId, userId])

  // first visit: pick up your time zone from the browser so friends see your local time
  useEffect(() => {
    const me = initialRooms.find((m) => m?.id === userId)
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (me && me.timeZone === 'UTC' && zone && zone !== 'UTC') {
      supabase
        .from('profiles')
        .update({ time_zone: zone })
        .eq('id', userId)
        .then(() => {
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
    </main>
  )
}

function listNames(names: string[]) {
  if (names.length === 1) return `${names[0]} is`
  if (names.length === 2) return `${names[0]} and ${names[1]} are`
  return `${names.slice(0, 2).join(', ')} and ${names.length - 2} more are`
}
