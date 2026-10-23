'use client'

import type { Guest, LoungeScene, ThemeId } from '@nightcap/scene'
import { useEffect, useRef, useState, type RefObject } from 'react'

/** mounts the living room once, then keeps who's in it up to date */
export function useLoungeScene(
  host: RefObject<HTMLDivElement | null>,
  opts: { theme: ThemeId; seed: string; people: Guest[] },
) {
  const sceneRef = useRef<LoungeScene | null>(null)
  const initial = useRef(opts)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = host.current
    if (!el) return
    let cancelled = false
    let scene: LoungeScene | null = null
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    import('@nightcap/scene').then(async ({ LoungeScene }) => {
      const s = await LoungeScene.create(el, { ...initial.current, reducedMotion })
      if (cancelled) return s.destroy()
      scene = sceneRef.current = s
      setReady(true)
    })
    return () => {
      cancelled = true
      scene?.destroy()
      sceneRef.current = null
    }
  }, [host])

  useEffect(() => {
    if (ready) sceneRef.current?.setPeople(opts.people)
  }, [opts.people, ready])

  return ready
}
