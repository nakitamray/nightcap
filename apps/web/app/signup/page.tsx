import { redirect } from 'next/navigation'
import { AuthScreen } from '@/components/AuthScreen'
import { currentUserId } from '@/lib/supabase/server'

export const metadata = { title: 'Make an account · Nightcap' }

export default async function SignupPage() {
  if (await currentUserId()) redirect('/keys')
  return <AuthScreen mode="signup" />
}
