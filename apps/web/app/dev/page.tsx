import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CityCard } from '@/components/CityCard'
import { Gallery } from '@/components/Gallery'
import { DEV_MODE } from '@/lib/dev'
import { THEME_NAMES, THEMES } from '@/lib/themes'

export const metadata = { title: 'Dev · Nightcap' }

export default function Dev() {
  if (!DEV_MODE) notFound()
  return (
    <Gallery
      title="DEV MODE"
      sub="every city, every room, just you. nothing here is saved."
      actions={<Link href="/">back to sign in</Link>}
    >
      {THEMES.map((t) => (
        <CityCard
          key={t}
          theme={t}
          href={`/dev/${t}`}
          label={`go to ${THEME_NAMES[t]}`}
          title={THEME_NAMES[t]}
          line="step outside"
        />
      ))}
    </Gallery>
  )
}
