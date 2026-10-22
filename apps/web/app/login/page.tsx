import { redirect } from 'next/navigation'
import { AuthScreen } from '@/components/AuthScreen'
import { safePath } from '@/lib/paths'
import { currentUserId } from '@/lib/supabase/server'

export const metadata = { title: 'Sign in · Nightcap' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; verified?: string }>
}) {
  const { next, verified } = await searchParams
  if (await currentUserId()) redirect(safePath(next))
  return <AuthScreen mode="signin" next={safePath(next)} verified={verified === '1'} />
}
