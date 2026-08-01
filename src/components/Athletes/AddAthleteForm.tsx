import { useState } from 'react'
import { useAuth } from '../../contexts/auth'
import { createAthlete, enrollAthleteInRace } from '../../services/api'
import Button from '../ui/Button'
import { Input, Textarea } from '../ui/Input'
import { localDateKey } from '../../lib/dates'
import { ArrowLeft, Save, UserPlus } from 'lucide-react'

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
    localDateKey()
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
      const today = localDateKey()
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
    <div className="mx-auto max-w-2xl">
      <div className="page-header">
        <div>
          <div className="mb-2 flex items-center gap-2.5 text-ink-muted">
            <UserPlus aria-hidden="true" size={17} strokeWidth={1.8} />
            <span className="page-eyebrow">New athlete</span>
          </div>
          <h2 className="page-title">Add athlete</h2>
          <p className="mt-2 text-sm text-ink-muted">Add contact details and optional race context.</p>
        </div>
        <Button variant="secondary" type="button" onClick={onCancel} icon={<ArrowLeft aria-hidden="true" size={16} />}>
          Back
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="panel space-y-5 p-5 sm:p-6">
        <Input
          id="name"
          label="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Athlete name"
          error={errors.name}
        />

        <div className="grid gap-4 sm:grid-cols-2">
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

        <div className="border-t border-white/[0.07] pt-5">
          <p className="section-label mb-3">
            Upcoming race
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
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
          <p className="mt-1.5 text-right text-xs tabular-nums text-ink-muted">
            {notes.length}/2000
          </p>
        </div>

        {errors.form && (
          <p className="text-xs text-signal-red">{errors.form}</p>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-white/[0.07] pt-5">
          <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={saving} icon={!saving ? <Save aria-hidden="true" size={16} /> : undefined}>
            {saving ? 'Saving…' : 'Save athlete'}
          </Button>
        </div>
      </form>
    </div>
  )
}
