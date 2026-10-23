'use client'

import { useState } from 'react'
import type { Found, RoomStore } from '@/lib/roomStore'
import styles from '../Room.module.css'

export interface Place {
  city: string
  lat: number | null
  lon: number | null
}

export function LocationPanel({
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
