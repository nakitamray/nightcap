// A window is lit while its person has the house open. Browsers check in
// every minute while the page is in front of them; a light stays on for a
// few minutes after the last check-in, so a phone putting the tab to sleep
// for a moment doesn't make it flicker, and a tab left open in the
// background all day doesn't keep it on.

export const BEAT_MS = 60_000
export const HOME_FOR_MS = 3 * 60_000

export function isHome(seenAt: string | null | undefined, now: number) {
  if (!seenAt) return false
  const t = Date.parse(seenAt)
  return Number.isFinite(t) && now - t < HOME_FOR_MS
}
