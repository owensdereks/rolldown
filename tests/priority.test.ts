import assert from 'node:assert/strict'
import test from 'node:test'
import { calculatePriority, comparePriority } from '../src/lib/priority.ts'

const NOW = new Date('2026-07-31T18:00:00Z')

test('an athlete without a logged conversation stays unknown and needs attention', () => {
  assert.deepEqual(
    calculatePriority({
      coachingStartDate: '2026-07-01',
      lastContactAt: null,
      now: NOW,
    }),
    { daysSinceLastContact: null, isNewAthlete: true, severity: 'red' }
  )
})

test('new-athlete thresholds are green through day one, yellow on day two, then red', () => {
  const result = (lastContactAt: string) => calculatePriority({
    coachingStartDate: '2026-07-01',
    lastContactAt,
    now: NOW,
  }).severity

  assert.equal(result('2026-07-30'), 'green')
  assert.equal(result('2026-07-29'), 'yellow')
  assert.equal(result('2026-07-28'), 'red')
})

test('tenured-athlete thresholds are green through day four, yellow through six, then red', () => {
  const result = (lastContactAt: string) => calculatePriority({
    coachingStartDate: '2025-01-01',
    lastContactAt,
    now: NOW,
  }).severity

  assert.equal(result('2026-07-27'), 'green')
  assert.equal(result('2026-07-25'), 'yellow')
  assert.equal(result('2026-07-24'), 'red')
})

test('unknown conversation dates sort ahead of the most overdue known date', () => {
  const athletes = [
    { days_since_last_contact: 12 },
    { days_since_last_contact: null },
    { days_since_last_contact: 3 },
  ]

  assert.deepEqual(athletes.sort(comparePriority), [
    { days_since_last_contact: null },
    { days_since_last_contact: 12 },
    { days_since_last_contact: 3 },
  ])
})
