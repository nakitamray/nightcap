import { Suspense } from 'react'
import { Street } from '@/components/Street'

export default function Home() {
  // the street reads ?theme= from the url, which needs a suspense boundary
  return (
    <Suspense>
      <Street />
    </Suspense>
  )
}
