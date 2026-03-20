import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Button from '../ui/Button'
import { Input } from '../ui/Input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({ email })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSubmitted(true)
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-sm border border-slate-200">
          <div className="text-center">
            <div className="mx-auto mb-4 text-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-slate-800 mb-2">
              Check your email
            </h1>
            <p className="text-sm text-slate-600">
              We sent a magic link to{' '}
              <span className="font-medium text-slate-800">{email}</span>.
              Click the link to sign in.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-sm border border-slate-200">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">
            Rolldown
          </h1>
          <p className="text-sm text-slate-500">Know who needs you today.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="coach@example.com"
            error={error ?? undefined}
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Sending...' : 'Send Magic Link'}
          </Button>
        </form>
      </div>
    </div>
  )
}
