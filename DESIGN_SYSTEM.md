# Rolldown design system

Rolldown is a calm, premium coaching workspace. It should feel focused at 6am, remain easy to scan with 15–25 athletes, and use visual emphasis only when it helps a coach decide what to do next.

## Principles

- **Quiet hierarchy.** Typography and spacing create structure before borders or color.
- **Operational, not promotional.** Controls are direct, copy is concise, and decoration stays restrained.
- **Status color has meaning.** Red, amber, and green indicate follow-up health; blue identifies actions; purple is limited to race context.
- **One surface, one purpose.** Prefer dividers and grouped regions over nested cards.
- **Accessible by default.** Body copy is at least 14px, interactive targets are at least 44px, focus is visible, and motion respects reduced-motion preferences.

## Foundations

### Color

| Token | Value | Use |
| --- | --- | --- |
| `bg` | `#0B0D10` | App background |
| `surface` | `#12161B` | Primary panels and rows |
| `elevated` | `#191E25` | Inputs, selected controls, modal surfaces |
| `border` | `#252B34` | Low-contrast boundaries |
| `ink` | `#F1F3F5` | Primary text |
| `ink-dim` | `#A4ADB9` | Secondary text |
| `ink-muted` | `#747E8B` | Metadata and labels |
| `accent` | `#78A6FF` | Primary actions and focus |
| `signal-red` | `#E66F79` | Overdue and destructive states |
| `signal-amber` | `#D6A85F` | Due-soon and warning states |
| `signal-green` | `#69B68D` | Healthy and successful states |
| `signal-purple` | `#A897D4` | Race context only |

Borders normally use translucent white (`6–9%`) so surfaces remain legible without looking boxed in. Glows and saturated gradients are not part of the system.

### Typography

- Outfit is the UI family at weights 400–700.
- Barlow Condensed is reserved for the Rolldown wordmark.
- Page titles use sentence case, 28–36px, weight 600, and tight tracking.
- Section titles use 16px/600. Body copy uses 14–16px. Labels and metadata use 12–13px.
- Use tabular numerals for day counts, dates, counters, and other aligned metrics.
- Avoid all-caps and wide tracking except the uppercase wordmark.

### Shape and spacing

- Controls: 44px minimum height and 10px radius.
- Panels: 14px radius with a subtle 1px border.
- Modals and large states: 16px radius and the shared panel shadow.
- Standard page gutter: responsive from 16px to 32px.
- Standard content width: 1152px (`max-w-6xl`).
- UI transitions: 150–200ms color or transform transitions, disabled when reduced motion is requested.

## Components

- **Buttons:** primary blue, neutral secondary, and low-chroma destructive. Icons are optional and always come from Lucide.
- **Inputs:** elevated charcoal surface, visible hover/focus border, 15px input text, labels above the field.
- **Badges:** compact status indicators. Do not use badges for ordinary metadata when plain text is clearer.
- **Panels and lists:** use one outer panel with row dividers. Avoid making every row a separate card.
- **Page headers:** contextual label and title on the left; page-level actions on the right; stack on mobile.
- **Overlays:** neutral dark backdrop, subtle blur, restrained shadow, and clear close control.
- **Feedback:** inline alerts for recoverable errors and a single bottom toast for successful quick actions.

## Responsive behavior

- Page headers and form grids stack below 640px.
- Secondary roster metadata may collapse, but every action remains accessible.
- Tables scroll horizontally instead of compressing columns beyond readability.
- The athlete drawer fills small screens and is capped at 500px on larger screens.
