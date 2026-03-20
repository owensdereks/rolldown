import { useState } from 'react'
import type { AthleteWithPriority } from '../../types'
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
}

type FilterMode = 'needs-attention' | 'all'

const severityColor = {
  red: 'bg-red-500',
  yellow: 'bg-amber-500',
  green: 'bg-emerald-500',
}

const severityTextColor = {
  red: 'text-red-500',
  yellow: 'text-amber-600',
  green: 'text-emerald-500',
}

function filterNeedsAttention(athletes: AthleteWithPriority[]): AthleteWithPriority[] {
  return athletes.filter(
    (a) => a.severity === 'red' || a.severity === 'yellow' || a.upcoming_race !== null
  )
}

function SkeletonRow() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg flex items-center overflow-hidden animate-pulse">
      <div className="w-1 self-stretch bg-slate-200" />
      <div className="flex-1 py-3 px-4 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-24 bg-slate-100 rounded" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-8 w-10 bg-slate-200 rounded" />
          <div className="h-8 w-24 bg-slate-100 rounded-md" />
        </div>
      </div>
    </div>
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
}: PriorityListProps) {
  const [filter, setFilter] = useState<FilterMode>('needs-attention')
  const [contactModalAthlete, setContactModalAthlete] = useState<AthleteWithPriority | null>(null)
  const [drawerAthlete, setDrawerAthlete] = useState<AthleteWithPriority | null>(null)

  // Loading state
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-9 w-40 bg-slate-200 rounded-md animate-pulse" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    )
  }

  // Zero athletes — onboarding
  if (athletes.length === 0) {
    return (
      <OnboardingScreen
        onAddAthlete={onAddAthlete}
        onImportRoster={onImportCSV}
      />
    )
  }

  const filtered = filter === 'needs-attention' ? filterNeedsAttention(athletes) : athletes
  const showAllCaughtUp = filter === 'needs-attention' && filtered.length === 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Your Athletes
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {filtered.length} of {athletes.length} athletes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle */}
          <div className="inline-flex rounded-md border border-slate-200 overflow-hidden">
            <button
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === 'needs-attention'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => setFilter('needs-attention')}
            >
              Needs Attention
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => setFilter('all')}
            >
              All Athletes
            </button>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mb-6">
        <Button onClick={onAddAthlete}>Add Athlete</Button>
        <Button variant="secondary" onClick={onImportCSV}>
          Import CSV
        </Button>
      </div>

      {/* All caught up state */}
      {showAllCaughtUp && (
        <div className="bg-white border border-slate-200 rounded-lg">
          <EmptyState
            icon={
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            heading="You're all caught up"
            description="All your athletes have been contacted recently. Nice work."
            actionLabel="View All Athletes"
            onAction={() => setFilter('all')}
          />
        </div>
      )}

      {/* Athlete rows */}
      {!showAllCaughtUp && (
        <div className="space-y-2">
          {filtered.map((athlete) => {
            return (
              <div
                key={athlete.id}
                className="bg-white border border-slate-200 rounded-lg flex items-center overflow-hidden hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setDrawerAthlete(athlete)}
              >
                {/* Severity bar */}
                <div
                  className={`w-1 self-stretch ${severityColor[athlete.severity]}`}
                />

                {/* Main content */}
                <div className="flex-1 py-3 px-4 flex items-center justify-between min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800 truncate">
                        {athlete.name}
                      </span>
                      {athlete.is_new_athlete && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {athlete.days_since_last_contact > 0
                        ? `Last contact ${athlete.days_since_last_contact} days ago`
                        : athlete.days_since_last_contact === 0
                          ? 'Contacted today'
                          : 'No contact logged'}
                    </p>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-4 ml-4 shrink-0">
                    {/* Upcoming race badge */}
                    {athlete.upcoming_race && (
                      <Badge variant="race">
                        {athlete.upcoming_race.race_name} —{' '}
                        {Math.ceil(
                          (new Date(athlete.upcoming_race.race_date).getTime() -
                            new Date().getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{' '}
                        days
                      </Badge>
                    )}

                    {/* Days counter */}
                    {athlete.days_since_last_contact === 0 ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium">
                        Today
                      </span>
                    ) : (
                      <div className="text-center w-12 shrink-0">
                        <span
                          className={`text-2xl font-bold ${severityTextColor[athlete.severity]}`}
                        >
                          {athlete.days_since_last_contact}
                        </span>
                        <p className="text-xs text-slate-400">days</p>
                      </div>
                    )}

                    {/* Log Contact button */}
                    <Button
                      variant="secondary"
                      className="text-xs px-3 py-1 shrink-0"
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
