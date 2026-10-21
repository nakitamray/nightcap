'use client'

import { useSyncExternalStore } from 'react'
import { RoomView } from '@/components/room/RoomView'
import { readLayout } from '@/lib/room'
import { readLocal, type Found } from '@/lib/roomStore'
import type { Theme } from '@/lib/themes'
import { THEME_NAMES } from '@/lib/themes'

// made-up housemates so the map poster has pins on it
const FRIENDS = [
  { lat: 55.9, lon: -3.2, name: 'Ellie' },
  { lat: 45.5, lon: -73.6, name: 'Mars' },
  { lat: 21.3, lon: -157.8, name: 'Kai' },
  { lat: 42.4, lon: -71.1, name: 'Priya' },
  { lat: 30.3, lon: -97.7, name: 'Dev' },
]

const noop = () => () => {}

/** your room in dev mode: the layout lives in this browser's storage */
export function DevRoom({ theme }: { theme: Theme }) {
  // only read storage once we're in the browser, so server and client agree
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
  if (!mounted) return null
  const layout = readLayout(readLocal(`nightcap:dev:${theme}:layout`))
  const place = readLocal<Found>('nightcap:dev:place')
  return (
    <RoomView
      dev
      houseId={`dev-${theme}`}
      houseName={`the ${THEME_NAMES[theme]} street`}
      userId="dev"
      theme={theme}
      initialLayout={layout}
      place={{ city: place?.city ?? '', lat: place?.lat ?? null, lon: place?.lon ?? null }}
      housemates={FRIENDS}
      spotify="dev"
      backHref={`/dev/${theme}`}
    />
  )
}
