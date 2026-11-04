import { notFound } from 'next/navigation'
import { SandboxLounge } from '@/components/sandbox/SandboxLounge'
import { isTheme } from '@/lib/themes'

export const metadata = { title: 'Living room · Nightcap' }

export default async function DemoLounge({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params
  if (!isTheme(city)) notFound()
  return <SandboxLounge theme={city} base="/demo" />
}
