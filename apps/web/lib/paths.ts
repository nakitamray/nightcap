// Where to send someone after signing in or connecting spotify. Only ever a
// path on this site: anything that could point off-site (//evil.com,
// /\evil.com, a full url, stray control characters) falls back instead.

const HERE = 'https://nightcap.invalid'

export function safePath(next: string | null | undefined, fallback = '/keys') {
  if (!next || !next.startsWith('/') || /[\\\u0000-\u001f\u007f]/.test(next)) return fallback
  try {
    const url = new URL(next, HERE)
    if (url.origin !== HERE) return fallback
    return url.pathname + url.search + url.hash
  } catch {
    return fallback
  }
}
