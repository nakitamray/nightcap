'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { settle, type Layout } from '@/lib/room'
import type { Theme } from '@/lib/themes'
import { Panel, type Place } from './Panel'
import { RoomScene, type Thing } from './RoomScene'
import type { Pin } from './WorldMap'
import styles from './Room.module.css'

export interface Track {
  title: string
  artist: string
  art: string | null
  url: string | null
}

interface Props {
  houseId: string
  houseName: string
  userId: string
  theme: Theme
  initialLayout: Layout
  place: Place
  housemates: Pin[]
  spotify: 'off' | 'unlinked' | 'linked'
}

const THINGS: [Thing, string][] = [
  ['bed', 'bed'],
  ['wall', 'walls'],
  ['window', 'window'],
  ['frames', 'frames'],
  ['lamp', 'lamp'],
  ['rug', 'rug'],
  ['desk', 'desk'],
  ['led', 'lights'],
]

export function RoomView({
  houseId,
  houseName,
  userId,
  theme,
  initialLayout,
  place: initialPlace,
  housemates,
  spotify,
}: Props) {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [layout, setLayout] = useState(initialLayout)
  const [open, setOpen] = useState<Thing | null>(null)
  const [saved, setSaved] = useState<'saved' | 'saving' | 'error'>('saved')
  const [place, setPlace] = useState(initialPlace)
  const [track, setTrack] = useState<Track | null>(null)
  const first = useRef(true)

  function change(next: Layout) {
    setLayout(settle(next))
  }

  // save a moment after the last change rather than on every click
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setSaved('saving')
    const t = setTimeout(async () => {
      const { error } = await supabase
        .from('memberships')
        .update({ layout })
        .eq('house_id', houseId)
        .eq('user_id', userId)
      setSaved(error ? 'error' : 'saved')
    }, 700)
    return () => clearTimeout(t)
  }, [layout, supabase, houseId, userId])

  // what's on the record player
  useEffect(() => {
    if (spotify !== 'linked') return
    let stop = false
    async function poll() {
      const res = await fetch('/api/spotify/now-playing').catch(() => null)
      const body = res?.ok ? await res.json() : null
      if (!stop) setTrack(body?.playing ? body.track : null)
    }
    poll()
    const t = setInterval(poll, 20_000)
    return () => {
      stop = true
      clearInterval(t)
    }
  }, [spotify])

  const pins: Pin[] = useMemo(
    () => [
      ...housemates,
      ...(place.lat != null && place.lon != null
        ? [{ lat: place.lat, lon: place.lon, name: 'you', me: true }]
        : []),
    ],
    [housemates, place],
  )

  return (
    <main className={styles.page}>
      <RoomScene
        layout={layout}
        theme={theme}
        seed={houseId}
        playing={!!track}
        pins={pins}
        onPick={setOpen}
      />

      <header className={styles.top}>
        <Link className={styles.button} href={`/h/${houseId}`}>
          back to {houseName}
        </Link>
        <span className={styles.saved} aria-live="polite">
          {saved === 'saving' ? 'saving…' : saved === 'error' ? 'couldn’t save, try again' : ''}
        </span>
      </header>

      {track && (
        <p className={styles.nowPlaying}>
          ♪ {track.title} · {track.artist}
        </p>
      )}

      {open && (
        <Panel
          thing={open}
          layout={layout}
          onChange={change}
          onClose={() => setOpen(null)}
          spotify={spotify}
          track={track}
          houseId={houseId}
          userId={userId}
          place={place}
          onPlace={setPlace}
        />
      )}

      <nav className={styles.things} aria-label="change your room">
        {THINGS.map(([thing, label]) => (
          <button
            key={thing}
            type="button"
            className={styles.button}
            data-on={open === thing}
            onClick={() => setOpen(open === thing ? null : thing)}
          >
            {label}
          </button>
        ))}
      </nav>
    </main>
  )
}
