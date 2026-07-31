import assert from 'node:assert/strict'
import test from 'node:test'
import { dateOnlyToLocalDate, daysUntilDate, localDateKey } from '../src/lib/dates.ts'

test('date-only values stay on the intended local calendar date', () => {
  const date = dateOnlyToLocalDate('2026-07-31')
  assert.equal(date.getFullYear(), 2026)
  assert.equal(date.getMonth(), 6)
  assert.equal(date.getDate(), 31)
})

test('local date keys do not depend on UTC rollover', () => {
  assert.equal(localDateKey(new Date(2026, 6, 31, 23, 59)), '2026-07-31')
})

test('race countdowns compare local calendar days', () => {
  assert.equal(daysUntilDate('2026-08-01', new Date(2026, 6, 31, 23, 59)), 1)
  assert.equal(daysUntilDate('2026-07-31', new Date(2026, 6, 31, 1, 0)), 0)
})
