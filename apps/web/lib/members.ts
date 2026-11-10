/** "Jaren, Mithula +5" -- or just "you" while you're waiting for company */
export function memberLine(names: string[], me: string) {
  const others = names.filter((n) => n !== me)
  if (others.length === 0) return 'just you so far'
  const shown = others.slice(0, 2).join(', ')
  return others.length > 2 ? `you, ${shown} +${others.length - 2}` : `you, ${shown}`
}

export const MAX_HOUSES = 5
