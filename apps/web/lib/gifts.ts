import type { GiftKind, StepGift } from '@nightcap/scene'

/** a gift on the step, with names filled in for the card */
export interface Gift {
  id: string
  kind: GiftKind
  from: string
  fromName: string
  to: string
  toName: string
  createdAt: string
}

/**
 * What the street draws on the step: oldest on the left, the ones for
 * whoever's looking lit up. Six fit; past that the newest wait their turn.
 */
export function stepGifts(gifts: Gift[], userId: string, max = 6): StepGift[] {
  return [...gifts]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, max)
    .map((g) => ({ kind: g.kind, mine: g.to === userId }))
}

/** "a gift for you" / "3 gifts for you" */
export function forYouLine(gifts: Gift[], userId: string) {
  const n = gifts.filter((g) => g.to === userId).length
  if (n === 0) return null
  return n === 1 ? 'a gift on the step for you' : `${n} gifts on the step for you`
}
