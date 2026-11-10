'use client'

import type { Occasion } from '@nightcap/scene/occasions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useRef, useState } from 'react'
import { StepCard } from '@/components/gifts/StepCard'
import houseStyles from '@/components/HouseView.module.css'
import streetStyles from '@/components/Street.module.css'
import { useStreetScene } from '@/components/useStreetScene'
import { WindowCard } from '@/components/WindowCard'
import { stepGifts, type Gift } from '@/lib/gifts'
import { demoRooms, marqueeFor, SANDBOX_ME, type Member } from '@/lib/house'
import { occasionLine } from '@/lib/moments'
import { THEME_NAMES, THEMES, type Theme } from '@/lib/themes'

const ME = demoRooms[SANDBOX_ME]!.id

const DEMO_GIFTS: Gift[] = [
  ['1', 'flowers', 'priya', 'Priya', ME, 'Nakita'],
  ['2', 'cake', 'ellie', 'Ellie', 'sam', 'Sam'],
  ['3', 'record', 'dev', 'Dev', ME, 'Nakita'],
].map(([id, kind, from, fromName, to, toName], i) => ({
  id: id!,
  kind: kind as Gift['kind'],
  from: from!,
  fromName: fromName!,
  to: to!,
  toName: toName!,
  createdAt: `2026-11-0${i + 1}T20:00:00Z`,
}))

/**
 * The street for the demo and dev mode: a house of made-up friends, every
 * window a room you can look into. Same as a real house, minus the saving.
 */
export function SandboxStreet({
  theme,
  base,
  occasion = null,
}: {
  theme: Theme
  base: '/demo' | '/dev'
  /** dress the street up, for trying the occasions out */
  occasion?: Occasion | null
}) {
  const router = useRouter()
  const hostRef = useRef<HTMLDivElement>(null)
  const open = useCallback(
    (index: number) => router.push(`${base}/${theme}/room/${index}`),
    [router, base, theme],
  )
  const [gifts, setGifts] = useState(DEMO_GIFTS)
  const [stepOpen, setStepOpen] = useState(false)
  const onStep = useMemo(() => stepGifts(gifts, ME), [gifts])
  const marquee = useMemo(
    () => (occasion ? [occasionLine(occasion, 2), ...marqueeFor(theme)] : marqueeFor(theme)),
    [occasion, theme],
  )
  const { hover, ready, stepBounds } = useStreetScene(hostRef, {
    rooms: demoRooms,
    marquee,
    theme,
    gifts: onStep,
    occasion,
    onWindowClick: open,
    onStepClick: () => setStepOpen(true),
  })

  const residents = demoRooms.filter((r): r is Member => r !== null)
  const home = residents.filter((r) => r.home).length
  const hovered = hover ? (demoRooms[hover.index] ?? null) : null

  return (
    <main className={streetStyles.street}>
      <div ref={hostRef} className={streetStyles.canvas} data-ready={ready} />
      {hover && <WindowCard member={hovered} bounds={hover.bounds} />}
      {stepOpen && (
        <StepCard
          gifts={gifts}
          userId={ME}
          bounds={stepBounds()}
          onTakeIn={(id) => setGifts((prev) => prev.filter((g) => g.id !== id))}
          onClose={() => setStepOpen(false)}
        />
      )}

      <nav className={houseStyles.controls} data-ready={ready}>
        <Link className={houseStyles.button} href={base === '/dev' ? '/dev' : '/'}>
          {base === '/dev' ? 'all cities' : 'sign in'}
        </Link>
        <span className={houseStyles.name}>{THEME_NAMES[theme]}</span>
        <Link className={houseStyles.button} href={`${base}/${theme}/lounge`}>
          living room
        </Link>
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
