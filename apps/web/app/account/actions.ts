'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { currentUserId, supabaseServer } from '@/lib/supabase/server'

export interface ActionState {
  error?: string
}

/** move out of one house; if you were the last one there, it closes */
export async function leaveHouse(_: ActionState, form: FormData): Promise<ActionState> {
  const houseId = String(form.get('house') ?? '')
  const supabase = await supabaseServer()
  const { error } = await supabase.rpc('leave_house', { h: houseId })
  if (error) {
    console.error('moving out', error)
    return { error: error.code === 'P0001' ? error.message : 'that didn’t work, try again' }
  }
  revalidatePath('/keys')
  return {}
}

/**
 * Deletes your account and everything that's yours, then signs you out. You
 * have to type your username (or "delete", if you don't have one) to do it.
 */
export async function deleteAccount(_: ActionState, form: FormData): Promise<ActionState> {
  const userId = await currentUserId()
  if (!userId) redirect('/login')
  const supabase = await supabaseServer()
  const { data: me } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .maybeSingle()
  const expected = (me?.username ?? 'delete').toLowerCase()
  const typed = String(form.get('confirm') ?? '')
    .trim()
    .toLowerCase()
  if (typed !== expected) return { error: `type ${expected} to confirm` }

  const { error } = await supabase.rpc('delete_account')
  if (error) {
    console.error('deleting account', error)
    return { error: 'your account couldn’t be deleted just now, try again' }
  }
  // the login's gone on the server; this clears the cookies here too
  await supabase.auth.signOut({ scope: 'local' })
  redirect('/login?goodbye=1')
}
