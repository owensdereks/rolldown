# Rolldown brand and interface guide

Rolldown is an endurance-editorial relationship workspace for coaches. The product should feel personal, considered, and useful before it feels technical. It borrows the clarity of a well-edited training journal—not the visual language of a metrics dashboard.

## Brand idea

**Promise:** Know who needs you today.

**Personality:** observant, steady, warm, direct, quietly confident.

**Voice:** Write like an experienced coach: concise, specific, and human. Prefer “Last spoke 8 days ago” to “Engagement overdue.” Avoid inflated software language such as “command center,” “unlock insights,” “optimize performance,” and “supercharge.”

## Logo

The Rolling R is a continuous course line forming a lowercase-inspired `R`. Its orange forward leg represents movement, cadence, and the next useful action. The lowercase wordmark keeps the identity approachable.

- Use the full lockup in navigation, sign-in, marketing headers, and documents.
- Use the symbol alone for the favicon, app icon, and spaces narrower than 120px.
- Use the reversed asset on green-black only. Use the monochrome mark where reproduction requires one color.
- Minimum symbol size is 24px digital or 7mm print.
- Keep clear space equal to half the symbol width on every side.
- Do not rotate, outline, recolor individual strokes, add shadows, place on noisy imagery, or typeset a substitute wordmark.

Assets: `brand-mark.svg`, `brand-mark-reversed.svg`, `brand-mark-mono.svg`, and `favicon.svg` in `public/`.

## Color

| Token | Value | Use |
| --- | --- | --- |
| Bone canvas | `#F5F1E8` | Page background |
| Paper | `#FCFAF5` | Primary surfaces and sheets |
| Green-black ink | `#18231D` | Primary text and navigation |
| Muted ink | `#687169` | Secondary copy |
| Soft border | `#DCD7CC` | Dividers and quiet boundaries |
| Raised paper | `#EFE9DD` | Selected controls and soft fills |
| Race orange | `#E85D32` | Primary action, focus, brand motion |
| Dark orange | `#B83E1C` | Hover and pressed action state |
| Moss | `#6C7F69` | Supporting illustration and quiet context |
| Cadence red | `#C44942` | Overdue and destructive meaning only |
| Cadence amber | `#A96F1F` | Due-soon and warning meaning only |
| Cadence green | `#3F745C` | Healthy and success meaning only |

Orange identifies action, never alarm. Red, amber, and green appear as small dots, text, or compact lozenges. Do not use neon colors, luminous glows, or ornamental gradients.

## Typography

- **Newsreader** is the editorial voice. Use it selectively for the sign-in statement, page titles, and major empty-state headings.
- **DM Sans** handles navigation, controls, tables, labels, body copy, and the custom lowercase wordmark.
- Display: 32–48px, 500–600 weight, tight tracking, sentence case.
- Body: 14–16px, 400–500 weight, 1.5–1.65 line height.
- Metadata: 11–13px. Uppercase is limited to short date or section kickers.
- Use tabular numerals for dates, day counts, and aligned metrics. Do not add a monospace family.

## Layout and components

- Desktop uses a fixed 216px green-black workspace sidebar and a fluid content canvas capped at 1320px.
- The Today view is a two-column workspace: relationship queue first, upcoming races and roster actions second. Below 1024px the context rail moves above the queue.
- Lists use one paper surface, neutral dividers, stable columns, and generous row rhythm. Avoid grids of floating cards.
- Controls have a minimum 44px touch target and 10px radius. Primary buttons are orange; secondary buttons are paper with a soft border.
- Drawers are paper-like profile sheets with sticky identity and action regions. Modals use the same surface over a translucent green-black overlay.
- Forms group related information with spacing and dividers instead of nested boxes. Fields stack on small screens.
- Icons come from Lucide at 1.7–1.9 stroke weight. An icon-only control always has an accessible label.

## Interaction and accessibility

- Hover states change color or surface only; they never shift layout.
- Focus uses a visible 3px translucent orange ring.
- Standard transitions last 150–200ms. The drawer may use a restrained 200ms transform.
- Honor `prefers-reduced-motion` by effectively removing animation and smooth scrolling.
- Meet WCAG AA contrast for text, retain complete keyboard operation, and prevent horizontal page overflow at 390px.

## Illustration and imagery

Use abstract course lines, rolling contours, elevation traces, and tactile paper texture. Favor editorial diagrams over literal sports imagery. Avoid stock athletes, finish-line clichés, glossy 3D objects, generic dashboard illustrations, and decorative AI imagery that does not explain or reinforce the brand.

## Copy examples

- “Who needs you today”
- “3 athletes have a reason to check in.”
- “Last spoke 12 days ago”
- “No conversations yet”
- “Import roster”

Keep actions literal: “Add athlete,” “Log conversation,” “View race,” “Try again.”
