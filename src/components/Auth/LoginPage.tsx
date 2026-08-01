import { useState } from 'react'
import { ArrowRight, Mail, Sparkles } from 'lucide-react'
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

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSubmitted(true)
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-5">
      <div
        className="pointer-events-none fixed left-1/2 top-0 -translate-x-1/2"
        style={{
          width: '760px',
          height: '500px',
          background: 'radial-gradient(ellipse at center top, rgba(120,166,255,0.09) 0%, transparent 65%)',
        }}
      />

      <div className="relative w-full max-w-[400px] rounded-2xl border border-white/[0.08] bg-surface/95 p-7 shadow-[0_28px_80px_rgba(0,0,0,0.36)] sm:p-9">
        {submitted ? (
          <div className="py-2 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-accent/15 bg-accent/10 text-accent">
              <Mail aria-hidden="true" size={22} strokeWidth={1.7} />
            </div>
            <h2 className="mb-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
              Check your inbox
            </h2>
            <p className="text-sm leading-relaxed text-ink-dim">
              Magic link sent to <span className="font-medium text-ink">{email}</span>
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-elevated text-accent">
                <Sparkles aria-hidden="true" size={17} strokeWidth={1.7} />
              </div>
              <h1 className="font-brand mb-1 text-[42px] font-extrabold uppercase leading-none tracking-[0.1em] text-ink">
                Rolldown
              </h1>
              <p className="text-sm text-ink-muted">Know who needs you today</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email"
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coach@example.com"
                error={error ?? undefined}
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                icon={!loading ? <ArrowRight aria-hidden="true" size={17} /> : undefined}
              >
                {loading ? 'Sending…' : 'Send magic link'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
