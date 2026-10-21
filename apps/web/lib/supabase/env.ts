// The demo street works without any of this; houses need it.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''
export const hasSupabase = Boolean(supabaseUrl && supabaseKey)
