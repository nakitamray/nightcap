import { paris } from '../paris'
import type { Theme } from '../types'

export const tokyo: Theme = { id: 'tokyo', build: (ctx) => paris.build(ctx) }
