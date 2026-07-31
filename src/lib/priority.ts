export type PrioritySeverity = 'green' | 'yellow' | 'red'

interface PriorityInput {
  coachingStartDate: string
  lastContactAt: string | null
  now?: Date
}

export interface PriorityResult {
  daysSinceLastContact: number | null
  isNewAthlete: boolean
  severity: PrioritySeverity
}

const DAY_MS = 24 * 60 * 60 * 1000

function utcDay(value: string | Date): number {
  if (typeof value === 'string') {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    if (dateOnly) {
      return Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    }
  }
  const date = typeof value === 'string' ? new Date(value) : value
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

export function calculatePriority({
  coachingStartDate,
  lastContactAt,
  now = new Date(),
}: PriorityInput): PriorityResult {
  const daysSinceStart = Math.max(
    0,
    Math.floor((utcDay(now) - utcDay(coachingStartDate)) / DAY_MS)
  )
  const isNewAthlete = daysSinceStart <= 90

  if (!lastContactAt) {
    return {
      daysSinceLastContact: null,
      isNewAthlete,
      severity: 'red',
    }
  }

  const daysSinceLastContact = Math.max(
    0,
    Math.floor((utcDay(now) - utcDay(lastContactAt)) / DAY_MS)
  )

  let severity: PrioritySeverity
  if (isNewAthlete) {
    severity = daysSinceLastContact <= 1
      ? 'green'
      : daysSinceLastContact === 2
        ? 'yellow'
        : 'red'
  } else {
    severity = daysSinceLastContact <= 4
      ? 'green'
      : daysSinceLastContact <= 6
        ? 'yellow'
        : 'red'
  }

  return { daysSinceLastContact, isNewAthlete, severity }
}

export function comparePriority(
  a: { days_since_last_contact: number | null },
  b: { days_since_last_contact: number | null }
): number {
  if (a.days_since_last_contact === null) return b.days_since_last_contact === null ? 0 : -1
  if (b.days_since_last_contact === null) return 1
  return b.days_since_last_contact - a.days_since_last_contact
}
