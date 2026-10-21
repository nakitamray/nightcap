import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CityWindow } from '@/components/CityWindow'
import { DEV_MODE } from '@/lib/dev'
import { THEME_NAMES, THEMES } from '@/lib/themes'
import styles from '../keys/keys.module.css'

export const metadata = { title: 'Dev · Nightcap' }

export default function Dev() {
  if (!DEV_MODE) notFound()
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>DEV MODE</h1>
          <p className={styles.sub}>every city, just you. nothing here touches the database.</p>
        </div>
        <Link className={styles.sub} href="/">
          back to sign in
        </Link>
      </header>
      <ul className={styles.grid}>
        {THEMES.map((t) => (
          <li key={t} className={styles.key}>
            <Link
              href={`/dev/${t}`}
              className={styles.window}
              aria-label={`go to ${THEME_NAMES[t]}`}
            >
              <CityWindow theme={t} seed={`dev-${t}`} className={styles.city} />
            </Link>
            <p className={styles.name}>{THEME_NAMES[t]}</p>
            <p className={styles.members}>
              <Link href={`/dev/${t}`}>the street</Link> &middot;{' '}
              <Link href={`/dev/${t}/room`}>straight to your room</Link>
            </p>
          </li>
        ))}
      </ul>
    </main>
  )
}
