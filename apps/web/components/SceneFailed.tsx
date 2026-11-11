'use client'

import styles from './SceneFailed.module.css'

/**
 * Shown in place of the street, a room or the living room when the browser
 * can't draw it at all. Without WebGL the scenes still draw on a plain 2D
 * canvas, so this is the last resort: a browser with neither. Everything else
 * on the page still works around it.
 */
export function SceneFailed({ what }: { what: string }) {
  return (
    <div className={styles.box} role="alert">
      <p className={styles.title}>the lights won’t come on</p>
      <p>
        your browser couldn’t draw {what}. try turning on hardware acceleration in your browser’s
        settings, updating your browser, or opening nightcap in another one.
      </p>
      <button type="button" className={styles.button} onClick={() => window.location.reload()}>
        try again
      </button>
    </div>
  )
}
