const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

export function dateOnlyToLocalDate(value: string): Date {
  const match = DATE_ONLY.exec(value)
  if (!match) return new Date(value)
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

export function localDateKey(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function daysUntilDate(value: string, now = new Date()): number {
  const target = dateOnlyToLocalDate(value)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
}
