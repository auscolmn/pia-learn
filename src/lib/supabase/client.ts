'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for browser/client-side usage.
 * This client handles auth state via cookies automatically.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Singleton client for simple client-side usage.
 * For most cases, prefer createClient() to ensure fresh state.
 */
let browserClient: ReturnType<typeof createClient> | null = null

export function getClient() {
  if (!browserClient) {
    browserClient = createClient()
  }
  return browserClient
}
