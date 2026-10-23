import { notFound } from 'next/navigation'
import { WindowWallBackground } from '@/components/WindowWallBackground'
import styles from '@/components/NightCard.module.css'
import { CharacterMaker } from '@/components/you/CharacterMaker'
import { DEFAULT_AVATAR } from '@/lib/avatar'
import { DEV_MODE } from '@/lib/dev'

export const metadata = { title: 'Dev · You · Nightcap' }

// the character maker on its own, nothing saved
export default function DevYou() {
  if (!DEV_MODE) notFound()
  return (
    <main className={styles.page}>
      <WindowWallBackground />
      <CharacterMaker initial={DEFAULT_AVATAR} userId={null} next="/dev" />
    </main>
  )
}
