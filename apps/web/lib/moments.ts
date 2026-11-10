import { GIFT_NAMES, type GiftKind } from '@nightcap/scene/gifts'
import type { Occasion } from '@nightcap/scene/occasions'
import { isHome } from './presence'

const DAY_MS = 24 * 3600_000

/** a house still waiting for a friend goes at this point */
export function goesAt(createdAt: string, keepUntil: string | null) {
  return new Date(
    Math.max(Date.parse(createdAt) + 7 * DAY_MS, keepUntil ? Date.parse(keepUntil) : 0),
  ).toISOString()
}

/** whole days until `at`, rounded up, never below zero */
export function daysUntil(at: string, now = Date.now()) {
  return Math.max(0, Math.ceil((Date.parse(at) - now) / DAY_MS))
}

/** a lonely house gets a nudge once it's down to its last two days */
export function goingSoon(at: string | null, now = Date.now()) {
  return !!at && Date.parse(at) - now < 2 * DAY_MS
}

/** someone's light just came on: they weren't home before and they are now */
export function cameHome(before: string | null | undefined, after: string, now = Date.now()) {
  return !isHome(before, now) && isHome(after, now)
}

/** the line the marquee over the door gets for an occasion */
export function occasionLine(occasion: Occasion, age: number) {
  if (occasion === 'new-year') return 'HAPPY NEW YEAR!'
  if (occasion === 'birthday') return age === 1 ? 'ONE YEAR TODAY!' : `${age} YEARS TODAY!`
  return 'HOUSE WARMING!'
}

export type Nudge =
  | { kind: 'note'; from: string }
  | { kind: 'gift'; from: string; gift: GiftKind }
  | { kind: 'home'; who: string }
  | { kind: 'moved-in'; who: string }
  | { kind: 'going'; house: string; days: number }

export function nudgeText(n: Nudge) {
  switch (n.kind) {
    case 'note':
      return `${n.from} slipped a note under your door`
    case 'gift':
      return `${n.from} left ${GIFT_NAMES[n.gift]} on the step for you`
    case 'home':
      return `${n.who} just got home`
    case 'moved-in':
      return `${n.who} moved in`
    case 'going':
      return n.days <= 1
        ? `${n.house} goes tomorrow unless a friend moves in`
        : `${n.house} goes in ${n.days} days unless a friend moves in`
  }
}

/** the line under a house on the keyring: what's waiting for you there */
export function houseNews(o: { notes: number; gifts: number; home: string[] }) {
  const parts: string[] = []
  if (o.notes) parts.push(o.notes === 1 ? 'a note for you' : `${o.notes} notes for you`)
  if (o.gifts)
    parts.push(
      o.gifts === 1 ? 'a gift for you on the step' : `${o.gifts} gifts for you on the step`,
    )
  if (o.home.length === 1) parts.push(`${o.home[0]}'s home`)
  else if (o.home.length === 2) parts.push(`${o.home[0]} and ${o.home[1]} are home`)
  else if (o.home.length > 2) parts.push(`${o.home.length} people home`)
  return parts.length ? parts.join(' · ') : null
}
