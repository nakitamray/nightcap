// What can be left on the front step. Kept free of the renderer so the app
// and the database agree on the list without loading pixi.

export const GIFT_KINDS = [
  'flowers',
  'cake',
  'wine',
  'candle',
  'record',
  'plant',
  'book',
  'tea',
] as const
export type GiftKind = (typeof GIFT_KINDS)[number]

export const GIFT_NAMES: Record<GiftKind, string> = {
  flowers: 'flowers',
  cake: 'a cake',
  wine: 'a bottle of wine',
  candle: 'a candle',
  record: 'a record',
  plant: 'a plant',
  book: 'a book',
  tea: 'a tin of tea',
}

export function isGiftKind(value: unknown): value is GiftKind {
  return typeof value === 'string' && (GIFT_KINDS as readonly string[]).includes(value)
}

/** the most a step holds for any one person, the same as the database's limit */
export const STEP_LIMIT = 6
