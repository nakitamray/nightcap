'use client'

import type { Pin, ThemeId, Thing } from '@nightcap/scene'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { settle, VARIANTS, type Layout } from '@/lib/room'
import { memoryStore, supabaseStore } from '@/lib/roomStore'
import { Panel, type Place } from './Panel'
import { useRoomScene } from './useRoomScene'
import styles from './Room.module.css'

export interface Track {
  title: string
  artist: string
  art: string | null
  url: string | null
}

/**
 * - mine: your own room, saved as you go
 * - visit: someone else's room, look but don't touch
 * - sandbox: the demo and dev mode, change anything but nothing's kept
 */
export type RoomMode = 'mine' | 'visit' | 'sandbox'

interface Props {
  mode: RoomMode
  houseId: string
  userId: string
  theme: ThemeId
  /** which of the house's twelve rooms this is */
  room: number
  /** whose room it is, for the title; null when it's yours */
  owner: string | null
  initialLayout: Layout
  place: Place
  housemates: Pin[]
  spotify: 'off' | 'unlinked' | 'linked' | 'dev'
  /** back out to the street */
  backHref: string
  backLabel: string
  /** your own room in this house, when you're somewhere else */
  myRoomHref?: string | null
  /** where to go to make a real house, shown with the sandbox warning */
  signUpHref?: string
}

const THINGS: [Thing, string][] = [
  ['bed', 'bed'],
  ['nightstand', 'nightstand'],
  ['wall', 'walls'],
  ['window', 'window'],
  ['posters', 'posters'],
  ['furniture', 'furniture'],
  ['lamp', 'lamp'],
  ['rug', 'rug'],
  ['desk', 'desk'],
  ['pet', 'pet'],
  ['led', 'lights'],
  ['vinyl', 'record'],
  ['map', 'map'],
]

const FAKE_TRACK: Track = { title: 'La Vie en rose', artist: 'Édith Piaf', art: null, url: null }

export function RoomView({
  mode,
  houseId,
  userId,
  theme,
  room,
  owner,
  initialLayout,
  place: initialPlace,
  housemates,
  spotify,
  backHref,
  backLabel,
  myRoomHref,
  signUpHref = '/signup',
}: Props) {
  const editable = mode !== 'visit'
  const store = useMemo(
    () => (mode === 'mine' ? supabaseStore(houseId, userId) : memoryStore),
    [mode, houseId, userId],
  )
  const hostRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState(initialLayout)
  const [open, setOpen] = useState<Thing | null>(null)
  const [saved, setSaved] = useState<'saved' | 'saving' | 'error'>('saved')
  const [place, setPlace] = useState(initialPlace)
  const [track, setTrack] = useState<Track | null>(null)
  // the sandbox warning shows the first time you change something
  const [warned, setWarned] = useState<'no' | 'showing' | 'done'>('no')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(saveTimer.current), [])

  // what's on the record player
  useEffect(() => {
    if (mode !== 'mine' || spotify !== 'linked') return
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
  }, [spotify, mode])

  const pins: Pin[] = useMemo(
    () => [
      ...housemates,
      ...(place.lat != null && place.lon != null
        ? [{ lat: place.lat, lon: place.lon, name: owner ?? 'you', me: true }]
        : []),
    ],
    [housemates, place, owner],
  )

  // visitors can look around, but clicking things doesn't open anything
  const pick = useCallback((thing: Thing) => editable && setOpen(thing), [editable])
  const ready = useRoomScene(
    hostRef,
    { layout, theme, seed: houseId, room, playing: !!track, pins, editable },
    pick,
  )

  function change(next: Layout) {
    const settled = settle(next, room)
    setLayout(settled)
    if (mode === 'sandbox' && warned === 'no') setWarned('showing')
    if (mode !== 'mine') return
    // save a moment after the last change rather than on every click
    setSaved('saving')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(
      async () => setSaved((await store.saveLayout(settled)) ? 'saved' : 'error'),
      700,
    )
  }

  const name = VARIANTS[room % VARIANTS.length]!.name

  return (
    <main className={styles.page}>
      <div ref={hostRef} className={styles.scene} data-ready={ready} />

      <header className={styles.top}>
        <Link className={styles.button} href={backHref}>
          {backLabel}
        </Link>
        <span className={styles.title}>
          {owner ? `${owner}’s ${name.replace(/^the /, '')}` : name}
        </span>
        {myRoomHref && (
          <Link className={styles.button} href={myRoomHref}>
            go to my room
          </Link>
        )}
        <span className={styles.saved} aria-live="polite">
          {saved === 'saving' ? 'saving…' : saved === 'error' ? 'couldn’t save, try again' : ''}
        </span>
      </header>

      {track && (
        <p className={styles.nowPlaying}>
          ♪ {track.title} · {track.artist}
        </p>
      )}

      {warned === 'showing' && (
        <div className={styles.notice} role="status">
          <p>just so you know: changes here won&apos;t be kept.</p>
          <p className={styles.hint}>make a house with your friends to keep your room.</p>
          <div className={styles.options}>
            <Link className={styles.button} href={signUpHref}>
              make a house
            </Link>
            <button type="button" className={styles.button} onClick={() => setWarned('done')}>
              keep playing
            </button>
          </div>
        </div>
      )}

      {editable && open && (
        <Panel
          thing={open}
          layout={layout}
          onChange={change}
          room={room}
          onClose={() => setOpen(null)}
          spotify={mode === 'sandbox' ? 'dev' : spotify}
          track={track}
          onFakePlay={() => setTrack((t) => (t ? null : FAKE_TRACK))}
          houseId={houseId}
          store={store}
          place={place}
          onPlace={setPlace}
        />
      )}

      {editable && (
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
      )}
    </main>
  )
}
