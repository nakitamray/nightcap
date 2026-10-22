import { redirect } from 'next/navigation'
import { CityCard, EmptyWindowCard } from '@/components/CityCard'
import cardStyles from '@/components/CityCard.module.css'
import { Gallery } from '@/components/Gallery'
import { InviteButton } from '@/components/InviteButton'
import { SignOut } from '@/components/SignOut'
import { daysLeft, MAX_HOUSES, memberLine } from '@/lib/members'
import { currentUserId, supabaseServer } from '@/lib/supabase/server'
import { isTheme, THEME_NAMES } from '@/lib/themes'

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
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', [...people])
  const nameOf = (id: string) => profiles?.find((p) => p.id === id)?.display_name ?? '?'
  const myName = me?.display_name ?? 'you'
  const keys = (houses ?? []) as Key[]

  return (
    <Gallery
      title="YOUR KEYRING"
      sub={`${keys.length} of ${MAX_HOUSES} houses · signed in as ${me?.username ?? myName}`}
      actions={<SignOut />}
    >
      {keys.map((h) => {
        const members = (rooms ?? [])
          .filter((r) => r.house_id === h.id)
          .map((r) => nameOf(r.user_id))
        const waiting = members.length < 2
        const theme = isTheme(h.theme) ? h.theme : 'paris'
        return (
          <CityCard
            key={h.id}
            theme={theme}
            href={`/h/${h.id}`}
            label={`go home to ${h.name}`}
            title={h.name}
            line={`${THEME_NAMES[theme]} · ${members.length >= 6 ? `${members.length} people` : memberLine(members, myName)}`}
          >
            {waiting && (
              <div className={cardStyles.waiting}>
                <p>waiting for a friend · {daysLeft(h.created_at)} days before it goes</p>
                <InviteButton houseId={h.id} userId={userId} />
              </div>
            )}
          </CityCard>
        )
      })}
      {keys.length < MAX_HOUSES && (
        <EmptyWindowCard href="/new" title="a new house" line="pick a city, send the link round" />
      )}
    </Gallery>
  )
}
