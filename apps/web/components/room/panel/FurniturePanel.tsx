'use client'

import { ADDABLE, canAdd, FURNITURE_NAMES, MAX_FURNITURE } from '@/lib/room'
import styles from '../Room.module.css'
import { Row, type Section } from './controls'

/** your own pieces go in first, then whatever the room came with */
export function FurniturePanel({ layout, plan, set }: Section) {
  const full = layout.furniture.length >= MAX_FURNITURE
  return (
    <>
      {layout.furniture.length > 0 && (
        <Row label="yours">
          <div className={styles.options}>
            {layout.furniture.map((kind, i) => (
              <button
                key={i}
                type="button"
                className={styles.button}
                aria-label={`take out the ${FURNITURE_NAMES[kind]}`}
                onClick={() =>
                  set(
                    'furniture',
                    layout.furniture.filter((_, j) => j !== i),
                  )
                }
              >
                {FURNITURE_NAMES[kind]} ×
              </button>
            ))}
          </div>
        </Row>
      )}
      <Row label="bring in">
        <div className={styles.options}>
          {ADDABLE.map((kind) => (
            <button
              key={kind}
              type="button"
              className={styles.button}
              disabled={full || !canAdd(plan, kind)}
              onClick={() => set('furniture', [...layout.furniture, kind])}
            >
              {FURNITURE_NAMES[kind]}
            </button>
          ))}
        </div>
      </Row>
      <p className={styles.hint}>
        {full
          ? 'that’s plenty. take something out to make room.'
          : plan.free.length === 0
            ? 'no floor left. take something out first.'
            : 'your things go in first, so they might nudge out something the room came with.'}
      </p>
    </>
  )
}
