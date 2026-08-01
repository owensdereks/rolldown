import { useState } from 'react'
import { ArrowRight, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Button from '../ui/Button'
import { Input } from '../ui/Input'
import Logo from '../Brand/Logo'

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
    <main className="grid min-h-screen bg-bg lg:grid-cols-[minmax(360px,0.9fr)_1.1fr]">
      <section className="relative hidden overflow-hidden bg-ink px-12 py-10 text-[#F5F1E8] lg:flex lg:flex-col">
        <Logo reversed />
        <div className="my-auto max-w-lg py-16">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.16em] text-[#EFA184]">The coaching day, clarified</p>
          <h1 className="font-serif text-6xl font-medium leading-[0.96] tracking-[-0.045em] xl:text-7xl">
            Know who<br />needs you today.
          </h1>
          <p className="mt-7 max-w-md text-base leading-relaxed text-[#AEB9B0]">
            Keep every athlete relationship moving—with the right conversation at the right time.
          </p>
        </div>
        <p className="text-xs text-[#78857B]">Built for coaches who know the work is personal.</p>
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full border-[44px] border-[#2A382F]" />
        <div className="pointer-events-none absolute bottom-14 right-24 h-24 w-44 rotate-[-17deg] rounded-[50%] border-t-2 border-accent" />
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-12 lg:hidden"><Logo /></div>
        {submitted ? (
          <div className="py-2">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent">
              <Mail aria-hidden="true" size={22} strokeWidth={1.7} />
            </div>
            <h2 className="mb-3 font-serif text-4xl font-semibold tracking-[-0.04em] text-ink">
              Check your inbox
            </h2>
            <p className="text-sm leading-relaxed text-ink-dim">
              Magic link sent to <span className="font-medium text-ink">{email}</span>
            </p>
          </div>
        ) : (
          <>
            <div className="mb-9">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-accent">Welcome back</p>
              <h1 className="font-serif text-4xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">Your athletes are waiting.</h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">Sign in with your email. We’ll send you a secure link—no password needed.</p>
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
        <p className="mt-8 text-xs leading-relaxed text-ink-muted">By continuing, you agree to keep athlete information private and use Rolldown responsibly.</p>
      </div>
      </section>
    </main>
  )
}
