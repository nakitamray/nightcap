'use client'

import { useEffect, useState } from 'react'

export interface Track {
  title: string
  artist: string
  art: string | null
  url: string | null
}

/**
 * Asks spotify what you're playing every 20 seconds while the page is on
 * screen. The server shares it with your housemates as it goes.
 */
export function useNowPlaying(enabled: boolean) {
  const [track, setTrack] = useState<Track | null>(null)
  useEffect(() => {
    if (!enabled) return
    let stop = false
    async function poll() {
      if (document.visibilityState !== 'visible') return
      const res = await fetch('/api/spotify/now-playing').catch(() => null)
      const body = res?.ok ? await res.json() : null
      if (!stop) setTrack(body?.playing ? body.track : null)
    }
    poll()
    const t = setInterval(poll, 20_000)
    document.addEventListener('visibilitychange', poll)
    return () => {
      stop = true
      clearInterval(t)
      document.removeEventListener('visibilitychange', poll)
    }
  }, [enabled])
  return enabled ? track : null
}
