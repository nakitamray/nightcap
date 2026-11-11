import { NextResponse, type NextRequest } from 'next/server'
import { safePath } from '@/lib/paths'
import { exchangeCode, sealedTokens } from '@/lib/spotify'
import { currentUserId, supabaseServer } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const next = safePath(req.cookies.get('spotify_next')?.value ?? null)
  const back = (err?: string) => {
    const url = new URL(next, req.url)
    url.searchParams.set('spotify', err ?? 'connected')
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

  const result = await exchangeCode(code, new URL('/api/spotify/callback', req.url).toString())
  if ('error' in result || !result.tokens.refresh_token) return back('failed')

  const supabase = await supabaseServer()
  const { error } = await supabase
    .from('spotify_links')
    .upsert({ user_id: userId, ...sealedTokens(result.tokens) })
  if (error) console.error('saving spotify link', error)
  return back(error ? 'failed' : undefined)
}
