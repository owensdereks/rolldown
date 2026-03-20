# Phase 2 Status — Design System, Athlete Management & Onboarding

## New Files Created

| File | Purpose |
| ---- | ------- |
| `src/styles/design-system.ts` | Theme config object (colors, typography, spacing, radius) |
| `DESIGN_SYSTEM.md` | Visual standards documentation |
| `src/components/ui/Button.tsx` | Reusable button (primary / secondary / danger variants) |
| `src/components/ui/Input.tsx` | Input and Textarea with label + error support |
| `src/components/ui/Modal.tsx` | Centered overlay modal with backdrop-close and X button |
| `src/components/ui/Badge.tsx` | Severity and race badges (red / amber / emerald / race) |
| `src/components/ui/EmptyState.tsx` | Centered empty state with icon, heading, description, CTA |
| `src/components/Layout/AppShell.tsx` | Top bar with app name, coach name, logout; main content area |
| `src/components/Onboarding/OnboardingScreen.tsx` | Welcome screen for zero-athlete state |
| `src/components/Athletes/AddAthleteForm.tsx` | Full-width add athlete form with validation |
| `src/components/Athletes/EditAthleteForm.tsx` | Edit athlete form with archive confirmation modal |

## Modified Files

| File | Change |
| ---- | ------ |
| `index.html` | Added Inter font from Google Fonts, updated title to "Rolldown" |
| `src/index.css` | Added `@theme` block to set Inter as default sans font |
| `src/components/Auth/LoginPage.tsx` | Restyled with design system components, new branding and tagline |
| `src/App.tsx` | Added AppShell wrapper, view routing (main / add / edit), athlete list |
| `src/services/api.ts` | Added `getAthleteRaces()`, expanded `createAthlete` and `updateAthlete` to accept `coaching_start_date` |

## Issues Encountered

- None. TypeScript compiles with zero errors and `vite build` succeeds.

## Verification Checklist

- [x] Design system renders correctly — all UI components use the defined palette, typography, and spacing
- [x] Login page is styled — centered card with "Rolldown" heading and "Know who needs you today." tagline, uses `Input` and `Button` components
- [x] App shell displays after login — top bar with app name, coach name, and logout button
- [x] Onboarding screen shows for new users with zero athletes — welcome message with "Add Your First Athlete" CTA and disabled "Import Your Roster" (coming soon tooltip)
- [x] Add Athlete form creates a record in Supabase — calls `createAthlete` + `createRace` through `api.ts`, validates name required, race name/date pairing, future race date, 2000 char notes limit
- [x] Edit Athlete form loads and saves correctly — fetches athlete + nearest future race on mount, updates athlete and handles race CRUD (create/update/delete)
- [x] Archive function works — confirmation modal, calls `archiveAthlete`, returns to main view and refreshes list

## Screenshot-Worthy Moments

1. **Login Page** — Clean centered card on slate-50 background with "Rolldown" branding and magic link form
2. **Onboarding Screen** — Welcome message with people icon, two CTA buttons, inside the AppShell with coach name in the header
