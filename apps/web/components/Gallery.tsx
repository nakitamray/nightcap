import type { ReactNode } from 'react'
import { WindowWallBackground } from './WindowWallBackground'
import styles from './Gallery.module.css'

/**
 * The pages that show a set of streets (your keyring, the dev cities): the
 * wall of lit windows behind, a title on top, the streets as window cards.
 */
export function Gallery({
  title,
  sub,
  actions,
  children,
}: {
  title: string
  sub?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <main className={styles.page}>
      <WindowWallBackground />
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          {sub && <p className={styles.sub}>{sub}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      <ul className={styles.grid}>{children}</ul>
    </main>
  )
}
