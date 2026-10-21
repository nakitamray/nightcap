/** "Jaren, Mithula +5" -- or just "you" while you're waiting for company */
export function memberLine(names: string[], me: string) {
  const others = names.filter((n) => n !== me)
  if (others.length === 0) return 'just you so far'
  const shown = others.slice(0, 2).join(', ')
  return others.length > 2 ? `you, ${shown} +${others.length - 2}` : `you, ${shown}`
}

/** days a lonely house has left before it's cleared away */
export function daysLeft(createdAt: string, now = new Date()) {
  const age = (now.getTime() - new Date(createdAt).getTime()) / 86_400_000
  return Math.max(0, Math.ceil(7 - age))
}

export const MAX_HOUSES = 5
