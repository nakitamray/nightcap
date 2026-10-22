import { notFound } from 'next/navigation'
import { SandboxRoom } from '@/components/sandbox/SandboxRoom'
import { roomIndex } from '@/lib/house'
import { isTheme } from '@/lib/themes'

export const metadata = { title: 'Demo room · Nightcap' }

export default async function DemoRoom({
  params,
}: {
  params: Promise<{ city: string; n: string }>
}) {
  const { city, n } = await params
  const room = roomIndex(n)
  if (!isTheme(city) || room === null) notFound()
  return <SandboxRoom theme={city} room={room} base="/demo" />
}
