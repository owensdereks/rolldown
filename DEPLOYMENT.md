# Deploying Rolldown to Vercel

## Prerequisites

- A GitHub account
- A Vercel account (sign up at vercel.com with your GitHub account)
- Your Supabase project URL and anon key (found in Supabase → Settings → API)

## Step 1: Push to GitHub

```bash
# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/rolldown.git
git branch -M main
git push -u origin main
```

## Step 2: Import into Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New…"** → **"Project"**
3. Find and select your `rolldown` repository
4. Framework Preset will auto-detect **Vite** — leave it as-is
5. **Before clicking Deploy**, expand **Environment Variables** and add:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
6. Click **Deploy**

Vercel will run `npm run build` and serve the `dist` folder automatically.

## Step 3: Update Supabase Auth Settings

Once deployed, Vercel will give you a URL like `https://rolldown-xxxx.vercel.app`.

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project → **Authentication** → **URL Configuration**
3. Set **Site URL** to your Vercel URL (e.g., `https://rolldown-xxxx.vercel.app`)
4. Under **Redirect URLs**, add:
   - `https://rolldown-xxxx.vercel.app/**`
5. Click **Save**

## Step 4: Test

1. Open your Vercel URL in a browser
2. Try logging in with a magic link
3. Check that the magic link email arrives and redirects back to your live app
4. Verify client-side routing works (navigate between pages, refresh on a sub-route)

## Custom Domain (Optional)

1. In Vercel → your project → **Settings** → **Domains**
2. Add your custom domain and follow the DNS instructions
3. Update the Supabase Site URL and Redirect URLs to match your custom domain
