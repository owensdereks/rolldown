# Rolldown

Rolldown is a focused coaching dashboard for two questions that otherwise live in a coach's memory and text threads:

1. Which athlete needs a real conversation today?
2. Who is racing together this weekend?

It complements workout platforms such as TrainingPeaks. Workout comments do not count as contact; Rolldown tracks substantive back-and-forth conversations by text, phone, or video.

## Product scope

Rolldown is intentionally not an outreach bot, workout tracker, or general CRM. The current pilot is designed for one coach managing roughly 15–25 athletes.

Core workflows:

- A priority-sorted focus list with an explanation for each athlete's position
- One-click logging for the common text-conversation case, with undo
- Call or video logging with optional notes
- CSV roster import without inventing missing conversation history
- Shared races, athlete rosters, race-weekend groups, and a monthly calendar

Priority rules are deliberately understandable:

- New athletes (first 90 days): green at 0–1 days, yellow at 2, red at 3+
- Established athletes: green at 0–4 days, yellow at 5–6, red at 7+
- No known conversation is shown as unknown and placed first
- An upcoming race adds context without silently changing conversation history

## Stack

- React 19, TypeScript, Vite, and Tailwind CSS
- Supabase Auth and Postgres with row-level security
- Vercel static hosting

All database operations are kept in `src/services/api.ts`. Pure priority behavior lives in `src/lib/priority.ts` and is covered by tests.

## Local setup

Prerequisites: Node.js 24+, the Supabase CLI, and either Docker for the local stack or a hosted Supabase project.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and enter the project's URL and publishable/anon key.

3. Apply the database migrations:

   - Local Supabase: run `supabase start`, then `supabase db reset`.
   - Hosted Supabase: link the project and run `supabase db push`, or run the files in `supabase/migrations` in numeric order through the SQL editor.

   Each migration contains executable forward SQL; rollback examples are commented out.

4. Add `http://localhost:5173/**` to the Supabase Auth redirect URLs.

5. Start the app:

   ```bash
   npm run dev
   ```

## Quality checks

```bash
npm test
npm run lint
npm run build
```

The priority test suite covers unknown history, new- and established-athlete thresholds, and sort order.

## Data and security decisions

- Athlete, conversation, race, and roster records are isolated by coach through database policies.
- A race entry must reference both an athlete and a race owned by the signed-in coach.
- Only necessary roster/contact fields are collected; workout and health data are out of scope.
- Athlete deletion cascades through conversation and race-entry relationships at the database layer.
- Environment credentials belong in local or Vercel environment variables, never committed source.

Before inviting a broader pilot, the project should add a coach-facing export and account-deletion workflow.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the Vercel and Supabase configuration checklist.
