import { NextResponse, type NextRequest } from 'next/server'
import { safePath } from '@/lib/paths'
import { supabaseServer } from '@/lib/supabase/server'

// the magic link lands here with a one-time code; swap it for a session
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const safe = safePath(searchParams.get('next'), '/home')

  if (code) {
    const supabase = await supabaseServer()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${safe}`)
  }
  return NextResponse.redirect(`${origin}/login?error=link`)
}
