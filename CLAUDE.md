# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite HMR)
npm run build      # TypeScript compile + Vite production build
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Architecture

**Rolldown** is a React + TypeScript + Vite SPA backed by Supabase. It helps coaches track athlete engagement, prioritizing follow-ups based on days since last contact and upcoming races.

**Stack:** React 19, TypeScript (strict), Tailwind CSS v4, Supabase JS, Vite

### Data Flow

1. Auth via Supabase magic link → `AuthContext` stores `session`/`user`
2. `App.tsx` conditionally renders auth screen or `AuthenticatedApp`
3. `AuthenticatedApp` (in App.tsx) loads coach profile and drives top-level view routing via a discriminated union state (`main` | `add-athlete` | `edit-athlete` | `csv-import`)
4. All DB operations go through `src/services/api.ts`

### Key Directories

- `src/services/api.ts` — All Supabase queries; contains priority-scoring logic for athletes
- `src/contexts/AuthContext.tsx` — Auth state; `useAuth()` hook
- `src/lib/supabase.ts` — Supabase client init
- `src/types/index.ts` — All shared TypeScript interfaces (`Athlete`, `AthleteWithPriority`, `Coach`, `ContactLog`, `AthleteRace`)
- `src/components/ui/` — Reusable design system components (Button, Input, Badge, Modal, EmptyState)
- `src/components/Dashboard/` — Main views: `PriorityList`, `AthleteDetailDrawer`, `LogContactModal`
- `src/components/Athletes/` — CRUD forms and CSV import

### Priority Scoring (in `api.ts` `getAthletes`)

Athletes are color-scored based on days since last contact and coaching tenure:
- **New athletes** (≤90 days): green 0–1d, yellow 2d, red 3+d
- **Tenured athletes** (>90 days): green 0–4d, yellow 5–6d, red 7+d
- Races within 14 days trigger an `upcoming_race` flag
- Result sorted most-neglected first

### Database Schema (Supabase)

Tables: `coaches`, `athletes`, `athlete_races`, `contact_logs`
Athletes are soft-deleted via `status` field (`active`/`archived`). All queries filter by `coach_id`.
