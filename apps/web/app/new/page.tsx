import Link from 'next/link'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import { isTheme, THEME_NAMES, THEMES } from '@/lib/themes'
import { WindowCardFrame } from '@/components/WindowCardFrame'
import { WindowWallBackground } from '@/components/WindowWallBackground'
import styles from '@/components/NightCard.module.css'

export const metadata = { title: 'New house · Nightcap' }

async function createHouse(form: FormData) {
  'use server'
  const name = String(form.get('name') ?? '')
    .trim()
    .slice(0, 40)
  const theme = form.get('theme')
  if (!name || !isTheme(theme)) redirect('/new?error=1')

  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc('create_house', {
    house_name: name,
    house_theme: theme,
  })
  // our own raised errors (too many houses) are worth showing as they are
  if (error?.code === 'P0001') redirect(`/new?error=${encodeURIComponent(error.message)}`)
  if (error || !data) redirect('/new?error=1')
  redirect(`/h/${data}/invite`)
}

export default async function NewHouse({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return (
    <main className={styles.page}>
      <WindowWallBackground />
      <WindowCardFrame>
        <h1 className={styles.title}>NEW HOUSE</h1>
        <p className={styles.lede}>name it, then send the link round</p>
        <form className={styles.form} action={createHouse}>
          <label className={styles.label}>
            What’s it called? This goes up on the sign.
            <input
              className={styles.input}
              name="name"
              required
              maxLength={40}
              placeholder="Nightcap"
            />
          </label>
          <label className={styles.label}>
            Where is it?
            <select className={styles.select} name="theme" defaultValue="paris">
              {THEMES.map((t) => (
                <option key={t} value={t}>
                  {THEME_NAMES[t]}
                </option>
              ))}
            </select>
          </label>
          {error && (
            <p className={styles.error}>
              {error === '1' ? 'Something went wrong making the house. Try again?' : error}
            </p>
          )}
          <button className={styles.button} type="submit">
            make the house
          </button>
        </form>
        <p className={styles.note}>
          <Link className={styles.link} href="/keys">
            back to your keyring
          </Link>
        </p>
      </WindowCardFrame>
    </main>
  )
}
