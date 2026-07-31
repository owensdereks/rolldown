import { useState, useEffect, useCallback } from 'react'
import type { Athlete, RaceWithAthletes } from '../../types'
import { getRaces, enrollAthleteInRace, removeAthleteFromRace } from '../../services/api'
import Button from '../ui/Button'

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

  const fetchRace = useCallback(async () => {
    try {
      const races = await getRaces(coachId)
      const found = races.find(r => r.id === raceId) ?? null
      setRace(found)
    } catch (err) {
      console.error('Failed to load race:', err)
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
      console.error('Failed to remove athlete:', err)
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
      console.error('Failed to add athlete:', err)
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
          className="font-mono text-xs text-ink-muted hover:text-ink uppercase tracking-widest mb-6 transition-colors"
        >
          ← Back
        </button>
        <p className="text-ink-dim font-mono text-sm">Race not found.</p>
      </div>
    )
  }

  const days = daysUntil(race.date)
  const enrolledIds = new Set(race.athletes.map(a => a.id))
  const unenrolled = allAthletes.filter(a => !enrolledIds.has(a.id))

  return (
    <div className="max-w-2xl">
      <button
        onClick={onBack}
        className="font-mono text-xs text-ink-muted hover:text-ink uppercase tracking-widest mb-6 transition-colors"
      >
        ← Back
      </button>

      {/* Race header */}
      <div className="mb-8">
        <h1 className="font-display font-black text-4xl text-ink uppercase tracking-wide leading-none">
          {race.name}
        </h1>
        <p className="font-mono text-sm text-accent mt-2">{formatFullDate(race.date)}</p>
        <p className="font-mono text-xs text-ink-muted mt-0.5">
          {days > 0
            ? `in ${days} days`
            : days === 0
              ? 'today'
              : `${Math.abs(days)} days ago`}
        </p>
        {(race.distance || race.location) && (
          <div className="flex items-center gap-4 mt-3">
            {race.distance && (
              <span className="inline-flex items-center rounded-full bg-elevated border border-border px-2.5 py-0.5 font-mono text-[10px] text-ink-dim uppercase tracking-widest">
                {race.distance}
              </span>
            )}
            {race.location && (
              <span className="font-mono text-xs text-ink-dim">{race.location}</span>
            )}
          </div>
        )}
      </div>

      {/* Athletes enrolled */}
      <div className="mb-8">
        <h2 className="font-display font-black text-xl text-ink uppercase tracking-wide mb-3">
          Athletes in This Race
        </h2>
        {race.athletes.length === 0 ? (
          <p className="font-mono text-xs text-ink-muted py-4">No athletes enrolled yet.</p>
        ) : (
          <div className="space-y-2">
            {race.athletes.map(athlete => (
              <div
                key={athlete.id}
                className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center justify-between"
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
          <h2 className="font-display font-black text-xl text-ink uppercase tracking-wide mb-3">
            Add Athlete
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={selectedAthleteId}
              onChange={e => setSelectedAthleteId(e.target.value)}
              className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent/50 transition-colors"
            >
              <option value="">Select an athlete…</option>
              {unenrolled.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <Button
              onClick={handleAdd}
              disabled={!selectedAthleteId || adding}
            >
              {adding ? 'Adding…' : 'Add'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
