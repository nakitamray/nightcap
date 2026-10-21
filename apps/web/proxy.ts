import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hasSupabase, supabaseKey, supabaseUrl } from '@/lib/supabase/env'

// pages you have to be signed in for
const PRIVATE = ['/h/', '/new', '/home', '/join/', '/keys']

// Keeps the session cookie fresh on every request, and bounces signed-out
// people to /login for private pages.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  if (!hasSupabase) return response

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(toSet, headers) {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const { pathname, search } = request.nextUrl
  if (!data?.claims && PRIVATE.some((p) => pathname.startsWith(p))) {
    const login = request.nextUrl.clone()
    login.pathname = '/login'
    login.search = `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(login)
  }
  return response
}

export const config = {
  // skip static files and images
  matcher: ['/((?!_next/static|_next/image|fonts/|icon.svg|.*\\.(?:png|jpg|svg|woff2?)$).*)'],
}
