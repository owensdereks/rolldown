import { useState, useEffect } from 'react'
import type { RaceWithAthletes } from '../../types'
import { getRaces } from '../../services/api'

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

  useEffect(() => {
    getRaces(coachId)
      .then(setRaces)
      .catch(console.error)
      .finally(() => setLoading(false))
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
      <button
        onClick={onBack}
        className="font-mono text-xs text-ink-muted hover:text-ink uppercase tracking-widest mb-6 transition-colors"
      >
        ← Back
      </button>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-black text-3xl text-ink uppercase tracking-wide">
          {monthLabel}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="px-3 py-1.5 font-mono text-xs text-ink-dim hover:text-ink border border-border hover:border-white/20 rounded-lg transition-all"
          >
            ← Prev
          </button>
          <button
            onClick={nextMonth}
            className="px-3 py-1.5 font-mono text-xs text-ink-dim hover:text-ink border border-border hover:border-white/20 rounded-lg transition-all"
          >
            Next →
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <p className="font-mono text-xs text-ink-muted animate-pulse uppercase tracking-widest">
            Loading races…
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          {/* Day-of-week header */}
          <div className="grid grid-cols-7 border-b border-border bg-surface">
            {DAY_LABELS.map(label => (
              <div
                key={label}
                className="py-2 text-center font-mono text-[10px] text-ink-muted uppercase tracking-widest border-r border-border last:border-r-0"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Week rows */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-border last:border-b-0">
              {week.map((day, di) => {
                if (!day) {
                  return (
                    <div
                      key={di}
                      className="min-h-[80px] p-1.5 border-r border-border last:border-r-0 bg-bg/40"
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
                      'min-h-[80px] p-1.5 border-r border-border last:border-r-0',
                      isToday ? 'ring-1 ring-inset ring-accent/60 bg-accent/5' : '',
                      !isCurrentMonth ? 'opacity-30' : '',
                    ].join(' ')}
                  >
                    <span
                      className={`font-mono text-[11px] leading-none block mb-1 ${
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
                          className="w-full text-left px-1.5 py-0.5 rounded font-mono text-[9px] bg-signal-purple/20 text-signal-purple hover:bg-signal-purple/35 border border-signal-purple/30 truncate transition-colors"
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
