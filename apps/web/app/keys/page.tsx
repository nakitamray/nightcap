import { redirect } from 'next/navigation'
import { CityCard, EmptyWindowCard } from '@/components/CityCard'
import cardStyles from '@/components/CityCard.module.css'
import { Gallery } from '@/components/Gallery'
import { InviteButton } from '@/components/InviteButton'
import { SignOut } from '@/components/SignOut'
import { MAX_HOUSES, memberLine } from '@/lib/members'
import { daysUntil, goesAt, houseNews } from '@/lib/moments'
import { isHome } from '@/lib/presence'
import { currentUserId, supabaseServer } from '@/lib/supabase/server'
import { isTheme, THEME_NAMES } from '@/lib/themes'

export const metadata = { title: 'Your keyring · Nightcap' }

interface Key {
  id: string
  name: string
  theme: string
  created_at: string
  keep_until: string | null
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
  const [
    { data: houses },
    { data: rooms },
    { data: me },
    { data: notes },
    { data: gifts },
    { data: presence },
  ] = await Promise.all([
    supabase
      .from('houses')
      .select('id, name, theme, created_at, keep_until')
      .in('id', ids)
      .order('created_at'),
    supabase.from('memberships').select('house_id, user_id').in('house_id', ids),
    supabase.from('profiles').select('display_name, username').eq('id', userId).maybeSingle(),
    // what's waiting for you in each house
    supabase.from('notes').select('house_id').eq('to_user', userId).is('read_at', null),
    supabase.from('gifts').select('house_id').eq('to_user', userId).is('taken_at', null),
    supabase.from('presence').select('house_id, user_id, seen_at').in('house_id', ids),
  ])
  const people = new Set((rooms ?? []).map((r) => r.user_id))
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', [...people])
  const nameOf = (id: string) => profiles?.find((p) => p.id === id)?.display_name ?? '?'
  const myName = me?.display_name ?? 'you'
  const keys = (houses ?? []) as Key[]
  const count = (rows: { house_id: string }[] | null, house: string) =>
    (rows ?? []).filter((r) => r.house_id === house).length

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
        const news = houseNews({
          notes: count(notes, h.id),
          gifts: count(gifts, h.id),
          home: whoIsHome(presence, h.id, userId).map(nameOf),
        })
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
            {news && <p className={cardStyles.news}>{news}</p>}
            {waiting && (
              <div className={cardStyles.waiting}>
                <p>
                  waiting for a friend · {daysUntil(goesAt(h.created_at, h.keep_until))} days before
                  it goes
                </p>
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

/** everyone but you whose light is on in a house right now */
function whoIsHome(
  presence: { house_id: string; user_id: string; seen_at: string }[] | null,
  house: string,
  you: string,
) {
  const now = Date.now()
  return (presence ?? [])
    .filter((p) => p.house_id === house && p.user_id !== you && isHome(p.seen_at, now))
    .map((p) => p.user_id)
}
