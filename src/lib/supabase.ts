import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export function ensureSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase n’est pas configuré. Vérifie VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.'
    )
  }
  return supabase
}

export async function initializeDatabase() {
  const client = ensureSupabase()
  const { data: { session } } = await client.auth.getSession()
  return !!session
}
