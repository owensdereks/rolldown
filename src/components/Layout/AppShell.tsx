import type { ReactNode } from 'react'
import { CalendarDays, LogOut, UserRound } from 'lucide-react'

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
        className="sticky top-0 z-30 border-b border-white/[0.065] backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(11,13,16,0.88)' }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-[var(--page-gutter)]">
          <div className="flex items-center gap-2">
            <h1 className="font-brand text-[28px] font-extrabold uppercase leading-none tracking-[0.08em] text-ink">
              Rolldown
            </h1>
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-accent/80" />
          </div>
          <nav className="flex items-center gap-1" aria-label="Primary navigation">
            <button
              onClick={onViewCalendar}
              className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-ink-dim transition-colors hover:bg-white/[0.05] hover:text-ink"
            >
              <CalendarDays aria-hidden="true" size={17} strokeWidth={1.8} />
              Calendar
            </button>
            <div className="mx-2 hidden h-5 w-px bg-white/[0.08] sm:block" />
            <div className="hidden min-w-0 items-center gap-2 px-2 sm:flex">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-elevated text-ink-muted">
                <UserRound aria-hidden="true" size={14} strokeWidth={1.8} />
              </span>
              <span className="max-w-40 truncate text-xs text-ink-muted">{coachName}</span>
            </div>
            <button
              onClick={onLogout}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-white/[0.05] hover:text-ink"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut aria-hidden="true" size={17} strokeWidth={1.8} />
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-[var(--page-gutter)] py-7 sm:py-10">{children}</main>
    </div>
  )
}
