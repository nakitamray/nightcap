import { redirect } from 'next/navigation'
import { isTheme } from '@/lib/themes'

// the demo opens on Paris; old links asked for a city with ?theme=
export default async function Demo({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>
}) {
  const { theme } = await searchParams
  redirect(`/demo/${isTheme(theme) ? theme : 'paris'}`)
}
