import type { Layout } from './room'
import { supabaseBrowser } from './supabase/browser'

export interface Found {
  city: string
  lat: number
  lon: number
  zone?: string
}

/** where the room editor saves to: supabase for real, the browser in dev mode */
export interface RoomStore {
  saveLayout(layout: Layout): Promise<boolean>
  savePlace(place: Found & { zone: string }): Promise<boolean>
}

export function supabaseStore(houseId: string, userId: string): RoomStore {
  const supabase = supabaseBrowser()
  return {
    async saveLayout(layout) {
      const { error } = await supabase
        .from('memberships')
        .update({ layout })
        .eq('house_id', houseId)
        .eq('user_id', userId)
      return !error
    },
    async savePlace({ city, lat, lon, zone }) {
      const { error } = await supabase
        .from('profiles')
        .update({ city, lat, lon, time_zone: zone })
        .eq('id', userId)
      return !error
    },
  }
}

export function localStore(key: string): RoomStore {
  return {
    async saveLayout(layout) {
      try {
        localStorage.setItem(`nightcap:dev:${key}:layout`, JSON.stringify(layout))
        return true
      } catch {
        return false
      }
    },
    async savePlace(place) {
      try {
        localStorage.setItem('nightcap:dev:place', JSON.stringify(place))
        return true
      } catch {
        return false
      }
    },
  }
}

export function readLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
