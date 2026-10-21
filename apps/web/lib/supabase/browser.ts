import { createBrowserClient } from '@supabase/ssr'
import { supabaseKey, supabaseUrl } from './env'

export function supabaseBrowser() {
  return createBrowserClient(supabaseUrl, supabaseKey)
}
