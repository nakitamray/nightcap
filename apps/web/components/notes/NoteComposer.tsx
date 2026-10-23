'use client'

import { useState } from 'react'
import roomStyles from '@/components/room/Room.module.css'
import styles from './Notes.module.css'

interface Props {
  to: string
  /** resolves to an error message, or null once it's under the door */
  onSend: (body: string) => Promise<string | null>
  onClose: () => void
}

const MAX = 500

/** a slip of paper to write on, then under someone's door it goes */
export function NoteComposer({ to, onSend, onClose }: Props) {
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<'writing' | 'sending' | 'sent'>('writing')
  const [error, setError] = useState('')

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setStatus('sending')
    const problem = await onSend(body.trim())
    if (problem) {
      setError(problem)
      setStatus('writing')
    } else {
      setStatus('sent')
      setTimeout(onClose, 1400)
    }
  }

  return (
    <form className={styles.compose} onSubmit={send} aria-label={`a note for ${to}`}>
      {status === 'sent' ? (
        <p>slipped under {to}&apos;s door.</p>
      ) : (
        <>
          <p>a note for {to}</p>
          <textarea
            className={styles.paper}
            value={body}
            maxLength={MAX}
            onChange={(e) => setBody(e.target.value)}
            placeholder="left you the last croissant…"
            autoFocus
          />
          {error && <p className={roomStyles.hint}>{error}</p>}
          <div className={styles.row}>
            <span>{MAX - body.length} left</span>
            <span className={roomStyles.options}>
              <button type="button" className={roomStyles.button} onClick={onClose}>
                never mind
              </button>
              <button
                type="submit"
                className={roomStyles.button}
                disabled={!body.trim() || status === 'sending'}
              >
                {status === 'sending' ? 'folding…' : 'slip it under'}
              </button>
            </span>
          </div>
        </>
      )}
    </form>
  )
}
