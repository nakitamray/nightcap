import type { Theme } from '@/lib/themes'

export interface HouseRow {
  id: string
  name: string
  theme: Theme
  marquee: string[]
}

export interface RoomRow {
  user_id: string
  room: number
  curtains: 'open' | 'drawn'
  profiles: { display_name: string; city: string | null; time_zone: string } | null
}
