'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useStreetSnapshot } from '@/lib/snapshots'
import type { Theme } from '@/lib/themes'
import styles from './CityCard.module.css'

interface Props {
  theme: Theme
  href: string
  title: string
  /** a line under the title: who lives there, which street */
  line?: ReactNode
  /** anything else under the card, like an invite button */
  children?: ReactNode
  label: string
}

/**
 * A city as a tall window onto its street: the same arched french window as
 * the sign-in card, with a picture of the actual street drawn by the scene.
 */
export function CityCard({ theme, href, title, line, children, label }: Props) {
  const src = useStreetSnapshot(theme)
  return (
    <li className={styles.item}>
      <Link href={href} className={styles.window} aria-label={label}>
        <span className={styles.glass} data-ready={!!src}>
          {/* a snapshot of the street, already sized; next/image adds nothing here */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {src && <img src={src} alt="" />}
        </span>
        <span className={styles.fanlight} aria-hidden />
        <span className={styles.bars} aria-hidden />
        <span className={styles.balconette} aria-hidden />
      </Link>
      <p className={styles.title}>{title}</p>
      {line && <p className={styles.line}>{line}</p>}
      {children}
    </li>
  )
}

/** an empty window, unlit, for making something new */
export function EmptyWindowCard({
  href,
  title,
  line,
}: {
  href: string
  title: string
  line?: string
}) {
  return (
    <li className={styles.item}>
      <Link href={href} className={`${styles.window} ${styles.empty}`} aria-label={title}>
        <span className={styles.glass}>
          <span className={styles.plus}>+</span>
        </span>
        <span className={styles.fanlight} aria-hidden />
        <span className={styles.balconette} aria-hidden />
      </Link>
      <p className={styles.title}>{title}</p>
      {line && <p className={styles.line}>{line}</p>}
    </li>
  )
}
