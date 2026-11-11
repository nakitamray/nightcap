'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { Track } from '@/components/useNowPlaying'
import { SPOTIFY_RESULT } from '@/lib/spotifyText'
import styles from '../Room.module.css'

export type Spotify = 'off' | 'unlinked' | 'linked' | 'not-allowed' | 'dev'

export function RecordPanel({
  spotify,
  track,
  houseId,
  onFakePlay,
}: {
  spotify: Spotify
  track: Track | null
  houseId: string
  onFakePlay?: () => void
}) {
  // coming back from spotify: say how it went
  const result = useSearchParams().get('spotify')
  const said = result && result !== 'connected' ? SPOTIFY_RESULT[result] : null
  if (spotify === 'dev') {
    return (
      <>
        <p className={styles.hint}>
          dev mode: no spotify here, but you can see what it looks like.
        </p>
        <button type="button" className={styles.button} onClick={onFakePlay}>
          {track ? 'stop the record' : 'pretend something’s playing'}
        </button>
      </>
    )
  }
  if (spotify === 'off') {
    return <p className={styles.hint}>spotify isn&apos;t hooked up on this site yet.</p>
  }
  if (spotify === 'unlinked') {
    return (
      <>
        {said && (
          <p className={styles.hint} role="alert">
            {said}
          </p>
        )}
        <p className={styles.hint}>
          connect spotify and the record lights up when you&apos;re listening. everyone in the house
          can see what&apos;s on.
        </p>
        <p>
          <a className={styles.button} href={`/api/spotify/login?next=/h/${houseId}/room`}>
            connect spotify
          </a>
        </p>
      </>
    )
  }
  if (spotify === 'not-allowed') {
    return (
      <>
        <p className={styles.hint} role="alert">
          {SPOTIFY_RESULT['not-allowed']}
        </p>
        <Disconnect houseId={houseId} />
      </>
    )
  }
  return (
    <>
      {track ? (
        <div className={styles.track}>
          {/* album art comes straight off spotify's cdn, tiny already */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {track.art && <img src={track.art} alt="" />}
          <div>
            <p>{track.title}</p>
            <p className={styles.hint}>{track.artist}</p>
            {track.url && (
              <a className={styles.hint} href={track.url} target="_blank" rel="noreferrer">
                open in spotify
              </a>
            )}
          </div>
        </div>
      ) : (
        <p className={styles.hint}>nothing playing right now.</p>
      )}
      <Disconnect houseId={houseId} />
    </>
  )
}

function Disconnect({ houseId }: { houseId: string }) {
  return (
    <form
      action="/api/spotify/disconnect"
      method="post"
      className={styles.row}
      style={{ marginTop: 14 }}
    >
      <input type="hidden" name="next" value={`/h/${houseId}/room`} />
      <button type="submit" className={styles.button}>
        disconnect
      </button>
      <Link className={styles.hint} href="/account">
        your account
      </Link>
    </form>
  )
}
