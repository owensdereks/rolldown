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

  return (
    <div
      className="min-h-screen bg-bg flex items-center justify-center px-4 relative overflow-hidden"
    >
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(30,42,58,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(30,42,58,0.35) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Radial teal glow from top */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: '900px',
          height: '500px',
          background: 'radial-gradient(ellipse at center top, rgba(0,200,240,0.07) 0%, transparent 65%)',
        }}
      />

      <div
        className="relative bg-elevated border border-border rounded-2xl p-8 max-w-sm w-full"
        style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)' }}
      >
        {submitted ? (
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-accent"
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
            <h2 className="font-display font-black text-2xl text-ink uppercase tracking-widest mb-2">
              Check Inbox
            </h2>
            <p className="text-sm text-ink-dim leading-relaxed">
              Magic link sent to{' '}
              <span className="text-ink font-medium">{email}</span>
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="font-display font-black text-5xl text-ink uppercase tracking-widest mb-2">
                Rolldown
              </h1>
              <p className="font-mono text-[11px] text-ink-muted uppercase tracking-widest">
                Know who needs you today
              </p>
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
              <Button type="submit" disabled={loading} className="w-full justify-center py-2.5">
                {loading ? 'Sending...' : 'Send Magic Link'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
