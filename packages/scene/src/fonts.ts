// Kollektiiv only covers letters, digits and ! , . ? -- the CSS in the app
// registers it together with Rye under one family name (split by
// unicode-range), so anything Kollektiiv is missing falls through to Rye.
export const DISPLAY_FONT = 'Nightcap Display'
export const BODY_FONT = 'Georgia, serif'

export async function loadDisplayFont(sample = "ABCabc0123:'/-&") {
  if (typeof document === 'undefined' || !('fonts' in document)) return
  try {
    await document.fonts.load(`64px "${DISPLAY_FONT}"`, sample)
  } catch {
    // text still renders with the fallback, just not as pretty
  }
}
