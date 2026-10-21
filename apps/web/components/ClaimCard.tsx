import styles from './HouseView.module.css'

interface Props {
  movingHouse: boolean
  error: string
  onClaim: () => void
  onCancel: () => void
}

export function ClaimCard({ movingHouse, error, onClaim, onCancel }: Props) {
  return (
    <div className={styles.claim} role="dialog" aria-label="claim this room">
      <p>this one&apos;s empty.</p>
      <p className={styles.small}>
        {movingHouse ? 'moving here gives up your old room.' : 'make it yours?'}
      </p>
      {error && <p className={styles.small}>{error}</p>}
      <div className={styles.claimButtons}>
        <button type="button" className={styles.button} onClick={onClaim}>
          claim it
        </button>
        <button type="button" className={styles.button} onClick={onCancel}>
          not this one
        </button>
      </div>
    </div>
  )
}
