import { useState, useEffect } from 'react'
import type { RaceWithAthletes } from '../../types'
import { getRaces } from '../../services/api'
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

interface RaceCalendarProps {
  coachId: string
  onViewRace: (raceId: string) => void
  onBack: () => void
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Returns a 2D array of weeks; null cells are padding from adjacent months
function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1)
  // Convert Sunday-based (0) to Monday-based (0): Sun→6, Mon→0, etc.
  let leadingBlanks = firstDay.getDay() - 1
  if (leadingBlanks < 0) leadingBlanks = 6

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []

  for (let i = 0; i < leadingBlanks; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function RaceCalendar({ coachId, onViewRace, onBack }: RaceCalendarProps) {
  const todayRaw = new Date()
  todayRaw.setHours(0, 0, 0, 0)
  const todayKey = toDateKey(todayRaw)

  const [year, setYear] = useState(todayRaw.getFullYear())
  const [month, setMonth] = useState(todayRaw.getMonth())
  const [races, setRaces] = useState<RaceWithAthletes[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRaces = () => {
    setLoading(true)
    setError(null)
    getRaces(coachId)
      .then(setRaces)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unable to load races')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadRaces()
    // loadRaces is deliberately scoped to the current coach.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachId])

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const racesByDate = new Map<string, RaceWithAthletes[]>()
  for (const race of races) {
    if (!racesByDate.has(race.date)) racesByDate.set(race.date, [])
    racesByDate.get(race.date)!.push(race)
  }

  const weeks = buildMonthGrid(year, month)
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="mb-2 flex items-center gap-2.5 text-ink-muted">
            <CalendarDays aria-hidden="true" size={17} strokeWidth={1.8} />
            <span className="page-eyebrow">Race calendar</span>
          </div>
          <h2 className="page-title">{monthLabel}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="mr-1 flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-ink-dim transition-colors hover:bg-white/[0.05] hover:text-ink">
            <ArrowLeft aria-hidden="true" size={16} /> Back
          </button>
          <button
            onClick={prevMonth}
            className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-white/[0.08] bg-elevated text-ink-dim transition-colors hover:border-white/[0.14] hover:text-ink"
            aria-label="Previous month"
          >
            <ChevronLeft aria-hidden="true" size={18} />
          </button>
          <button
            onClick={nextMonth}
            className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-white/[0.08] bg-elevated text-ink-dim transition-colors hover:border-white/[0.14] hover:text-ink"
            aria-label="Next month"
          >
            <ChevronRight aria-hidden="true" size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <p className="animate-pulse text-sm text-ink-muted">
            Loading races…
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-signal-red/30 bg-surface p-8 text-center">
          <p className="text-sm text-ink-dim">The race calendar could not be loaded.</p>
          <p className="mt-2 break-words text-xs text-signal-red">{error}</p>
          <button onClick={loadRaces} className="mt-4 min-h-11 text-sm font-medium text-accent">
            Try again
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-surface">
          {/* Day-of-week header */}
          <div className="grid grid-cols-7 border-b border-white/[0.07] bg-elevated/50">
            {DAY_LABELS.map(label => (
              <div
                key={label}
                className="border-r border-white/[0.06] py-2.5 text-center text-[11px] font-medium text-ink-muted last:border-r-0"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Week rows */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-white/[0.06] last:border-b-0">
              {week.map((day, di) => {
                if (!day) {
                  return (
                    <div
                      key={di}
                      className="min-h-[92px] border-r border-white/[0.06] bg-bg/25 p-2 last:border-r-0"
                    />
                  )
                }

                const key = toDateKey(day)
                const isToday = key === todayKey
                const dayRaces = racesByDate.get(key) ?? []
                const isCurrentMonth = day.getMonth() === month

                return (
                  <div
                    key={di}
                    className={[
                      'min-h-[92px] border-r border-white/[0.06] p-2 last:border-r-0',
                      isToday ? 'bg-accent/[0.055]' : '',
                      !isCurrentMonth ? 'opacity-30' : '',
                    ].join(' ')}
                  >
                    <span
                      className={`mb-2 block text-xs tabular-nums leading-none ${
                        isToday ? 'text-accent font-semibold' : 'text-ink-muted'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    <div className="space-y-0.5">
                      {dayRaces.map(race => (
                        <button
                          key={race.id}
                          onClick={() => onViewRace(race.id)}
                          title={race.name}
                          className="w-full truncate rounded-md border border-accent/15 bg-accent/[0.08] px-1.5 py-1 text-left text-[10px] text-accent transition-colors hover:bg-accent/[0.13]"
                        >
                          {race.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
