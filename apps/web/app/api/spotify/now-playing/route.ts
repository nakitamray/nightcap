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
  if (res.status !== 200) return NextResponse.json(NOTHING)
  const body: Playing = await res.json()
  if (!body.is_playing || !body.item) return NextResponse.json(NOTHING)

  const item = body.item
  const images = item.album?.images ?? item.images ?? []
  const small =
    [...images].sort((a, b) => a.width - b.width).find((i) => i.width >= 64) ?? images[0]
  return NextResponse.json({
    playing: true,
    track: {
      title: item.name,
      artist: item.artists?.map((a) => a.name).join(', ') ?? item.show?.name ?? '',
      art: small?.url ?? null,
      url: item.external_urls?.spotify ?? null,
    },
  })
}
