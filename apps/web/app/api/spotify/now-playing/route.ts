import { NextResponse } from 'next/server'
import { refresh, spotifyConfigured } from '@/lib/spotify'
import { currentUserId, supabaseServer } from '@/lib/supabase/server'

const NOTHING = { playing: false }

interface Playing {
  is_playing: boolean
  currently_playing_type: string
  item: {
    name: string
    artists?: { name: string }[]
    show?: { name: string }
    album?: { images: { url: string; width: number }[] }
    images?: { url: string; width: number }[]
    external_urls?: { spotify?: string }
  } | null
}

interface Track {
  title: string
  artist: string
  art: string | null
  url: string | null
}

type Server = Awaited<ReturnType<typeof supabaseServer>>

// whatever's on goes into now_playing so housemates can see it; nothing on
// clears it. Only fields that pass the table's checks are kept.
async function share(supabase: Server, userId: string, track: Track | null) {
  const { error } = track
    ? await supabase.from('now_playing').upsert({
        user_id: userId,
        title: track.title.slice(0, 300),
        artist: track.artist.slice(0, 300),
        art: track.art?.startsWith('https://') ? track.art.slice(0, 500) : null,
        url: track.url?.startsWith('https://open.spotify.com/') ? track.url.slice(0, 500) : null,
        updated_at: new Date().toISOString(),
      })
    : await supabase.from('now_playing').delete().eq('user_id', userId)
  if (error) console.error('sharing now playing', error)
}

export async function GET() {
  if (!spotifyConfigured()) return NextResponse.json(NOTHING)
  const userId = await currentUserId()
  if (!userId) return NextResponse.json(NOTHING, { status: 401 })

  const supabase = await supabaseServer()
  const { data: link } = await supabase
    .from('spotify_links')
    .select('refresh_token, access_token, expires_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (!link) return NextResponse.json(NOTHING)

  let token = link.access_token
  // refresh a minute early so a token doesn't die halfway through a request
  if (!token || !link.expires_at || new Date(link.expires_at).getTime() < Date.now() + 60_000) {
    const fresh = await refresh(link.refresh_token)
    if (!fresh) return NextResponse.json(NOTHING)
    token = fresh.access_token
    await supabase
      .from('spotify_links')
      .update({
        access_token: fresh.access_token,
        refresh_token: fresh.refresh_token ?? link.refresh_token,
        expires_at: new Date(Date.now() + fresh.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  }

  const res = await fetch(
    'https://api.spotify.com/v1/me/player/currently-playing?additional_types=episode',
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  )
  // 204 means nothing's on
  const body: Playing | null = res.status === 200 ? await res.json() : null
  if (!body?.is_playing || !body.item) {
    await share(supabase, userId, null)
    return NextResponse.json(NOTHING)
  }

  const item = body.item
  const images = item.album?.images ?? item.images ?? []
  const small =
    [...images].sort((a, b) => a.width - b.width).find((i) => i.width >= 64) ?? images[0]
  const track: Track = {
    title: item.name,
    artist: item.artists?.map((a) => a.name).join(', ') ?? item.show?.name ?? '',
    art: small?.url ?? null,
    url: item.external_urls?.spotify ?? null,
  }
  await share(supabase, userId, track)
  return NextResponse.json({ playing: true, track })
}
