import { notFound } from 'next/navigation'
import { HouseLounge } from '@/components/lounge/HouseLounge'
import { loadHouse } from '@/lib/houseData'
import { currentUserId, supabaseServer } from '@/lib/supabase/server'
import { isTheme } from '@/lib/themes'

export const metadata = { title: 'Living room · Nightcap' }

export default async function Lounge({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await currentUserId()
  if (!userId) notFound()
  const supabase = await supabaseServer()

  // row level security: this is empty unless you live here
  const { data: house } = await supabase
    .from('houses')
    .select('id, name, theme')
    .eq('id', id)
    .maybeSingle()
  if (!house) notFound()

  const { members, seen, housemates } = await loadHouse(supabase, id)
  return (
    <HouseLounge
      houseId={house.id}
      houseName={house.name}
      userId={userId}
      theme={isTheme(house.theme) ? house.theme : 'paris'}
      housemates={housemates}
      initialSeen={seen}
      myRoom={members.find((m) => m.user_id === userId)?.room ?? null}
    />
  )
}
