import { randomBytes } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { safePath } from '@/lib/paths'
import { authorizeUrl, spotifyConfigured } from '@/lib/spotify'
import { currentUserId } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const next = safePath(req.nextUrl.searchParams.get('next'))
  if (!spotifyConfigured()) return NextResponse.redirect(new URL(next, req.url))
  if (!(await currentUserId()))
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, req.url))

  // state ties the callback to this browser so nobody can link their account to yours
  const state = randomBytes(16).toString('hex')
  const res = NextResponse.redirect(
    authorizeUrl(new URL('/api/spotify/callback', req.url).toString(), state),
  )
  const cookie = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: req.nextUrl.protocol === 'https:',
    maxAge: 600,
    path: '/',
  }
  res.cookies.set('spotify_state', state, cookie)
  res.cookies.set('spotify_next', next, cookie)
  return res
}
