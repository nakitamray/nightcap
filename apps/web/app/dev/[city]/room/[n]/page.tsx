import { notFound } from 'next/navigation'
import { SandboxRoom } from '@/components/sandbox/SandboxRoom'
import { DEV_MODE } from '@/lib/dev'
import { roomIndex } from '@/lib/house'
import { isTheme } from '@/lib/themes'

export const metadata = { title: 'Dev room · Nightcap' }

export default async function DevRoom({
  params,
}: {
  params: Promise<{ city: string; n: string }>
}) {
  const { city, n } = await params
  const room = roomIndex(n)
  if (!DEV_MODE || !isTheme(city) || room === null) notFound()
  return <SandboxRoom theme={city} room={room} base="/dev" />
}
