import { useState, useEffect } from 'react'
import {
  getAthlete,
  getAthleteRaces,
  updateAthlete,
  createRace,
  updateRace,
  deleteRace,
  archiveAthlete,
} from '../../services/api'
import type { AthleteRace } from '../../types'
import Button from '../ui/Button'
import { Input, Textarea } from '../ui/Input'
import Modal from '../ui/Modal'

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

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [coachingStartDate, setCoachingStartDate] = useState('')
  const [raceName, setRaceName] = useState('')
  const [raceDate, setRaceDate] = useState('')
  const [notes, setNotes] = useState('')
  const [existingRace, setExistingRace] = useState<AthleteRace | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [athlete, races] = await Promise.all([
          getAthlete(athleteId),
          getAthleteRaces(athleteId),
        ])
        setName(athlete.name)
        setEmail(athlete.email ?? '')
        setPhone(athlete.phone ?? '')
        setCoachingStartDate(athlete.coaching_start_date)
        setNotes(athlete.notes ?? '')

        if (races.length > 0) {
          setExistingRace(races[0])
          setRaceName(races[0].race_name)
          setRaceDate(races[0].race_date)
        }
      } catch (err) {
        setErrors({
          form:
            err instanceof Error ? err.message : 'Failed to load athlete',
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

    const hasRaceName = raceName.trim().length > 0
    const hasRaceDate = raceDate.length > 0
    if (hasRaceName !== hasRaceDate) {
      newErrors.race = 'Please provide both race name and date'
    }

    if (hasRaceDate) {
      const today = new Date().toISOString().split('T')[0]
      if (raceDate <= today) {
        newErrors.raceDate = 'Race date must be in the future'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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

      const hasRace = raceName.trim() && raceDate
      if (hasRace && !existingRace) {
        await createRace(athleteId, {
          race_name: raceName.trim(),
          race_date: raceDate,
        })
      } else if (hasRace && existingRace) {
        await updateRace(existingRace.id, {
          race_name: raceName.trim(),
          race_date: raceDate,
        })
      } else if (!hasRace && existingRace) {
        await deleteRace(existingRace.id)
      }

      onSave()
    } catch (err) {
      setErrors({
        form:
          err instanceof Error ? err.message : 'Failed to save changes',
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
        form:
          err instanceof Error
            ? err.message
            : 'Failed to archive athlete',
      })
      setShowArchiveModal(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-sm text-slate-500">Loading athlete...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold text-slate-800 mb-6">
        Edit Athlete
      </h2>
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

        <div className="border-t border-slate-200 pt-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-3">
            Upcoming Race
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="race-name"
              label="Race Name"
              value={raceName}
              onChange={(e) => setRaceName(e.target.value)}
              placeholder="e.g., Boston Marathon"
              error={errors.race}
            />
            <Input
              id="race-date"
              label="Race Date"
              type="date"
              value={raceDate}
              onChange={(e) => setRaceDate(e.target.value)}
              error={errors.raceDate}
            />
          </div>
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
          <p className="mt-1 text-xs text-slate-400 text-right">
            {notes.length}/2000
          </p>
        </div>

        {errors.form && (
          <p className="text-sm text-red-500">{errors.form}</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        <div className="border-t border-slate-200 pt-4 mt-6">
          <Button
            variant="danger"
            type="button"
            onClick={() => setShowArchiveModal(true)}
          >
            Archive Athlete
          </Button>
        </div>
      </form>

      <Modal
        open={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
      >
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          Archive {name}?
        </h3>
        <p className="text-sm text-slate-600 mb-6">
          They'll be removed from your priority list.
        </p>
        <div className="flex items-center gap-3">
          <Button variant="danger" onClick={handleArchive}>
            Archive
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowArchiveModal(false)}
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  )
}
