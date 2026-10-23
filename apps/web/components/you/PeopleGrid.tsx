'use client'

import { useEffect, useRef } from 'react'
import { avatarFromSeed, type Avatar } from '@/lib/avatar'

type Pose = 'stand' | 'sit' | 'floor'

/** every made-up person in a grid, standing, on chairs and on the floor */
export function PeopleGrid({ people }: { people?: { avatar: Avatar; pose: Pose }[] }) {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = host.current
    if (!el) return
    let stop = false
    let destroy = () => {}
    const crowd =
      people ??
      [
        ...Array.from({ length: 30 }, (_, i) => ['stand', `p${i}`] as const),
        ...Array.from({ length: 10 }, (_, i) => ['sit', `s${i}`] as const),
        ...Array.from({ length: 10 }, (_, i) => ['floor', `f${i}`] as const),
      ].map(([pose, seed]) => ({ avatar: avatarFromSeed(seed), pose }))
    import('@nightcap/scene').then(async ({ castSheet }) => {
      const done = await castSheet(el, crowd)
      if (stop) done()
      else destroy = done
    })
    return () => {
      stop = true
      destroy()
    }
  }, [people])
  return <div ref={host} style={{ position: 'fixed', inset: 0 }} />
}
