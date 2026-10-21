'use client'

import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/browser'
import styles from './HouseView.module.css'

export function SignOut() {
  const router = useRouter()
  return (
    <button
      type="button"
      className={styles.button}
      onClick={async () => {
        await supabaseBrowser().auth.signOut()
        router.push('/')
        router.refresh()
      }}
    >
      sign out
    </button>
  )
}
