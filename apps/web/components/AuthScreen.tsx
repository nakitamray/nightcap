import Link from 'next/link'
import { DEV_MODE } from '@/lib/dev'
import { AuthForm } from './AuthForm'
import { WindowCardFrame } from './WindowCardFrame'
import { WindowWallBackground } from './WindowWallBackground'
import styles from './NightCard.module.css'

/** the front door: sign in or make an account, with the demo for anyone just looking */
export function AuthScreen(props: { mode: 'signin' | 'signup'; next?: string; verified?: boolean }) {
  return (
    <main className={styles.page}>
      <WindowWallBackground />
      <WindowCardFrame>
        <h1 className={styles.title}>NIGHTCAP</h1>
        <p className={styles.lede}>make a home</p>
        <AuthForm mode={props.mode} next={props.next ?? '/keys'} verified={props.verified} />
      </WindowCardFrame>
      <Link className={styles.demo} href="/demo">
        just looking? see the demo street
      </Link>
      {DEV_MODE && (
        <Link className={styles.demo} href="/dev">
          dev mode: every city, just you
        </Link>
      )}
    </main>
  )
}

/** only ever send people back to a page on this site */
export function safeNext(next: string | undefined) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/keys'
}
