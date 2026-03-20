import { useState } from 'react'
import type { AthleteWithPriority, ContactLog } from '../../types'
import { createContactLog } from '../../services/api'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Textarea } from '../ui/Input'

interface LogContactModalProps {
  athlete: AthleteWithPriority
  coachId: string
  onClose: () => void
  onSaved: () => Promise<void>
}

const CONTACT_TYPES: ContactLog['contact_type'][] = ['text', 'email', 'call', 'other']

const CONTACT_TYPE_LABELS: Record<ContactLog['contact_type'], string> = {
  text: 'Text',
  email: 'Email',
  call: 'Call',
  other: 'Other',
}

const MAX_NOTES = 500

export default function LogContactModal({
  athlete,
  coachId,
  onClose,
  onSaved,
}: LogContactModalProps) {
  const [contactType, setContactType] = useState<ContactLog['contact_type']>('text')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await createContactLog({
        athlete_id: athlete.id,
        coach_id: coachId,
        contact_type: contactType,
        notes: notes.trim() || null,
      })
      await onSaved()
    } catch (err) {
      console.error('Failed to log contact:', err)
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose}>
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        Log Contact with {athlete.name}
      </h3>

      {/* Contact type pills */}
      <div className="mb-4">
        <p className="block text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">
          Contact Type
        </p>
        <div className="flex gap-2">
          {CONTACT_TYPES.map((type) => (
            <button
              key={type}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                contactType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => setContactType(type)}
            >
              {CONTACT_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <Textarea
          label="Notes"
          id="contact-notes"
          placeholder="What did you discuss? (optional)"
          rows={3}
          value={notes}
          maxLength={MAX_NOTES}
          onChange={(e) => setNotes(e.target.value)}
        />
        <p className="text-xs text-slate-400 text-right mt-1">
          {notes.length}/{MAX_NOTES}
        </p>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </Modal>
  )
}
