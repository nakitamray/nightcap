import Link from 'next/link'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import { isTheme, THEME_NAMES } from '@/lib/themes'
import { WindowCardFrame } from '@/components/WindowCardFrame'
import { WindowWallBackground } from '@/components/WindowWallBackground'
import styles from '@/components/NightCard.module.css'

export const metadata = { title: 'Join · Nightcap' }

interface InvitePreview {
  house_name: string
  house_theme: string
  people: number
}

// moving in is a button press (a POST), never just opening the link, so
// another site can't sign you up for a house by loading it in the background
async function moveIn(form: FormData) {
  'use server'
  const code = String(form.get('code') ?? '')
  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc('join_house', { invite_code: code })
  if (error || !data) {
    const why = error?.code === 'P0001' ? error.message : '1'
    redirect(`/join/${encodeURIComponent(code)}?error=${encodeURIComponent(why)}`)
  }
  redirect(`/h/${data}`)
}

export default async function Join({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { code } = await params
  const { error } = await searchParams
  const supabase = await supabaseServer()
  const { data } = await supabase.rpc('invite_preview', { invite_code: code })
  const house = (data as InvitePreview[] | null)?.[0]

  if (!house) {
    return (
      <main className={styles.page}>
        <WindowWallBackground />
        <WindowCardFrame>
          <h1 className={styles.title}>HM.</h1>
          <p className={styles.lede}>that invite has run out, or never existed</p>
          <p className={styles.note}>
            Ask whoever sent it for a fresh link, or{' '}
            <Link className={styles.link} href="/keys">
              go back to your keyring
            </Link>
            .
          </p>
        </WindowCardFrame>
      </main>
    )
  }

  const city = isTheme(house.house_theme) ? THEME_NAMES[house.house_theme] : 'the city'
  return (
    <main className={styles.page}>
      <WindowWallBackground />
      <WindowCardFrame>
        <h1 className={styles.title}>YOU&apos;RE INVITED</h1>
        <p className={styles.lede}>
          to {house.house_name}, in {city}
        </p>
        <p className={styles.note}>
          {house.people === 1
            ? 'one person lives there so far.'
            : `${house.people} people live there.`}
        </p>
        <form className={styles.form} action={moveIn}>
          <input type="hidden" name="code" value={code} />
          {error && (
            <p className={styles.error}>
              {error === '1' ? 'Something went wrong. Try again?' : error}
            </p>
          )}
          <button className={styles.button} type="submit">
            move in
          </button>
        </form>
        <p className={styles.note}>
          <Link className={styles.link} href="/keys">
            not now
          </Link>
        </p>
      </WindowCardFrame>
    </main>
  )
}
