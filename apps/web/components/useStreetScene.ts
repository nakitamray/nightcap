'use client'

import type { Rooms, StreetScene, ThemeId, WindowEvent } from '@nightcap/scene'
import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * Mounts the street into `host` once and keeps it in sync with `rooms`.
 * The scene is created a single time; after that everything goes through
 * setRooms so lights can flicker on instead of the whole thing rebuilding.
 */
export function useStreetScene(
  host: RefObject<HTMLDivElement | null>,
  rooms: Rooms,
  marquee: string[],
  theme: ThemeId,
  onWindowClick: (index: number) => void,
) {
  const sceneRef = useRef<StreetScene | null>(null)
  const clickRef = useRef(onWindowClick)
  const initial = useRef({ rooms, marquee, theme })
  const [hover, setHover] = useState<WindowEvent | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    clickRef.current = onWindowClick
  }, [onWindowClick])

  useEffect(() => {
    const el = host.current
    if (!el) return
    let cancelled = false
    let scene: StreetScene | null = null
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    import('@nightcap/scene').then(async ({ StreetScene }) => {
      const s = await StreetScene.create(el, { ...initial.current, reducedMotion })
      // strict mode mounts twice; the first one can finish after it's gone
      if (cancelled) return s.destroy()
      scene = sceneRef.current = s
      s.events.on('window:hover', setHover)
      s.events.on('window:click', (e) => clickRef.current(e.index))
      setReady(true)
    })

    return () => {
      cancelled = true
      scene?.destroy()
      sceneRef.current = null
    }
  }, [host])

  useEffect(() => {
    sceneRef.current?.setRooms(rooms)
  }, [rooms, ready])

  useEffect(() => {
    sceneRef.current?.setMarquee(marquee)
  }, [marquee, ready])

  return { hover, ready }
}
