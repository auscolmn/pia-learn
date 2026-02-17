'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signUpWithEmail } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    createOrg: false,
    orgName: '',
    orgSlug: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-generate slug from org name
    if (field === 'orgName' && typeof value === 'string') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData(prev => ({ ...prev, orgSlug: slug }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    if (formData.createOrg && (!formData.orgName || !formData.orgSlug)) {
      setError('Please provide organization name and URL')
      setLoading(false)
      return
    }

    try {
      const result = await signUpWithEmail(
        formData.email,
        formData.password,
        formData.fullName,
        formData.createOrg
          ? {
              createOrg: true,
              orgName: formData.orgName,
              orgSlug: formData.orgSlug,
            }
          : undefined
      )
      
      if (!result.success) {
        setError(result.error ?? 'Failed to create account')
        return
      }

      // Show success message for email confirmation
      setSuccess(true)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setError(null)
    setGoogleLoading(true)

    try {
      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect ?? '/dashboard')}`,
        },
      })

      if (oauthError) {
        setError(oauthError.message)
        setGoogleLoading(false)
      }
    } catch {
      setError('Failed to sign up with Google')
      setGoogleLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a confirmation link to <strong>{formData.email}</strong>.
            Click the link to verify your account.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button variant="link" onClick={() => router.push('/login')}>
            Back to sign in
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Get started with LearnStudio today
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              required
              autoComplete="name"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              required
              autoComplete="new-password"
            />
            <p className="text-xs text-gray-500">
              Must be at least 8 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          {/* Create Organization Toggle */}
          <div className="rounded-lg border border-gray-200 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={formData.createOrg}
                onChange={(e) => updateField('createOrg', e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="block font-medium text-gray-900">
                  Create an organization
                </span>
                <span className="text-sm text-gray-500">
                  Set up your own course platform
                </span>
              </div>
            </label>

            {formData.createOrg && (
              <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization name</Label>
                  <Input
                    id="orgName"
                    type="text"
                    placeholder="My Academy"
                    value={formData.orgName}
                    onChange={(e) => updateField('orgName', e.target.value)}
                    required={formData.createOrg}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgSlug">Organization URL</Label>
                  <div className="flex items-center">
                    <span className="rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                      learnstudio.com/
                    </span>
                    <Input
                      id="orgSlug"
                      type="text"
                      placeholder="my-academy"
                      value={formData.orgSlug}
                      onChange={(e) => updateField('orgSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      required={formData.createOrg}
                      className="rounded-l-none"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Only lowercase letters, numbers, and hyphens
                  </p>
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Create account'}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignUp}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <Spinner size="sm" />
          ) : (
            <>
              <GoogleIcon className="mr-2 h-4 w-4" />
              Google
            </>
          )}
        </Button>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
