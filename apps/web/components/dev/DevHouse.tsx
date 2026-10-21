'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { ClaimCard } from '@/components/ClaimCard'
import houseStyles from '@/components/HouseView.module.css'
import streetStyles from '@/components/Street.module.css'
import { useStreetScene } from '@/components/useStreetScene'
import { useWindowClicks } from '@/components/useWindowClicks'
import { WindowCard } from '@/components/WindowCard'
import { demoRooms, marqueeFor, type Member } from '@/lib/house'
import { readLocal } from '@/lib/roomStore'
import { THEME_NAMES, THEMES, type Theme } from '@/lib/themes'

const ME: Member = {
  id: 'me',
  name: 'you',
  city: 'here',
  timeZone: 'UTC',
  home: true,
  curtains: 'open',
}

/**
 * The street in dev mode: the demo friends, two empty rooms, and you. Claim
 * one with a double click, double click it again to go inside. Your pick is
 * remembered in this browser, per city.
 */
export function DevHouse({ theme }: { theme: Theme }) {
  // storage only exists in the browser, so wait for it before drawing anything
  const mounted = useSyncExternalStore(noop, () => true, () => false)
  if (!mounted) return null
  return <DevStreet theme={theme} initial={readLocal<number>(`nightcap:dev:${theme}:room`)} />
}

const noop = () => () => {}

function DevStreet({ theme, initial }: { theme: Theme; initial: number | null }) {
  const router = useRouter()
  const hostRef = useRef<HTMLDivElement>(null)
  const key = `nightcap:dev:${theme}:room`
  const [mine, setMine] = useState<number | null>(initial)
  const [curtains, setCurtains] = useState<Member['curtains']>('open')
  const [claiming, setClaiming] = useState<number | null>(null)

  const rooms = useMemo(() => {
    const r = [...demoRooms]
    if (mine !== null)
      r[mine] = { ...ME, curtains, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
    return r
  }, [mine, curtains])

  const toggle = useCallback(
    (index: number) => {
      if (index === mine) setCurtains((c) => (c === 'open' ? 'drawn' : 'open'))
    },
    [mine],
  )
  const inside = useCallback(
    (index: number) => {
      if (index === mine) router.push(`/dev/${theme}/room`)
      else if (!rooms[index]) setClaiming(index)
    },
    [mine, rooms, router, theme],
  )
  const onClick = useWindowClicks(toggle, inside)
  const { hover, ready } = useStreetScene(hostRef, rooms, marqueeFor(theme), theme, onClick)

  function claim() {
    if (claiming === null) return
    setMine(claiming)
    try {
      localStorage.setItem(key, JSON.stringify(claiming))
    } catch {
      // private window; it just won't be remembered
    }
    setClaiming(null)
  }

  const hovered = hover ? (rooms[hover.index] ?? null) : null

  return (
    <main className={streetStyles.street}>
      <div ref={hostRef} className={streetStyles.canvas} data-ready={ready} />
      {hover && <WindowCard member={hovered} bounds={hover.bounds} />}
      {claiming !== null && (
        <ClaimCard
          movingHouse={mine !== null}
          error=""
          onClaim={claim}
          onCancel={() => setClaiming(null)}
        />
      )}

      <nav className={houseStyles.controls} data-ready={ready}>
        <Link className={houseStyles.button} href="/dev">
          dev mode
        </Link>
        {THEMES.filter((t) => t !== theme).map((t) => (
          <Link key={t} className={houseStyles.button} href={`/dev/${t}`}>
            {THEME_NAMES[t]}
          </Link>
        ))}
        {mine !== null && (
          <Link className={houseStyles.button} href={`/dev/${theme}/room`}>
            your room
          </Link>
        )}
      </nav>

      <footer className={streetStyles.footer} data-ready={ready}>
        <p className={streetStyles.count}>{THEME_NAMES[theme]}, dev mode</p>
        <p className={streetStyles.hint}>
          {mine === null
            ? 'double click an empty window to claim it'
            : 'click your window for the curtains, double click to go inside'}
        </p>
      </footer>
    </main>
  )
}
