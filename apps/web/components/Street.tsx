'use client'

import type { StreetScene, WindowEvent } from '@nightcap/scene'
import { useCallback, useEffect, useRef, useState } from 'react'
import { demoMarquee, demoRooms, type Member } from '@/lib/house'
import { WindowCard } from './WindowCard'
import styles from './Street.module.css'

export function Street() {
  const hostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<StreetScene | null>(null)
  const [rooms, setRooms] = useState(demoRooms)
  const [hover, setHover] = useState<WindowEvent | null>(null)
  const [ready, setReady] = useState(false)
  const [touched, setTouched] = useState(false)

  const toggle = useCallback((index: number) => {
    setTouched(true)
    setRooms((prev) => {
      const room = prev[index]
      if (!room) return prev
      const next = [...prev]
      next[index] = { ...room, home: !room.home }
      return next
    })
  }, [])

  // the scene is created once; everything after that goes through setRooms
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let cancelled = false
    let scene: StreetScene | null = null
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    import('@nightcap/scene').then(async ({ StreetScene }) => {
      const s = await StreetScene.create(host, {
        rooms: demoRooms,
        marquee: demoMarquee,
        reducedMotion,
      })
      // strict mode mounts twice; the first one can finish after it's gone
      if (cancelled) return s.destroy()
      scene = sceneRef.current = s
      s.events.on('window:hover', setHover)
      s.events.on('window:click', (e) => toggle(e.index))
      setReady(true)
    })

    return () => {
      cancelled = true
      scene?.destroy()
      sceneRef.current = null
    }
  }, [toggle])

  useEffect(() => {
    sceneRef.current?.setRooms(rooms)
  }, [rooms])

  const residents = rooms.filter((r): r is Member => r !== null)
  const home = residents.filter((r) => r.home).length
  const hovered = hover ? (rooms[hover.index] ?? null) : null

  return (
    <main className={styles.street}>
      <div ref={hostRef} className={styles.canvas} data-ready={ready} />

      {hover && <WindowCard member={hovered} bounds={hover.bounds} />}

      <footer className={styles.footer} data-ready={ready}>
        <p className={styles.count}>
          <span className={styles.number}>{home}</span> of {residents.length} home
        </p>
        <p className={styles.hint} data-hidden={touched}>
          click a window to flip its light
        </p>
      </footer>

      {/* the canvas isn't keyboard friendly, so the same controls live here too */}
      <ul className="sr-only">
        {rooms.map((room, i) =>
          room ? (
            <li key={room.id}>
              <button type="button" aria-pressed={room.home} onClick={() => toggle(i)}>
                {room.name}&apos;s light, {room.home ? 'on' : 'off'}
              </button>
            </li>
          ) : null,
        )}
      </ul>
    </main>
  )
}
