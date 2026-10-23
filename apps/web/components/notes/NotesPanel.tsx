'use client'

import { useEffect } from 'react'
import roomStyles from '@/components/room/Room.module.css'
import styles from './Notes.module.css'

export interface Note {
  id: string
  from: string
  fromName: string
  body: string
  createdAt: string
  read: boolean
}

interface Props {
  notes: Note[]
  onRead: (ids: string[]) => void
  onThrowAway: (id: string) => void
  /** write back to whoever left it */
  onReply?: (note: Note) => void
  onClose: () => void
}

function when(iso: string) {
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

/** the notes that came under your door, newest first */
export function NotesPanel({ notes, onRead, onThrowAway, onReply, onClose }: Props) {
  // opening the pile counts as reading it
  const unread = notes.filter((n) => !n.read).map((n) => n.id)
  const key = unread.join(',')
  useEffect(() => {
    if (key) onRead(key.split(','))
  }, [key, onRead])

  return (
    <aside className={styles.panel} aria-label="notes under your door">
      <div className={styles.head}>
        <h2>under the door</h2>
        <button type="button" className={roomStyles.close} onClick={onClose} aria-label="close">
          ×
        </button>
      </div>
      {notes.length === 0 && <p className={roomStyles.hint}>nothing yet.</p>}
      <div>
        {notes.map((n) => (
          <article key={n.id} className={styles.note} data-new={!n.read}>
            <p className={styles.body}>{n.body}</p>
            <p className={styles.from}>
              {n.fromName} · {when(n.createdAt)}
            </p>
            <div className={styles.actions}>
              {onReply && (
                <button type="button" onClick={() => onReply(n)}>
                  write back
                </button>
              )}
              <button type="button" onClick={() => onThrowAway(n.id)}>
                throw it away
              </button>
            </div>
          </article>
        ))}
      </div>
    </aside>
  )
}
