'use client'

import { GIFT_KINDS, GIFT_NAMES, type GiftKind } from '@nightcap/scene/gifts'
import { useState } from 'react'
import roomStyles from '@/components/room/Room.module.css'
import styles from './Gifts.module.css'

interface Props {
  to: string
  /** resolves to an error message, or null once it's on their step */
  onLeave: (kind: GiftKind) => Promise<string | null>
  onClose: () => void
}

/** pick something small and leave it on the front step for them */
export function GiftPicker({ to, onLeave, onClose }: Props) {
  const [kind, setKind] = useState<GiftKind | null>(null)
  const [status, setStatus] = useState<'picking' | 'leaving' | 'left'>('picking')
  const [error, setError] = useState('')

  async function leave(e: React.FormEvent) {
    e.preventDefault()
    if (!kind) return
    setStatus('leaving')
    const problem = await onLeave(kind)
    if (problem) {
      setError(problem)
      setStatus('picking')
    } else {
      setStatus('left')
      setTimeout(onClose, 1600)
    }
  }

  return (
    <form className={styles.picker} onSubmit={leave} aria-label={`a gift for ${to}`}>
      {status === 'left' && kind ? (
        <p>
          {GIFT_NAMES[kind]} is waiting on the step for {to}.
        </p>
      ) : (
        <>
          <p>leave something on the step for {to}</p>
          <div className={styles.kinds} role="radiogroup" aria-label="what to leave">
            {GIFT_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                className={roomStyles.button}
                data-on={kind === k}
                onClick={() => setKind(k)}
              >
                {GIFT_NAMES[k].replace(/^an? /, '')}
              </button>
            ))}
          </div>
          {error && <p className={roomStyles.hint}>{error}</p>}
          <div className={styles.row}>
            <button type="button" className={roomStyles.button} onClick={onClose}>
              never mind
            </button>
            <button
              type="submit"
              className={roomStyles.button}
              disabled={!kind || status === 'leaving'}
            >
              {status === 'leaving' ? 'leaving it…' : 'leave it on the step'}
            </button>
          </div>
        </>
      )}
    </form>
  )
}
