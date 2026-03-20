import { useState, useEffect, useRef, useCallback } from 'react'
import type { Athlete, AthleteRace, AthleteWithPriority, ContactLog } from '../../types'
import { getAthlete, getContactLogs, getAthleteRaces, updateAthlete } from '../../services/api'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { Textarea } from '../ui/Input'
import EmptyState from '../ui/EmptyState'
import LogContactModal from './LogContactModal'

interface AthleteDetailDrawerProps {
  athleteId: string
  athlete: AthleteWithPriority
  coachId: string
  onClose: () => void
  onEditAthlete: (athleteId: string) => void
  onRefresh: () => Promise<void>
}

const CONTACT_TYPE_COLORS: Record<ContactLog['contact_type'], string> = {
  text: 'bg-blue-400',
  email: 'bg-purple-400',
  call: 'bg-emerald-400',
  other: 'bg-slate-400',
}

const CONTACT_TYPE_LABELS: Record<ContactLog['contact_type'], string> = {
  text: 'Text',
  email: 'Email',
  call: 'Call',
  other: 'Other',
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
  if (diffDays < 14) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatCoachingSince(dateStr: string): string {
  const date = new Date(dateStr)
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
  const [races, setRaces] = useState<AthleteRace[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [savedNotice, setSavedNotice] = useState(false)
  const [showAllLogs, setShowAllLogs] = useState(false)
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set())
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const drawerRef = useRef<HTMLDivElement>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

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
  }, [contactModalOpen])

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

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(onClose, 300)
  }

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
    // Refresh both drawer data and priority list
    await Promise.all([loadData(), onRefresh()])
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

  // Race badge (within 14 days)
  const raceBadge = (() => {
    if (!priorityAthlete.upcoming_race) return null
    const daysAway = Math.ceil(
      (new Date(priorityAthlete.upcoming_race.race_date).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    )
    return (
      <Badge variant="race">
        {priorityAthlete.upcoming_race.race_name} — in {daysAway} day{daysAway !== 1 ? 's' : ''}
      </Badge>
    )
  })()

  // Tenure
  const tenureDays = athleteData
    ? Math.floor(
        (new Date().getTime() - new Date(athleteData.coaching_start_date).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0

  const displayedLogs = showAllLogs ? contactLogs : contactLogs.slice(0, INITIAL_LOG_COUNT)
  const hasMoreLogs = contactLogs.length > INITIAL_LOG_COUNT

  // Find the nearest upcoming race for this athlete (from full race data, not just 14-day window)
  const nextRace = races.length > 0 ? races[0] : null
  const nextRaceDaysAway = nextRace
    ? Math.ceil(
        (new Date(nextRace.race_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : null

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${priorityAthlete.name}`}
        className={`fixed inset-y-0 right-0 z-40 w-full sm:max-w-md bg-white shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4 shrink-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-800 truncate">
                {priorityAthlete.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {severityBadge}
                {raceBadge}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 transition-colors ml-4 shrink-0"
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
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 w-48 bg-slate-200 rounded" />
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-20 bg-slate-100 rounded" />
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-32 bg-slate-100 rounded" />
            </div>
          ) : (
            <>
              {/* Quick Info */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                      Email
                    </p>
                    <p className="text-sm text-slate-600">
                      {athleteData?.email || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                      Phone
                    </p>
                    <p className="text-sm text-slate-600">
                      {athleteData?.phone || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                      Coaching since
                    </p>
                    <p className="text-sm text-slate-600">
                      {athleteData ? formatCoachingSince(athleteData.coaching_start_date) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                      Tenure
                    </p>
                    <p className="text-sm text-slate-600">
                      {tenureDays <= 90 ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          New Athlete
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Tenured
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Race info */}
                {nextRace && nextRaceDaysAway !== null && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    <p className="text-xs text-blue-500 uppercase tracking-wide font-medium">
                      Upcoming Race
                    </p>
                    <p className="text-sm font-medium text-blue-800">{nextRace.race_name}</p>
                    <p className="text-xs text-blue-600">
                      {new Date(nextRace.race_date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}{' '}
                      — {nextRaceDaysAway} day{nextRaceDaysAway !== 1 ? 's' : ''} away
                    </p>
                  </div>
                )}
              </div>

              {/* Persistent Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                    Notes
                  </p>
                  {savedNotice && (
                    <span className="text-xs text-emerald-600 font-medium animate-pulse">
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
                <p className="text-xs text-slate-400 text-right mt-1">
                  {notes.length}/{MAX_NOTES}
                </p>
              </div>

              {/* Contact History */}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-3">
                  Contact History
                </p>

                {contactLogs.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg">
                    <EmptyState
                      heading="No contacts logged yet"
                      description="Log your first contact with this athlete to start tracking communication."
                      actionLabel="Log Contact"
                      onAction={() => setContactModalOpen(true)}
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    {displayedLogs.map((log) => {
                      const isExpanded = expandedLogIds.has(log.id)
                      return (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0"
                        >
                          {/* Type indicator */}
                          <div className="flex flex-col items-center pt-1 shrink-0">
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${CONTACT_TYPE_COLORS[log.contact_type]}`}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700">
                              {CONTACT_TYPE_LABELS[log.contact_type]}
                            </p>
                            {log.notes ? (
                              <p
                                className={`text-sm text-slate-600 mt-0.5 ${
                                  !isExpanded ? 'line-clamp-2' : ''
                                } ${log.notes.length > 80 ? 'cursor-pointer' : ''}`}
                                onClick={() => {
                                  if (log.notes && log.notes.length > 80) toggleLogExpand(log.id)
                                }}
                              >
                                {log.notes}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400 italic mt-0.5">No notes</p>
                            )}
                          </div>

                          {/* Date */}
                          <p className="text-xs text-slate-400 shrink-0 pt-0.5">
                            {formatRelativeDate(log.contacted_at)}
                          </p>
                        </div>
                      )
                    })}

                    {hasMoreLogs && !showAllLogs && (
                      <button
                        className="w-full text-center text-xs text-blue-600 hover:text-blue-700 font-medium py-2 transition-colors"
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

        {/* Action Bar (sticky bottom) */}
        <div className="border-t border-slate-200 px-6 py-4 shrink-0 bg-white">
          <Button
            className="w-full"
            onClick={() => setContactModalOpen(true)}
          >
            Log Contact
          </Button>
          <button
            className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 transition-colors"
            onClick={() => onEditAthlete(athleteId)}
          >
            Edit Athlete
          </button>
        </div>
      </div>

      {/* Log Contact Modal — layered above drawer */}
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
