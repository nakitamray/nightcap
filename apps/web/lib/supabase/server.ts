import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseKey, supabaseUrl } from './env'

/** one per request -- never share it, it carries that person's session */
export async function supabaseServer() {
  const store = await cookies()
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return store.getAll()
      },
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) => store.set(name, value, options))
        } catch {
          // called from a server component, where cookies are read-only.
          // fine -- proxy.ts refreshes the session on the way in.
        }
      },
    },
  })
}

export async function currentUserId() {
  const supabase = await supabaseServer()
  const { data } = await supabase.auth.getClaims()
  return data?.claims.sub ?? null
}
