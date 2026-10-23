'use client'

import type { AvatarPreview } from '@nightcap/scene'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import roomStyles from '@/components/room/Room.module.css'
import {
  ACCESSORIES,
  avatarFromSeed,
  BOTTOMS,
  CLOTH_COLOURS,
  css,
  FACE_SHAPES,
  FACES,
  HAIR_COLOURS,
  HAIRSTYLES,
  MAX_ACCESSORIES,
  NAMES,
  SKINS,
  TOPS,
  type Accessory,
  type Avatar,
} from '@/lib/avatar'
import { supabaseBrowser } from '@/lib/supabase/browser'
import styles from './You.module.css'

interface Props {
  initial: Avatar
  /** who to save it for; null in the demo and dev mode, where nothing is kept */
  userId: string | null
  /** where to go once you're happy */
  next: string
  /** whether this is the first time, straight after signing up */
  firstTime?: boolean
}

export function CharacterMaker({ initial, userId, next, firstTime = false }: Props) {
  const router = useRouter()
  const hostRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<AvatarPreview | null>(null)
  const [avatar, setAvatar] = useState(initial)
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const first = useRef(initial)

  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    let cancelled = false
    let preview: AvatarPreview | null = null
    import('@nightcap/scene').then(async ({ AvatarPreview }) => {
      const p = await AvatarPreview.create(el, first.current)
      if (cancelled) return p.destroy()
      preview = previewRef.current = p
      setReady(true)
    })
    return () => {
      cancelled = true
      preview?.destroy()
      previewRef.current = null
    }
  }, [])

  useEffect(() => {
    if (ready) previewRef.current?.set(avatar)
  }, [avatar, ready])

  const set = <K extends keyof Avatar>(key: K, value: Avatar[K]) =>
    setAvatar((a) => ({ ...a, [key]: value }))

  function toggle(a: Accessory) {
    setAvatar((cur) => {
      const on = cur.accessories.includes(a)
      if (!on && cur.accessories.length >= MAX_ACCESSORIES) return cur
      return {
        ...cur,
        accessories: on ? cur.accessories.filter((x) => x !== a) : [...cur.accessories, a],
      }
    })
  }

  async function save() {
    if (!userId) return router.push(next)
    setStatus('saving')
    const { error } = await supabaseBrowser().from('profiles').update({ avatar }).eq('id', userId)
    if (error) {
      console.error('saving avatar', error)
      return setStatus('error')
    }
    router.push(next)
    router.refresh()
  }

  const full = avatar.accessories.length >= MAX_ACCESSORIES

  return (
    <div className={styles.layout}>
      <div className={styles.window}>
        <div ref={hostRef} className={styles.preview} data-ready={ready} />
      </div>

      <section className={styles.wardrobe} aria-label="what you look like">
        <h1 className={styles.title}>THIS IS YOU</h1>
        <p className={styles.lede}>
          {firstTime
            ? 'before you go in: who’s moving in? your friends see this when you’re home.'
            : 'change anything you like. your friends see this when you’re home.'}
        </p>

        <Row label="skin">
          <Swatches colours={SKINS} value={avatar.skin} onPick={(skin) => set('skin', skin)} />
        </Row>
        <Row label="face">
          <Choice value={avatar.face} options={FACES} onPick={(face) => set('face', face)} />
        </Row>
        <Row label="face shape">
          <Choice
            value={avatar.faceShape}
            options={FACE_SHAPES}
            onPick={(faceShape) => set('faceShape', faceShape)}
          />
        </Row>
        <Row label="hair">
          <Choice value={avatar.hair} options={HAIRSTYLES} onPick={(hair) => set('hair', hair)} />
        </Row>
        <Row label="hair colour">
          <Swatches
            colours={HAIR_COLOURS}
            value={avatar.hairColour}
            onPick={(hairColour) => set('hairColour', hairColour)}
          />
        </Row>
        <Row label="top">
          <Choice value={avatar.top} options={TOPS} onPick={(top) => set('top', top)} />
        </Row>
        <Row label="top colour">
          <Swatches
            colours={CLOTH_COLOURS}
            value={avatar.topColour}
            onPick={(topColour) => set('topColour', topColour)}
          />
        </Row>
        <Row label="bottoms">
          <Choice
            value={avatar.bottom}
            options={BOTTOMS}
            onPick={(bottom) => set('bottom', bottom)}
          />
        </Row>
        <Row label="bottoms colour">
          <Swatches
            colours={CLOTH_COLOURS}
            value={avatar.bottomColour}
            onPick={(bottomColour) => set('bottomColour', bottomColour)}
          />
        </Row>
        <Row label={`extras (up to ${MAX_ACCESSORIES})`}>
          <div className={roomStyles.options}>
            {ACCESSORIES.map((a) => {
              const on = avatar.accessories.includes(a)
              return (
                <button
                  key={a}
                  type="button"
                  className={roomStyles.button}
                  data-on={on}
                  aria-pressed={on}
                  disabled={!on && full}
                  onClick={() => toggle(a)}
                >
                  {NAMES[a] ?? a}
                </button>
              )
            })}
          </div>
        </Row>

        <div className={styles.actions}>
          <button
            type="button"
            className={roomStyles.button}
            onClick={() => setAvatar(avatarFromSeed(String(Math.random())))}
          >
            surprise me
          </button>
          <button
            type="button"
            className={`${roomStyles.button} ${styles.save}`}
            onClick={save}
            disabled={status === 'saving'}
          >
            {status === 'saving' ? 'saving…' : userId ? 'that’s me' : 'done'}
          </button>
          {!firstTime && userId && (
            <Link className={roomStyles.button} href={next}>
              never mind
            </Link>
          )}
        </div>
        {status === 'error' && <p className={styles.note}>couldn’t save that, try again?</p>}
        {!userId && (
          <p className={styles.note}>
            just trying it on: this one won’t be kept.{' '}
            <Link className={roomStyles.hint} href="/signup">
              make an account
            </Link>{' '}
            to keep yourself.
          </p>
        )}
      </section>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={roomStyles.row}>
      <span className={roomStyles.label}>{label}</span>
      {children}
    </div>
  )
}

function Choice<T extends string>({
  value,
  options,
  onPick,
}: {
  value: T
  options: readonly T[]
  onPick: (v: T) => void
}) {
  return (
    <div className={roomStyles.options}>
      {options.map((v) => (
        <button
          key={v}
          type="button"
          className={roomStyles.button}
          data-on={v === value}
          aria-pressed={v === value}
          onClick={() => onPick(v)}
        >
          {NAMES[v] ?? v}
        </button>
      ))}
    </div>
  )
}

function Swatches({
  colours,
  value,
  onPick,
}: {
  colours: readonly number[]
  value: number
  onPick: (i: number) => void
}) {
  return (
    <div className={roomStyles.options}>
      {colours.map((c, i) => (
        <button
          key={c}
          type="button"
          className={roomStyles.swatch}
          style={{ background: css(c) }}
          data-on={i === value}
          aria-pressed={i === value}
          aria-label={css(c)}
          onClick={() => onPick(i)}
        />
      ))}
    </div>
  )
}
