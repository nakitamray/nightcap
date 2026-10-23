import { notFound } from 'next/navigation'
import { PeopleGrid } from '@/components/you/PeopleGrid'
import {
  ACCESSORIES,
  avatarFromSeed,
  BOTTOMS,
  DEFAULT_AVATAR,
  FACE_SHAPES,
  FACES,
  HAIRSTYLES,
  TOPS,
  type Avatar,
} from '@/lib/avatar'
import { DEV_MODE } from '@/lib/dev'

export const metadata = { title: 'People · Nightcap' }

type Pose = 'stand' | 'sit' | 'floor'

// every option once, so a change to the drawing can be checked at a glance
function everything() {
  const d = DEFAULT_AVATAR
  const out: { avatar: Avatar; pose: Pose }[] = []
  // colours change from one to the next so it isn't a row of twins
  const add = (a: Partial<Avatar>, pose: Pose = 'stand') => {
    const i = out.length
    out.push({ avatar: { ...d, topColour: i % 12, bottomColour: (i * 5 + 3) % 12, ...a }, pose })
  }
  HAIRSTYLES.forEach((hair, i) => add({ hair, hairColour: i, skin: i }))
  add({ skin: 8 })
  add({ skin: 9, hair: 'long', hairColour: 6 })
  TOPS.forEach((top, i) => add({ top, topColour: i * 2 + 1, skin: i + 2 }))
  BOTTOMS.forEach((bottom, i) => add({ bottom, bottomColour: i * 3, hair: 'bun', skin: 7 - i }))
  FACES.forEach((face) => add({ face, hair: 'short', skin: 4 }))
  FACE_SHAPES.forEach((faceShape) => add({ faceShape, hair: 'buzz', skin: 1 }))
  add({ face: 'grin', faceShape: 'long', hair: 'curly', hairColour: 8 })
  add({ face: 'freckles', faceShape: 'oval', hair: 'braids', hairColour: 3 })
  add({ face: 'sleepy', hair: 'afro', hairColour: 0, skin: 0 })
  ACCESSORIES.forEach((a, i) => add({ accessories: [a], hair: HAIRSTYLES[i]!, topColour: i + 3 }))
  add({ accessories: ['glasses', 'beanie', 'scarf'], hair: 'long', topColour: 9 })
  add({ accessories: ['headphones', 'earrings', 'necklace'], hair: 'bob', top: 'tee' })
  add({ accessories: ['beanie', 'headphones'], hair: 'afro', top: 'hoodie', topColour: 6 })
  add({ accessories: ['glasses', 'scarf'], hair: 'curly', top: 'cardigan', bottom: 'skirt' })
  for (let i = 0; i < 10; i++) out.push({ avatar: avatarFromSeed(`s${i}`), pose: 'sit' })
  for (let i = 0; i < 10; i++) out.push({ avatar: avatarFromSeed(`f${i}`), pose: 'floor' })
  return out
}

export default function People() {
  if (!DEV_MODE) notFound()
  return <PeopleGrid people={everything()} />
}
