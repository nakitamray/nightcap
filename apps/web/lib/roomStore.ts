import type { Layout } from './room'
import { supabaseBrowser } from './supabase/browser'

export interface Found {
  city: string
  lat: number
  lon: number
  zone?: string
}

/** where the room editor saves to */
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

/** for the demo and dev mode: takes the change and forgets it */
export const memoryStore: RoomStore = {
  saveLayout: async () => true,
  savePlace: async () => true,
}
