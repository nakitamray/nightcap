'use client'

import { MAX_POSTERS, POSTER_COUNT, POSTER_NAMES } from '@/lib/room'
import styles from '../Room.module.css'
import { Row, type Section } from './controls'

/** every free bit of wall can take a poster; flick through the designs */
export function PostersPanel({ layout, plan, set }: Section) {
  const spots = plan.posters.length
  const hung = layout.posters.slice(0, spots)
  return (
    <>
      {hung.map((design, i) => (
        <Row key={i} label={`${i + 1}. ${POSTER_NAMES[design]}`}>
          <div className={styles.options}>
            <button
              type="button"
              className={styles.button}
              onClick={() =>
                set(
                  'posters',
                  layout.posters.map((d, j) =>
                    j === i ? (d + POSTER_COUNT - 1) % POSTER_COUNT : d,
                  ),
                )
              }
            >
              ‹
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() =>
                set(
                  'posters',
                  layout.posters.map((d, j) => (j === i ? (d + 1) % POSTER_COUNT : d)),
                )
              }
            >
              ›
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() =>
                set(
                  'posters',
                  layout.posters.filter((_, j) => j !== i),
                )
              }
            >
              take down
            </button>
          </div>
        </Row>
      ))}
      {hung.length < Math.min(spots, MAX_POSTERS) ? (
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            const unused =
              Array.from({ length: POSTER_COUNT }, (_, d) => d).find((d) => !hung.includes(d)) ?? 0
            set('posters', [...hung, unused])
          }}
        >
          put up another
        </button>
      ) : null}
      <p className={styles.hint}>
        {spots - hung.length > 0
          ? `room on the walls for ${spots - hung.length} more.`
          : 'the walls are full. take one down, or move some furniture to free up wall.'}
      </p>
    </>
  )
}
