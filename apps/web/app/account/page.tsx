import Link from 'next/link'
import { redirect } from 'next/navigation'
import { DeleteAccount } from '@/components/account/DeleteAccount'
import own from '@/components/account/Account.module.css'
import { SignOut } from '@/components/SignOut'
import { WindowCardFrame } from '@/components/WindowCardFrame'
import { WindowWallBackground } from '@/components/WindowWallBackground'
import styles from '@/components/NightCard.module.css'
import { spotifyConfigured, spotifyStatus } from '@/lib/spotify'
import { SPOTIFY_RESULT } from '@/lib/spotifyText'
import { supabaseServer } from '@/lib/supabase/server'

export const metadata = { title: 'Your account · Nightcap' }

// Who you are here, your spotify connection, and the way out.
export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ spotify?: string }>
}) {
  const supabase = await supabaseServer()
  const { data: auth } = await supabase.auth.getClaims()
  const userId = auth?.claims.sub
  if (!userId) redirect('/login?next=/account')
  const { spotify: result } = await searchParams

  const [{ data: me }, { count: houses }, spotify] = await Promise.all([
    supabase.from('profiles').select('display_name, username').eq('id', userId).maybeSingle(),
    supabase
      .from('memberships')
      .select('house_id', { count: 'exact', head: true })
      .eq('user_id', userId),
    spotifyConfigured() ? spotifyStatus(supabase, userId) : null,
  ])
  const name = me?.username ?? me?.display_name ?? 'you'
  const email = typeof auth.claims.email === 'string' ? auth.claims.email : null
  const said = result && SPOTIFY_RESULT[result]

  return (
    <main className={styles.page}>
      <WindowWallBackground />
      <WindowCardFrame>
        <h1 className={styles.title}>ACCOUNT</h1>
        <p className={styles.lede}>signed in as {name}</p>

        <section className={own.section}>
          <h2>SPOTIFY</h2>
          {said && <p role="status">{said}</p>}
          {!spotify ? (
            <p>spotify isn’t hooked up on this site yet.</p>
          ) : spotify.state === 'linked' ? (
            <>
              <p>
                connected{spotify.name ? ` as ${spotify.name}` : ''}. the record player in your room
                spins when you’re listening, and your housemates can see what’s on.
              </p>
              <Disconnect />
            </>
          ) : spotify.state === 'not-allowed' ? (
            <>
              {result !== 'not-allowed' && <p role="alert">{SPOTIFY_RESULT['not-allowed']}</p>}
              <Disconnect />
            </>
          ) : spotify.state === 'unavailable' ? (
            <>
              <p>spotify isn’t answering right now. your connection is still saved.</p>
              <Disconnect />
            </>
          ) : (
            <>
              <p>
                connect spotify and the record player in your room spins while you’re listening.
                everyone in your houses can see what’s on. you can disconnect any time.
              </p>
              <a className={own.button} href="/api/spotify/login?next=/account">
                connect spotify
              </a>
            </>
          )}
        </section>

        <section className={own.section}>
          <h2>HOUSES</h2>
          <p>
            you live in {houses ?? 0} {houses === 1 ? 'house' : 'houses'}. to move out of one, find
            it on{' '}
            <Link href="/keys" className={styles.link}>
              your keyring
            </Link>
            .
          </p>
        </section>

        <section className={own.section}>
          <h2>LEAVING</h2>
          {email && <p>your login is {email}.</p>}
          <p>
            <SignOut />
          </p>
          <DeleteAccount word={me?.username?.toLowerCase() ?? 'delete'} />
        </section>
      </WindowCardFrame>
      <Link className={own.back} href="/keys">
        back to your keyring
      </Link>
    </main>
  )
}

function Disconnect() {
  return (
    <form action="/api/spotify/disconnect" method="post">
      <input type="hidden" name="next" value="/account" />
      <button type="submit" className={own.quiet}>
        disconnect spotify
      </button>
    </form>
  )
}
