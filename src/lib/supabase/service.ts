import { createClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client with the service role key.
 * This bypasses Row Level Security - use only in trusted server contexts
 * like webhooks or background jobs.
 * 
 * NEVER use this in client-side code or expose the service role key.
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
