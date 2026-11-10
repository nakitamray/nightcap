'use client'

import type {
  Occasion,
  Rooms,
  StepEvent,
  StepGift,
  StreetScene,
  ThemeId,
  WindowEvent,
} from '@nightcap/scene'
import { useEffect, useRef, useState, type RefObject } from 'react'

interface Options {
  rooms: Rooms
  marquee: string[]
  theme: ThemeId
  /** gifts waiting on the front step */
  gifts?: StepGift[]
  /** what the street is dressed up for, if anything */
  occasion?: Occasion | null
  onWindowClick: (index: number) => void
  onStepClick?: (e: StepEvent) => void
}

const NO_GIFTS: StepGift[] = []

/**
 * Mounts the street into `host` once and keeps it in sync with everything
 * else. The scene is created a single time; after that everything goes
 * through its setters so lights can flicker on instead of the whole thing
 * rebuilding.
 */
export function useStreetScene(host: RefObject<HTMLDivElement | null>, o: Options) {
  const { rooms, marquee, theme, gifts = NO_GIFTS, occasion = null } = o
  const sceneRef = useRef<StreetScene | null>(null)
  const handlers = useRef(o)
  const initial = useRef({ rooms, marquee, theme, gifts, occasion })
  const [hover, setHover] = useState<WindowEvent | null>(null)
  const [stepHover, setStepHover] = useState<StepEvent | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    handlers.current = o
  })

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
      s.events.on('window:click', (e) => handlers.current.onWindowClick(e.index))
      s.events.on('step:hover', setStepHover)
      s.events.on('step:click', (e) => handlers.current.onStepClick?.(e))
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

  useEffect(() => {
    sceneRef.current?.setGifts(gifts)
  }, [gifts, ready])

  useEffect(() => {
    sceneRef.current?.setOccasion(occasion)
  }, [occasion, ready])

  /** where the gifts on the step are on screen right now, if there are any */
  const stepBounds = () => sceneRef.current?.stepEvent()?.bounds ?? null

  return { hover, stepHover, ready, stepBounds }
}
