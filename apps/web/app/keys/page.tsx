import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CityWindow } from '@/components/CityWindow'
import { InviteButton } from '@/components/InviteButton'
import { SignOut } from '@/components/SignOut'
import { daysLeft, MAX_HOUSES, memberLine } from '@/lib/members'
import { currentUserId, supabaseServer } from '@/lib/supabase/server'
import { isTheme, THEME_NAMES } from '@/lib/themes'
import styles from './keys.module.css'

export const metadata = { title: 'Your keyring · Nightcap' }

interface Key {
  id: string
  name: string
  theme: string
  created_at: string
}

// The keyring: every house you have a key to, each one a window onto its
// city. Pick one to go home to, or make a new one.
export default async function Keyring() {
  const userId = await currentUserId()
  if (!userId) redirect('/login')
  const supabase = await supabaseServer()

  // houses nobody joined within a week quietly go
  await supabase.rpc('sweep_lonely_houses')

  const { data: mine } = await supabase.from('memberships').select('house_id').eq('user_id', userId)
  const ids = (mine ?? []).map((m) => m.house_id)
  const [{ data: houses }, { data: rooms }, { data: me }] = await Promise.all([
    supabase.from('houses').select('id, name, theme, created_at').in('id', ids).order('created_at'),
    supabase.from('memberships').select('house_id, user_id').in('house_id', ids),
    supabase.from('profiles').select('display_name, username').eq('id', userId).maybeSingle(),
  ])
  const people = new Set((rooms ?? []).map((r) => r.user_id))
  const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', [...people])
  const nameOf = (id: string) => profiles?.find((p) => p.id === id)?.display_name ?? '?'
  const myName = me?.display_name ?? 'you'
  const keys = (houses ?? []) as Key[]

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>YOUR KEYRING</h1>
          <p className={styles.sub}>
            {keys.length} of {MAX_HOUSES} houses &middot; signed in as {me?.username ?? myName}
          </p>
        </div>
        <SignOut />
      </header>

      <ul className={styles.grid}>
        {keys.map((h) => {
          const members = (rooms ?? []).filter((r) => r.house_id === h.id).map((r) => nameOf(r.user_id))
          const waiting = members.length < 2
          const theme = isTheme(h.theme) ? h.theme : 'paris'
          return (
            <li key={h.id} className={styles.key} data-waiting={waiting}>
              <Link href={`/h/${h.id}`} className={styles.window} aria-label={`go home to ${h.name}`}>
                <CityWindow theme={theme} seed={h.id} className={styles.city} />
              </Link>
              <p className={styles.name}>{h.name}</p>
              <p className={styles.members}>
                {THEME_NAMES[theme]} &middot; {members.length >= 6 ? `${members.length} people` : memberLine(members, myName)}
              </p>
              {waiting && (
                <div className={styles.waiting}>
                  <p>
                    waiting for a friend &middot; {daysLeft(h.created_at)} days before it goes
                  </p>
                  <InviteButton houseId={h.id} userId={userId} />
                </div>
              )}
            </li>
          )
        })}
        {keys.length < MAX_HOUSES && (
          <li className={styles.key}>
            <Link href="/new" className={`${styles.window} ${styles.newWindow}`}>
              <span className={styles.plus}>+</span>
              <span>make a new house</span>
            </Link>
          </li>
        )}
      </ul>
    </main>
  )
}
