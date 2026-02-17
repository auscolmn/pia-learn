import { Suspense } from 'react'
import { RegisterForm } from './register-form'

export const metadata = {
  title: 'Create Account | LearnStudio',
  description: 'Create your LearnStudio account',
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFormSkeleton />}>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterFormSkeleton() {
  return (
    <div className="w-full max-w-md animate-pulse">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 space-y-2">
          <div className="h-8 w-40 rounded bg-gray-200" />
          <div className="h-4 w-56 rounded bg-gray-100" />
        </div>
        <div className="space-y-4">
          <div className="h-10 rounded bg-gray-100" />
          <div className="h-10 rounded bg-gray-100" />
          <div className="h-10 rounded bg-gray-100" />
          <div className="h-10 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  )
}
