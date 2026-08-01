import { useState } from 'react'
import type { AthleteWithPriority, RaceWithAthletes } from '../../types'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import OnboardingScreen from '../Onboarding/OnboardingScreen'
import AthleteDetailDrawer from './AthleteDetailDrawer'
import { createContactLog, deleteContactLog } from '../../services/api'
import { dateOnlyToLocalDate, daysUntilDate, localDateKey } from '../../lib/dates'
import { ArrowUpRight, CalendarDays, Check, FileUp, MessageSquare, Plus, RotateCcw } from 'lucide-react'

interface PriorityListProps {
  athletes: AthleteWithPriority[]
  loading: boolean
  coachId: string
  onAddAthlete: () => void
  onImportCSV: () => void
  onEditAthlete: (athleteId: string) => void
  onRefresh: () => Promise<void>
  upcomingRaces: RaceWithAthletes[]
  onViewRace: (raceId: string) => void
  error: string | null
  onRetry: () => void
  filter: FilterMode
  onFilterChange: (filter: FilterMode) => void
}

export type FilterMode = 'needs-attention' | 'all'

const severityConfig = {
  red: {
    dot: 'bg-signal-red',
    textClass: 'text-signal-red',
    label: 'Needs contact',
  },
  yellow: {
    dot: 'bg-signal-amber',
    textClass: 'text-signal-amber',
    label: 'Due soon',
  },
  green: {
    dot: 'bg-signal-green',
    textClass: 'text-signal-green',
    label: 'On cadence',
  },
}

function filterNeedsAttention(athletes: AthleteWithPriority[]): AthleteWithPriority[] {
  return athletes.filter(
    (a) => a.severity === 'red' || a.severity === 'yellow' || a.upcoming_race !== null
  )
}

function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center border-b border-border bg-surface last:border-0">
      <div className="flex flex-1 items-center justify-between px-5 py-4">
        <div className="space-y-2">
          <div className="h-4 w-36 bg-elevated rounded-md" />
          <div className="h-3 w-24 bg-elevated/60 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-10 bg-elevated rounded" />
          <div className="h-8 w-24 bg-elevated rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function formatShortDate(dateStr: string): string {
  const d = dateOnlyToLocalDate(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function daysUntilRace(dateStr: string): number {
  return daysUntilDate(dateStr)
}

function weekendKey(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const dayOfWeek = date.getDay()
  date.setDate(date.getDate() + (dayOfWeek === 0 ? -1 : 6 - dayOfWeek))
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function weekendLabel(key: string): string {
  const todayKey = localDateKey()
  const thisWeekend = weekendKey(todayKey)
  const [year, month, day] = thisWeekend.split('-').map(Number)
  const nextWeekendDate = new Date(year, month - 1, day + 7)
  const nextWeekend = `${nextWeekendDate.getFullYear()}-${String(nextWeekendDate.getMonth() + 1).padStart(2, '0')}-${String(nextWeekendDate.getDate()).padStart(2, '0')}`

  if (key === thisWeekend) return 'This weekend'
  if (key === nextWeekend) return 'Next weekend'
  return `Weekend of ${formatShortDate(key).replace(/^\w+, /, '')}`
}

function RaceCard({
  race,
  onViewRace,
}: {
  race: RaceWithAthletes
  onViewRace: (raceId: string) => void
}) {
  const days = daysUntilRace(race.date)
  return (
    <button
      onClick={() => onViewRace(race.id)}
      className="group flex w-full items-start gap-3 border-b border-border py-4 text-left transition-colors last:border-0 hover:text-accent"
    >
      <div className="mt-0.5 min-w-12 text-center">
        <span className="block font-serif text-2xl leading-none text-ink tabular-nums">{dateOnlyToLocalDate(race.date).getDate()}</span>
        <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
          {dateOnlyToLocalDate(race.date).toLocaleDateString('en-US', { month: 'short' })}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug text-ink group-hover:text-accent">{race.name}</p>
          <ArrowUpRight aria-hidden="true" className="mt-0.5 shrink-0 text-ink-muted" size={15} />
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`} ·{' '}
          {race.athletes.length} athlete{race.athletes.length !== 1 ? 's' : ''}
        </p>
      </div>
    </button>
  )
}

export default function PriorityList({
  athletes,
  loading,
  coachId,
  onAddAthlete,
  onImportCSV,
  onEditAthlete,
  onRefresh,
  upcomingRaces,
  onViewRace,
  error,
  onRetry,
  filter,
  onFilterChange,
}: PriorityListProps) {
  const [drawerAthlete, setDrawerAthlete] = useState<AthleteWithPriority | null>(null)
  const [quickLoggingId, setQuickLoggingId] = useState<string | null>(null)
  const [quickLogResult, setQuickLogResult] = useState<{ id: string; athleteName: string } | null>(null)
  const [quickLogError, setQuickLogError] = useState<string | null>(null)

  const handleQuickLog = async (athlete: AthleteWithPriority) => {
    if (quickLoggingId) return
    setQuickLoggingId(athlete.id)
    setQuickLogError(null)
    try {
      const log = await createContactLog({
        athlete_id: athlete.id,
        coach_id: coachId,
        contact_type: 'text',
        notes: null,
      })
      setQuickLogResult({ id: log.id, athleteName: athlete.name })
      await onRefresh()
    } catch (err) {
      setQuickLogError(err instanceof Error ? err.message : 'Could not log the conversation')
    } finally {
      setQuickLoggingId(null)
    }
  }

  const handleUndoQuickLog = async () => {
    if (!quickLogResult) return
    try {
      await deleteContactLog(quickLogResult.id)
      setQuickLogResult(null)
      await onRefresh()
    } catch (err) {
      setQuickLogError(err instanceof Error ? err.message : 'Could not undo the conversation')
    }
  }

  const raceWeekends = Array.from(
    upcomingRaces.reduce((groups, race) => {
      const key = weekendKey(race.date)
      const races = groups.get(key) ?? []
      races.push(race)
      groups.set(key, races)
      return groups
    }, new Map<string, RaceWithAthletes[]>())
  )

  if (loading) {
    return (
      <div>
        <div className="mb-7 flex items-center justify-between">
          <div className="h-8 w-44 bg-surface rounded-md animate-pulse" />
          <div className="h-9 w-52 bg-surface rounded-xl animate-pulse" />
        </div>
        <div className="panel overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
        </div>
      </div>
    )
  }

  if (error && athletes.length === 0) {
    return (
      <div className="panel mx-auto max-w-xl p-8 text-center">
        <p className="text-xs font-semibold text-signal-red">
          Data unavailable
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
          Rolldown couldn’t load your roster
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-dim">
          Check that the Supabase project is active and that this deployment has the correct environment variables.
        </p>
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-xs text-ink-muted">
            Technical details
          </summary>
          <p className="mt-2 break-words text-xs text-ink-dim">{error}</p>
        </details>
        <Button className="mt-6" onClick={onRetry}>Try again</Button>
      </div>
    )
  }

  if (athletes.length === 0) {
    return <OnboardingScreen onAddAthlete={onAddAthlete} onImportRoster={onImportCSV} />
  }

  const filtered = filter === 'needs-attention' ? filterNeedsAttention(athletes) : athletes
  const showAllCaughtUp = filter === 'needs-attention' && filtered.length === 0
  const today = new Date()
  const dateLabel = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div>
      {quickLogError && (
        <div role="alert" className="mb-5 rounded-xl border border-signal-red/20 bg-signal-red/[0.07] px-4 py-3 text-sm text-signal-red">
          {quickLogError}
        </div>
      )}

      {error && (
        <div role="alert" className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-signal-amber/20 bg-signal-amber/[0.07] px-4 py-3 text-sm text-signal-amber">
          <span>Some data could not be refreshed. Your existing list is still shown.</span>
          <button onClick={onRetry} className="flex min-h-11 items-center gap-2 px-2 text-xs font-semibold">
            <RotateCcw aria-hidden="true" size={14} /> Retry
          </button>
        </div>
      )}

      <header className="mb-8 border-b border-border pb-7 sm:mb-10 sm:pb-9">
        <p className="mb-3 text-sm font-semibold text-accent">{dateLabel}</p>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h2 className="page-title">Who needs you today</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
            {filter === 'needs-attention'
              ? `${filtered.length} of ${athletes.length} athletes have a reason to check in.`
              : `Your complete roster of ${athletes.length} athletes.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Button onClick={onAddAthlete} icon={<Plus aria-hidden="true" size={17} />}>
            Add athlete
          </Button>
        </div>
        </div>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-12">
        <main className="min-w-0">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-ink">Priority queue</h3>
            <p className="mt-1 text-xs text-ink-muted">Ordered by coaching cadence and race proximity</p>
          </div>
        <div className="flex items-center rounded-lg border border-border bg-surface p-1">
          <button
            className={`min-h-9 rounded-lg px-3 text-sm font-medium transition-colors ${filter === 'needs-attention' ? 'bg-elevated text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}
            onClick={() => onFilterChange('needs-attention')}
          >
            Needs attention
          </button>
          <button
            className={`min-h-9 rounded-lg px-3 text-sm font-medium transition-colors ${filter === 'all' ? 'bg-elevated text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}
            onClick={() => onFilterChange('all')}
          >
            All athletes
          </button>
        </div>
        </div>

      {/* All caught up */}
      {showAllCaughtUp && (
        <div className="panel">
          <EmptyState
            icon={
              <Check aria-hidden="true" className="mx-auto" size={34} strokeWidth={1.5} />
            }
            heading="All caught up"
            description="Every athlete has been contacted recently. Solid work."
            actionLabel="View all athletes"
            onAction={() => onFilterChange('all')}
          />
        </div>
      )}

      {/* Athlete rows */}
      {!showAllCaughtUp && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {filtered.map((athlete) => {
            const cfg = severityConfig[athlete.severity]
            const raceDaysAway = athlete.upcoming_race
              ? daysUntilDate(athlete.upcoming_race.date)
              : null

            return (
              <div
                key={athlete.id}
                className="group relative flex cursor-pointer items-stretch border-b border-border bg-surface transition-colors duration-150 last:border-0 hover:bg-elevated/45 focus-visible:bg-elevated/45"
                onClick={() => setDrawerAthlete(athlete)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setDrawerAthlete(athlete)
                  }
                }}
              >
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-4 sm:gap-5 sm:px-5">
                  <div className="flex min-w-0 flex-1 items-center gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-bold text-ink">
                      {athlete.name.split(' ').map((part) => part[0] ?? '').join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="truncate text-[15px] font-semibold text-ink">
                        {athlete.name}
                      </span>
                      {athlete.is_new_athlete && (
                        <span className="inline-flex items-center rounded-full border border-accent/15 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                          New
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-xs">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
                      <span className={cfg.textClass}>{cfg.label}</span>
                      <span aria-hidden="true" className="text-border">·</span>
                      <span className="truncate text-ink-muted">
                      {athlete.days_since_last_contact === null
                        ? 'No conversation logged'
                        : athlete.days_since_last_contact > 0
                        ? `Last spoke ${athlete.days_since_last_contact}d ago`
                        : athlete.days_since_last_contact === 0
                          ? 'Spoke today'
                          : 'No conversation logged'}
                      </span>
                    </div>
                    {athlete.upcoming_race && raceDaysAway !== null && (
                      <p className="mt-1.5 truncate text-xs text-ink-dim">
                        {athlete.upcoming_race.name} · {raceDaysAway === 0 ? 'today' : `${raceDaysAway}d`}
                      </p>
                    )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                    {athlete.days_since_last_contact === null ? (
                      <div className="hidden w-16 text-right sm:block">
                        <span className="text-xs text-ink-muted">—</span>
                      </div>
                    ) : athlete.days_since_last_contact === 0 ? (
                      <div className="hidden w-16 text-right sm:block">
                        <span className="text-xs font-semibold text-signal-green">Today</span>
                      </div>
                    ) : (
                      <div className="hidden w-16 shrink-0 text-right tabular-nums sm:block">
                        <span className="text-sm font-semibold text-ink">{athlete.days_since_last_contact}d</span>
                        <p className="mt-0.5 text-[10px] text-ink-muted">since contact</p>
                      </div>
                    )}

                    {/* The most common workflow is intentionally one click. */}
                    <Button
                      variant="secondary"
                      className="shrink-0 px-3 text-xs sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                      icon={<MessageSquare aria-hidden="true" size={14} />}
                      aria-label={`Log text conversation with ${athlete.name}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleQuickLog(athlete)
                      }}
                      disabled={quickLoggingId !== null}
                    >
                      <span className="hidden sm:inline">
                        {quickLoggingId === athlete.id ? 'Logging…' : 'Log text'}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
        </main>

        <aside className="order-first space-y-8 lg:order-none" aria-label="Race context and roster actions">
          {upcomingRaces.length > 0 && (
            <section aria-labelledby="race-weekends-title">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CalendarDays aria-hidden="true" className="text-accent" size={17} strokeWidth={1.8} />
                  <h2 id="race-weekends-title" className="text-sm font-semibold text-ink">Race weekends</h2>
                </div>
              </div>
              {raceWeekends.map(([key, races]) => (
                <section key={key} className="mt-5" aria-labelledby={`weekend-${key}`}>
                  <p id={`weekend-${key}`} className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                    {weekendLabel(key)}
                  </p>
                  <div className="mt-1">
                    {races.map((race) => <RaceCard key={race.id} race={race} onViewRace={onViewRace} />)}
                  </div>
                </section>
              ))}
            </section>
          )}

          <section className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm font-semibold text-ink">Roster</p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">Add athletes one at a time or bring in an existing list.</p>
            <div className="mt-4 grid gap-2">
              <Button variant="secondary" onClick={onImportCSV} icon={<FileUp aria-hidden="true" size={16} />}>Import roster</Button>
              <button onClick={() => onFilterChange('all')} className="min-h-11 text-sm font-semibold text-accent hover:text-accent-dark">View all {athletes.length} athletes</button>
            </div>
          </section>
        </aside>
      </div>

      {/* Athlete Detail Drawer */}
      {drawerAthlete && (
        <AthleteDetailDrawer
          athleteId={drawerAthlete.id}
          athlete={drawerAthlete}
          coachId={coachId}
          onClose={() => setDrawerAthlete(null)}
          onEditAthlete={(id) => {
            setDrawerAthlete(null)
            onEditAthlete(id)
          }}
          onRefresh={onRefresh}
        />
      )}

      {quickLogResult && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-center gap-4 rounded-xl border border-border bg-ink px-4 py-3 shadow-2xl"
        >
          <span className="text-sm text-white">
            Text conversation logged for {quickLogResult.athleteName}.
          </span>
          <button
            type="button"
            onClick={() => void handleUndoQuickLog()}
            className="min-h-11 text-xs font-semibold text-accent hover:text-ink"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => setQuickLogResult(null)}
            className="text-ink-muted hover:text-ink"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
