import type { Metadata, Viewport } from 'next'
import { Libre_Caslon_Text } from 'next/font/google'
import './globals.css'

const caslon = Libre_Caslon_Text({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-caslon',
})

export const metadata: Metadata = {
  title: 'Nightcap',
  description: 'A house for your friends, always at night.',
}

export const viewport: Viewport = {
  themeColor: '#040307',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={caslon.variable}>
      <body>{children}</body>
    </html>
  )
}
