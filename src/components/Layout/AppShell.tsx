import { useState, type ReactNode } from 'react'
import { CalendarDays, FileUp, LogOut, Menu, SunMedium, UsersRound, X } from 'lucide-react'
import Logo from '../Brand/Logo'

export type NavItem = 'today' | 'athletes' | 'calendar' | 'import' | 'other'

interface AppShellProps {
  coachName: string
  children: ReactNode
  activeNav: NavItem
  athleteCount: number
  onLogout: () => void
  onViewToday: () => void
  onViewAthletes: () => void
  onViewCalendar: () => void
  onImportRoster: () => void
}

export default function AppShell({
  coachName,
  children,
  activeNav,
  athleteCount,
  onLogout,
  onViewToday,
  onViewAthletes,
  onViewCalendar,
  onImportRoster,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = (action: () => void) => {
    action()
    setMobileOpen(false)
  }

  const navItems = [
    { id: 'today' as const, label: 'Today', icon: SunMedium, action: onViewToday, count: athleteCount },
    { id: 'athletes' as const, label: 'All athletes', icon: UsersRound, action: onViewAthletes },
    { id: 'calendar' as const, label: 'Race calendar', icon: CalendarDays, action: onViewCalendar },
    { id: 'import' as const, label: 'Import roster', icon: FileUp, action: onImportRoster },
  ]

  const sidebar = (
    <>
      <div className="px-2 pb-8 pt-1"><Logo reversed /></div>
      <nav className="space-y-1" aria-label="Primary navigation">
        {navItems.map(({ id, label, icon: Icon, action, count }) => (
          <button
            key={id}
            onClick={() => navigate(action)}
            className={`flex min-h-11 w-full items-center gap-3 rounded-[10px] px-3 text-left text-sm font-medium transition-colors ${
              activeNav === id
                ? 'bg-[#2A382F] text-[#FCFAF5]'
                : 'text-[#AEB9B0] hover:bg-[#223027] hover:text-[#FCFAF5]'
            }`}
          >
            <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
            <span className="flex-1">{label}</span>
            {count !== undefined && <span className="text-xs tabular-nums text-[#78857B]">{count}</span>}
          </button>
        ))}
      </nav>
      <div className="mt-auto border-t border-[#344139] px-2 pt-4">
        <p className="truncate text-sm font-medium text-[#F5F1E8]">{coachName}</p>
        <button
          onClick={onLogout}
          className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-lg text-xs text-[#8E9B91] transition-colors hover:text-[#F5F1E8]"
        >
          <LogOut aria-hidden="true" size={15} /> Sign out
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-bg">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[216px] flex-col bg-[#18231D] px-4 py-6 lg:flex">
        {sidebar}
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/95 px-5 backdrop-blur lg:hidden">
        <Logo />
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-border bg-surface text-ink"
          aria-label="Open navigation"
        >
          <Menu aria-hidden="true" size={20} />
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-[#18231D]/35 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col bg-[#18231D] px-4 py-6 shadow-2xl">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg text-[#AEB9B0] hover:bg-[#223027] hover:text-white" aria-label="Close navigation menu">
              <X aria-hidden="true" size={19} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="min-h-screen lg:ml-[216px]">
        <div className="mx-auto max-w-[1320px] px-[var(--page-gutter)] py-8 sm:py-11">{children}</div>
      </main>
    </div>
  )
}
