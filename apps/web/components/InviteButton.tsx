'use client'

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/browser'
import styles from './HouseView.module.css'

/** makes a 7-day invite and shows the link to send round */
export function InviteButton({ houseId, userId }: { houseId: string; userId: string }) {
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  async function invite() {
    setBusy(true)
    const { data, error } = await supabaseBrowser()
      .from('invites')
      .insert({ house_id: houseId, created_by: userId })
      .select('code')
      .single()
    setBusy(false)
    if (!error && data) setLink(`${window.location.origin}/join/${data.code}`)
  }

  async function copy() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  if (!link) {
    return (
      <button type="button" className={styles.button} onClick={invite} disabled={busy}>
        {busy ? '…' : 'invite a friend'}
      </button>
    )
  }

  return (
    <span className={styles.invite}>
      <input className={styles.link} readOnly value={link} onFocus={(e) => e.target.select()} aria-label="invite link" />
      <button type="button" className={styles.button} onClick={copy}>
        {copied ? 'copied' : 'copy'}
      </button>
    </span>
  )
}
