import { redirect } from 'next/navigation'
import { AuthScreen } from '@/components/AuthScreen'
import { hasSupabase } from '@/lib/supabase/env'
import { currentUserId } from '@/lib/supabase/server'

// the front door. signed in? straight to your keyring. no backend configured
// (the demo deploy)? straight to the street.
export default async function Landing() {
  if (!hasSupabase) redirect('/demo')
  if (await currentUserId()) redirect('/keys')
  return <AuthScreen mode="signin" />
}
