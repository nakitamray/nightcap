'use client'

import type { Pin, RoomScene, ThemeId, Thing } from '@nightcap/scene'
import { useEffect, useRef, useState, type RefObject } from 'react'
import type { Layout } from '@/lib/room'

/** mounts the room once, then pushes layout / record / pins changes into it */
export function useRoomScene(
  host: RefObject<HTMLDivElement | null>,
  opts: {
    layout: Layout
    theme: ThemeId
    seed: string
    room: number
    playing: boolean
    pins: Pin[]
    editable: boolean
  },
  onPick: (thing: Thing) => void,
) {
  const sceneRef = useRef<RoomScene | null>(null)
  const pickRef = useRef(onPick)
  const initial = useRef(opts)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    pickRef.current = onPick
  }, [onPick])

  useEffect(() => {
    const el = host.current
    if (!el) return
    let cancelled = false
    let scene: RoomScene | null = null
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    import('@nightcap/scene').then(async ({ RoomScene }) => {
      const s = await RoomScene.create(el, { ...initial.current, reducedMotion })
      if (cancelled) return s.destroy()
      scene = sceneRef.current = s
      s.events.on('pick', (t) => pickRef.current(t))
      setReady(true)
    })
    return () => {
      cancelled = true
      scene?.destroy()
      sceneRef.current = null
    }
  }, [host])

  useEffect(() => {
    if (ready) sceneRef.current?.setLayout(opts.layout)
  }, [opts.layout, ready])

  useEffect(() => {
    sceneRef.current?.setPlaying(opts.playing)
  }, [opts.playing, ready])

  useEffect(() => {
    if (ready) sceneRef.current?.setPins(opts.pins)
  }, [opts.pins, ready])

  return ready
}
