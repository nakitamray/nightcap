import Link from 'next/link'
import { WindowCardFrame } from '@/components/WindowCardFrame'
import { WindowWallBackground } from '@/components/WindowWallBackground'
import styles from '@/components/NightCard.module.css'

export const metadata = { title: 'Nobody home · Nightcap' }

// a door that isn't there, or a house you don't have a key to (we don't say
// which, so nobody can find out a house exists by guessing)
export default function NotFound() {
  return (
    <main className={styles.page}>
      <WindowWallBackground />
      <WindowCardFrame>
        <h1 className={styles.title}>NOBODY HOME</h1>
        <p className={styles.lede}>there’s no door here</p>
        <p className={styles.note}>
          this page doesn’t exist, or it’s a house you don’t have a key to. if a friend sent you the
          link, ask them for a fresh invite.
        </p>
        <p className={styles.note}>
          <Link className={styles.link} href="/keys">
            go to your keyring
          </Link>
        </p>
      </WindowCardFrame>
    </main>
  )
}
