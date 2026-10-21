'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Member } from '@/lib/house'
import { supabaseBrowser } from '@/lib/supabase/browser'
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
  marquee: string[]
}

export function HouseView({ houseId, houseName, userId, initialRooms, marquee }: Props) {
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

  const toggleCurtains = useCallback(
    async (index: number) => {
      // you can only touch your own curtains
      if (index !== myRoom) return
      const me = members[index]
      if (!me) return
      const curtains = me.curtains === 'open' ? 'drawn' : 'open'
      setMembers((prev) => prev.map((m, i) => (i === index && m ? { ...m, curtains } : m)))
      await supabase.from('memberships').update({ curtains }).eq('house_id', houseId).eq('user_id', userId)
      channelRef.current?.send({ type: 'broadcast', event: 'curtains', payload: { userId, curtains } })
    },
    [members, myRoom, supabase, houseId, userId],
  )

  const { hover, ready } = useStreetScene(hostRef, rooms, marquee, toggleCurtains)

  // presence: everyone with the house open is "home"
  useEffect(() => {
    const channel = supabase.channel(`house:${houseId}`, { config: { presence: { key: userId } } })
    channelRef.current = channel
    channel
      .on('presence', { event: 'sync' }, () => setOnline(new Set(Object.keys(channel.presenceState()))))
      .on('broadcast', { event: 'curtains' }, ({ payload }) => {
        setMembers((prev) => prev.map((m) => (m && m.id === payload.userId ? { ...m, curtains: payload.curtains } : m)))
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
      supabase.from('profiles').update({ time_zone: zone }).eq('id', userId).then(() => {
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
  const home = residents.filter((r) => r.home).length
  const hovered = hover ? (rooms[hover.index] ?? null) : null

  return (
    <main className={streetStyles.street}>
      <div ref={hostRef} className={streetStyles.canvas} data-ready={ready} />

      {hover && <WindowCard member={hovered} bounds={hover.bounds} />}

      <nav className={styles.controls} data-ready={ready}>
        <span className={styles.name}>{houseName}</span>
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
          {myRoom >= 0 ? 'click your own window to open or draw the curtains' : ''}
        </p>
      </footer>
    </main>
  )
}
