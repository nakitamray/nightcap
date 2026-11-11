'use client'

import { useActionState, useState } from 'react'
import { deleteAccount, type ActionState } from '@/app/account/actions'
import styles from '@/components/NightCard.module.css'
import own from './Account.module.css'

/** the last thing on the account page, behind a second step and your username */
export function DeleteAccount({ word }: { word: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<ActionState, FormData>(deleteAccount, {})
  if (!open) {
    return (
      <button type="button" className={own.quiet} onClick={() => setOpen(true)}>
        delete my account
      </button>
    )
  }
  return (
    <form className={styles.form} action={action}>
      <p className={styles.hint}>
        this moves you out of every house, takes your rooms, notes and spotify link with you, and
        deletes your login. it can’t be undone. houses you were alone in close.
      </p>
      <label className={styles.label}>
        type {word} to confirm
        <input
          className={styles.input}
          name="confirm"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </label>
      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className={styles.button} disabled={pending}>
        {pending ? 'deleting…' : 'delete it all'}
      </button>
      <button type="button" className={own.quiet} onClick={() => setOpen(false)}>
        never mind
      </button>
    </form>
  )
}
