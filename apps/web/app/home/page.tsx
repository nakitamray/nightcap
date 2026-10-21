import { redirect } from 'next/navigation'
import { currentUserId, supabaseServer } from '@/lib/supabase/server'

// "go home": straight to your house, or to making one if you don't have one yet
export default async function Home() {
  const userId = await currentUserId()
  if (!userId) redirect('/login')

  const supabase = await supabaseServer()
  const { data } = await supabase
    .from('memberships')
    .select('house_id')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1)

  const first = data?.[0]
  redirect(first ? `/h/${first.house_id}` : '/new')
}
