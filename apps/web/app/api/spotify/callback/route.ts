import { NextResponse, type NextRequest } from 'next/server'
import { exchangeCode, safePath } from '@/lib/spotify'
import { currentUserId, supabaseServer } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const next = safePath(req.cookies.get('spotify_next')?.value ?? null)
  const back = (err?: string) => {
    const url = new URL(next, req.url)
    if (err) url.searchParams.set('spotify', err)
    const res = NextResponse.redirect(url)
    res.cookies.delete('spotify_state')
    res.cookies.delete('spotify_next')
    return res
  }

  const code = params.get('code')
  const state = params.get('state')
  if (!code || !state || state !== req.cookies.get('spotify_state')?.value) return back('denied')

  const userId = await currentUserId()
  if (!userId) return back('signed-out')

  const tokens = await exchangeCode(code, new URL('/api/spotify/callback', req.url).toString())
  if (!tokens?.refresh_token) return back('failed')

  const supabase = await supabaseServer()
  const { error } = await supabase.from('spotify_links').upsert({
    user_id: userId,
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  })
  return back(error ? 'failed' : undefined)
}
