import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'
import type { supabaseServer } from './supabase/server'

// Spotify, server side only. The client id/secret live in env vars and the
// tokens in spotify_links, which only you can read (row level security), and
// even then only sealed: they're encrypted here with a key derived from the
// client secret, which the database and the browser never see.

const ACCOUNTS = 'https://accounts.spotify.com'
const API = 'https://api.spotify.com/v1'
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

// sealing tokens ----------------------------------------------------------------

const PREFIX = 'v1:'

function keyFrom(secret: string) {
  return Buffer.from(hkdfSync('sha256', secret, 'nightcap', 'spotify tokens', 32))
}

/** encrypts a token for the database: "v1:" + iv, ciphertext and tag (AES-256-GCM) */
export function seal(token: string, secret = process.env.SPOTIFY_CLIENT_SECRET ?? '') {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', keyFrom(secret), iv)
  const body = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  return PREFIX + Buffer.concat([iv, body, cipher.getAuthTag()]).toString('base64url')
}

/** the token back out, or null if it was sealed with another key or tampered with */
export function unseal(sealed: string, secret = process.env.SPOTIFY_CLIENT_SECRET ?? '') {
  if (!sealed.startsWith(PREFIX)) return null
  const raw = Buffer.from(sealed.slice(PREFIX.length), 'base64url')
  if (raw.length < 12 + 16) return null
  try {
    const decipher = createDecipheriv('aes-256-gcm', keyFrom(secret), raw.subarray(0, 12))
    decipher.setAuthTag(raw.subarray(raw.length - 16))
    return Buffer.concat([
      decipher.update(raw.subarray(12, raw.length - 16)),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    return null
  }
}

// talking to spotify -------------------------------------------------------------

interface Tokens {
  access_token: string
  refresh_token?: string
  expires_in: number
}

type TokenResult = { tokens: Tokens } | { error: 'revoked' | 'unavailable' }

async function tokenRequest(body: Record<string, string>): Promise<TokenResult> {
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
  }).catch(() => null)
  if (res?.ok) return { tokens: await res.json() }
  // invalid_grant: they took the app's access away on spotify's side
  const err = res ? await res.json().catch(() => null) : null
  return { error: err?.error === 'invalid_grant' ? 'revoked' : 'unavailable' }
}

export function exchangeCode(code: string, redirectUri: string) {
  return tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri })
}

type Server = Awaited<ReturnType<typeof supabaseServer>>

/** the tokens as they're saved, sealed */
export function sealedTokens(tokens: Tokens, refreshToken = tokens.refresh_token) {
  return {
    refresh_token: seal(refreshToken!),
    access_token: seal(tokens.access_token),
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/** why we couldn't get a token: not connected, or spotify isn't answering */
export type Problem = 'unlinked' | 'unavailable'

/**
 * A working access token for someone, refreshing it if it's about to run out.
 * A link that can't be used any more (they revoked it, or the key changed) is
 * thrown away so they're offered "connect" again.
 */
export async function accessToken(
  supabase: Server,
  userId: string,
): Promise<{ token: string } | { problem: Problem }> {
  const { data: link } = await supabase
    .from('spotify_links')
    .select('refresh_token, access_token, expires_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (!link) return { problem: 'unlinked' }

  const forget = async () => {
    await supabase.from('spotify_links').delete().eq('user_id', userId)
    await supabase.from('now_playing').delete().eq('user_id', userId)
    return { problem: 'unlinked' as const }
  }

  // refresh a minute early so a token doesn't die halfway through a request
  const fresh = link.expires_at && new Date(link.expires_at).getTime() > Date.now() + 60_000
  const current = fresh && link.access_token ? unseal(link.access_token) : null
  if (current) return { token: current }

  const refreshToken = unseal(link.refresh_token)
  if (!refreshToken) return forget()
  const result = await tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken })
  if ('error' in result) return result.error === 'revoked' ? forget() : { problem: 'unavailable' }
  // spotify only sometimes hands out a new refresh token
  await supabase
    .from('spotify_links')
    .update(sealedTokens(result.tokens, result.tokens.refresh_token ?? refreshToken))
    .eq('user_id', userId)
  return { token: result.tokens.access_token }
}

/** a GET against the web api; `status` tells "not allowed" (403) apart from the rest */
export async function spotifyGet<T>(token: string, path: string) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null)
  if (!res) return { status: 0, body: null }
  const body = res.status === 200 ? ((await res.json().catch(() => null)) as T | null) : null
  return { status: res.status, body }
}

/**
 * How someone's spotify connection is doing, for the account page:
 * - linked: working, with the name on their spotify account
 * - not-allowed: spotify said no. Apps in spotify's development mode only
 *   work for accounts added by hand in the developer dashboard
 * - unlinked / unavailable: not connected, or spotify isn't answering
 */
export async function spotifyStatus(
  supabase: Server,
  userId: string,
): Promise<{ state: 'linked'; name: string | null } | { state: 'not-allowed' | Problem }> {
  const got = await accessToken(supabase, userId)
  if ('problem' in got) return { state: got.problem }
  const me = await spotifyGet<{ display_name?: string; id?: string }>(got.token, '/me')
  if (me.status === 403) return { state: 'not-allowed' }
  if (me.status !== 200) return { state: 'unavailable' }
  return { state: 'linked', name: me.body?.display_name ?? me.body?.id ?? null }
}
