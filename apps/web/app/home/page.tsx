import { redirect } from 'next/navigation'

// old links pointed here
export default function Home() {
  redirect('/keys')
}
