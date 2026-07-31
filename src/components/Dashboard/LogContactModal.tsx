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

const CONTACT_TYPE_ICONS: Record<ContactLog['contact_type'], string> = {
  text: '💬',
  email: '✉️',
  call: '📞',
  other: '···',
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
      <div className="mb-5">
        <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-1">
          Log Contact
        </p>
        <h3 className="font-display font-black text-2xl text-ink uppercase tracking-wide">
          {athlete.name}
        </h3>
      </div>

      {/* Contact type */}
      <div className="mb-5">
        <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-2.5">
          Method
        </p>
        <div className="grid grid-cols-4 gap-2">
          {CONTACT_TYPES.map((type) => (
            <button
              key={type}
              className={`py-3 rounded-xl text-xs font-medium transition-all duration-150 flex flex-col items-center gap-1.5 ${
                contactType === type
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : 'bg-surface border border-border text-ink-dim hover:border-white/15 hover:text-ink'
              }`}
              onClick={() => setContactType(type)}
            >
              <span className="text-base leading-none">{CONTACT_TYPE_ICONS[type]}</span>
              <span className="font-mono text-[10px] uppercase tracking-widest">
                {CONTACT_TYPE_LABELS[type]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-5">
        <Textarea
          label="Notes"
          id="contact-notes"
          placeholder="What did you discuss? (optional)"
          rows={3}
          value={notes}
          maxLength={MAX_NOTES}
          onChange={(e) => setNotes(e.target.value)}
        />
        <p className="font-mono text-[10px] text-ink-muted text-right mt-1.5">
          {notes.length}/{MAX_NOTES}
        </p>
      </div>

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
