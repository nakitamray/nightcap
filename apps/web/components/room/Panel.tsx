'use client'

import { useState, type ReactNode } from 'react'
import type { Thing } from '@nightcap/scene'
import {
  ART_COUNT,
  ART_NAMES,
  deskCanGoRight,
  LAMP_NAMES,
  LAMP_STYLES,
  MAX_FRAMES,
  SWATCHES,
  type Layout,
} from '@/lib/room'
import type { Found, RoomStore } from '@/lib/roomStore'
import type { Track } from './RoomView'
import styles from './Room.module.css'

export interface Place {
  city: string
  lat: number | null
  lon: number | null
}

interface Props {
  thing: Thing
  layout: Layout
  onChange: (layout: Layout) => void
  onClose: () => void
  spotify: 'off' | 'unlinked' | 'linked' | 'dev'
  track: Track | null
  onFakePlay?: () => void
  houseId: string
  store: RoomStore
  place: Place
  onPlace: (place: Place) => void
}

const TITLES: Record<Thing, string> = {
  bed: 'the bed',
  wall: 'the walls',
  window: 'the window',
  frames: 'pictures',
  lamp: 'the lamp',
  rug: 'the rug',
  desk: 'the desk',
  led: 'ceiling lights',
  vinyl: 'the record',
  map: 'the map',
}

export function Panel(props: Props) {
  const { thing, onClose } = props
  return (
    <aside className={styles.panel} aria-label={TITLES[thing]}>
      <div className={styles.panelHead}>
        <h2>{TITLES[thing]}</h2>
        <button type="button" className={styles.close} onClick={onClose} aria-label="close">
          ×
        </button>
      </div>
      <Body {...props} />
    </aside>
  )
}

function Body({
  thing,
  layout,
  onChange,
  spotify,
  track,
  onFakePlay,
  houseId,
  store,
  place,
  onPlace,
}: Props) {
  const set = <K extends keyof Layout>(key: K, value: Layout[K]) =>
    onChange({ ...layout, [key]: value })

  switch (thing) {
    case 'bed':
      return (
        <>
          <Row label="frame">
            <Choice
              value={layout.bed.style}
              options={[
                ['iron', 'iron'],
                ['wood', 'wooden'],
              ]}
              onPick={(style) => set('bed', { ...layout.bed, style })}
            />
          </Row>
          <Row label="where it goes">
            <Choice
              value={layout.bed.spot}
              options={[
                ['right', 'right wall'],
                ['window', 'under the window'],
              ]}
              onPick={(spot) => set('bed', { ...layout.bed, spot })}
            />
          </Row>
          <Row label="frame">
            <Swatches
              colours={SWATCHES.wood}
              value={layout.bed.frame}
              onPick={(frame) => set('bed', { ...layout.bed, frame })}
            />
          </Row>
          <Row label="sheets">
            <Swatches
              colours={SWATCHES.fabric}
              value={layout.bed.sheets}
              onPick={(sheets) => set('bed', { ...layout.bed, sheets })}
            />
          </Row>
          <Row label="pillows">
            <Swatches
              colours={SWATCHES.fabric}
              value={layout.bed.pillows}
              onPick={(pillows) => set('bed', { ...layout.bed, pillows })}
            />
          </Row>
          <Row label="blanket">
            <Swatches
              colours={SWATCHES.fabric}
              value={layout.bed.blanket}
              onPick={(blanket) => set('bed', { ...layout.bed, blanket })}
            />
          </Row>
          {layout.desk.wall === 'right' && (
            <p className={styles.hint}>
              moving the bed back to the right wall puts the desk on the left.
            </p>
          )}
        </>
      )

    case 'wall':
      return (
        <Row label="paint">
          <Swatches
            colours={SWATCHES.wall}
            value={layout.wall}
            onPick={(wall) => set('wall', wall)}
          />
        </Row>
      )

    case 'window':
      return (
        <>
          <Row label="shape">
            <Choice
              value={layout.window.shape}
              options={[
                ['rect', 'square'],
                ['arch', 'arch'],
                ['circle', 'round'],
              ]}
              onPick={(shape) => set('window', { ...layout.window, shape })}
            />
          </Row>
          <Row label="curtains">
            <Choice
              value={layout.window.curtains ? 'on' : 'off'}
              options={[
                ['on', 'curtains'],
                ['off', 'bare'],
              ]}
              onPick={(v) => set('window', { ...layout.window, curtains: v === 'on' })}
            />
          </Row>
          {layout.window.curtains && (
            <Row label="curtain colour">
              <Swatches
                colours={SWATCHES.fabric}
                value={layout.window.curtainColor}
                onPick={(curtainColor) => set('window', { ...layout.window, curtainColor })}
              />
            </Row>
          )}
        </>
      )

    case 'frames':
      return (
        <>
          {layout.frames.map((f, i) => (
            <Row key={i} label={`picture ${i + 1}: ${ART_NAMES[f.art]}`}>
              <div className={styles.options}>
                <Choice
                  value={f.wall}
                  options={[
                    ['left', 'left wall'],
                    ['right', 'right wall'],
                  ]}
                  onPick={(wall) =>
                    set(
                      'frames',
                      layout.frames.map((g, j) => (j === i ? { ...g, wall } : g)),
                    )
                  }
                />
                <button
                  type="button"
                  className={styles.button}
                  onClick={() =>
                    set(
                      'frames',
                      layout.frames.map((g, j) =>
                        j === i ? { ...g, art: (g.art + 1) % ART_COUNT } : g,
                      ),
                    )
                  }
                >
                  swap picture
                </button>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() =>
                    set(
                      'frames',
                      layout.frames.filter((_, j) => j !== i),
                    )
                  }
                >
                  take down
                </button>
              </div>
            </Row>
          ))}
          {layout.frames.length < MAX_FRAMES ? (
            <button
              type="button"
              className={styles.button}
              onClick={() =>
                set('frames', [
                  ...layout.frames,
                  {
                    wall: layout.frames[0]?.wall === 'left' ? 'right' : 'left',
                    art: (layout.frames.length * 2 + 1) % ART_COUNT,
                  },
                ])
              }
            >
              hang a picture
            </button>
          ) : (
            <p className={styles.hint}>two&apos;s the limit, the walls are small.</p>
          )}
        </>
      )

    case 'lamp':
      return (
        <Row label="style">
          <Choice
            value={layout.lamp}
            options={LAMP_STYLES.map((l) => [l, LAMP_NAMES[l] ?? l])}
            onPick={(lamp) => set('lamp', lamp)}
          />
        </Row>
      )

    case 'rug':
      return (
        <>
          <Row label="shape">
            <Choice
              value={layout.rug.shape}
              options={[
                ['none', 'none'],
                ['rect', 'rectangle'],
                ['circle', 'circle'],
                ['oval', 'oval'],
                ['diamond', 'diamond'],
              ]}
              onPick={(shape) => set('rug', { ...layout.rug, shape })}
            />
          </Row>
          {layout.rug.shape !== 'none' && (
            <Row label="colour">
              <Swatches
                colours={SWATCHES.rug}
                value={layout.rug.color}
                onPick={(color) => set('rug', { ...layout.rug, color })}
              />
            </Row>
          )}
        </>
      )

    case 'desk':
      return (
        <>
          <Row label="which wall">
            <Choice
              value={layout.desk.wall}
              options={[
                ['left', 'left'],
                ['right', 'right'],
              ]}
              disabled={deskCanGoRight(layout) ? [] : ['right']}
              onPick={(wall) => set('desk', { ...layout.desk, wall })}
            />
            {!deskCanGoRight(layout) && (
              <p className={styles.hint}>
                the bed&apos;s on the right wall. move it under the window to put the desk there.
              </p>
            )}
          </Row>
          <Row label="wood">
            <Swatches
              colours={SWATCHES.wood}
              value={layout.desk.color}
              onPick={(color) => set('desk', { ...layout.desk, color })}
            />
          </Row>
        </>
      )

    case 'led':
      return (
        <Row label="strip colour">
          <div className={styles.options}>
            <button
              type="button"
              className={styles.button}
              data-on={layout.led === null}
              onClick={() => set('led', null)}
            >
              off
            </button>
            <Swatches
              colours={SWATCHES.led}
              value={layout.led ?? ''}
              onPick={(led) => set('led', led)}
            />
          </div>
        </Row>
      )

    case 'vinyl':
      return <Record spotify={spotify} track={track} houseId={houseId} onFakePlay={onFakePlay} />

    case 'map':
      return <Location store={store} place={place} onPlace={onPlace} />
  }
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      {children}
    </div>
  )
}

function Choice<T extends string>({
  value,
  options,
  onPick,
  disabled = [],
}: {
  value: T
  options: [T, string][]
  onPick: (v: T) => void
  disabled?: T[]
}) {
  return (
    <div className={styles.options}>
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          className={styles.button}
          data-on={v === value}
          disabled={disabled.includes(v)}
          onClick={() => onPick(v)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function Swatches({
  colours,
  value,
  onPick,
}: {
  colours: string[]
  value: string
  onPick: (c: string) => void
}) {
  return (
    <div className={styles.options}>
      {colours.map((c) => (
        <button
          key={c}
          type="button"
          className={styles.swatch}
          style={{ background: c }}
          data-on={c === value}
          onClick={() => onPick(c)}
          aria-label={c}
        />
      ))}
    </div>
  )
}

function Record({
  spotify,
  track,
  houseId,
  onFakePlay,
}: {
  spotify: Props['spotify']
  track: Track | null
  houseId: string
  onFakePlay?: () => void
}) {
  if (spotify === 'dev') {
    return (
      <>
        <p className={styles.hint}>
          dev mode: no spotify here, but you can see what it looks like.
        </p>
        <button type="button" className={styles.button} onClick={onFakePlay}>
          {track ? 'stop the record' : 'pretend something’s playing'}
        </button>
      </>
    )
  }
  if (spotify === 'off') {
    return <p className={styles.hint}>spotify isn&apos;t hooked up on this site yet.</p>
  }
  if (spotify === 'unlinked') {
    return (
      <>
        <p className={styles.hint}>
          connect spotify and the record lights up when you&apos;re listening. everyone in the house
          can see what&apos;s on.
        </p>
        <p>
          <a className={styles.button} href={`/api/spotify/login?next=/h/${houseId}/room`}>
            connect spotify
          </a>
        </p>
      </>
    )
  }
  return (
    <>
      {track ? (
        <div className={styles.track}>
          {/* album art comes straight off spotify's cdn, tiny already */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {track.art && <img src={track.art} alt="" />}
          <div>
            <p>{track.title}</p>
            <p className={styles.hint}>{track.artist}</p>
            {track.url && (
              <a className={styles.hint} href={track.url} target="_blank" rel="noreferrer">
                open in spotify
              </a>
            )}
          </div>
        </div>
      ) : (
        <p className={styles.hint}>nothing playing right now.</p>
      )}
      <form
        action="/api/spotify/disconnect"
        method="post"
        className={styles.row}
        style={{ marginTop: 14 }}
      >
        <input type="hidden" name="next" value={`/h/${houseId}/room`} />
        <button type="submit" className={styles.button}>
          disconnect
        </button>
      </form>
    </>
  )
}

function Location({
  store,
  place,
  onPlace,
}: {
  store: RoomStore
  place: Place
  onPlace: (p: Place) => void
}) {
  const [typed, setTyped] = useState('')
  const [status, setStatus] = useState('')

  async function save(found: Found) {
    const zone = found.zone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!(await store.savePlace({ ...found, zone })))
      return setStatus('couldn’t save that, try again')
    onPlace({ city: found.city, lat: found.lat, lon: found.lon })
    setStatus('')
  }

  function here() {
    if (!navigator.geolocation) return setStatus('your browser won’t share a location')
    setStatus('finding you…')
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        // only the town gets saved, rounded off, never the exact spot
        const lat = Math.round(coords.latitude * 10) / 10
        const lon = Math.round(coords.longitude * 10) / 10
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
        ).catch(() => null)
        const body = res?.ok ? await res.json() : {}
        await save({
          city: body.city || body.locality || body.principalSubdivision || 'somewhere',
          lat,
          lon,
        })
      },
      () => setStatus('no luck. type your city instead?'),
      { timeout: 10_000 },
    )
  }

  async function search(e: React.FormEvent) {
    e.preventDefault()
    if (!typed.trim()) return
    setStatus('looking…')
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(typed.trim())}`,
    ).catch(() => null)
    const hit = res?.ok ? (await res.json()).results?.[0] : null
    if (!hit) return setStatus('couldn’t find that one')
    await save({
      city: hit.name,
      lat: Math.round(hit.latitude * 10) / 10,
      lon: Math.round(hit.longitude * 10) / 10,
      zone: hit.timezone,
    })
    setTyped('')
  }

  return (
    <>
      <p className={styles.hint}>
        {place.city
          ? `you’re pinned in ${place.city}.`
          : 'put yourself on the map so the house knows where you are.'}
      </p>
      <div className={styles.row} style={{ marginTop: 12 }}>
        <button type="button" className={styles.button} onClick={here}>
          use where I am
        </button>
      </div>
      <form onSubmit={search} className={styles.row}>
        <span className={styles.label}>or type a city</span>
        <input
          className={styles.input}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Lisbon"
        />
      </form>
      {status && <p className={styles.hint}>{status}</p>}
    </>
  )
}
