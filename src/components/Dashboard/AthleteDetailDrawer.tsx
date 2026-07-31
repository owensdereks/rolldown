import { useState, useEffect, useRef, useCallback } from 'react'
import type { Athlete, Race, AthleteWithPriority, ContactLog } from '../../types'
import { getAthlete, getContactLogs, getAthleteRaces, updateAthlete, removeAthleteFromRace } from '../../services/api'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { Textarea } from '../ui/Input'
import EmptyState from '../ui/EmptyState'
import LogContactModal from './LogContactModal'
import { dateOnlyToLocalDate, daysUntilDate } from '../../lib/dates'

interface AthleteDetailDrawerProps {
  athleteId: string
  athlete: AthleteWithPriority
  coachId: string
  onClose: () => void
  onEditAthlete: (athleteId: string) => void
  onRefresh: () => Promise<void>
}

const CONTACT_TYPE_COLORS: Record<ContactLog['contact_type'], string> = {
  text: 'bg-accent',
  call: 'bg-signal-green',
  video: 'bg-signal-purple',
  unknown: 'bg-ink-muted',
  email: 'bg-ink-muted',
  other: 'bg-ink-muted',
}

const CONTACT_TYPE_LABELS: Record<ContactLog['contact_type'], string> = {
  text: 'Text',
  call: 'Call',
  video: 'Video',
  unknown: 'Unknown method',
  email: 'Legacy email',
  other: 'Unknown method',
}

const MAX_NOTES = 2000
const INITIAL_LOG_COUNT = 10

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor(
    (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 14) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatCoachingSince(dateStr: string): string {
  const date = dateOnlyToLocalDate(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function AthleteDetailDrawer({
  athleteId,
  athlete: priorityAthlete,
  coachId,
  onClose,
  onEditAthlete,
  onRefresh,
}: AthleteDetailDrawerProps) {
  const [athleteData, setAthleteData] = useState<Athlete | null>(null)
  const [contactLogs, setContactLogs] = useState<ContactLog[]>([])
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [savedNotice, setSavedNotice] = useState(false)
  const [showAllLogs, setShowAllLogs] = useState(false)
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set())
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const drawerRef = useRef<HTMLDivElement>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setTimeout(onClose, 300)
  }, [onClose])

  // Animate in on mount
  useEffect(() => {
    requestAnimationFrame(() => setIsOpen(true))
  }, [])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Fetch data
  const loadData = useCallback(async () => {
    try {
      const [athlete, logs, raceData] = await Promise.all([
        getAthlete(athleteId),
        getContactLogs(athleteId),
        getAthleteRaces(athleteId),
      ])
      setAthleteData(athlete)
      setContactLogs(logs)
      setRaces(raceData)
      setNotes(athlete.notes ?? '')
    } catch (err) {
      console.error('Failed to load athlete details:', err)
    } finally {
      setLoading(false)
    }
  }, [athleteId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !contactModalOpen) {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [contactModalOpen, handleClose])

  // Focus trap
  useEffect(() => {
    if (!drawerRef.current || contactModalOpen) return

    const drawer = drawerRef.current
    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = drawer.querySelectorAll<HTMLElement>(focusableSelector)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [contactModalOpen, loading])

  // Auto-save notes on blur
  const handleNotesSave = async () => {
    if (!athleteData) return
    const trimmed = notes.trim()
    if (trimmed === (athleteData.notes ?? '')) return

    try {
      await updateAthlete(athleteId, { notes: trimmed || null })
      setAthleteData((prev) => (prev ? { ...prev, notes: trimmed || null } : prev))
      setSavedNotice(true)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => setSavedNotice(false), 2000)
    } catch (err) {
      console.error('Failed to save notes:', err)
    }
  }

  const handleContactSaved = async () => {
    setContactModalOpen(false)
    await Promise.all([loadData(), onRefresh()])
  }

  const handleRemoveRace = async (raceId: string) => {
    try {
      await removeAthleteFromRace(athleteId, raceId)
      await loadData()
    } catch (err) {
      console.error('Failed to remove race:', err)
    }
  }

  const toggleLogExpand = (logId: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev)
      if (next.has(logId)) next.delete(logId)
      else next.add(logId)
      return next
    })
  }

  // Severity badge
  const severityBadge = (() => {
    switch (priorityAthlete.severity) {
      case 'red':
        return <Badge variant="red">Overdue</Badge>
      case 'yellow':
        return <Badge variant="amber">Due Soon</Badge>
      case 'green':
        return <Badge variant="emerald">Healthy</Badge>
    }
  })()

  // Race badge
  const raceBadge = (() => {
    if (!priorityAthlete.upcoming_race) return null
    const daysAway = daysUntilDate(priorityAthlete.upcoming_race.date)
    return (
      <Badge variant="race">
        {priorityAthlete.upcoming_race.name} — {daysAway}d
      </Badge>
    )
  })()

  // Tenure
  const tenureDays = athleteData
    ? -daysUntilDate(athleteData.coaching_start_date)
    : 0

  const displayedLogs = showAllLogs ? contactLogs : contactLogs.slice(0, INITIAL_LOG_COUNT)
  const hasMoreLogs = contactLogs.length > INITIAL_LOG_COUNT

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${priorityAthlete.name}`}
        className={`fixed inset-y-0 right-0 z-40 w-full sm:max-w-md flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          backgroundColor: '#0D1117',
          borderLeft: '1px solid #1E2A3A',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div className="border-b border-border px-6 py-5 shrink-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <h2 className="font-display font-black text-3xl text-ink uppercase tracking-wide truncate">
                {priorityAthlete.name}
              </h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {severityBadge}
                {raceBadge}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-ink-muted hover:text-ink transition-colors ml-4 shrink-0 mt-1"
              aria-label="Close drawer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 w-48 bg-elevated rounded" />
              <div className="h-4 w-32 bg-elevated rounded" />
              <div className="h-20 bg-elevated rounded-lg" />
              <div className="h-4 w-40 bg-elevated rounded" />
              <div className="h-32 bg-elevated rounded-lg" />
            </div>
          ) : (
            <>
              {/* Quick Info Grid */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-elevated border border-border rounded-lg px-3 py-2.5">
                    <p className="font-mono text-[9px] text-ink-muted uppercase tracking-widest mb-1">
                      Email
                    </p>
                    <p className="text-sm text-ink-dim truncate">{athleteData?.email || '—'}</p>
                  </div>
                  <div className="bg-elevated border border-border rounded-lg px-3 py-2.5">
                    <p className="font-mono text-[9px] text-ink-muted uppercase tracking-widest mb-1">
                      Phone
                    </p>
                    <p className="text-sm text-ink-dim">{athleteData?.phone || '—'}</p>
                  </div>
                  <div className="bg-elevated border border-border rounded-lg px-3 py-2.5">
                    <p className="font-mono text-[9px] text-ink-muted uppercase tracking-widest mb-1">
                      Coaching Since
                    </p>
                    <p className="text-sm text-ink-dim">
                      {athleteData ? formatCoachingSince(athleteData.coaching_start_date) : '—'}
                    </p>
                  </div>
                  <div className="bg-elevated border border-border rounded-lg px-3 py-2.5">
                    <p className="font-mono text-[9px] text-ink-muted uppercase tracking-widest mb-1">
                      Tenure
                    </p>
                    {tenureDays <= 90 ? (
                      <span className="inline-flex items-center rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 font-mono text-[9px] font-medium text-accent uppercase tracking-widest">
                        New
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-ink-muted/20 border border-ink-muted/30 px-2 py-0.5 font-mono text-[9px] font-medium text-ink-dim uppercase tracking-widest">
                        Tenured
                      </span>
                    )}
                  </div>
                </div>

                {/* Races list */}
                {races.length > 0 && (
                  <div>
                    <p className="font-mono text-[9px] text-signal-purple/70 uppercase tracking-widest mb-2">
                      Races
                    </p>
                    <div className="space-y-2">
                      {races.map((race) => {
                        const daysAway = daysUntilDate(race.date)
                        return (
                          <div
                            key={race.id}
                            className="bg-signal-purple/5 border border-signal-purple/20 rounded-lg px-4 py-3 flex items-start justify-between gap-3"
                          >
                            <div>
                              <p className="text-sm font-semibold text-ink">{race.name}</p>
                              <p className="font-mono text-xs text-signal-purple mt-0.5">
                                {dateOnlyToLocalDate(race.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}{' '}
                                — in {daysAway} days
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveRace(race.id)}
                              className="font-mono text-[10px] text-ink-muted hover:text-signal-red uppercase tracking-widest transition-colors shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
                    Notes
                  </p>
                  {savedNotice && (
                    <span className="font-mono text-[10px] text-signal-green uppercase tracking-widest">
                      Saved
                    </span>
                  )}
                </div>
                <Textarea
                  id="athlete-notes"
                  placeholder="Add notes about this athlete..."
                  rows={4}
                  value={notes}
                  maxLength={MAX_NOTES}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleNotesSave}
                />
                <p className="font-mono text-[10px] text-ink-muted text-right mt-1.5">
                  {notes.length}/{MAX_NOTES}
                </p>
              </div>

              {/* Conversation History */}
              <div>
                <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-3">
                  Conversation History
                </p>

                {contactLogs.length === 0 ? (
                  <div className="bg-surface border border-border rounded-xl">
                    <EmptyState
                      heading="No Conversations Yet"
                      description="Log your first conversation with this athlete to start tracking communication."
                      actionLabel="Log Conversation"
                      onAction={() => setContactModalOpen(true)}
                    />
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {displayedLogs.map((log) => {
                      const isExpanded = expandedLogIds.has(log.id)
                      return (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0"
                        >
                          {/* Type indicator */}
                          <div className="flex flex-col items-center pt-1.5 shrink-0">
                            <div
                              className={`w-2 h-2 rounded-full ${CONTACT_TYPE_COLORS[log.contact_type]}`}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
                              {CONTACT_TYPE_LABELS[log.contact_type]}
                            </p>
                            {log.notes ? (
                              <p
                                className={`text-sm text-ink-dim mt-0.5 leading-relaxed ${
                                  !isExpanded ? 'line-clamp-2' : ''
                                } ${log.notes.length > 80 ? 'cursor-pointer' : ''}`}
                                onClick={() => {
                                  if (log.notes && log.notes.length > 80)
                                    toggleLogExpand(log.id)
                                }}
                              >
                                {log.notes}
                              </p>
                            ) : (
                              <p className="text-xs text-ink-muted italic mt-0.5">No notes</p>
                            )}
                          </div>

                          {/* Date */}
                          <p className="font-mono text-[10px] text-ink-muted shrink-0 pt-0.5 uppercase tracking-widest">
                            {formatRelativeDate(log.contacted_at)}
                          </p>
                        </div>
                      )
                    })}

                    {hasMoreLogs && !showAllLogs && (
                      <button
                        className="w-full text-center font-mono text-[10px] text-accent hover:text-accent/80 uppercase tracking-widest py-2.5 transition-colors"
                        onClick={() => setShowAllLogs(true)}
                      >
                        Show more ({contactLogs.length - INITIAL_LOG_COUNT} remaining)
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Action Bar */}
        <div
          className="border-t border-border px-6 py-4 shrink-0"
          style={{ backgroundColor: '#0D1117' }}
        >
          <Button
            className="w-full justify-center py-2.5"
            onClick={() => setContactModalOpen(true)}
          >
            Log Conversation
          </Button>
          <button
            className="w-full text-center font-mono text-[11px] text-ink-dim hover:text-ink uppercase tracking-widest font-medium mt-3 transition-colors"
            onClick={() => onEditAthlete(athleteId)}
          >
            Edit Athlete
          </button>
        </div>
      </div>

      {/* Log conversation modal — layered above drawer */}
      {contactModalOpen && (
        <LogContactModal
          athlete={priorityAthlete}
          coachId={coachId}
          onClose={() => setContactModalOpen(false)}
          onSaved={handleContactSaved}
        />
      )}
    </>
  )
}
