import { useState } from 'react'
import type { ReactNode } from 'react'
import type { AthleteWithPriority, ContactLog } from '../../types'
import { createContactLog } from '../../services/api'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Textarea } from '../ui/Input'
import { MessageCircle, Phone, Video } from 'lucide-react'

interface LogContactModalProps {
  athlete: AthleteWithPriority
  coachId: string
  onClose: () => void
  onSaved: () => Promise<void>
}

type LoggableContactType = Extract<ContactLog['contact_type'], 'text' | 'call' | 'video'>

const CONTACT_TYPES: LoggableContactType[] = ['text', 'call', 'video']

const CONTACT_TYPE_LABELS: Record<ContactLog['contact_type'], string> = {
  text: 'Text',
  call: 'Call',
  video: 'Video',
  unknown: 'Unknown',
  email: 'Legacy email',
  other: 'Unknown method',
}

const CONTACT_TYPE_ICONS: Record<LoggableContactType, ReactNode> = {
  text: <MessageCircle aria-hidden="true" size={18} strokeWidth={1.7} />,
  call: <Phone aria-hidden="true" size={18} strokeWidth={1.7} />,
  video: <Video aria-hidden="true" size={18} strokeWidth={1.7} />,
}

const MAX_NOTES = 500

export default function LogContactModal({
  athlete,
  coachId,
  onClose,
  onSaved,
}: LogContactModalProps) {
  const [contactType, setContactType] = useState<LoggableContactType>('text')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      await createContactLog({
        athlete_id: athlete.id,
        coach_id: coachId,
        contact_type: contactType,
        notes: notes.trim() || null,
      })
      await onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log conversation')
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose}>
      <div className="mb-5">
        <p className="page-eyebrow mb-1">
          Log conversation
        </p>
        <h3 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
          {athlete.name}
        </h3>
      </div>

      {/* Contact type */}
      <div className="mb-5">
        <p className="section-label mb-2.5">
          Method
        </p>
        <div className="grid grid-cols-3 gap-2">
          {CONTACT_TYPES.map((type) => (
            <button
              key={type}
              className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border py-3 text-xs font-medium transition-colors duration-150 ${
                contactType === type
                  ? 'border-accent/30 bg-accent/10 text-accent'
                  : 'border-white/[0.07] bg-surface text-ink-dim hover:border-white/[0.13] hover:text-ink'
              }`}
              onClick={() => setContactType(type)}
            >
              <span>{CONTACT_TYPE_ICONS[type]}</span>
              <span className="text-xs">
                {CONTACT_TYPE_LABELS[type]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-xs text-signal-red">
          {error}
        </p>
      )}

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
        <p className="mt-1.5 text-right text-xs tabular-nums text-ink-muted">
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
