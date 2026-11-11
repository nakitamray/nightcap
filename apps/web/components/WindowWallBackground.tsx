'use client'

import type { WindowWall } from '@nightcap/scene'
import { useEffect, useRef, useState } from 'react'
import styles from './NightCard.module.css'

/** the wall of other people's windows behind the sign-in pages */
export function WindowWallBackground() {
  const host = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = host.current
    if (!el) return
    let cancelled = false
    let wall: WindowWall | null = null
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    import('@nightcap/scene')
      .then(async ({ WindowWall }) => {
        const w = await WindowWall.create(el, { reducedMotion })
        if (cancelled) return w.destroy()
        wall = w
        setReady(true)
      })
      // it's only the backdrop: without webgl the page is just dark behind the card
      .catch((err) => console.warn('drawing the window wall', err))
    return () => {
      cancelled = true
      wall?.destroy()
    }
  }, [])

  return <div ref={host} className={styles.wall} data-ready={ready} aria-hidden />
}
