import styles from './NightCard.module.css'

/** the card on the sign-in pages, dressed as a tall paris window: fanlight, sheers, a balconette */
export function WindowCardFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.card}>
      <span className={styles.fanlight} aria-hidden />
      <span className={styles.curtain} data-side="left" aria-hidden />
      <span className={styles.curtain} data-side="right" aria-hidden />
      {children}
      <span className={styles.balconette} aria-hidden />
      <span className={styles.pots} aria-hidden />
    </div>
  )
}
