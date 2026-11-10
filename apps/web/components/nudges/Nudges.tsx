'use client'

import Link from 'next/link'
import styles from './Nudges.module.css'
import type { ShownNudge } from './useNudges'

interface Props {
  shown: ShownNudge[]
  onDismiss: (id: number) => void
  /** whether this browser can show notifications, and what you said */
  allowed: NotificationPermission | 'unsupported'
  onAsk: () => void
}

/** the nudges stacked in the corner, and a way to get them when you're away */
export function Nudges({ shown, onDismiss, allowed, onAsk }: Props) {
  return (
    <div className={styles.stack}>
      <ul className={styles.list} aria-live="polite">
        {shown.map((n) => (
          <li key={n.id} className={styles.nudge}>
            {n.href ? (
              <Link href={n.href} onClick={() => onDismiss(n.id)}>
                {n.text}
              </Link>
            ) : (
              <span>{n.text}</span>
            )}
            <button
              type="button"
              className={styles.close}
              aria-label="dismiss"
              onClick={() => onDismiss(n.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {allowed === 'default' && (
        <button type="button" className={styles.ask} onClick={onAsk}>
          nudge me when I’m on another tab
        </button>
      )}
    </div>
  )
}
