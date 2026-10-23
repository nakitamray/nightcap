'use client'

import type { Thing } from '@nightcap/scene'
import type { Track } from '@/components/useNowPlaying'
import {
  BED_NAMES,
  BED_STYLES,
  deskCanGoRight,
  LAMP_NAMES,
  LAMP_STYLES,
  planRoom,
  SWATCHES,
  type Layout,
} from '@/lib/room'
import type { RoomStore } from '@/lib/roomStore'
import { Choice, NightstandChoice, Row, Swatches } from './panel/controls'
import { FurniturePanel } from './panel/FurniturePanel'
import { LocationPanel, type Place } from './panel/LocationPanel'
import { PetPanel } from './panel/PetPanel'
import { PostersPanel } from './panel/PostersPanel'
import { RecordPanel, type Spotify } from './panel/RecordPanel'
import styles from './Room.module.css'

export type { Place }

interface Props {
  thing: Thing
  layout: Layout
  /** which of the house's rooms this is */
  room: number
  onChange: (layout: Layout) => void
  onClose: () => void
  spotify: Spotify
  track: Track | null
  onFakePlay?: () => void
  houseId: string
  store: RoomStore
  place: Place
  onPlace: (place: Place) => void
}

const TITLES: Record<Thing, string> = {
  bed: 'the bed',
  nightstand: 'the nightstand',
  wall: 'the walls',
  window: 'the window',
  posters: 'posters',
  furniture: 'furniture',
  lamp: 'the lamp',
  rug: 'the rug',
  desk: 'the desk',
  led: 'ceiling lights',
  vinyl: 'the record',
  map: 'the map',
  pet: 'your pet',
  notes: 'notes',
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
  room,
  onChange,
  spotify,
  track,
  onFakePlay,
  houseId,
  store,
  place,
  onPlace,
}: Props) {
  const plan = planRoom(layout, room)
  const set = <K extends keyof Layout>(key: K, value: Layout[K]) =>
    onChange({ ...layout, [key]: value })

  switch (thing) {
    case 'bed':
      return (
        <>
          <Row label="frame">
            <Choice
              value={layout.bed.style}
              options={BED_STYLES.map((b) => [b, BED_NAMES[b] ?? b])}
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
          <Row label="nightstand">
            <NightstandChoice layout={layout} set={set} />
          </Row>
          <Row label="wood">
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

    case 'posters':
      return <PostersPanel layout={layout} plan={plan} set={set} />

    case 'nightstand':
      return (
        <Row label="style">
          <NightstandChoice layout={layout} set={set} />
        </Row>
      )

    case 'furniture':
      return <FurniturePanel layout={layout} plan={plan} set={set} />

    case 'pet':
      return <PetPanel layout={layout} plan={plan} set={set} />

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
      if (plan.variant.fairy)
        return (
          <p className={styles.hint}>this room has fairy lights strung up instead of a strip.</p>
        )
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
      return (
        <RecordPanel spotify={spotify} track={track} houseId={houseId} onFakePlay={onFakePlay} />
      )

    case 'map':
      return <LocationPanel store={store} place={place} onPlace={onPlace} />

    // notes open their own pile, not a panel
    case 'notes':
      return null
  }
}
