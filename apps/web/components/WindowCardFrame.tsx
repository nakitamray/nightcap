import styles from './NightCard.module.css'

/** the card on the sign-in pages, dressed as a window: curtains, a sill, flowers */
export function WindowCardFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.card}>
      <span className={styles.curtain} data-side="left" aria-hidden />
      <span className={styles.curtain} data-side="right" aria-hidden />
      {children}
      <span className={styles.sill} aria-hidden />
      <span className={styles.flowers} aria-hidden />
    </div>
  )
}
