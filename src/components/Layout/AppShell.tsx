import type { ReactNode } from 'react'
import Button from '../ui/Button'

interface AppShellProps {
  coachName: string
  children: ReactNode
  onLogout: () => void
}

export default function AppShell({
  coachName,
  children,
  onLogout,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800">
            Rolldown
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{coachName}</span>
            <Button variant="secondary" onClick={onLogout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
