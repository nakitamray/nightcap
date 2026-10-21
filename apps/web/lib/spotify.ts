// Spotify, server side only. The client id/secret live in env vars and the
// tokens in spotify_links, which only you can read (row level security).

const ACCOUNTS = 'https://accounts.spotify.com'
export const SCOPES = 'user-read-currently-playing user-read-playback-state'

export function spotifyConfigured() {
  return Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET)
}

export function authorizeUrl(redirectUri: string, state: string) {
  const q = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
  })
  return `${ACCOUNTS}/authorize?${q}`
}

interface Tokens {
  access_token: string
  refresh_token?: string
  expires_in: number
}

async function tokenRequest(body: Record<string, string>): Promise<Tokens | null> {
  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
  ).toString('base64')
  const res = await fetch(`${ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
    cache: 'no-store',
  })
  return res.ok ? res.json() : null
}

export function exchangeCode(code: string, redirectUri: string) {
  return tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri })
}

export function refresh(refreshToken: string) {
  return tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken })
}

/** only same-site paths, so the redirect can't be pointed somewhere else */
export function safePath(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/keys'
}
