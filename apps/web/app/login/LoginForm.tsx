'use client'

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/browser'
import styles from '@/components/NightCard.module.css'

export function LoginForm({ next, linkError }: { next: string; linkError: boolean }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState(linkError ? 'That link didn’t work. It may have expired, so ask for a new one.' : '')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    setError('')
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        // only used the first time, to name your room
        data: name.trim() ? { name: name.trim() } : undefined,
      },
    })
    if (error) {
      setError(error.message)
      setState('idle')
    } else {
      setState('sent')
    }
  }

  if (state === 'sent') {
    return (
      <p className={styles.note}>
        Check <strong>{email}</strong>. There’s a link in there that lets you in. You can close this tab.
      </p>
    )
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.label}>
        Your email
        <input
          className={styles.input}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className={styles.label}>
        <span>
          What do your friends call you? <span className={styles.hint}>(first time only)</span>
        </span>
        <input
          className={styles.input}
          maxLength={40}
          autoComplete="given-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      {error && <p className={styles.error}>{error}</p>}
      <button className={styles.button} type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'sending…' : 'send me a link'}
      </button>
    </form>
  )
}
