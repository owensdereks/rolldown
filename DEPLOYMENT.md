# Deploying Rolldown to Vercel

## Prerequisites

- A GitHub account
- A Vercel account (sign up at vercel.com with your GitHub account)
- Your Supabase project URL and anon key (found in Supabase → Settings → API)

## Step 1: Recreate the Database

Link the repository with `supabase link --project-ref <project-ref>`, then run `supabase db push`. Alternatively, open the SQL editor and run every file in `supabase/migrations` in numeric order. Do not skip the shared-races or conversation-types migrations.

Afterward, confirm these tables exist:

- `coaches`
- `athletes`
- `contact_logs`
- `races`
- `athlete_race_entries`

### Existing restored Rolldown project

The original project was restored on July 31, 2026. Its schema was initially created through the dashboard, so migrations `001` and `002` were never entered in Supabase's migration ledger. Migrations `003` and `004` were applied and verified through the SQL editor during recovery.

Before using `supabase db push` against that specific project, obtain or reset its database password and reconcile the ledger once:

```bash
supabase migration repair --linked --status applied 001 002 003 004
supabase db push --linked --dry-run
```

The dry run must report that the remote database is up to date before a real push is used.

## Step 2: Push to GitHub

```bash
# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/rolldown.git
git branch -M main
git push -u origin main
```

## Step 3: Import into Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New…"** → **"Project"**
3. Find and select your `rolldown` repository
4. Framework Preset will auto-detect **Vite** — leave it as-is
5. **Before clicking Deploy**, expand **Environment Variables** and add:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
6. Click **Deploy**

Vercel will run `npm run build` and serve the `dist` folder automatically.

## Step 4: Update Supabase Auth Settings

Once deployed, Vercel will give you a URL like `https://rolldown-xxxx.vercel.app`.

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project → **Authentication** → **URL Configuration**
3. Set **Site URL** to your Vercel URL (e.g., `https://rolldown-xxxx.vercel.app`)
4. Under **Redirect URLs**, add:
   - `https://rolldown-xxxx.vercel.app/**`
   - A narrowly scoped preview pattern such as `https://rolldown-*-owensdereks-projects.vercel.app/**`
5. Click **Save**

## Step 5: Test

1. Open your Vercel URL in a browser
2. Try logging in with a magic link
3. Check that the magic link email arrives and redirects back to your live app
4. Verify client-side routing works (navigate between pages, refresh on a sub-route)
5. Create an athlete with no conversation history and confirm they appear as `Unknown`
6. Use `Log text`, then confirm `Undo` restores the prior state
7. Add two athletes to one race and confirm they appear together under Race Weekends

## Custom Domain (Optional)

1. In Vercel → your project → **Settings** → **Domains**
2. Add your custom domain and follow the DNS instructions
3. Update the Supabase Site URL and Redirect URLs to match your custom domain
