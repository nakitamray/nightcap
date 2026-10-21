// The room's layout rules on their own, without pulling in the renderer, so
// server code can validate a saved room.
export * from './room/layout'
export type { Layout as RoomLayout } from './room/layout'
export { POSTER_NAMES } from './room/posters'
export { planRoom } from './room/plan'
export type { Plan } from './room/plan'
export { VARIANTS, variantFor } from './room/variants'
