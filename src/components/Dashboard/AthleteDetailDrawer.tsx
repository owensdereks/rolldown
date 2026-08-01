import { useState, useEffect, useRef, useCallback } from 'react'
import type { Athlete, Race, AthleteWithPriority, ContactLog } from '../../types'
import { getAthlete, getContactLogs, getAthleteRaces, updateAthlete, removeAthleteFromRace } from '../../services/api'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { Textarea } from '../ui/Input'
import EmptyState from '../ui/EmptyState'
import LogContactModal from './LogContactModal'
import { dateOnlyToLocalDate, daysUntilDate } from '../../lib/dates'
import { MessageSquare, Pencil, Trash2, X } from 'lucide-react'

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
        className={`fixed inset-y-0 right-0 z-40 flex w-full flex-col transition-transform duration-200 ease-out sm:max-w-[500px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          backgroundColor: '#12161B',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '-24px 0 70px rgba(0,0,0,0.38)',
        }}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-white/[0.07] px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="page-eyebrow mb-1">Athlete profile</p>
              <h2 className="truncate text-2xl font-semibold tracking-[-0.03em] text-ink">
                {priorityAthlete.name}
              </h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {severityBadge}
                {raceBadge}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-white/[0.05] hover:text-ink"
              aria-label="Close drawer"
            >
              <X aria-hidden="true" size={19} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6 sm:px-6">
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
                <div className="grid grid-cols-2 gap-x-5 gap-y-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div>
                    <p className="section-label mb-1">
                      Email
                    </p>
                    <p className="text-sm text-ink-dim truncate">{athleteData?.email || '—'}</p>
                  </div>
                  <div>
                    <p className="section-label mb-1">
                      Phone
                    </p>
                    <p className="text-sm text-ink-dim">{athleteData?.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="section-label mb-1">
                      Coaching since
                    </p>
                    <p className="text-sm text-ink-dim">
                      {athleteData ? formatCoachingSince(athleteData.coaching_start_date) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="section-label mb-1">
                      Tenure
                    </p>
                    {tenureDays <= 90 ? (
                      <span className="inline-flex items-center rounded-full border border-accent/15 bg-accent/10 px-2 py-1 text-[11px] font-medium text-accent">
                        New
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-white/[0.07] bg-white/[0.035] px-2 py-1 text-[11px] font-medium text-ink-dim">
                        Tenured
                      </span>
                    )}
                  </div>
                </div>

                {/* Races list */}
                {races.length > 0 && (
                  <div>
                    <p className="section-label mb-2">
                      Races
                    </p>
                    <div className="space-y-2">
                      {races.map((race) => {
                        const daysAway = daysUntilDate(race.date)
                        return (
                          <div
                            key={race.id}
                            className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-1 py-3 last:border-0"
                          >
                            <div>
                              <p className="text-sm font-semibold text-ink">{race.name}</p>
                              <p className="mt-0.5 text-xs text-ink-muted">
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
                              className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs text-ink-muted transition-colors hover:bg-signal-red/10 hover:text-signal-red"
                            >
                              <Trash2 aria-hidden="true" size={14} /> Remove
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
                  <p className="section-label">
                    Notes
                  </p>
                  {savedNotice && (
                    <span className="text-xs font-medium text-signal-green">
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
                <p className="mt-1.5 text-right text-xs tabular-nums text-ink-muted">
                  {notes.length}/{MAX_NOTES}
                </p>
              </div>

              {/* Conversation History */}
              <div>
                <p className="section-label mb-3">
                  Conversation history
                </p>

                {contactLogs.length === 0 ? (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.015]">
                    <EmptyState
                      heading="No conversations yet"
                      description="Log your first conversation with this athlete to start tracking communication."
                      actionLabel="Log conversation"
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
                          className="flex items-start gap-3 border-b border-white/[0.06] py-3 last:border-0"
                        >
                          {/* Type indicator */}
                          <div className="flex flex-col items-center pt-1.5 shrink-0">
                            <div
                              className={`w-2 h-2 rounded-full ${CONTACT_TYPE_COLORS[log.contact_type]}`}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-ink-muted">
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
                          <p className="shrink-0 pt-0.5 text-xs tabular-nums text-ink-muted">
                            {formatRelativeDate(log.contacted_at)}
                          </p>
                        </div>
                      )
                    })}

                    {hasMoreLogs && !showAllLogs && (
                      <button
                        className="w-full py-3 text-center text-xs font-semibold text-accent transition-colors hover:text-ink"
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
          className="shrink-0 border-t border-white/[0.07] px-5 py-4 sm:px-6"
          style={{ backgroundColor: '#12161B' }}
        >
          <Button
            className="w-full"
            icon={<MessageSquare aria-hidden="true" size={17} />}
            onClick={() => setContactModalOpen(true)}
          >
            Log conversation
          </Button>
          <button
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-ink-dim transition-colors hover:bg-white/[0.04] hover:text-ink"
            onClick={() => onEditAthlete(athleteId)}
          >
            <Pencil aria-hidden="true" size={15} /> Edit athlete
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
