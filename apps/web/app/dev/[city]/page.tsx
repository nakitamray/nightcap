import { notFound } from 'next/navigation'
import { DevHouse } from '@/components/dev/DevHouse'
import { DEV_MODE } from '@/lib/dev'
import { isTheme } from '@/lib/themes'

export const metadata = { title: 'Dev · Nightcap' }

export default async function DevStreet({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params
  if (!DEV_MODE || !isTheme(city)) notFound()
  return <DevHouse theme={city} />
}
