# Rolldown — Design System

## Design Principles

- **Clean, calm, professional.** This is a tool coaches open at 6am — no visual noise.
- **High information density** without feeling cluttered.
- **Accessible to all comfort levels.** Becca (low-tech comfort) should never feel overwhelmed. Alex should feel nudged, not lectured.

---

## Color Palette

| Token              | Tailwind Class    | Usage                                  |
| ------------------ | ----------------- | -------------------------------------- |
| Primary text       | `slate-800`       | Headings, key labels                   |
| Secondary text     | `slate-600`       | Body text, descriptions                |
| Muted text         | `slate-400`       | Captions, timestamps                   |
| Accent             | `blue-600`        | Interactive elements, links, primary buttons |
| Severity — overdue | `red-500`         | Overdue indicators                     |
| Severity — warning | `amber-500`       | Approaching threshold                  |
| Severity — healthy | `emerald-500`     | Healthy / on-track                     |
| Card background    | `white`           | Card surfaces                          |
| Page background    | `slate-50`        | App background                         |
| Hover background   | `slate-100`       | Hover states                           |
| Borders            | `slate-200`       | Dividers, card borders                 |

## Typography

- **Font:** Inter (loaded from Google Fonts)
- **Headings:** `text-lg font-semibold text-slate-800`
- **Body:** `text-sm text-slate-600`
- **Captions / Labels:** `text-xs text-slate-400 uppercase tracking-wide`
- **Input Labels:** `text-xs text-slate-500 uppercase tracking-wide font-medium`

## Spacing

| Element          | Class              |
| ---------------- | ------------------ |
| Card padding     | `p-4`              |
| Section gaps     | `space-y-6`        |
| List item padding| `py-3 px-4`        |
| Card radius      | `rounded-lg`       |
| Button/input radius | `rounded-md`    |

## Components

All reusable components live in `src/components/ui/`.

### Button

Variants: `primary`, `secondary`, `danger`

| Variant   | Classes                                                    |
| --------- | ---------------------------------------------------------- |
| primary   | `bg-blue-600 text-white hover:bg-blue-700`                 |
| secondary | `bg-white border border-slate-200 text-slate-700 hover:bg-slate-50` |
| danger    | `bg-red-50 text-red-600 border border-red-200 hover:bg-red-100`     |

All buttons: `rounded-md px-4 py-2 text-sm font-medium transition-colors`

### Input

- Border: `border border-slate-200 rounded-md px-3 py-2 text-sm`
- Focus: `focus:ring-2 focus:ring-blue-500 focus:ring-offset-1`
- Label: `text-xs text-slate-500 uppercase tracking-wide font-medium` (above input)
- Error: inline red text below field

### Modal

- Overlay: `bg-black/50` backdrop
- Card: `bg-white rounded-lg p-6 max-w-md`, centered
- Close: backdrop click + X button

### Badge

- Base: `rounded-full px-2 py-0.5 text-xs font-medium`
- Variants: `red`, `amber`, `emerald` (severity), `race` (upcoming race: `bg-blue-50 text-blue-700 border border-blue-200`)

### EmptyState

- Centered layout with optional icon, heading, description, and CTA button
