import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function initializeDatabase() {
  // Create tables if they don't exist
  // This is handled by Supabase SQL migrations
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}
