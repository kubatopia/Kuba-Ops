import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
      'Copy .env.local.example to .env.local and fill in your project URL and anon key.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper: log an activity event after a mutation
export async function logActivity(
  clientId: string,
  eventType: string,
  description: string,
  metadata: Record<string, unknown> = {}
) {
  await supabase.from('activities').insert({ client_id: clientId, event_type: eventType, description, metadata })
}
