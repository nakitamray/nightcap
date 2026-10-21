// Dev mode: every city, a room of your own, no database and no friends
// needed. On by default when running locally; set NEXT_PUBLIC_DEV_MODE=1 to
// keep it on a deployed build.
export const DEV_MODE =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEV_MODE === '1'
