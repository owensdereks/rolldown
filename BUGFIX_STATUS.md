# Bugfix: days_since_last_contact showing -1

## Problem
When a coach logs a contact, the athlete's `days_since_last_contact` briefly showed as -1. The `contacted_at` timestamp is stored in UTC, but the frontend date diff used local time — causing a day-boundary mismatch when the local timezone is ahead of UTC.

## Fix applied in `src/services/api.ts`

1. **Normalized dates to UTC date-only values** before computing the day difference. Both `now` and the reference date (`contacted_at` or `created_at`) are converted to midnight UTC using `getUTCFullYear`, `getUTCMonth`, `getUTCDate` — eliminating timezone-induced day shifts.

2. **Added `Math.max(0, days)` floor** so days since last contact can never be negative.

3. **`createContactLog` already returns the created record** — no change needed there.

## Verification
- TypeScript compiles clean (`npx tsc --noEmit` — no errors).
- No other logic was modified.
