import type { ReactNode } from 'react'

interface AppShellProps {
  coachName: string
  children: ReactNode
  onLogout: () => void
  onViewCalendar: () => void
}

export default function AppShell({
  coachName,
  children,
  onLogout,
  onViewCalendar,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg">
      <header
        className="sticky top-0 z-30 border-b border-border/60 backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(7,9,15,0.9)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h1 className="font-display font-black text-2xl text-ink uppercase tracking-widest">
              Rolldown
            </h1>
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          </div>
          <div className="flex items-center gap-5">
            <span className="font-mono text-xs text-ink-muted hidden sm:block">
              {coachName}
            </span>
            <button
              onClick={onViewCalendar}
              className="font-mono text-[11px] text-ink-muted hover:text-ink-dim transition-colors uppercase tracking-widest"
            >
              Calendar
            </button>
            <button
              onClick={onLogout}
              className="font-mono text-[11px] text-ink-muted hover:text-ink-dim transition-colors uppercase tracking-widest"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  )
}
