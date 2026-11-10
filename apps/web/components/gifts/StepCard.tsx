'use client'

import { GIFT_NAMES } from '@nightcap/scene/gifts'
import { useEffect, useRef } from 'react'
import type { Gift } from '@/lib/gifts'
import styles from './Gifts.module.css'

interface Props {
  gifts: Gift[]
  userId: string
  /** where the step is on screen; the card hangs over it. Centred if null */
  bounds: { x: number; y: number; width: number; height: number } | null
  onTakeIn: (id: string) => void
  onClose: () => void
}

/** what's on the front step, who it's for, and taking yours inside */
export function StepCard({ gifts, userId, bounds, onTakeIn, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
    const close = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])

  const style = bounds
    ? { left: bounds.x + bounds.width / 2, top: bounds.y - 12 }
    : { left: '50%', top: '50%' }
  const mine = gifts.filter((g) => g.to === userId)
  const others = gifts.filter((g) => g.to !== userId)

  return (
    <div
      ref={ref}
      className={styles.step}
      data-anchored={!!bounds}
      style={style}
      role="dialog"
      aria-label="the front step"
      tabIndex={-1}
    >
      <h2 className={styles.heading}>on the step</h2>
      {gifts.length === 0 && <p className={styles.quiet}>nothing left out tonight</p>}
      <ul className={styles.gifts}>
        {mine.map((g) => (
          <li key={g.id} className={styles.gift} data-mine>
            <span>
              {GIFT_NAMES[g.kind]} for you, from {g.fromName}
            </span>
            <button type="button" className={styles.button} onClick={() => onTakeIn(g.id)}>
              take it in
            </button>
          </li>
        ))}
        {others.map((g) => (
          <li key={g.id} className={styles.gift}>
            <span>
              {GIFT_NAMES[g.kind]} for {g.toName}
              {g.from === userId ? ', from you' : ''}
            </span>
          </li>
        ))}
      </ul>
      <button type="button" className={styles.close} onClick={onClose}>
        close
      </button>
    </div>
  )
}
