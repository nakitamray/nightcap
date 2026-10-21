'use client'

import type { Pin, ThemeId, Thing } from '@nightcap/scene'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { settle, type Layout } from '@/lib/room'
import { localStore, supabaseStore } from '@/lib/roomStore'
import { Panel, type Place } from './Panel'
import { useRoomScene } from './useRoomScene'
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
  theme: ThemeId
  initialLayout: Layout
  place: Place
  housemates: Pin[]
  spotify: 'off' | 'unlinked' | 'linked' | 'dev'
  /** dev mode: save to this browser instead of the database */
  dev?: boolean
  backHref?: string
}

const THINGS: [Thing, string][] = [
  ['bed', 'bed'],
  ['wall', 'walls'],
  ['window', 'window'],
  ['frames', 'pictures'],
  ['lamp', 'lamp'],
  ['rug', 'rug'],
  ['desk', 'desk'],
  ['led', 'lights'],
  ['vinyl', 'record'],
  ['map', 'map'],
]

const FAKE_TRACK: Track = { title: 'La Vie en rose', artist: 'Édith Piaf', art: null, url: null }

export function RoomView({
  houseId,
  houseName,
  userId,
  theme,
  initialLayout,
  place: initialPlace,
  housemates,
  spotify,
  dev = false,
  backHref,
}: Props) {
  const store = useMemo(
    () => (dev ? localStore(`${theme}`) : supabaseStore(houseId, userId)),
    [dev, theme, houseId, userId],
  )
  const hostRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState(initialLayout)
  const [open, setOpen] = useState<Thing | null>(null)
  const [saved, setSaved] = useState<'saved' | 'saving' | 'error'>('saved')
  const [place, setPlace] = useState(initialPlace)
  const [track, setTrack] = useState<Track | null>(null)
  const first = useRef(true)

  // save a moment after the last change rather than on every click
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setSaved('saving')
    const t = setTimeout(
      async () => setSaved((await store.saveLayout(layout)) ? 'saved' : 'error'),
      700,
    )
    return () => clearTimeout(t)
  }, [layout, store])

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

  const ready = useRoomScene(
    hostRef,
    { layout, theme, seed: houseId, playing: !!track, pins },
    setOpen,
  )

  return (
    <main className={styles.page}>
      <div ref={hostRef} className={styles.scene} data-ready={ready} />

      <header className={styles.top}>
        <Link className={styles.button} href={backHref ?? `/h/${houseId}`}>
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
          onChange={(next) => setLayout(settle(next))}
          onClose={() => setOpen(null)}
          spotify={spotify}
          track={track}
          onFakePlay={() => setTrack((t) => (t ? null : FAKE_TRACK))}
          houseId={houseId}
          store={store}
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
