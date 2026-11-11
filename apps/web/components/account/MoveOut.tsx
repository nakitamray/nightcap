'use client'

import { useActionState, useState } from 'react'
import { leaveHouse, type ActionState } from '@/app/account/actions'
import houseStyles from '@/components/HouseView.module.css'
import own from './Account.module.css'

/** under a house on the keyring: move out, after saying so twice */
export function MoveOut({ houseId, name, last }: { houseId: string; name: string; last: boolean }) {
  const [asking, setAsking] = useState(false)
  const [state, action, pending] = useActionState<ActionState, FormData>(leaveHouse, {})
  if (!asking) {
    return (
      <button type="button" className={own.quiet} onClick={() => setAsking(true)}>
        move out
      </button>
    )
  }
  return (
    <form action={action} className={own.confirm}>
      <input type="hidden" name="house" value={houseId} />
      <p>
        {last
          ? `you’re the last one in ${name}. move out and it closes for good.`
          : `move out of ${name}? your room and your notes there go with you.`}
      </p>
      {state.error && <p role="alert">{state.error}</p>}
      <span className={own.buttons}>
        <button type="submit" className={houseStyles.button} disabled={pending}>
          {pending ? '…' : 'yes, move out'}
        </button>
        <button type="button" className={houseStyles.button} onClick={() => setAsking(false)}>
          stay
        </button>
      </span>
    </form>
  )
}
