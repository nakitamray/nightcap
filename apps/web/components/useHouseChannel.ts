'use client'

import type { SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useRef } from 'react'
import type { Seen } from '@/lib/together'

export interface NoteRow {
  id: string
  house_id: string
  from_user: string
  to_user: string
  body: string
  created_at: string
  read_at: string | null
}

export interface PlayingRow {
  user_id: string
  title: string
  artist: string
  art: string | null
  url: string | null
  updated_at: string
}

export interface HouseHandlers {
  onSeen?: (userId: string, seen: Seen) => void
  onCurtains?: (userId: string, curtains: 'open' | 'drawn') => void
  onNote?: (note: NoteRow, event: 'INSERT' | 'UPDATE' | 'DELETE') => void
  onPlaying?: (userId: string, row: PlayingRow | null) => void
}

/**
 * One live channel per page for everything that changes in a house: who's
 * where, curtains, notes, music. They all arrive as database changes on a
 * private channel only people who live here can join, and realtime checks
 * every row against the table's own policies before passing it on.
 */
export function useHouseChannel(
  supabase: SupabaseClient,
  houseId: string | null,
  handlers: HouseHandlers,
) {
  const ref = useRef(handlers)
  useEffect(() => {
    ref.current = handlers
  })

  useEffect(() => {
    if (!houseId) return
    let channel: ReturnType<typeof supabase.channel> | null = null
    let stopped = false
    const inHouse = `house_id=eq.${houseId}`
    supabase.realtime.setAuth().then(() => {
      if (stopped) return
      channel = supabase
        .channel(`house:${houseId}`, { config: { private: true } })
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'presence', filter: inHouse },
          ({ new: row }) => {
            const r = row as { user_id?: string; seen_at?: string; place?: string }
            if (r.user_id && r.seen_at)
              ref.current.onSeen?.(r.user_id, { at: r.seen_at, place: r.place ?? 'street' })
          },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'memberships', filter: inHouse },
          ({ new: row }) => {
            const r = row as { user_id: string; curtains: 'open' | 'drawn' }
            ref.current.onCurtains?.(r.user_id, r.curtains)
          },
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notes', filter: inHouse },
          (change) => {
            const row = (change.eventType === 'DELETE' ? change.old : change.new) as NoteRow
            ref.current.onNote?.(row, change.eventType)
          },
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'now_playing' },
          (change) => {
            if (change.eventType === 'DELETE') {
              const old = change.old as { user_id?: string }
              if (old.user_id) ref.current.onPlaying?.(old.user_id, null)
            } else {
              const row = change.new as PlayingRow
              ref.current.onPlaying?.(row.user_id, row)
            }
          },
        )
        .subscribe((status, err) => {
          if (err) console.error('house channel', status, err)
        })
    })
    return () => {
      stopped = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [supabase, houseId])
}
