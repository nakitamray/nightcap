import { notFound } from 'next/navigation'
import { SandboxLounge } from '@/components/sandbox/SandboxLounge'
import { DEV_MODE } from '@/lib/dev'
import { isTheme } from '@/lib/themes'

export const metadata = { title: 'Dev living room · Nightcap' }

// ?people=0..12 to see it empty or packed, ?house=anything for another house's living room
export default async function DevLounge({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>
  searchParams: Promise<{ people?: string; house?: string }>
}) {
  const { city } = await params
  const { people, house } = await searchParams
  if (!DEV_MODE || !isTheme(city)) notFound()
  const n = Number(people)
  const count =
    people !== undefined && Number.isInteger(n) ? Math.max(0, Math.min(12, n)) : undefined
  return <SandboxLounge theme={city} base="/dev" count={count} house={house?.slice(0, 40)} />
}
