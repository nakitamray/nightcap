import Link from 'next/link'
import { Suspense } from 'react'
import { Street } from '@/components/Street'
import styles from '../page.module.css'

export const metadata = { title: 'Demo · Nightcap' }

// the street with made-up friends in it, for anyone who wants a look around
export default function Demo() {
  return (
    <>
      {/* the street reads ?theme= from the url, which needs a suspense boundary */}
      <Suspense>
        <Street />
      </Suspense>
      <Link className={styles.door} href="/">
        sign in
      </Link>
    </>
  )
}
