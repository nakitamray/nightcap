'use client'

import { BREED_NAMES, CAT_BREEDS, DOG_BREEDS } from '@/lib/room'
import { Choice, Row, type Section } from './controls'

/** a cat on the bed, a dog on its cushion, or nobody */
export function PetPanel({ layout, set }: Section) {
  const pet = layout.pet
  return (
    <>
      <Row label="who lives here">
        <Choice
          value={pet.kind}
          options={[
            ['none', 'nobody'],
            ['cat', 'a cat'],
            ['dog', 'a dog'],
          ]}
          onPick={(kind) =>
            set(
              'pet',
              kind === 'cat'
                ? { kind, breed: 'black' }
                : kind === 'dog'
                  ? { kind, breed: 'golden' }
                  : { kind },
            )
          }
        />
      </Row>
      {pet.kind === 'cat' && (
        <Row label="coat">
          <Choice
            value={pet.breed}
            options={CAT_BREEDS.map((b) => [b, BREED_NAMES[b] ?? b])}
            onPick={(breed) => set('pet', { kind: 'cat', breed })}
          />
        </Row>
      )}
      {pet.kind === 'dog' && (
        <Row label="breed">
          <Choice
            value={pet.breed}
            options={DOG_BREEDS.map((b) => [b, BREED_NAMES[b] ?? b])}
            onPick={(breed) => set('pet', { kind: 'dog', breed })}
          />
        </Row>
      )}
    </>
  )
}
