'use client'

import { useState } from 'react'
import styles from './NightCard.module.css'

export function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className={styles.copyRow}>
      <input
        className={styles.input}
        readOnly
        value={link}
        onFocus={(e) => e.target.select()}
        aria-label="invite link"
      />
      <button type="button" className={styles.button} onClick={copy}>
        {copied ? 'copied' : 'copy'}
      </button>
    </div>
  )
}
