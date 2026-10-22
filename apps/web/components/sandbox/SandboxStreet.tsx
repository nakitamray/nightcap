'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useRef } from 'react'
import houseStyles from '@/components/HouseView.module.css'
import streetStyles from '@/components/Street.module.css'
import { useStreetScene } from '@/components/useStreetScene'
import { WindowCard } from '@/components/WindowCard'
import { demoRooms, marqueeFor, type Member } from '@/lib/house'
import { THEME_NAMES, THEMES, type Theme } from '@/lib/themes'

/**
 * The street for the demo and dev mode: a house of made-up friends, every
 * window a room you can look into. Same as a real house, minus the saving.
 */
export function SandboxStreet({ theme, base }: { theme: Theme; base: '/demo' | '/dev' }) {
  const router = useRouter()
  const hostRef = useRef<HTMLDivElement>(null)
  const open = useCallback(
    (index: number) => router.push(`${base}/${theme}/room/${index}`),
    [router, base, theme],
  )
  const { hover, ready } = useStreetScene(hostRef, demoRooms, marqueeFor(theme), theme, open)

  const residents = demoRooms.filter((r): r is Member => r !== null)
  const home = residents.filter((r) => r.home).length
  const hovered = hover ? (demoRooms[hover.index] ?? null) : null

  return (
    <main className={streetStyles.street}>
      <div ref={hostRef} className={streetStyles.canvas} data-ready={ready} />
      {hover && <WindowCard member={hovered} bounds={hover.bounds} />}

      <nav className={houseStyles.controls} data-ready={ready}>
        <Link className={houseStyles.button} href={base === '/dev' ? '/dev' : '/'}>
          {base === '/dev' ? 'all cities' : 'sign in'}
        </Link>
        <span className={houseStyles.name}>{THEME_NAMES[theme]}</span>
      </nav>

      <footer className={streetStyles.footer} data-ready={ready}>
        <p className={streetStyles.count}>
          <span className={streetStyles.number}>{home}</span> of {residents.length} home
        </p>
        <p className={streetStyles.hint}>click any window to look inside</p>
      </footer>

      <nav className={streetStyles.themes} data-ready={ready} aria-label="Street">
        {THEMES.map((id) => (
          <Link key={id} href={`${base}/${id}`} aria-current={id === theme ? 'page' : undefined}>
            {THEME_NAMES[id]}
          </Link>
        ))}
      </nav>

      {/* the canvas isn't keyboard friendly, so every room is a link here too */}
      <ul className="sr-only">
        {demoRooms.map((room, i) => (
          <li key={i}>
            <Link href={`${base}/${theme}/room/${i}`}>
              {room ? `${room.name}'s room` : `empty room ${i + 1}`}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
