import Link from 'next/link'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import { WindowWallBackground } from '@/components/WindowWallBackground'
import styles from '@/components/NightCard.module.css'

export const metadata = { title: 'Join · Nightcap' }

export default async function Join({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc('join_house', { invite_code: code })
  if (!error && data) redirect(`/h/${data}`)

  return (
    <main className={styles.page}>
      <WindowWallBackground />
      <div className={styles.card}>
        <h1 className={styles.title}>HM.</h1>
        <p className={styles.lede}>{error?.message ?? 'That invite didn’t work.'}</p>
        <p className={styles.note}>
          Ask whoever sent it for a fresh link, or <Link className={styles.link} href="/home">go home</Link>.
        </p>
      </div>
    </main>
  )
}
