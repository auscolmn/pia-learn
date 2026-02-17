import { Suspense } from 'react'
import { ResetPasswordForm } from './reset-password-form'

export const metadata = {
  title: 'Set New Password | LearnStudio',
  description: 'Set a new password for your LearnStudio account',
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordSkeleton />}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordSkeleton() {
  return (
    <div className="w-full max-w-md animate-pulse">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 space-y-2">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-4 w-64 rounded bg-gray-100" />
        </div>
        <div className="space-y-4">
          <div className="h-10 rounded bg-gray-100" />
          <div className="h-10 rounded bg-gray-100" />
          <div className="h-10 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  )
}
