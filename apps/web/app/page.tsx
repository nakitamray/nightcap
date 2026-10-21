import Link from 'next/link'
import { Suspense } from 'react'
import { Street } from '@/components/Street'
import { hasSupabase } from '@/lib/supabase/env'
import { currentUserId } from '@/lib/supabase/server'
import styles from './page.module.css'

// the public page is the demo street with made-up friends; real houses live behind /login
export default async function Landing() {
  const signedIn = hasSupabase ? Boolean(await currentUserId()) : false
  return (
    <>
      {/* the street reads ?theme= from the url, which needs a suspense boundary */}
      <Suspense>
        <Street />
      </Suspense>
      {hasSupabase && (
        <Link className={styles.door} href={signedIn ? '/home' : '/login'}>
          {signedIn ? 'go home' : 'sign in'}
        </Link>
      )}
    </>
  )
}
