'use client'

import type { ReactNode } from 'react'
import { NIGHTSTAND_NAMES, NIGHTSTAND_STYLES, type Layout, type planRoom } from '@/lib/room'
import styles from '../Room.module.css'

/** what each section of the panel gets handed */
export interface Section {
  layout: Layout
  plan: ReturnType<typeof planRoom>
  set: <K extends keyof Layout>(key: K, value: Layout[K]) => void
}

export function NightstandChoice({
  layout,
  set,
}: {
  layout: Layout
  set: (key: 'nightstand', value: Layout['nightstand']) => void
}) {
  return (
    <Choice
      value={layout.nightstand}
      options={NIGHTSTAND_STYLES.map((n) => [n, NIGHTSTAND_NAMES[n] ?? n])}
      onPick={(n) => set('nightstand', n)}
    />
  )
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      {children}
    </div>
  )
}

export function Choice<T extends string>({
  value,
  options,
  onPick,
  disabled = [],
}: {
  value: T
  options: [T, string][]
  onPick: (v: T) => void
  disabled?: T[]
}) {
  return (
    <div className={styles.options}>
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          className={styles.button}
          data-on={v === value}
          disabled={disabled.includes(v)}
          onClick={() => onPick(v)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function Swatches({
  colours,
  value,
  onPick,
}: {
  colours: string[]
  value: string
  onPick: (c: string) => void
}) {
  return (
    <div className={styles.options}>
      {colours.map((c) => (
        <button
          key={c}
          type="button"
          className={styles.swatch}
          style={{ background: c }}
          data-on={c === value}
          onClick={() => onPick(c)}
          aria-label={c}
        />
      ))}
    </div>
  )
}
