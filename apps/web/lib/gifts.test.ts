import { readFileSync } from 'node:fs'
import { GIFT_KINDS, GIFT_NAMES } from '@nightcap/scene/gifts'
import { describe, expect, it } from 'vitest'
import { forYouLine, stepGifts, type Gift } from './gifts'

const gift = (id: string, to: string, createdAt: string): Gift => ({
  id,
  kind: 'cake',
  from: 'b',
  fromName: 'bob',
  to,
  toName: to,
  createdAt,
})

describe('stepGifts', () => {
  it('puts the oldest first and lights up yours', () => {
    const gifts = [gift('2', 'me', '2026-11-02'), gift('1', 'them', '2026-11-01')]
    expect(stepGifts(gifts, 'me')).toEqual([
      { kind: 'cake', mine: false },
      { kind: 'cake', mine: true },
    ])
  })

  it('only fits so many', () => {
    const gifts = Array.from({ length: 9 }, (_, i) => gift(`${i}`, 'me', `2026-11-0${i + 1}`))
    expect(stepGifts(gifts, 'me')).toHaveLength(6)
  })
})

describe('forYouLine', () => {
  it('counts only gifts for you', () => {
    expect(forYouLine([gift('1', 'them', '2026-11-01')], 'me')).toBeNull()
    expect(forYouLine([gift('1', 'me', '2026-11-01')], 'me')).toBe('a gift on the step for you')
    expect(forYouLine([gift('1', 'me', '2026-11-01'), gift('2', 'me', '2026-11-02')], 'me')).toBe(
      '2 gifts on the step for you',
    )
  })
})

describe('gift kinds', () => {
  it('match what the database allows on the step', () => {
    const sql = readFileSync(
      new URL('../../../supabase/migrations/20261110180220_house_moments.sql', import.meta.url),
      'utf8',
    )
    const allowed = sql.match(/kind in \(([^)]*)\)/)?.[1]?.match(/'([a-z-]+)'/g) ?? []
    expect(allowed.map((k: string) => k.slice(1, -1))).toEqual([...GIFT_KINDS])
    for (const kind of GIFT_KINDS) expect(GIFT_NAMES[kind]).toBeTruthy()
  })
})
