import { paris } from '../paris'
import type { Theme } from '../types'

export const venice: Theme = { id: 'venice', build: (ctx) => paris.build(ctx) }
