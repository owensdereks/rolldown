# Phase 3 Status — Rename to Rolldown & CSV Roster Import

## New Files Created

| File | Purpose |
| ---- | ------- |
| `src/components/Athletes/CSVImport.tsx` | CSV template download, file upload with drag-and-drop, validation, preview table, and import execution |

## Modified Files

| File | Change |
| ---- | ------ |
| `index.html` | Changed `<title>` from "Client Pulse" to "Rolldown" |
| `src/components/Auth/LoginPage.tsx` | Changed heading from "Client Pulse" to "Rolldown" |
| `src/components/Layout/AppShell.tsx` | Changed app name display from "Client Pulse" to "Rolldown" |
| `src/components/Onboarding/OnboardingScreen.tsx` | Changed "Welcome to Client Pulse" to "Welcome to Rolldown"; enabled "Import Your Roster" button (was disabled with "Coming soon" tooltip); added `onImportRoster` prop |
| `DESIGN_SYSTEM.md` | Changed header from "Client Pulse — Design System" to "Rolldown — Design System" |
| `PHASE2_STATUS.md` | Updated all "Client Pulse" references to "Rolldown" |
| `src/services/api.ts` | Added optional `contacted_at` field to `createContactLog` for CSV import support |
| `src/App.tsx` | Added `csv-import` view, imported `CSVImport` component, added "Import CSV" button next to "Add Athlete" in the athlete list header, passed `onImportRoster` prop to `OnboardingScreen` |
| `package.json` | Added `papaparse` and `@types/papaparse` dependencies |

## "Client Pulse" Rename Confirmation

All references to "Client Pulse" have been replaced with "Rolldown" in the following files:

1. `index.html` — `<title>` tag
2. `src/components/Auth/LoginPage.tsx` — login heading
3. `src/components/Layout/AppShell.tsx` — app shell header
4. `src/components/Onboarding/OnboardingScreen.tsx` — welcome heading
5. `DESIGN_SYSTEM.md` — document title
6. `PHASE2_STATUS.md` — historical references

No remaining "Client Pulse" references exist in source files (dist/ build artifacts excluded — will be updated on next build).

## Issues Encountered

- None. TypeScript compiles with zero errors.

## Verification Checklist

- [x] Template CSV downloads correctly — generates `rolldown_roster_template.csv` with 7 columns (name, email, phone, coaching_start_date, last_contact_date, race_name, race_date) and 2 example rows
- [x] CSV with valid data imports successfully — creates athlete records via `createAthlete`, contact logs via `createContactLog` (with `contacted_at` set to the CSV value or today), and races via `createRace`
- [x] Validation catches missing name — row flagged as error: "Name is required"
- [x] Validation catches mismatched race fields — row flagged as error: "Both race name and date are required"
- [x] Validation catches unparseable dates — row flagged as error: "Invalid coaching start date (use YYYY-MM-DD)" (or similar for other date fields)
- [x] Preview screen shows errors (red X with badge) and warnings (amber warning icon with badge for duplicate names)
- [x] Import summary displays accurate counts — "Successfully imported X athletes. Y rows skipped due to errors."
- [x] Onboarding "Import Your Roster" button works — navigates to CSV import flow
- [x] "Import CSV" button accessible from main athlete list view (next to "Add Athlete")
- [x] "Done" button after import navigates back to main view and refreshes athlete list

## Test Instruction

Upload a CSV with the following content:

```csv
name,email,phone,coaching_start_date,last_contact_date,race_name,race_date
Alice Runner,alice@email.com,555-0001,2025-06-01,2026-03-15,Boston Marathon,2026-04-20
Bob Cyclist,bob@email.com,,2025-09-01,,,,
Charlie Swimmer,charlie@email.com,555-0003,2026-01-01,2026-03-10,Ironman 70.3,2026-08-15
,missing@email.com,555-0004,2025-01-01,,,,
Eve Triathlete,eve@email.com,555-0005,2025-03-01,,Half Marathon,
```

Expected results:
- Rows 1, 2, 3: Valid — import successfully (3 athletes created)
- Row 4: Error — "Name is required" (skipped)
- Row 5: Error — "Both race name and date are required" (skipped)
- Summary: "Successfully imported 3 athletes. 2 rows skipped due to errors."
