import { ensureSupabase } from './supabase'

export async function signUp(email: string, password: string, username: string) {
  const supabase = ensureSupabase()
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username
      }
    }
  })

  if (authError) throw authError

  // Create user profile
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          email,
          username,
          created_at: new Date().toISOString()
        }
      ])

    if (profileError) throw profileError
  }

  return authData.user
}

export async function signIn(email: string, password: string) {
  const supabase = ensureSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error
  return data.user
}

export async function signOut() {
  const supabase = ensureSupabase()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const supabase = ensureSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
}

export async function getUserProfile(userId: string) {
  const supabase = ensureSupabase()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}
