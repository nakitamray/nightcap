import { notFound } from 'next/navigation'
import { SandboxStreet } from '@/components/sandbox/SandboxStreet'
import { DEV_MODE } from '@/lib/dev'
import { isTheme } from '@/lib/themes'
import { OCCASIONS, type Occasion } from '@nightcap/scene/occasions'

export const metadata = { title: 'Dev · Nightcap' }

// ?occasion=new-year, birthday or house-warming to dress the street up
export default async function DevStreet({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>
  searchParams: Promise<{ occasion?: string }>
}) {
  const { city } = await params
  const { occasion } = await searchParams
  if (!DEV_MODE || !isTheme(city)) notFound()
  const dressed = OCCASIONS.find((o): o is Occasion => o === occasion) ?? null
  return <SandboxStreet theme={city} base="/dev" occasion={dressed} />
}
