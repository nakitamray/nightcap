'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { passwordChecks, passwordOk, usernameProblem } from '@/lib/rules'
import { supabaseBrowser } from '@/lib/supabase/browser'
import styles from './NightCard.module.css'

type Mode = 'signin' | 'signup'

interface Props {
  mode: Mode
  next: string
  verified?: boolean
}

export function AuthForm({ mode, next, verified }: Props) {
  return mode === 'signin' ? <SignIn next={next} verified={verified} /> : <SignUp />
}

function Tabs({ mode }: { mode: Mode }) {
  return (
    <nav className={styles.tabs}>
      <Link href="/login" className={styles.tab} data-on={mode === 'signin'}>
        sign in
      </Link>
      <Link href="/signup" className={styles.tab} data-on={mode === 'signup'}>
        make an account
      </Link>
    </nav>
  )
}

function SignIn({ next, verified }: { next: string; verified?: boolean }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) {
      setError(
        /not confirmed/i.test(error.message)
          ? 'You need to verify your email first. Check your inbox for the link.'
          : 'That email and password don’t match.',
      )
      return
    }
    router.push(next)
    router.refresh()
  }

  return (
    <>
      <Tabs mode="signin" />
      {verified && <p className={styles.good}>You’re verified. Sign in to move in.</p>}
      <form className={styles.form} onSubmit={submit}>
        <label className={styles.label}>
          Email
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
          Password
          <input
            className={styles.input}
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.button} type="submit" disabled={busy}>
          {busy ? '…' : 'come in'}
        </button>
      </form>
    </>
  )
}

function SignUp() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [taken, setTaken] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const nameProblem = username ? usernameProblem(username) : null
  const checks = passwordChecks(password)
  const ready = !usernameProblem(username) && !taken && email && passwordOk(password)

  async function checkName() {
    if (usernameProblem(username)) return
    const { data } = await supabaseBrowser().rpc('username_available', { wanted: username })
    setTaken(data === false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!ready) return
    setBusy(true)
    setError('')
    const supabase = supabaseBrowser()
    const { data: free } = await supabase.rpc('username_available', { wanted: username })
    if (free === false) {
      setTaken(true)
      setBusy(false)
      return
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        // the link in the email verifies you, then drops you at sign in
        emailRedirectTo: `${window.location.origin}/login?verified=1`,
      },
    })
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  if (sent) {
    return (
      <>
        <Tabs mode="signup" />
        <p className={styles.note}>
          Nearly there. We sent a link to <strong>{email}</strong>. Click it to verify, then sign
          in.
        </p>
      </>
    )
  }

  return (
    <>
      <Tabs mode="signup" />
      <form className={styles.form} onSubmit={submit}>
        <label className={styles.label}>
          Username
          <input
            className={styles.input}
            required
            maxLength={20}
            autoComplete="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setTaken(false)
            }}
            onBlur={checkName}
          />
          {nameProblem && <span className={styles.hint}>{nameProblem}</span>}
          {taken && <span className={styles.errorSmall}>that one’s taken</span>}
        </label>
        <label className={styles.label}>
          Email
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
          Password
          <input
            className={styles.input}
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <ul className={styles.checks}>
          {checks.map((c) => (
            <li key={c.label} data-ok={c.ok}>
              {c.ok ? '✓' : '·'} {c.label}
            </li>
          ))}
        </ul>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.button} type="submit" disabled={busy || !ready}>
          {busy ? '…' : 'make my account'}
        </button>
      </form>
    </>
  )
}
