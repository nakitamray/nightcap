import { notFound } from 'next/navigation'
import { SandboxStreet } from '@/components/sandbox/SandboxStreet'
import { isTheme, THEME_NAMES } from '@/lib/themes'

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params
  return { title: `${isTheme(city) ? THEME_NAMES[city] : 'Demo'} · Nightcap` }
}

// a street of made-up friends, for anyone who wants a look around
export default async function DemoStreet({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params
  if (!isTheme(city)) notFound()
  return <SandboxStreet theme={city} base="/demo" />
}
