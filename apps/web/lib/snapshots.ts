'use client'

import { useSyncExternalStore } from 'react'
import { THEMES, type Theme } from './themes'

// Pictures of each city's street, drawn once by the real scene and kept for
// the rest of the visit. Every card on a page shares the one batch.

const KEY = 'nightcap:snapshots:v1'
let shots: Record<string, string> | null = null
let loading = false
const listeners = new Set<() => void>()

function stored(): Record<string, string> | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : null
  } catch {
    return null
  }
}

function done(next: Record<string, string>) {
  shots = next
  for (const l of listeners) l()
}

function load() {
  if (shots || loading) return
  const saved = stored()
  if (saved) return done(saved)
  loading = true
  import('@nightcap/scene')
    .then(({ snapshotStreets }) => snapshotStreets([...THEMES]))
    .then((next) => {
      try {
        sessionStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        // too big or private browsing; they'll just be drawn again next time
      }
      done(next)
    })
    .catch(() => (loading = false))
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  load()
  return () => listeners.delete(listener)
}

/** the picture of a city's street, or null while it's being drawn */
export function useStreetSnapshot(theme: Theme) {
  return useSyncExternalStore(
    subscribe,
    () => shots?.[theme] ?? null,
    () => null,
  )
}
