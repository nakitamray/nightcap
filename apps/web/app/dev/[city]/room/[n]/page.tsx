import { notFound } from 'next/navigation'
import { SandboxRoom } from '@/components/sandbox/SandboxRoom'
import { DEV_MODE } from '@/lib/dev'
import { roomIndex } from '@/lib/house'
import { skyFromParams } from '@/lib/skyParam'
import { isTheme } from '@/lib/themes'

export const metadata = { title: 'Dev room · Nightcap' }

export default async function DevRoom({
  params,
  searchParams,
}: {
  params: Promise<{ city: string; n: string }>
  searchParams: Promise<{ sky?: string; weather?: string }>
}) {
  const { city, n } = await params
  const q = await searchParams
  // trying out skies is a dev thing
  const sky = DEV_MODE ? skyFromParams(q.sky, q.weather) : undefined
  const room = roomIndex(n)
  if (!DEV_MODE || !isTheme(city) || room === null) notFound()
  return <SandboxRoom theme={city} room={room} base="/dev" sky={sky} />
}
