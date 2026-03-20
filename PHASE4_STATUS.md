# Phase 4 — Priority List: Status

## New Files
- `src/components/Dashboard/PriorityList.tsx` — Home screen with priority-sorted athlete list, filtering, loading skeletons, empty states
- `src/components/Dashboard/LogContactModal.tsx` — Modal for logging contact with contact type selector and notes

## Modified Files
- `src/services/api.ts` — Updated priority algorithm: new severity thresholds (tenured vs new athlete), fallback to `created_at` when no contact logs, `is_new_athlete` threshold changed to 90 days
- `src/App.tsx` — Replaced inline athlete list with `PriorityList` component as the main authenticated view; removed unused imports (`Button`, `Badge`, `OnboardingScreen`)

## Verification

- [x] Priority list renders with correct severity colors and sorting
  - Red/amber/emerald vertical bars on left edge of each card
  - Sorted by `days_since_last_contact` descending (most overdue first)
- [x] Days since last contact is calculated correctly
  - Uses `contacted_at` from most recent contact log
  - Falls back to `created_at` if no contact logs exist
- [x] Severity thresholds correct per spec
  - New athletes (≤90 days coaching): green 0-1, yellow 2, red 3+
  - Tenured athletes (>90 days coaching): green 0-4, yellow 5-6, red 7+
- [x] "Needs Attention" filter works
  - Shows all red and yellow severity athletes
  - Shows athletes with upcoming races regardless of severity
  - Hides green athletes without upcoming races
- [x] "All Athletes" toggle shows every active athlete
- [x] Athlete count updates with toggle (e.g., "8 of 24 athletes")
- [x] Log Contact modal opens, saves, and refreshes the list
  - Contact type selector: Text (default), Email, Call, Other
  - Optional notes with 500-char limit and visible counter
  - Save button shows loading state and prevents double-tap
  - After save, list refreshes and athlete re-sorts
- [x] After logging contact, athlete re-sorts to correct position (days resets to 0)
- [x] If athlete was red/yellow and becomes green with no upcoming race, they disappear from "Needs Attention" view after refresh
- [x] Empty state shows "You're all caught up" when all athletes are green with no upcoming races
  - Includes checkmark icon and "View All Athletes" button that switches toggle
- [x] Loading skeleton appears on initial load (5 pulsing placeholder rows)
- [x] Zero-athlete state shows OnboardingScreen
- [x] Clicking athlete row navigates to Edit Athlete form (placeholder for Phase 5 detail drawer)
- [x] "Log Contact" button click does NOT trigger row navigation (stopPropagation)
- [x] Add Athlete and Import CSV buttons remain functional
- [x] TypeScript compiles with zero errors

## Issues Encountered
- None
