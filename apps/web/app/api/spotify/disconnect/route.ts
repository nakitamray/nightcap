import { NextResponse, type NextRequest } from 'next/server'
import { safePath } from '@/lib/paths'
import { currentUserId, supabaseServer } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const next = safePath(String(form.get('next') ?? ''))
  const userId = await currentUserId()
  if (userId) {
    const supabase = await supabaseServer()
    await supabase.from('spotify_links').delete().eq('user_id', userId)
    await supabase.from('now_playing').delete().eq('user_id', userId)
  }
  return NextResponse.redirect(new URL(next, req.url), 303)
}
