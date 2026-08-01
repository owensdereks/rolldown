import { useState, useEffect, useCallback } from 'react'
import type { Athlete, RaceWithAthletes } from '../../types'
import { getRaces, enrollAthleteInRace, removeAthleteFromRace } from '../../services/api'
import Button from '../ui/Button'
import { ArrowLeft, CalendarDays, MapPin, Plus, Route, UsersRound } from 'lucide-react'

interface RaceDetailPageProps {
  raceId: string
  coachId: string
  allAthletes: Athlete[]
  onBack: () => void
  onRosterChanged: () => void
}

function formatFullDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function daysUntil(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number)
  const race = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((race.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function RaceDetailPage({
  raceId,
  coachId,
  allAthletes,
  onBack,
  onRosterChanged,
}: RaceDetailPageProps) {
  const [race, setRace] = useState<RaceWithAthletes | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAthleteId, setSelectedAthleteId] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchRace = useCallback(async () => {
    setError(null)
    try {
      const races = await getRaces(coachId)
      const found = races.find(r => r.id === raceId) ?? null
      setRace(found)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load race')
    } finally {
      setLoading(false)
    }
  }, [raceId, coachId])

  useEffect(() => {
    fetchRace()
  }, [fetchRace])

  const handleRemove = async (athleteId: string) => {
    setRemoving(athleteId)
    try {
      await removeAthleteFromRace(athleteId, raceId)
      await fetchRace()
      onRosterChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove athlete')
    } finally {
      setRemoving(null)
    }
  }

  const handleAdd = async () => {
    if (!selectedAthleteId || !race) return
    setAdding(true)
    try {
      await enrollAthleteInRace(coachId, selectedAthleteId, race.name, race.date, {
        location: race.location ?? undefined,
        distance: race.distance ?? undefined,
      })
      setSelectedAthleteId('')
      await fetchRace()
      onRosterChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add athlete')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse max-w-2xl">
        <div className="h-4 w-20 bg-surface rounded" />
        <div className="h-10 w-72 bg-surface rounded" />
        <div className="h-4 w-48 bg-surface rounded" />
        <div className="mt-8 space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-surface rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!race) {
    return (
      <div>
        <button
          onClick={onBack}
          className="mb-6 flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-ink-muted transition-colors hover:bg-elevated hover:text-ink"
        >
          <ArrowLeft aria-hidden="true" size={16} /> Back
        </button>
        <p className="text-sm text-ink-dim">
          {error ? 'The race could not be loaded.' : 'Race not found.'}
        </p>
        {error && <p className="mt-2 break-words text-xs text-signal-red">{error}</p>}
        {error && (
          <button onClick={() => void fetchRace()} className="mt-4 min-h-11 text-sm font-medium text-accent">
            Try again
          </button>
        )}
      </div>
    )
  }

  const days = daysUntil(race.date)
  const enrolledIds = new Set(race.athletes.map(a => a.id))
  const unenrolled = allAthletes.filter(a => !enrolledIds.has(a.id))

  return (
    <div className="max-w-3xl">

      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-signal-red/20 bg-signal-red/[0.07] px-4 py-3 text-sm text-signal-red">
          {error}
        </div>
      )}

      {/* Race header */}
      <div className="page-header">
        <div>
          <div className="mb-2 flex items-center gap-2.5 text-ink-muted">
            <CalendarDays aria-hidden="true" size={17} strokeWidth={1.8} />
            <span className="page-eyebrow">Race details</span>
          </div>
        <h1 className="page-title">
          {race.name}
        </h1>
        <p className="mt-2 text-sm text-ink-dim">{formatFullDate(race.date)}</p>
        <p className="mt-0.5 text-xs tabular-nums text-ink-muted">
          {days > 0
            ? `in ${days} days`
            : days === 0
              ? 'today'
              : `${Math.abs(days)} days ago`}
        </p>
        {(race.distance || race.location) && (
          <div className="mt-3 flex flex-wrap items-center gap-4">
            {race.distance && (
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-dim">
                <Route aria-hidden="true" size={14} /> {race.distance}
              </span>
            )}
            {race.location && (
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-dim">
                <MapPin aria-hidden="true" size={14} /> {race.location}
              </span>
            )}
          </div>
        )}
        </div>
        <Button variant="secondary" onClick={onBack} icon={<ArrowLeft aria-hidden="true" size={16} />}>Back</Button>
      </div>

      {/* Athletes enrolled */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2.5">
          <UsersRound aria-hidden="true" className="text-ink-muted" size={17} />
          <h2 className="section-title">Athletes in this race</h2>
        </div>
        {race.athletes.length === 0 ? (
          <p className="py-4 text-sm text-ink-muted">No athletes enrolled yet.</p>
        ) : (
          <div className="panel overflow-hidden">
            {race.athletes.map(athlete => (
              <div
                key={athlete.id}
                className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 last:border-0"
              >
                <span className="text-sm font-semibold text-ink">{athlete.name}</span>
                <Button
                  variant="secondary"
                  className="text-xs px-3 py-1.5"
                  onClick={() => handleRemove(athlete.id)}
                  disabled={removing === athlete.id}
                >
                  {removing === athlete.id ? 'Removing…' : 'Remove'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add athlete */}
      {unenrolled.length > 0 && (
        <div>
          <h2 className="section-title mb-3">
            Add athlete
          </h2>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedAthleteId}
              onChange={e => setSelectedAthleteId(e.target.value)}
              className="min-h-11 flex-1 rounded-[10px] border border-border bg-elevated px-3.5 py-2.5 text-sm text-ink transition-colors hover:border-ink/25 focus:border-accent/60"
            >
              <option value="">Select an athlete…</option>
              {unenrolled.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <Button
              onClick={handleAdd}
              disabled={!selectedAthleteId || adding}
              icon={!adding ? <Plus aria-hidden="true" size={16} /> : undefined}
            >
              {adding ? 'Adding…' : 'Add'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
