import type { Theme } from '@/lib/themes'

export interface HouseRow {
  id: string
  name: string
  theme: Theme
  marquee: string[]
  created_at: string
  keep_until: string | null
}
