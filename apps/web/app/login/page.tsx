import { redirect } from 'next/navigation'
import { AuthScreen, safeNext } from '@/components/AuthScreen'
import { currentUserId } from '@/lib/supabase/server'

export const metadata = { title: 'Sign in · Nightcap' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; verified?: string }>
}) {
  const { next, verified } = await searchParams
  if (await currentUserId()) redirect(safeNext(next))
  return <AuthScreen mode="signin" next={safeNext(next)} verified={verified === '1'} />
}
