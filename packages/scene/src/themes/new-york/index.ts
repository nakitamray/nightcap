import { paris } from '../paris'
import type { Theme } from '../types'

export const newYork: Theme = { id: 'new-york', build: (ctx) => paris.build(ctx) }
