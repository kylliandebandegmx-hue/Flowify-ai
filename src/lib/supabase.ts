import { createClient } from '@supabase/supabase-js'

// === EMBEDDED DEFAULTS (INSECURE - committed in repo) ===
// Project URL
const DEFAULT_SUPABASE_URL = 'https://tqazqfmbquktvhvbxgct.supabase.co'
// Public anon key (use only for testing; do NOT use service_role key here)
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxYXpxZm1icXVrdHZodmJ4Z2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MzgyNDksImV4cCI6MjA5NjMxNDI0OX0.u3Owww4gWCuXqE9ZlocHeQKRqnPi9cHDRYQgJrKEo1Y'

// Use environment variables when present (local dev or CI), otherwise fall back to embedded values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function ensureSupabase() {
  return supabase
}

export async function initializeDatabase() {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}
