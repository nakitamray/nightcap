'use client'

import { useCallback, useEffect, useRef } from 'react'

/**
 * Tells a single click on a window from a double one. The single click waits
 * a beat, so a double click on your own window doesn't flap the curtains on
 * the way inside.
 */
export function useWindowClicks(
  onSingle: (index: number) => void,
  onDouble: (index: number) => void,
) {
  const pending = useRef<{ index: number; timer: ReturnType<typeof setTimeout> } | null>(null)
  useEffect(() => () => clearTimeout(pending.current?.timer), [])

  return useCallback(
    (index: number) => {
      const last = pending.current
      if (last) clearTimeout(last.timer)
      if (last && last.index === index) {
        pending.current = null
        onDouble(index)
        return
      }
      pending.current = {
        index,
        timer: setTimeout(() => {
          pending.current = null
          onSingle(index)
        }, 320),
      }
    },
    [onSingle, onDouble],
  )
}
