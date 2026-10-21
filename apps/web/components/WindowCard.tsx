'use client'

import { useEffect, useState } from 'react'
import type { Member } from '@/lib/house'
import { localTime, partOfDay } from '@/lib/time'
import styles from './WindowCard.module.css'

interface Props {
  member: Member | null
  bounds: { x: number; y: number; width: number; height: number }
}

// the little card that hangs above a window when you hover it
export function WindowCard({ member, bounds }: Props) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000)
    return () => clearInterval(id)
  }, [])

  const style = {
    left: bounds.x + bounds.width / 2,
    top: bounds.y - 14,
  }

  if (!member) {
    return (
      <div className={styles.card} style={style} role="status">
        <p className={styles.name}>Vacant</p>
        <p className={styles.meta}>nobody&apos;s moved in yet</p>
      </div>
    )
  }

  return (
    <div className={styles.card} style={style} role="status">
      <p className={styles.name}>{member.name}</p>
      <p className={styles.meta}>
        {member.city && <>{member.city} &middot; </>}
        {localTime(member.timeZone, now)}, {partOfDay(member.timeZone, now)}
      </p>
      <p className={styles.status} data-home={member.home}>
        {member.home ? 'home' : 'out'}
        {member.curtains === 'drawn' && <span className={styles.curtains}> &middot; curtains drawn</span>}
      </p>
    </div>
  )
}
