'use client'

import type { SupabaseClient } from '@supabase/supabase-js'
import { useEffect } from 'react'
import { BEAT_MS } from '@/lib/presence'
import type { Place } from '@/lib/together'

/** tells the house you're here (and where) while the page is on screen */
export function useCheckIn(supabase: SupabaseClient, houseId: string | null, place: Place) {
  useEffect(() => {
    if (!houseId) return
    async function beat() {
      if (document.visibilityState !== 'visible') return
      const { error } = await supabase.rpc('here', { h: houseId, place })
      if (error) console.error('checking in', error)
    }
    beat()
    const t = setInterval(beat, BEAT_MS)
    document.addEventListener('visibilitychange', beat)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', beat)
    }
  }, [supabase, houseId, place])
}
