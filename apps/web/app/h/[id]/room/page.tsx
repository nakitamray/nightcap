import { notFound, redirect } from 'next/navigation'
import { currentUserId, supabaseServer } from '@/lib/supabase/server'

// "my room": straight to yours, or out to the house to pick one
export default async function MyRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await currentUserId()
  if (!userId) notFound()
  const supabase = await supabaseServer()
  const { data: me } = await supabase
    .from('memberships')
    .select('room')
    .eq('house_id', id)
    .eq('user_id', userId)
    .maybeSingle()
  redirect(me?.room == null ? `/h/${id}` : `/h/${id}/room/${me.room}`)
}
