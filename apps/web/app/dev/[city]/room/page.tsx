import { notFound } from 'next/navigation'
import { DevRoom } from '@/components/dev/DevRoom'
import { DEV_MODE } from '@/lib/dev'
import { isTheme } from '@/lib/themes'

export const metadata = { title: 'Dev room · Nightcap' }

export default async function DevRoomPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params
  if (!DEV_MODE || !isTheme(city)) notFound()
  return <DevRoom theme={city} />
}
