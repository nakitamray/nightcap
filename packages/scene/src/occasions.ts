// Days the street dresses up for. Kept free of the renderer so the app can
// work out the occasion without loading pixi.

export const OCCASIONS = ['new-year', 'birthday', 'house-warming'] as const
export type Occasion = (typeof OCCASIONS)[number]

/** how long the bunting stays up after the second person moves in */
export const WARMING_MS = 3 * 24 * 3600_000

export interface HouseDates {
  createdAt: string
  /** when the second person moved in; null while it's still just you */
  warmedAt: string | null
}

/**
 * What, if anything, the street is celebrating at `at` for someone in
 * `timeZone`:
 *
 * - new year: lanterns from six on new year's eve until new year's day is over
 * - birthday: fireworks on every anniversary of the day the house was made
 * - house-warming: for three days after the second person moves in
 *
 * New year wins over a birthday, and a birthday over a house-warming.
 */
export function occasionFor(at: Date, house: HouseDates, timeZone: string): Occasion | null {
  const now = localDate(at, timeZone)
  if ((now.month === 12 && now.day === 31 && now.hour >= 18) || (now.month === 1 && now.day === 1))
    return 'new-year'

  const made = localDate(new Date(house.createdAt), timeZone)
  if (now.year > made.year && sameDay(now, made)) return 'birthday'

  if (house.warmedAt) {
    const since = at.getTime() - Date.parse(house.warmedAt)
    if (since >= 0 && since < WARMING_MS) return 'house-warming'
  }
  return null
}

/** how many years old the house is turning on its birthday */
export function houseAge(at: Date, createdAt: string, timeZone: string) {
  return localDate(at, timeZone).year - localDate(new Date(createdAt), timeZone).year
}

interface LocalDate {
  year: number
  month: number
  day: number
  hour: number
}

function localDate(at: Date, timeZone: string): LocalDate {
  let parts: Intl.DateTimeFormatPart[]
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      hourCycle: 'h23',
    }).formatToParts(at)
  } catch {
    // an unknown time zone shouldn't take the street down
    return localDate(at, 'UTC')
  }
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour') }
}

/** a house made on 29 February has its birthday on the 28th in other years */
function sameDay(now: LocalDate, made: LocalDate) {
  if (made.month === 2 && made.day === 29 && !isLeap(now.year))
    return now.month === 2 && now.day === 28
  return now.month === made.month && now.day === made.day
}

function isLeap(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}
