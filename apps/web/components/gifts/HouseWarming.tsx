'use client'

import { useEffect, useRef } from 'react'
import styles from './Gifts.module.css'

interface Props {
  houseName: string
  /** everyone else who lives here */
  others: string[]
  onClose: () => void
}

/** the moment a house stops being just you */
export function HouseWarming({ houseName, others, onClose }: Props) {
  const button = useRef<HTMLButtonElement>(null)
  useEffect(() => button.current?.focus(), [])

  const who =
    others.length === 0
      ? 'someone'
      : others.length === 1
        ? others[0]
        : `${others.slice(0, -1).join(', ')} and ${others.at(-1)}`

  return (
    <div className={styles.warming} role="dialog" aria-labelledby="warming-title">
      <h2 id="warming-title">IT&apos;S A HOUSE NOW!</h2>
      <p>
        {who} moved into {houseName}. It&apos;s staying for good, and the lights are up out front
        for the next three days.
      </p>
      <button ref={button} type="button" className={styles.button} onClick={onClose}>
        go and look
      </button>
    </div>
  )
}

const seenKey = (houseId: string) => `nightcap:warmed:${houseId}`

/** whether you've already had the moment for this house, on this browser */
export function sawWarming(houseId: string) {
  try {
    return localStorage.getItem(seenKey(houseId)) === '1'
  } catch {
    return true
  }
}

export function markWarmingSeen(houseId: string) {
  try {
    localStorage.setItem(seenKey(houseId), '1')
  } catch {
    // nothing to remember it in; it'll just show again
  }
}
