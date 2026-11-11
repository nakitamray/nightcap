'use client'

import type { Guest, ThemeId } from '@nightcap/scene'
import Link from 'next/link'
import { useRef } from 'react'
import styles from '@/components/room/Room.module.css'
import { SceneFailed } from '@/components/SceneFailed'
import { useLoungeScene } from './useLoungeScene'

interface Props {
  theme: ThemeId
  /** the house id, so the living room looks the same every visit */
  seed: string
  people: Guest[]
  backHref: string
  backLabel: string
  myRoomHref?: string | null
}

/** the house's living room: whoever's in, on the sofas and cushions */
export function LoungeView({ theme, seed, people, backHref, backLabel, myRoomHref }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const { ready, failed } = useLoungeScene(hostRef, { theme, seed, people })
  const count = people.length

  return (
    <main className={styles.page}>
      <div ref={hostRef} className={styles.scene} data-ready={ready} />
      {failed && <SceneFailed what="the living room" />}

      <header className={styles.top}>
        <Link className={styles.button} href={backHref}>
          {backLabel}
        </Link>
        <span className={styles.title}>the living room</span>
        {myRoomHref ? (
          <Link className={styles.button} href={myRoomHref}>
            go to my room
          </Link>
        ) : (
          <span />
        )}
      </header>

      <p className={styles.nowPlaying} aria-live="polite">
        {count === 0
          ? 'nobody in just now'
          : count === 1
            ? `just ${people[0]!.name} in here`
            : `${count} of you in here`}
      </p>

      {/* the canvas can't be read out, so here's who's in */}
      <ul className="sr-only">
        {people.map((p) => (
          <li key={p.id}>{p.me ? `${p.name} (you)` : p.name}</li>
        ))}
      </ul>
    </main>
  )
}
