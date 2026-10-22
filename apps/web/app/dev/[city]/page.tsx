import { notFound } from 'next/navigation'
import { SandboxStreet } from '@/components/sandbox/SandboxStreet'
import { DEV_MODE } from '@/lib/dev'
import { isTheme } from '@/lib/themes'

export const metadata = { title: 'Dev · Nightcap' }

export default async function DevStreet({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params
  if (!DEV_MODE || !isTheme(city)) notFound()
  return <SandboxStreet theme={city} base="/dev" />
}
