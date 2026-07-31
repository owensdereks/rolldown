import { useState } from 'react'
import type { AthleteWithPriority, RaceWithAthletes } from '../../types'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import OnboardingScreen from '../Onboarding/OnboardingScreen'
import LogContactModal from './LogContactModal'
import AthleteDetailDrawer from './AthleteDetailDrawer'

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
}

type FilterMode = 'needs-attention' | 'all'

const severityConfig = {
  red: {
    bar: '#FF3B52',
    glow: 'rgba(255,59,82,0.35)',
    textClass: 'text-signal-red',
  },
  yellow: {
    bar: '#FFAD2E',
    glow: 'rgba(255,173,46,0.3)',
    textClass: 'text-signal-amber',
  },
  green: {
    bar: '#00D977',
    glow: 'rgba(0,217,119,0.25)',
    textClass: 'text-signal-green',
  },
}

function filterNeedsAttention(athletes: AthleteWithPriority[]): AthleteWithPriority[] {
  return athletes.filter(
    (a) => a.severity === 'red' || a.severity === 'yellow' || a.upcoming_race !== null
  )
}

function SkeletonRow() {
  return (
    <div className="bg-surface border border-border rounded-xl flex items-center overflow-hidden animate-pulse">
      <div className="w-[3px] self-stretch bg-elevated shrink-0" />
      <div className="flex-1 py-4 px-4 flex items-center justify-between">
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
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function daysUntilRace(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number)
  const race = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((race.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function RaceCard({
  race,
  onViewRace,
}: {
  race: RaceWithAthletes
  onViewRace: (raceId: string) => void
}) {
  const days = daysUntilRace(race.date)
  const visibleAthletes = race.athletes.slice(0, 3)
  const overflow = race.athletes.length - visibleAthletes.length

  return (
    <button
      onClick={() => onViewRace(race.id)}
      className="flex-shrink-0 w-44 bg-elevated border border-border rounded-xl p-4 text-left hover:border-signal-purple/40 hover:bg-signal-purple/5 transition-all duration-200 group"
    >
      {/* Race name */}
      <p className="font-display font-black text-base text-ink uppercase tracking-wide leading-tight truncate">
        {race.name}
      </p>

      {/* Date + days */}
      <p className="font-mono text-[10px] text-accent mt-1.5 uppercase tracking-widest">
        {formatShortDate(race.date)}
      </p>
      <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
        in {days} day{days !== 1 ? 's' : ''}
      </p>

      {/* Athlete count */}
      <p className="font-mono text-[10px] text-ink-dim mt-2 uppercase tracking-widest">
        {race.athletes.length} athlete{race.athletes.length !== 1 ? 's' : ''}
      </p>

      {/* Avatar row */}
      {race.athletes.length > 0 && (
        <div className="flex items-center gap-1 mt-2">
          {visibleAthletes.map(a => {
            const initials = a.name
              .split(' ')
              .map(p => p[0] ?? '')
              .join('')
              .slice(0, 2)
              .toUpperCase()
            return (
              <div
                key={a.id}
                className="w-6 h-6 rounded-full bg-bg border border-border flex items-center justify-center flex-shrink-0"
              >
                <span className="font-mono text-[8px] text-accent font-semibold">{initials}</span>
              </div>
            )
          })}
          {overflow > 0 && (
            <div className="w-6 h-6 rounded-full bg-bg border border-border flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-[8px] text-ink-dim">+{overflow}</span>
            </div>
          )}
        </div>
      )}
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
}: PriorityListProps) {
  const [filter, setFilter] = useState<FilterMode>('needs-attention')
  const [contactModalAthlete, setContactModalAthlete] = useState<AthleteWithPriority | null>(null)
  const [drawerAthlete, setDrawerAthlete] = useState<AthleteWithPriority | null>(null)

  if (loading) {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-44 bg-surface rounded-md animate-pulse" />
          <div className="h-9 w-52 bg-surface rounded-xl animate-pulse" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    )
  }

  if (athletes.length === 0) {
    return <OnboardingScreen onAddAthlete={onAddAthlete} onImportRoster={onImportCSV} />
  }

  const filtered = filter === 'needs-attention' ? filterNeedsAttention(athletes) : athletes
  const showAllCaughtUp = filter === 'needs-attention' && filtered.length === 0

  return (
    <div>
      {/* Race feed */}
      {upcomingRaces.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display font-black text-xl text-ink uppercase tracking-wide mb-3">
            Upcoming Races
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {upcomingRaces.map(race => (
              <RaceCard key={race.id} race={race} onViewRace={onViewRace} />
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-black text-3xl text-ink uppercase tracking-wide">
            Athletes
          </h2>
          <p className="font-mono text-[10px] text-ink-muted mt-0.5 uppercase tracking-widest">
            {filtered.length} of {athletes.length}
          </p>
        </div>

        {/* Filter toggle */}
        <div className="flex items-center bg-surface border border-border rounded-xl p-1 gap-1">
          <button
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
              filter === 'needs-attention'
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'text-ink-dim hover:text-ink'
            }`}
            onClick={() => setFilter('needs-attention')}
          >
            Needs Attention
          </button>
          <button
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
              filter === 'all'
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'text-ink-dim hover:text-ink'
            }`}
            onClick={() => setFilter('all')}
          >
            All Athletes
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mb-5">
        <Button onClick={onAddAthlete}>Add Athlete</Button>
        <Button variant="secondary" onClick={onImportCSV}>
          Import CSV
        </Button>
      </div>

      {/* All caught up */}
      {showAllCaughtUp && (
        <div className="bg-surface border border-border rounded-xl">
          <EmptyState
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.25}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            heading="All Caught Up"
            description="Every athlete has been contacted recently. Solid work."
            actionLabel="View All Athletes"
            onAction={() => setFilter('all')}
          />
        </div>
      )}

      {/* Athlete rows */}
      {!showAllCaughtUp && (
        <div className="space-y-2">
          {filtered.map((athlete) => {
            const cfg = severityConfig[athlete.severity]
            const raceDaysAway = athlete.upcoming_race
              ? Math.ceil(
                  (new Date(athlete.upcoming_race.date).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : null

            return (
              <div
                key={athlete.id}
                className="relative bg-surface border border-border rounded-xl flex items-stretch overflow-hidden hover:border-white/10 transition-all duration-200 cursor-pointer group"
                onClick={() => setDrawerAthlete(athlete)}
              >
                {/* Severity bar with glow */}
                <div
                  className="w-[3px] shrink-0"
                  style={{
                    backgroundColor: cfg.bar,
                    boxShadow: `0 0 12px ${cfg.glow}, 0 0 4px ${cfg.bar}`,
                  }}
                />

                {/* Main content */}
                <div className="flex-1 py-3.5 px-4 flex items-center justify-between min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink truncate">
                        {athlete.name}
                      </span>
                      {athlete.is_new_athlete && (
                        <span className="inline-flex items-center rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 font-mono text-[9px] font-medium text-accent uppercase tracking-widest">
                          New
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-ink-muted mt-0.5 uppercase tracking-widest">
                      {athlete.days_since_last_contact > 0
                        ? `Last contact ${athlete.days_since_last_contact}d ago`
                        : athlete.days_since_last_contact === 0
                          ? 'Contacted today'
                          : 'No contact logged'}
                    </p>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    {athlete.upcoming_race && raceDaysAway !== null && (
                      <Badge variant="race">
                        {athlete.upcoming_race.name} — {raceDaysAway}d
                      </Badge>
                    )}

                    {/* Days counter */}
                    {athlete.days_since_last_contact === 0 ? (
                      <div className="w-12 text-center">
                        <span className="inline-flex items-center rounded-full bg-signal-green/10 border border-signal-green/20 px-2 py-0.5 font-mono text-[9px] font-medium text-signal-green uppercase tracking-widest">
                          Today
                        </span>
                      </div>
                    ) : (
                      <div className="text-center w-12 shrink-0">
                        <span
                          className={`font-display font-black text-3xl leading-none ${cfg.textClass}`}
                        >
                          {athlete.days_since_last_contact}
                        </span>
                        <p className="font-mono text-[9px] text-ink-muted uppercase tracking-widest mt-0.5">
                          days
                        </p>
                      </div>
                    )}

                    {/* Log Contact button */}
                    <Button
                      variant="secondary"
                      className="text-xs px-3 py-1.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        setContactModalAthlete(athlete)
                      }}
                    >
                      Log Contact
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Log Contact Modal */}
      {contactModalAthlete && (
        <LogContactModal
          athlete={contactModalAthlete}
          coachId={coachId}
          onClose={() => setContactModalAthlete(null)}
          onSaved={async () => {
            setContactModalAthlete(null)
            await onRefresh()
          }}
        />
      )}

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
    </div>
  )
}
