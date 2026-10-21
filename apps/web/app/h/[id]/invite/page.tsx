import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { CopyLink } from '@/components/CopyLink'
import { WindowCardFrame } from '@/components/WindowCardFrame'
import { WindowWallBackground } from '@/components/WindowWallBackground'
import styles from '@/components/NightCard.module.css'
import { currentUserId, supabaseServer } from '@/lib/supabase/server'

export const metadata = { title: 'Invite · Nightcap' }

export default async function Invite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await currentUserId()
  const supabase = await supabaseServer()

  const { data: house } = await supabase
    .from('houses')
    .select('id, name')
    .eq('id', id)
    .maybeSingle()
  if (!house || !userId) notFound()

  // reuse a link that's still good so refreshing doesn't pile up invites
  const { data: existing } = await supabase
    .from('invites')
    .select('code')
    .eq('house_id', id)
    .gt('expires_at', aDayFromNow())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  let code = existing?.code
  if (!code) {
    const { data } = await supabase
      .from('invites')
      .insert({ house_id: id, created_by: userId })
      .select('code')
      .single()
    code = data?.code
  }

  const { count } = await supabase
    .from('memberships')
    .select('user_id', { count: 'exact', head: true })
    .eq('house_id', id)
  const h = await headers()
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`

  return (
    <main className={styles.page}>
      <WindowWallBackground />
      <WindowCardFrame>
        <h1 className={styles.title}>{house.name.toUpperCase()}</h1>
        <p className={styles.lede}>now send the key round</p>
        {code ? (
          <CopyLink link={`${origin}/join/${code}`} />
        ) : (
          <p className={styles.error}>Couldn’t make a link. Refresh to try again.</p>
        )}
        <p className={styles.note}>
          {(count ?? 0) < 2
            ? 'A house needs two people to stay standing. If nobody moves in within a week, it goes.'
            : 'The link works for a week. Anyone with it gets a key.'}
        </p>
        <p className={styles.note}>
          <Link className={styles.link} href={`/h/${id}`}>
            go inside
          </Link>{' '}
          ·{' '}
          <Link className={styles.link} href="/keys">
            back to your keyring
          </Link>
        </p>
      </WindowCardFrame>
    </main>
  )
}

// only hand out links with at least a day left on them
function aDayFromNow() {
  return new Date(Date.now() + 86_400_000).toISOString()
}
