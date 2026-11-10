'use client'

import type { SupabaseClient } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { HouseHandlers } from '@/components/useHouseChannel'
import { cameHome, daysUntil, goingSoon, nudgeText, type Nudge } from '@/lib/moments'
import type { Seen } from '@/lib/together'

export interface ShownNudge {
  id: number
  text: string
  href?: string
}

type Permission = NotificationPermission | 'unsupported'

const SHOW_FOR_MS = 9000

function permission(): Permission {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
}
const noSubscription = () => () => {}
const onServer = (): Permission => 'unsupported'

/**
 * Little notices for when something happens in the house. They show on the
 * page, and if the tab is in the background and you've said yes, as a
 * system notification too.
 */
export function useNudges() {
  const [shown, setShown] = useState<ShownNudge[]>([])
  // the browser doesn't announce permission changes, so asking re-reads it
  const [, reread] = useState(0)
  const allowed = useSyncExternalStore(noSubscription, permission, onServer)
  const next = useRef(0)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const dismiss = useCallback((id: number) => {
    setShown((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const push = useCallback(
    (nudge: Nudge, href?: string) => {
      const text = nudgeText(nudge)
      const id = ++next.current
      // three at most; the oldest goes first
      setShown((prev) => [...prev.slice(-2), { id, text, ...(href ? { href } : {}) }])
      const t = setTimeout(() => {
        timers.current.delete(t)
        dismiss(id)
      }, SHOW_FOR_MS)
      timers.current.add(t)
      if (document.visibilityState === 'hidden' && permission() === 'granted') {
        const n = new Notification('nightcap', { body: text, tag: `${nudge.kind}:${text}` })
        n.onclick = () => {
          window.focus()
          if (href) window.location.assign(href)
          n.close()
        }
      }
    },
    [dismiss],
  )

  const ask = useCallback(async () => {
    if (typeof Notification === 'undefined') return
    await Notification.requestPermission()
    reread((n) => n + 1)
  }, [])

  return { shown, push, dismiss, allowed, ask }
}

interface HouseNudgeOptions {
  supabase: SupabaseClient
  houseId: string
  houseName: string
  userId: string
  /** everyone's names, by user id */
  names: Map<string, string>
  /** who'd checked in when the page loaded, so they don't all "arrive" at once */
  initialSeen: Record<string, Seen>
  /** when a house still waiting for a friend goes; null once it's staying */
  goesAt: string | null
  /** where your room is, for a note's link; null if you haven't claimed one */
  myRoomHref: string | null
  push: (nudge: Nudge, href?: string) => void
}

/**
 * The house's live changes, turned into nudges: a note or a gift for you,
 * a friend coming home, someone moving in, the house about to go. Returns
 * channel handlers to merge with the page's own.
 */
export function useHouseNudges(o: HouseNudgeOptions): HouseHandlers {
  const lastSeen = useRef<Map<string, string> | null>(null)
  lastSeen.current ??= new Map(Object.entries(o.initialSeen).map(([id, s]) => [id, s.at]))
  const ref = useRef(o)
  useEffect(() => {
    ref.current = o
  })

  // a lonely house gets one reminder a day while it's in its last two days
  useEffect(() => {
    if (!goingSoon(o.goesAt) || !o.goesAt) return
    const key = `nightcap:going:${o.houseId}:${new Date().toDateString()}`
    try {
      if (localStorage.getItem(key)) return
      localStorage.setItem(key, '1')
    } catch {
      // private mode: a reminder every visit is fine
    }
    o.push({ kind: 'going', house: o.houseName, days: daysUntil(o.goesAt) })
    // once per page, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.goesAt, o.houseId])

  const name = (id: string) => ref.current.names.get(id) ?? 'someone'

  return {
    onNote: (note, event) => {
      if (event !== 'INSERT' || note.to_user !== ref.current.userId) return
      ref.current.push(
        { kind: 'note', from: name(note.from_user) },
        ref.current.myRoomHref ?? undefined,
      )
    },
    onGift: (gift) => {
      if (gift.taken_at || gift.to_user !== ref.current.userId) return
      ref.current.push(
        { kind: 'gift', from: name(gift.from_user), gift: gift.kind },
        `/h/${ref.current.houseId}`,
      )
    },
    onSeen: (id, seen) => {
      const seenAt = lastSeen.current!
      const before = seenAt.get(id)
      seenAt.set(id, seen.at)
      if (id === ref.current.userId) return
      if (cameHome(before, seen.at)) ref.current.push({ kind: 'home', who: name(id) })
    },
    onMovedIn: async (id) => {
      if (id === ref.current.userId) return
      const { data } = await ref.current.supabase
        .from('profiles')
        .select('display_name')
        .eq('id', id)
        .maybeSingle()
      ref.current.push({ kind: 'moved-in', who: data?.display_name ?? 'someone new' })
    },
  }
}

/** several sets of channel handlers as one: each event goes to all of them */
export function bothHandlers(a: HouseHandlers, b: HouseHandlers): HouseHandlers {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof HouseHandlers>
  const out: Record<string, (...args: never[]) => void> = {}
  for (const k of keys) {
    const fa = a[k] as ((...args: never[]) => void) | undefined
    const fb = b[k] as ((...args: never[]) => void) | undefined
    out[k] = (...args: never[]) => {
      fa?.(...args)
      fb?.(...args)
    }
  }
  return out as HouseHandlers
}
