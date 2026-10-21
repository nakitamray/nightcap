import { LoginForm } from './LoginForm'
import { WindowCardFrame } from '@/components/WindowCardFrame'
import { WindowWallBackground } from '@/components/WindowWallBackground'
import styles from '@/components/NightCard.module.css'

export const metadata = { title: 'Sign in · Nightcap' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams
  return (
    <main className={styles.page}>
      <WindowWallBackground />
      <WindowCardFrame>
        <h1 className={styles.title}>NIGHTCAP</h1>
        <p className={styles.lede}>make a home</p>
        <LoginForm next={safeNext(next)} linkError={error === 'link'} />
      </WindowCardFrame>
    </main>
  )
}

/** only ever send people back to a page on this site */
function safeNext(next: string | undefined) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/home'
}
