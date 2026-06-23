import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Client-side Supabase (uses anon key)
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

// Server-side Supabase (uses service role key - backend only)
export function getServerSupabase(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase not configured')
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

export const isSupabaseConfigured = (): boolean => !!(supabaseUrl && supabaseAnonKey)

// Realtime subscription helper
export function subscribeToChannel(
  channelName: string,
  callback: (payload: Record<string, unknown>) => void
) {
  if (!supabase) return null
  return supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public' }, callback)
    .subscribe()
}

// Chat realtime
export function subscribeToChat(
  userId: string,
  callback: (payload: Record<string, unknown>) => void
) {
  if (!supabase) return null
  return supabase
    .channel('chat-messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `receiver_id=eq.${userId}`,
    }, callback)
    .subscribe()
}

// Order realtime
export function subscribeToOrders(
  userId: string,
  callback: (payload: Record<string, unknown>) => void
) {
  if (!supabase) return null
  return supabase
    .channel('orders')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'orders',
      filter: `user_id=eq.${userId}`,
    }, callback)
    .subscribe()
}

// Auth helpers
export async function signInWithEmail(email: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUpWithEmail(email: string, password: string, metadata?: Record<string, string>) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata } })
  if (error) throw error
  return data
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } }
  return supabase.auth.onAuthStateChange((event, session) => { callback(event, session) })
}
