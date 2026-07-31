import { useState, useEffect } from 'react'
import {
  getAthlete,
  getAthleteRaces,
  updateAthlete,
  enrollAthleteInRace,
  removeAthleteFromRace,
  archiveAthlete,
} from '../../services/api'
import type { Race } from '../../types'
import { useAuth } from '../../contexts/auth'
import Button from '../ui/Button'
import { Input, Textarea } from '../ui/Input'
import Modal from '../ui/Modal'
import { dateOnlyToLocalDate, localDateKey } from '../../lib/dates'

interface EditAthleteFormProps {
  athleteId: string
  onCancel: () => void
  onSave: () => void
  onArchive: () => void
}

export default function EditAthleteForm({
  athleteId,
  onCancel,
  onSave,
  onArchive,
}: EditAthleteFormProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showArchiveModal, setShowArchiveModal] = useState(false)

  const { user } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [coachingStartDate, setCoachingStartDate] = useState('')
  const [notes, setNotes] = useState('')

  const [races, setRaces] = useState<Race[]>([])
  const [newRaceName, setNewRaceName] = useState('')
  const [newRaceDate, setNewRaceDate] = useState('')
  const [raceError, setRaceError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [athlete, raceList] = await Promise.all([
          getAthlete(athleteId),
          getAthleteRaces(athleteId),
        ])
        setName(athlete.name)
        setEmail(athlete.email ?? '')
        setPhone(athlete.phone ?? '')
        setCoachingStartDate(athlete.coaching_start_date)
        setNotes(athlete.notes ?? '')
        setRaces(raceList)
      } catch (err) {
        setErrors({
          form: err instanceof Error ? err.message : 'Failed to load athlete',
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [athleteId])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddRace = async () => {
    setRaceError(null)
    if (!newRaceName.trim() || !newRaceDate) {
      setRaceError('Both race name and date are required')
      return
    }
    const today = localDateKey()
    if (newRaceDate <= today) {
      setRaceError('Race date must be in the future')
      return
    }
    if (!user) return
    try {
      await enrollAthleteInRace(user.id, athleteId, newRaceName.trim(), newRaceDate)
      const updated = await getAthleteRaces(athleteId)
      setRaces(updated)
      setNewRaceName('')
      setNewRaceDate('')
    } catch (err) {
      setRaceError(err instanceof Error ? err.message : 'Failed to add race')
    }
  }

  const handleRemoveRace = async (race: Race) => {
    try {
      await removeAthleteFromRace(athleteId, race.id)
      const updated = await getAthleteRaces(athleteId)
      setRaces(updated)
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Failed to remove race' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      await updateAthlete(athleteId, {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        coaching_start_date: coachingStartDate,
        notes: notes.trim() || null,
      })
      onSave()
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Failed to save changes',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    try {
      await archiveAthlete(athleteId)
      onArchive()
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Failed to archive athlete',
      })
      setShowArchiveModal(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-surface rounded-md" />
          <div className="h-10 w-full bg-surface rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-surface rounded-lg" />
            <div className="h-10 bg-surface rounded-lg" />
          </div>
          <div className="h-10 bg-surface rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-1">
          Edit Athlete
        </p>
        <h2 className="font-display font-black text-3xl text-ink uppercase tracking-wide">
          {name || 'Edit Athlete'}
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="name"
          label="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Athlete name"
          error={errors.name}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="athlete@example.com"
          />
          <Input
            id="phone"
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>

        <Input
          id="coaching-start-date"
          label="Coaching Start Date"
          type="date"
          value={coachingStartDate}
          onChange={(e) => setCoachingStartDate(e.target.value)}
        />

        <div className="border-t border-border pt-4">
          <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-3">
            Races
          </p>
          {races.length > 0 && (
            <div className="space-y-2 mb-3">
              {races.map((race) => (
                <div
                  key={race.id}
                  className="flex items-center justify-between bg-elevated border border-border rounded-lg px-3 py-2"
                >
                  <div>
                    <p className="text-sm text-ink">{race.name}</p>
                    <p className="font-mono text-[10px] text-ink-muted mt-0.5">
                      {dateOnlyToLocalDate(race.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRace(race)}
                    className="font-mono text-[10px] text-ink-muted hover:text-signal-red uppercase tracking-widest transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="new-race-name"
              label="Race Name"
              value={newRaceName}
              onChange={(e) => setNewRaceName(e.target.value)}
              placeholder="e.g., Boston Marathon"
            />
            <Input
              id="new-race-date"
              label="Race Date"
              type="date"
              value={newRaceDate}
              onChange={(e) => setNewRaceDate(e.target.value)}
            />
          </div>
          {raceError && (
            <p className="font-mono text-[10px] text-signal-red mt-1">{raceError}</p>
          )}
          <button
            type="button"
            onClick={handleAddRace}
            className="mt-2 font-mono text-[10px] text-accent hover:text-accent/80 uppercase tracking-widest transition-colors"
          >
            + Add Race
          </button>
        </div>

        <div>
          <Textarea
            id="notes"
            label="Notes"
            value={notes}
            onChange={(e) => {
              if (e.target.value.length <= 2000) setNotes(e.target.value)
            }}
            placeholder="Any notes about this athlete..."
            rows={3}
          />
          <p className="font-mono text-[10px] text-ink-muted text-right mt-1.5">
            {notes.length}/2000
          </p>
        </div>

        {errors.form && (
          <p className="font-mono text-[10px] text-signal-red">{errors.form}</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        <div className="border-t border-border pt-4 mt-6">
          <Button
            variant="danger"
            type="button"
            onClick={() => setShowArchiveModal(true)}
          >
            Archive Athlete
          </Button>
        </div>
      </form>

      <Modal open={showArchiveModal} onClose={() => setShowArchiveModal(false)}>
        <div className="mb-4">
          <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-1">
            Confirm Archive
          </p>
          <h3 className="font-display font-black text-2xl text-ink uppercase tracking-wide">
            Archive {name}?
          </h3>
        </div>
        <p className="text-sm text-ink-dim mb-6 leading-relaxed">
          They'll be removed from your priority list.
        </p>
        <div className="flex items-center gap-3">
          <Button variant="danger" onClick={handleArchive}>
            Archive
          </Button>
          <Button variant="secondary" onClick={() => setShowArchiveModal(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  )
}
