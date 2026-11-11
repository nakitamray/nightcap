'use client'

import { useEffect } from 'react'

// the last resort, if even the root layout broke: it replaces the whole page,
// so it brings its own <html> and plain styles that don't depend on anything
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 16,
          background: '#040307',
          color: '#f2e2bd',
          fontFamily: 'Georgia, serif',
          textAlign: 'center',
        }}
      >
        <main style={{ maxWidth: 360 }}>
          <h1 style={{ color: '#ffb04a', fontWeight: 'normal' }}>Lights out</h1>
          <p>Nightcap hit a problem loading. It’s probably a blip.</p>
          {error.digest && <p style={{ opacity: 0.7, fontSize: 14 }}>Reference: {error.digest}</p>}
          <p>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: '8px 16px',
                font: 'inherit',
                color: '#fff1d8',
                background: '#8e2416',
                border: '1px solid #d9c7a2',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </p>
          <p>
            {/* a plain link on purpose: the router may be what broke */}
            <a href="/keys" style={{ color: '#ffb04a' }}>
              Go to your keyring
            </a>
          </p>
        </main>
      </body>
    </html>
  )
}
