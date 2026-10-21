/** "11:42 pm" in someone else's time zone */
export function localTime(timeZone: string, now = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  })
    .format(now)
    .toLowerCase()
}

/** rough part of day, for the little line under someone's name */
export function partOfDay(timeZone: string, now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hourCycle: 'h23' }).format(now),
  )
  if (hour < 5) return 'small hours'
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'night'
}
