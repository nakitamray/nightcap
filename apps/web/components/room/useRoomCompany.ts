'use client'

import type { Avatar, Guest, Pet } from '@nightcap/scene'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Note } from '@/components/notes/NotesPanel'
import { useCheckIn } from '@/components/useCheckIn'
import { useHouseChannel, type NoteRow } from '@/components/useHouseChannel'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { roomPlace, stillPlaying, whoIsIn, type Seen } from '@/lib/together'
import type { Track } from '@/components/useNowPlaying'

export interface Housemate {
  id: string
  name: string
  avatar: Avatar
  pet?: Pet
}

interface Options {
  /** a real house: check in, listen, save notes. Otherwise it's all pretend */
  live: boolean
  houseId: string
  userId: string
  /** who lives in this room */
  ownerId: string | null
  room: number
  housemates: Housemate[]
  initialSeen: Record<string, Seen>
  /** notes under this door, if it's yours */
  initialNotes: Note[]
  /** what the person who lives here is playing, if you're visiting */
  initialOwnerTrack: (Track & { at: string }) | null
}

/**
 * Everything about a room that's to do with other people: who's in here
 * with you, the notes under your door, and what whoever lives here is
 * listening to.
 */
export function useRoomCompany(o: Options) {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const live = o.live
  const [seen, setSeen] = useState(o.initialSeen)
  const [notes, setNotes] = useState(o.initialNotes)
  const [ownerTrack, setOwnerTrack] = useState(o.initialOwnerTrack)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 20_000)
    return () => clearInterval(tick)
  }, [])

  useCheckIn(supabase, live ? o.houseId : null, roomPlace(o.room))

  const names = useMemo(() => new Map(o.housemates.map((h) => [h.id, h.name])), [o.housemates])
  const toNote = useCallback(
    (n: NoteRow): Note => ({
      id: n.id,
      from: n.from_user,
      fromName: names.get(n.from_user) ?? 'someone',
      body: n.body,
      createdAt: n.created_at,
      read: !!n.read_at,
    }),
    [names],
  )

  useHouseChannel(supabase, live ? o.houseId : null, {
    onSeen: (id, s) => setSeen((prev) => ({ ...prev, [id]: s })),
    onNote: (row, event) => {
      if (row.to_user !== o.userId || o.ownerId !== o.userId) return
      setNotes((prev) => {
        const rest = prev.filter((n) => n.id !== row.id)
        return event === 'DELETE' ? rest : [toNote(row), ...rest]
      })
    },
    onPlaying: (id, row) => {
      if (id !== o.ownerId || id === o.userId) return
      setOwnerTrack(
        row
          ? { title: row.title, artist: row.artist, art: row.art, url: row.url, at: row.updated_at }
          : null,
      )
    },
  })

  // you're always in the room you're looking at; anyone else who checked in here lately too
  const guests: Guest[] = useMemo(() => {
    const here = new Set(live ? whoIsIn(seen, roomPlace(o.room), now) : Object.keys(seen))
    here.add(o.userId)
    return o.housemates
      .filter((h) => here.has(h.id))
      .map((h) => ({
        id: h.id,
        name: h.name,
        avatar: h.avatar,
        // the room already has its own pet; visitors bring theirs
        pet: h.id === o.ownerId ? undefined : h.pet,
        me: h.id === o.userId,
      }))
  }, [live, seen, now, o.room, o.userId, o.ownerId, o.housemates])

  const markRead = useCallback(
    async (ids: string[]) => {
      setNotes((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)))
      if (!live) return
      const { error } = await supabase
        .from('notes')
        .update({ read_at: new Date().toISOString() })
        .in('id', ids)
      if (error) console.error('marking notes read', error)
    },
    [live, supabase],
  )

  const throwAway = useCallback(
    async (id: string) => {
      setNotes((prev) => prev.filter((n) => n.id !== id))
      if (!live) return
      const { error } = await supabase.from('notes').delete().eq('id', id)
      if (error) console.error('throwing a note away', error)
    },
    [live, supabase],
  )

  /** resolves to an error message, or null once it's under their door */
  const sendNote = useCallback(
    async (to: string, body: string): Promise<string | null> => {
      if (!live)
        return 'this is only the demo, so the note stays with you. make a house to send real ones.'
      const { error } = await supabase
        .from('notes')
        .insert({ house_id: o.houseId, from_user: o.userId, to_user: to, body })
      if (!error) return null
      console.error('sending a note', error)
      return error.code === 'P0001' ? error.message : 'couldn’t send that, try again'
    },
    [live, supabase, o.houseId, o.userId],
  )

  return {
    guests,
    notes,
    unread: notes.filter((n) => !n.read).length,
    markRead,
    throwAway,
    sendNote,
    ownerTrack: ownerTrack && stillPlaying(ownerTrack.at, now) ? ownerTrack : null,
  }
}
