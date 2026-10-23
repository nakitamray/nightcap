import { WindowWallBackground } from '@/components/WindowWallBackground'
import styles from '@/components/NightCard.module.css'
import { CharacterMaker } from '@/components/you/CharacterMaker'
import { DEFAULT_AVATAR, readAvatar } from '@/lib/avatar'
import { safePath } from '@/lib/paths'
import { hasSupabase } from '@/lib/supabase/env'
import { currentUserId, supabaseServer } from '@/lib/supabase/server'

export const metadata = { title: 'You · Nightcap' }

// what you look like when you're home. Signed out, it's just for trying on.
export default async function You({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const userId = hasSupabase ? await currentUserId() : null
  let saved: unknown = null
  if (userId) {
    const supabase = await supabaseServer()
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar')
      .eq('id', userId)
      .maybeSingle()
    if (error) console.error('reading avatar', error)
    saved = data?.avatar ?? null
  }
  return (
    <main className={styles.page}>
      <WindowWallBackground />
      <CharacterMaker
        initial={saved ? readAvatar(saved) : DEFAULT_AVATAR}
        userId={userId}
        next={safePath(next, userId ? '/keys' : '/')}
        firstTime={Boolean(userId) && !saved}
      />
    </main>
  )
}
