// Kollektiiv only covers letters, digits and ! , . ? -- the CSS in the app
// registers it together with Rye under one family name (split by
// unicode-range), so anything Kollektiiv is missing falls through to Rye.
export const DISPLAY_FONT = 'Nightcap Display'
/** Rye on its own, for small signs where Kollektiiv's wilder letters stop being readable */
export const SIGN_FONT = 'Nightcap Sign'
export const BODY_FONT = 'Georgia, serif'

export async function loadDisplayFont(sample = "ABCabc0123:'/-&") {
  if (typeof document === 'undefined' || !('fonts' in document)) return
  try {
    await Promise.all([
      document.fonts.load(`64px "${DISPLAY_FONT}"`, sample),
      document.fonts.load(`32px "${SIGN_FONT}"`, sample),
    ])
  } catch {
    // text still renders with the fallback, just not as pretty
  }
}
