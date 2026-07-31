import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { createAthlete, enrollAthleteInRace } from '../../services/api'
import Button from '../ui/Button'
import { Input, Textarea } from '../ui/Input'

interface AddAthleteFormProps {
  onCancel: () => void
  onSave: () => void
}

export default function AddAthleteForm({
  onCancel,
  onSave,
}: AddAthleteFormProps) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [coachingStartDate, setCoachingStartDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [raceName, setRaceName] = useState('')
  const [raceDate, setRaceDate] = useState('')
  const [notes, setNotes] = useState('')

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
    if (!validate() || !user) return

    setSaving(true)
    try {
      const athlete = await createAthlete({
        coach_id: user.id,
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        coaching_start_date: coachingStartDate,
        notes: notes.trim() || null,
      })

      if (raceName.trim() && raceDate) {
        await enrollAthleteInRace(user.id, athlete.id, raceName.trim(), raceDate)
      }

      onSave()
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Failed to save athlete',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-1">
          New Athlete
        </p>
        <h2 className="font-display font-black text-3xl text-ink uppercase tracking-wide">
          Add Athlete
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
          <p className="font-mono text-[10px] text-ink-muted text-right mt-1.5">
            {notes.length}/2000
          </p>
        </div>

        {errors.form && (
          <p className="font-mono text-[10px] text-signal-red">{errors.form}</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Athlete'}
          </Button>
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
