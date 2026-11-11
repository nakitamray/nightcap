'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { WindowCardFrame } from '@/components/WindowCardFrame'
import styles from '@/components/NightCard.module.css'

// something broke while loading a page. The rest of the site is fine, so
// offer another go and a way home. (No window wall behind this one: if the
// page broke, better not to start the renderer up again.)
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className={styles.page}>
      <WindowCardFrame>
        <h1 className={styles.title}>LIGHTS OUT</h1>
        <p className={styles.lede}>something went wrong</p>
        <p className={styles.note}>
          that page didn’t load properly. it’s probably just a blip, so try again.
        </p>
        {error.digest && (
          <p className={styles.hint}>if it keeps happening, mention {error.digest}</p>
        )}
        <button type="button" className={styles.button} onClick={reset}>
          try again
        </button>
        <p className={styles.note}>
          <Link className={styles.link} href="/keys">
            go to your keyring
          </Link>
        </p>
      </WindowCardFrame>
    </main>
  )
}
