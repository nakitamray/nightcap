'use client'

import type { Pin, ThemeId, Thing } from '@nightcap/scene'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NoteComposer } from '@/components/notes/NoteComposer'
import { NotesPanel, type Note } from '@/components/notes/NotesPanel'
import notesStyles from '@/components/notes/Notes.module.css'
import { useNowPlaying, type Track } from '@/components/useNowPlaying'
import { settle, VARIANTS, type Layout } from '@/lib/room'
import { memoryStore, supabaseStore } from '@/lib/roomStore'
import type { Seen } from '@/lib/together'
import { Panel, type Place } from './Panel'
import { useRoomCompany, type Housemate } from './useRoomCompany'
import { useRoomScene } from './useRoomScene'
import styles from './Room.module.css'

export type { Track }

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
  ownerId: string | null
  initialLayout: Layout
  place: Place
  /** everyone else's pins for the map poster */
  pins: Pin[]
  /** everyone in the house, so whoever's in this room can be drawn */
  housemates: Housemate[]
  initialSeen?: Record<string, Seen>
  /** notes under the door, when it's your room */
  initialNotes?: Note[]
  /** what whoever lives here is playing, when you're visiting */
  initialOwnerTrack?: (Track & { at: string }) | null
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
  ownerId,
  initialLayout,
  place: initialPlace,
  pins: others,
  housemates,
  initialSeen = {},
  initialNotes = [],
  initialOwnerTrack = null,
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
  const [fakeTrack, setFakeTrack] = useState<Track | null>(null)
  const [panel, setPanel] = useState<'notes' | 'write' | null>(null)
  const [writeTo, setWriteTo] = useState<{ id: string; name: string } | null>(null)
  // the sandbox warning shows the first time you change something
  const [warned, setWarned] = useState<'no' | 'showing' | 'done'>('no')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(saveTimer.current), [])

  const company = useRoomCompany({
    live: mode !== 'sandbox',
    houseId,
    userId,
    ownerId,
    room,
    housemates,
    initialSeen,
    initialNotes,
    initialOwnerTrack,
  })
  // what's on the record player: yours from spotify, theirs from the house
  const myTrack = useNowPlaying(mode === 'mine' && spotify === 'linked')
  const track = mode === 'visit' ? company.ownerTrack : mode === 'mine' ? myTrack : fakeTrack

  const pins: Pin[] = useMemo(
    () => [
      ...others,
      ...(place.lat != null && place.lon != null
        ? [{ lat: place.lat, lon: place.lon, name: owner ?? 'you', me: true }]
        : []),
    ],
    [others, place, owner],
  )

  // visitors can look around, but clicking things doesn't open anything
  const pick = useCallback((thing: Thing) => editable && setOpen(thing), [editable])
  const ready = useRoomScene(
    hostRef,
    {
      layout,
      theme,
      seed: houseId,
      room,
      playing: !!track,
      pins,
      editable,
      people: company.guests,
    },
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
        {ownerId === userId ? (
          <button
            type="button"
            className={styles.button}
            data-on={panel === 'notes'}
            onClick={() => setPanel(panel === 'notes' ? null : 'notes')}
          >
            <span className={notesStyles.badge}>
              notes {company.unread > 0 && <b aria-label="new">{company.unread}</b>}
            </span>
          </button>
        ) : (
          ownerId &&
          owner && (
            <button
              type="button"
              className={styles.button}
              onClick={() => {
                setWriteTo({ id: ownerId, name: owner })
                setPanel('write')
              }}
            >
              leave {owner} a note
            </button>
          )
        )}
        <span className={styles.saved} aria-live="polite">
          {saved === 'saving' ? 'saving…' : saved === 'error' ? 'couldn’t save, try again' : ''}
        </span>
      </header>

      {track && (
        <p className={styles.nowPlaying}>
          ♪ {track.title} · {track.artist}
          {mode === 'visit' && owner && <> · {owner}&apos;s listening</>}
          {mode === 'visit' && track.url && (
            <>
              {' '}
              <a href={track.url} target="_blank" rel="noreferrer">
                play it too
              </a>
            </>
          )}
        </p>
      )}

      {panel === 'notes' && (
        <NotesPanel
          notes={company.notes}
          onRead={company.markRead}
          onThrowAway={company.throwAway}
          onReply={(n) => {
            setWriteTo({ id: n.from, name: n.fromName })
            setPanel('write')
          }}
          onClose={() => setPanel(null)}
        />
      )}

      {panel === 'write' && writeTo && (
        <NoteComposer
          to={writeTo.name}
          onSend={(body) => company.sendNote(writeTo.id, body)}
          onClose={() => setPanel(null)}
        />
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
          onFakePlay={() => setFakeTrack((t) => (t ? null : FAKE_TRACK))}
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
