import { createServerClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Auth callback handler for:
 * - OAuth sign-in (Google, etc.)
 * - Email confirmation
 * - Password reset
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') ?? '/dashboard'
  const type = searchParams.get('type') // 'recovery' for password reset
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth/Supabase errors
  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('error', errorDescription ?? error)
    return NextResponse.redirect(loginUrl)
  }

  if (code) {
    const supabase = await createServerClient()
    
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      const loginUrl = new URL('/login', origin)
      loginUrl.searchParams.set('error', exchangeError.message)
      return NextResponse.redirect(loginUrl)
    }

    // For password recovery, redirect to reset password page
    if (type === 'recovery') {
      const resetUrl = new URL('/reset-password', origin)
      return NextResponse.redirect(resetUrl)
    }

    // Redirect to the original destination
    const redirectUrl = new URL(redirect, origin)
    return NextResponse.redirect(redirectUrl)
  }

  // No code - redirect to login
  const loginUrl = new URL('/login', origin)
  return NextResponse.redirect(loginUrl)
}
